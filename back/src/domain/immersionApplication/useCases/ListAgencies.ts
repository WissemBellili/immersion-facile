import {
  AgencyInListDto,
  ListAgenciesRequestDto,
  listAgenciesRequestSchema,
} from "../../../shared/agencies";
import { LatLonDto } from "../../../shared/latLon";
import { UseCase } from "../../core/UseCase";
import { AgencyConfig, AgencyRepository } from "../ports/AgencyRepository";

export class ListAgencies extends UseCase<
  ListAgenciesRequestDto,
  AgencyInListDto[]
> {
  constructor(readonly agencyRepository: AgencyRepository) {
    super();
  }

  inputSchema = listAgenciesRequestSchema;

  public async _execute({
    position,
  }: ListAgenciesRequestDto): Promise<AgencyInListDto[]> {
    const agencyConfigs = await this.getAgenciesConfig(position);
    return agencyConfigs.map(agencyConfigToAgencyDto);
  }

  private getAgenciesConfig(position?: LatLonDto): Promise<AgencyConfig[]> {
    if (position) return this.agencyRepository.getNearby(position);
    return this.agencyRepository.getAllActive();
  }
}

const agencyConfigToAgencyDto = (config: AgencyConfig): AgencyInListDto => ({
  id: config.id,
  name: config.name,
  position: {
    lat: config.position.lat,
    lon: config.position.lon,
  },
});
