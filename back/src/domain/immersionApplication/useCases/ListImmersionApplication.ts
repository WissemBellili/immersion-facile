import {
  ImmersionApplicationDto,
  ListImmersionApplicationRequestDto,
} from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { UseCase } from "../../core/UseCase";
import { ImmersionApplicationRepository } from "../ports/ImmersionApplicationRepository";
import { listImmersionApplicationRequestDtoSchema } from "shared/src/ImmersionApplication/immersionApplication.schema";

export class ListImmersionApplication extends UseCase<
  ListImmersionApplicationRequestDto,
  ImmersionApplicationDto[]
> {
  constructor(
    private readonly immersionApplicationRepository: ImmersionApplicationRepository,
  ) {
    super();
  }

  inputSchema = listImmersionApplicationRequestDtoSchema;

  public async _execute({
    status,
    agencyId,
  }: ListImmersionApplicationRequestDto) {
    const entities =
      await this.immersionApplicationRepository.getLatestUpdated();
    return entities
      .map((entity) => entity.toDto())
      .filter((dto) => !status || dto.status === status)
      .filter((dto) => !agencyId || dto.agencyId === agencyId);
  }
}
