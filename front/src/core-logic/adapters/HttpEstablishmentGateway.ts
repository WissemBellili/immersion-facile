import axios from "axios";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";
import { FormEstablishmentDto } from "src/shared/formEstablishment/FormEstablishment.dto";
import {
  addEstablishmentFormRouteWithoutApiKey,
  editEstablishmentFormRouteWithApiKey,
  formAlreadyExistsRoute,
  requestEmailToUpdateFormRoute,
  retrieveEstablishmentFormRouteWithApiKey,
} from "src/shared/routes";
import { SiretDto } from "src/shared/siret";
import { zString } from "src/shared/zodUtils";

const prefix = "api";
export class HttpEstablishmentGateway implements EstablishmentGateway {
  public async addFormEstablishment(
    establishment: FormEstablishmentDto,
  ): Promise<SiretDto> {
    const httpResponse = await axios.post(
      `/${prefix}/${addEstablishmentFormRouteWithoutApiKey}`,
      establishment,
    );

    return zString.parse(httpResponse.data);
  }

  public async isEstablishmentAlreadyRegisteredBySiret(
    siret: SiretDto,
  ): Promise<boolean> {
    const httpResponse = await axios.get(
      `/${prefix}/${formAlreadyExistsRoute}/${siret}`,
    );
    return httpResponse.data;
  }
  public async requestEstablishmentModification(
    siret: SiretDto,
  ): Promise<void> {
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
