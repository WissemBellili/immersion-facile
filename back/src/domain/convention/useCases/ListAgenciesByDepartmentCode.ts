import {
  activeAgencyStatuses,
  AgencyDto,
  AgencyIdAndName,
  AgencyKindFilter,
  DepartmentCode,
  ListAgenciesByDepartmentCodeRequestDto,
  ListAgenciesByDepartmentCodeRequestSchema,
} from "shared";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class ListAgenciesByDepartmentCode extends TransactionalUseCase<
  ListAgenciesByDepartmentCodeRequestDto,
  AgencyIdAndName[]
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = ListAgenciesByDepartmentCodeRequestSchema;

  public async _execute(
    { departmentCode, filter }: ListAgenciesByDepartmentCodeRequestDto,
    uow: UnitOfWork,
  ): Promise<AgencyIdAndName[]> {
    const agencies = await getActiveAgencies(uow, departmentCode, filter);
    return agencies.map(agencyToAgencyWithPositionDto);
  }
}

const getActiveAgencies = (
  uow: UnitOfWork,
  departmentCode: DepartmentCode,
  agencyKindFilter?: AgencyKindFilter,
): Promise<AgencyDto[]> =>
  uow.agencyRepository.getAgencies({
    filters: {
      departmentCode,
      kind: agencyKindFilter,
      status: activeAgencyStatuses,
    },
  });

const agencyToAgencyWithPositionDto = (config: AgencyDto): AgencyIdAndName => ({
  id: config.id,
  name: config.name,
});
