import axios from "axios";
import { FormEstablishmentGateway } from "src/core-logic/ports/FormEstablishmentGateway";
import { FormEstablishmentDto } from "src/shared/FormEstablishmentDto";
import { RomeSearchMatchDto, romeSearchResponseSchema } from "src/shared/rome";
import {
  editEstablishmentFormRouteWithApiKey,
  formAlreadyExistsRoute,
  requestEmailToUpdateFormRoute,
  romeRoute,
  retrieveEstablishmentFormRouteWithApiKey,
  addEstablishmentFormRouteWithoutApiKey,
} from "src/shared/routes";
import { SiretDto } from "src/shared/siret";
import { zString } from "src/shared/zodUtils";

const prefix = "api";

export class HttpFormEstablishmentGateway implements FormEstablishmentGateway {
  public async addFormEstablishment(
    establishment: FormEstablishmentDto,
  ): Promise<SiretDto> {
    const httpResponse = await axios.post(
      `/${prefix}/${addEstablishmentFormRouteWithoutApiKey}`,
      establishment,
    );

    return zString.parse(httpResponse.data);
  }

  public async searchProfession(
    searchText: string,
  ): Promise<RomeSearchMatchDto[]> {
    const httpResponse = await axios.get(`/${prefix}/${romeRoute}`, {
      params: { searchText },
    });

    return httpResponse.data;
  }
  public async getSiretAlreadyExists(siret: SiretDto): Promise<boolean> {
    const httpResponse = await axios.get(
      `/${prefix}/${formAlreadyExistsRoute}/${siret}`,
    );
    return httpResponse.data;
  }
  public async requestEmailToEditForm(siret: SiretDto): Promise<void> {
    await axios.get(`/${prefix}/${requestEmailToUpdateFormRoute}/${siret}`);
  }
  public async getFormEstablishmentFromJwt(
    jwt: string,
  ): Promise<FormEstablishmentDto> {
    const httpResponse = await axios.get(
      `/${prefix}/${retrieveEstablishmentFormRouteWithApiKey}/${jwt}`,
    );
    return httpResponse.data;
  }
  public async updateFormEstablishment(
    establishment: FormEstablishmentDto,
    jwt: string,
  ): Promise<void> {
    await axios.post(
      `/${prefix}/${editEstablishmentFormRouteWithApiKey}/${jwt}`,
      establishment,
    );
  }
}
