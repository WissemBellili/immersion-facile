import { mapObjIndexed } from "ramda";
import {
  ConventionDto,
  ConventionMagicLinkPayload,
  ConventionStatus,
  UpdateConventionStatusRequestDto,
  updateConventionStatusRequestSchema,
  validatedConventionStatuses,
  WithConventionId,
} from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainEvent, DomainTopic } from "../../core/eventBus/events";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { makeGetStoredConventionOrThrowIfNotAllowed } from "../entities/Convention";

const logger = createLogger(__filename);

const domainTopicByTargetStatusMap: Record<
  ConventionStatus,
  DomainTopic | null
> = {
  READY_TO_SIGN: null,
  PARTIALLY_SIGNED: "ImmersionApplicationPartiallySigned",
  IN_REVIEW: "ImmersionApplicationFullySigned",
  ACCEPTED_BY_COUNSELLOR: "ImmersionApplicationAcceptedByCounsellor",
  ACCEPTED_BY_VALIDATOR: "ImmersionApplicationAcceptedByValidator",
  REJECTED: "ImmersionApplicationRejected",
  CANCELLED: "ImmersionApplicationCancelled",
  DRAFT: "ImmersionApplicationRequiresModification",
};

export class UpdateConventionStatus extends TransactionalUseCase<
  UpdateConventionStatusRequestDto,
  WithConventionId
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
    private readonly timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = updateConventionStatusRequestSchema;

  public async _execute(
    params: UpdateConventionStatusRequestDto,
    uow: UnitOfWork,
    { applicationId, role }: ConventionMagicLinkPayload,
  ): Promise<WithConventionId> {
    const { status } = params;
    logger.debug({ status, applicationId, role });

    const getStoredConventionOrThrowIfNotAllowed =
      makeGetStoredConventionOrThrowIfNotAllowed(uow.conventionRepository);

    const storedDto = await getStoredConventionOrThrowIfNotAllowed(
      status,
      role,
      applicationId,
    );

    const conventionUpdatedAt = this.timeGateway.now().toISOString();
    const {
      beneficiary,
      establishmentRepresentative,
      beneficiaryCurrentEmployer,
      ...otherSignatories
    } = storedDto.signatories;
    const updatedDto: ConventionDto = {
      ...storedDto,
      ...(params.status === "REJECTED" && {
        rejectionJustification: params.justification,
      }),
      ...(status === "DRAFT" && {
        signatories: {
          ...mapObjIndexed(
            (signatory) => ({ ...signatory, signedAt: undefined }),
            otherSignatories,
          ),
          beneficiaryCurrentEmployer: beneficiaryCurrentEmployer
            ? {
                ...beneficiaryCurrentEmployer,
                signedAt: undefined,
              }
            : undefined,
          beneficiary: {
            ...beneficiary,
            signedAt: undefined,
          },
          establishmentRepresentative: {
            ...establishmentRepresentative,
            signedAt: undefined,
          },
        },
      }),

      status,
      dateValidation: validatedConventionStatuses.includes(status)
        ? conventionUpdatedAt
        : undefined,
    };

    const updatedId = await uow.conventionRepository.update(updatedDto);
    if (!updatedId) throw new NotFoundError(updatedId);

    const domainTopic = domainTopicByTargetStatusMap[status];
    if (!domainTopic) return { id: updatedId };

    const event: DomainEvent = {
      ...this.createEvent(
        updatedDto,
        domainTopic,
        params.status === "REJECTED" || params.status === "DRAFT"
          ? params.justification
          : undefined,
      ),
      occurredAt: conventionUpdatedAt,
    };
    await uow.outboxRepository.save(event);
    return { id: updatedId };
  }

  private createEvent(
    updatedDto: ConventionDto,
    domainTopic: DomainTopic,
    justification?: string,
  ) {
    if (domainTopic === "ImmersionApplicationRequiresModification")
      return this.createNewEvent({
        topic: domainTopic,
        payload: {
          convention: updatedDto,
          justification: justification ?? "",
          roles: ["beneficiary", "establishment"],
        },
      });

    return this.createNewEvent({
      topic: domainTopic,
      payload: updatedDto,
    });
  }
}
