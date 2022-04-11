import axios from "axios";
import { FormEstablishmentGateway } from "src/core-logic/ports/FormEstablishmentGateway";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import {
  editEstablishmentFormRouteWithApiKey,
  formAlreadyExistsRoute,
  requestEmailToUpdateFormRoute,
  retrieveEstablishmentFormRouteWithApiKey,
  addEstablishmentFormRouteWithoutApiKey,
} from "shared/src/routes";
import { SiretDto } from "shared/src/siret";
import { zString } from "shared/src/zodUtils";

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
