import { AccessTokenGateway } from "../../../domain/core/ports/AccessTokenGateway";
import { SearchParams } from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import {
  LaBonneBoiteAPI,
  LaBonneBoiteCompany,
} from "../../../domain/immersionOffer/ports/LaBonneBoiteAPI";
import { createAxiosInstance } from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class HttpLaBonneBoiteAPI implements LaBonneBoiteAPI {
  constructor(
    private readonly accessTokenGateway: AccessTokenGateway,
    private readonly poleEmploiClientId: string,
  ) {}

  public async searchCompanies(
    searchParams: SearchParams,
  ): Promise<LaBonneBoiteCompany[]> {
    const accessToken = await this.accessTokenGateway.getAccessToken(
      `application_${this.poleEmploiClientId} api_labonneboitev1`,
    );
    const response = await createAxiosInstance(logger).get(
      "https://api.emploi-store.fr/partenaire/labonneboite/v1/company/",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          distance: searchParams.distance_km,
          longitude: searchParams.lon,
          latitude: searchParams.lat,
          rome_codes: searchParams.rome,
        },
      },
    );
    return response.data.companies || [];
  }
}
