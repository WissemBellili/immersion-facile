import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { FeatureFlags } from "../../../shared/featureFlags";
import {
  ApplicationStatus,
  UpdateImmersionApplicationRequestDto,
  updateImmersionApplicationRequestDtoSchema,
  WithImmersionApplicationId,
} from "../../../shared/ImmersionApplicationDto";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase, UseCase } from "../../core/UseCase";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";

export class UpdateImmersionApplication extends TransactionalUseCase<
  UpdateImmersionApplicationRequestDto,
  WithImmersionApplicationId
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  inputSchema = updateImmersionApplicationRequestDtoSchema;

  public async _execute(
    params: UpdateImmersionApplicationRequestDto,
    uow: UnitOfWork,
  ): Promise<WithImmersionApplicationId> {
    const minimalValidStatus: ApplicationStatus = "READY_TO_SIGN";

    if (
      params.immersionApplication.status != "DRAFT" &&
      params.immersionApplication.status != minimalValidStatus
    ) {
      throw new ForbiddenError();
    }

    const immersionApplicationEntity = ImmersionApplicationEntity.create(
      params.immersionApplication,
    );

    const currentApplication = await uow.immersionApplicationRepo.getById(
      params.id,
    );
    if (!currentApplication) throw new NotFoundError(params.id);
    if (currentApplication.status != "DRAFT") {
      throw new BadRequestError(currentApplication.status);
    }
    const id = await uow.immersionApplicationRepo.updateImmersionApplication(
      immersionApplicationEntity,
    );
    if (!id) throw new NotFoundError(params.id);

    if (params.immersionApplication.status === minimalValidStatus) {
      // So far we are in the case where a beneficiary made an update on an Immersion Application, and we just need to review it for eligibility
      const event = this.createNewEvent({
        topic: "ImmersionApplicationSubmittedByBeneficiary",
        payload: params.immersionApplication,
      });

      await uow.outboxRepo.save(event);
    }

    return { id };
  }
}
