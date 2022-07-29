import {
  activeAgencyStatuses,
  AgencyDto,
  AgencyKindFilter,
  AgencyIdAndName,
  CountyCode,
  ListAgenciesWithPositionRequestDto,
} from "shared/src/agency/agency.dto";
import { listAgenciesRequestSchema } from "shared/src/agency/agency.schema";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

// type FullAddressVO = {
//   roadNumber: string,
//   street: string,
//   street2?: string,
//   postalCode: number, // (ex: 75001)
//   countyCode: number, // numéro de département (ex: 75)
//   city: string,
// }

export class ListAgenciesWithPosition extends TransactionalUseCase<
  ListAgenciesWithPositionRequestDto,
  AgencyIdAndName[]
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = listAgenciesRequestSchema;

  public async _execute(
    { countyCode, filter }: ListAgenciesWithPositionRequestDto,
    uow: UnitOfWork,
  ): Promise<AgencyIdAndName[]> {
    const agencies = await getActiveAgencies(uow, countyCode, filter);
    return agencies.map(agencyToAgencyWithPositionDto);
  }
}

const getActiveAgencies = (
  uow: UnitOfWork,
  countyCode: CountyCode,
  agencyKindFilter?: AgencyKindFilter,
): Promise<AgencyDto[]> =>
  uow.agencyRepository.getAgencies({
    filters: {
      countyCode,
      kind: agencyKindFilter,
      status: activeAgencyStatuses,
    },
    limit: 20,
  });

const agencyToAgencyWithPositionDto = (config: AgencyDto): AgencyIdAndName => ({
  id: config.id,
  name: config.name,
});
