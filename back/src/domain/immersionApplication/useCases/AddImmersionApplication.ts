import { Role } from "./../../../shared/tokens/MagicLinkPayload";
import { generateJwt } from "./../../auth/jwt";
import { ConflictError } from "../../../adapters/primary/helpers/sendHttpResponse";
import {
  AddImmersionApplicationMLResponseDto,
  AddImmersionApplicationResponseDto,
  ImmersionApplicationDto,
} from "../../../shared/ImmersionApplicationDto";
import { createLogger } from "../../../utils/logger";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { OutboxRepository } from "../../core/ports/OutboxRepository";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationEntity } from "../entities/ImmersionApplicationEntity";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";

const logger = createLogger(__filename);

export class AddImmersionApplication
  implements
    UseCase<ImmersionApplicationDto, AddImmersionApplicationResponseDto>
{
  constructor(
    private readonly applicationRepository: ImmersionApplicationRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  public async execute(
    immersionApplicationDto: ImmersionApplicationDto,
  ): Promise<AddImmersionApplicationResponseDto> {
    const applicationEntity = ImmersionApplicationEntity.create(
      immersionApplicationDto,
    );
    const id = await this.applicationRepository.save(applicationEntity);
    if (!id) throw new ConflictError(applicationEntity.id);

    const event = this.createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: immersionApplicationDto,
    });

    await this.outboxRepository.save(event);

    return { id };
  }
}

export class AddImmersionApplicationML
  implements
    UseCase<ImmersionApplicationDto, AddImmersionApplicationMLResponseDto>
{
  constructor(
    private readonly applicationRepository: ImmersionApplicationRepository,
    private readonly createNewEvent: CreateNewEvent,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  public async execute(
    immersionApplicationDto: ImmersionApplicationDto,
  ): Promise<AddImmersionApplicationMLResponseDto> {
    const applicationEntity = ImmersionApplicationEntity.create(
      immersionApplicationDto,
    );
    const id = await this.applicationRepository.save(applicationEntity);

    if (!id) throw new ConflictError(applicationEntity.id);

    const event = this.createNewEvent({
      topic: "ImmersionApplicationSubmittedByBeneficiary",
      payload: immersionApplicationDto,
    });

    await this.outboxRepository.save(event);

    const applicantPayload = {
      applicationId: id,
      roles: ["beneficiary" as Role],
      iat: Math.round(Date.now() / 1000),
      exp: Math.round(Date.now() / 1000) + 31 * 24 * 3600,
      name:
        immersionApplicationDto.firstName +
        " " +
        immersionApplicationDto.lastName,
    };

    const establishmentPayload = {
      ...applicantPayload,
      name: immersionApplicationDto.mentor,
      roles: ["establishment" as Role],
    };

    return {
      magicLinkApplicant: generateJwt(applicantPayload),
      magicLinkEnterprise: generateJwt(establishmentPayload),
    };
  }
}
