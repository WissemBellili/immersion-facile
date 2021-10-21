import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  UpdateImmersionApplicationRequestDto,
  UpdateImmersionApplicationResponseDto,
} from "../../../shared/ImmersionApplicationDto";
import {
  FeatureDisabledError,
  FeatureFlags,
} from "../../../shared/featureFlags";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { DomainEvent, DomainTopic } from "../../core/eventBus/events";

type UpdateImmersionApplicationDependencies = {
  immersionApplicationRepository: ImmersionApplicationRepository;
  featureFlags: FeatureFlags;
};

export class UpdateImmersionApplication
  implements
    UseCase<
      UpdateImmersionApplicationRequestDto,
      UpdateImmersionApplicationResponseDto
    >
{
  private readonly immersionApplicationRepository: ImmersionApplicationRepository;
  private readonly featureFlags: FeatureFlags;

  constructor(
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
    {
      immersionApplicationRepository,
      featureFlags,
    }: UpdateImmersionApplicationDependencies,
  ) {
    this.immersionApplicationRepository = immersionApplicationRepository;
    this.featureFlags = featureFlags;
  }

  public async execute(
    params: UpdateImmersionApplicationRequestDto,
  ): Promise<UpdateImmersionApplicationResponseDto> {
    if (
      !this.featureFlags.enableViewableApplications &&
      !this.featureFlags.enableMagicLinks
    )
      throw new FeatureDisabledError();
    const immersionApplicationEntity = ImmersionApplicationEntity.create(
      params.demandeImmersion,
    );
    const id =
      await this.immersionApplicationRepository.updateImmersionApplication(
        immersionApplicationEntity,
      );
    if (!id) throw new NotFoundError(params.id);

    // So far we are in the case where a beneficiary made an update on an Immersion Application, and we just need to review it for eligibility
    const event = this.createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: params.demandeImmersion,
    });

    await this.outboxRepository.save(event);

    return { id };
  }
}
