import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import {
  ConventionStatus,
  ConventionId,
  UpdateConventionStatusRequestDto,
  WithConventionId,
  ConventionDto,
} from "shared/src/convention/convention.dto";
import { statusTransitionConfigs } from "shared/src/convention/conventionStatusTransitions";
import {
  ConventionMagicLinkPayload,
  Role,
} from "shared/src/tokens/MagicLinkPayload";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { DomainTopic } from "../../core/eventBus/events";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UseCase } from "../../core/UseCase";
import { ConventionRepository } from "../ports/ConventionRepository";
import { updateConventionStatusRequestSchema } from "shared/src/convention/convention.schema";

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
  VALIDATED: "FinalImmersionApplicationValidationByAdmin",
  REJECTED: "ImmersionApplicationRejected",
  CANCELLED: "ImmersionApplicationCancelled",
  DRAFT: "ImmersionApplicationRequiresModification",
};

export class UpdateImmersionApplicationStatus extends UseCase<
  UpdateConventionStatusRequestDto,
  WithConventionId
> {
  constructor(
    private readonly conventionRepository: ConventionRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
  ) {
    super();
  }

  inputSchema = updateConventionStatusRequestSchema;

  public async _execute(
    { status, justification }: UpdateConventionStatusRequestDto,
    { applicationId, role }: ConventionMagicLinkPayload,
  ): Promise<WithConventionId> {
    logger.debug({ status, applicationId, role });
    const convention = await this.getImmersionStatusOrThrowIfNotAllowed(
      status,
      role,
      applicationId,
    );

    const updatedDto = {
      ...convention,
      ...(status === "REJECTED" && { rejectionJustification: justification }),
      ...(status === "DRAFT" && {
        enterpriseAccepted: false,
        beneficiaryAccepted: false,
      }),
      status,
    };

    const updatedId = await this.conventionRepository.update(updatedDto);
    if (!updatedId) throw new NotFoundError(updatedId);

    const domainTopic = domainTopicByTargetStatusMap[status];
    if (!domainTopic) return { id: updatedId };

    const event = this.createEvent(updatedDto, domainTopic, justification);
    await this.outboxRepository.save(event);
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
          reason: justification ?? "",
          roles: ["beneficiary", "establishment"],
        },
      });

    return this.createNewEvent({
      topic: domainTopic,
      payload: updatedDto,
    });
  }

  private async getImmersionStatusOrThrowIfNotAllowed(
    status: ConventionStatus,
    role: Role,
    applicationId: ConventionId,
  ): Promise<ConventionDto> {
    const statusTransitionConfig = statusTransitionConfigs[status];

    if (!statusTransitionConfig.validRoles.includes(role))
      throw new ForbiddenError();

    const convention = await this.conventionRepository.getById(applicationId);
    if (!convention) throw new NotFoundError(applicationId);

    if (
      !statusTransitionConfig.validInitialStatuses.includes(convention.status)
    )
      throw new BadRequestError(
        `Cannot go from status '${convention.status}' to '${status}'`,
      );

    return convention;
  }
}
