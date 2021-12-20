import { AccessTokenGateway } from "../../../domain/core/ports/AccessTokenGateway";
import { RetryStrategy } from "../../../domain/core/ports/RetryStrategy";
import { SearchParams } from "../../../domain/immersionOffer/entities/SearchParams";
import {
  LaBonneBoiteAPI,
  LaBonneBoiteCompany,
} from "../../../domain/immersionOffer/ports/LaBonneBoiteAPI";
import { createAxiosInstance, logAxiosError } from "../../../utils/axiosUtils";
import { createLogger } from "../../../utils/logger";
import { RateLimiter } from "./../../../domain/core/ports/RateLimiter";

const logger = createLogger(__filename);

export class HttpLaBonneBoiteAPI implements LaBonneBoiteAPI {
  constructor(
    private readonly accessTokenGateway: AccessTokenGateway,
    private readonly poleEmploiClientId: string,
    private readonly rateLimiter: RateLimiter,
    private readonly retryStrategy: RetryStrategy,
  ) {}

  public async searchCompanies(
    searchParams: SearchParams,
  ): Promise<LaBonneBoiteCompany[]> {
    const accessToken = await this.accessTokenGateway.getAccessToken(
      `application_${this.poleEmploiClientId} api_labonneboitev1`,
    );
    try {
      const axios = createAxiosInstance(logger);
      const response = await this.retryStrategy.apply(() =>
        this.rateLimiter.whenReady(() =>
          axios.get(
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
          ),
        ),
      );
      return response.data.companies || [];
    } catch (error: any) {
      logAxiosError(logger, error, "Error calling labonneboite API");
      throw error;
    }
  }
}
