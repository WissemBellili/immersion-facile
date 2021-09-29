import axios, { AxiosInstance } from "axios";
import { RomeGateway, RomeMetier } from "../../domain/rome/ports/RomeGateway";
import { logger } from "../../utils/logger";
import { AccessTokenGateway } from "./../../domain/core/ports/AccessTokenGateway";

export class PoleEmploiRomeGateway implements RomeGateway {
  private readonly logger = logger.child({
    logsource: "PoleEmploiRomeGateway",
  });
  private readonly axiosInstance: AxiosInstance;
  private readonly scope: string;

  public constructor(
    private readonly accessTokenGateway: AccessTokenGateway,
    poleEmploiClientId: string,
  ) {
    this.axiosInstance = axios.create({
      baseURL: "https://api.emploi-store.fr/partenaire/rome/v1",
      headers: {
        Accept: "application/json",
      },
    });
    this.axiosInstance.interceptors.request.use((request) => {
      this.logger.info(request);
      return request;
    });
    this.axiosInstance.interceptors.response.use((response) => {
      this.logger.debug({
        status: response.status,
        headers: response.headers,
        data: response.data,
      });
      return response;
    });

    this.scope = [
      `application_${poleEmploiClientId}`,
      "api_romev1",
      "nomenclatureRome",
    ].join(" ");
  }

  public async searchMetier(query: string): Promise<RomeMetier[]> {
    const accessToken = await this.accessTokenGateway.getAccessToken(
      this.scope,
    );

    const response = await this.axiosInstance.get("/metier", {
      headers: {
        Authorization: `Bearer ${accessToken.access_token}`,
      },
      params: {
        q: query,
      },
    });

    return response.data;
  }
}
