import { FormEstablishmentDto } from "src/shared/FormEstablishmentDto";
import { RomeSearchMatchDto } from "src/shared/rome";
import { SiretDto } from "src/shared/siret";

export interface FormEstablishmentGateway {
  addFormEstablishment: (
    establishment: FormEstablishmentDto,
  ) => Promise<SiretDto>;
  searchProfession: (searchText: string) => Promise<RomeSearchMatchDto[]>;
  getSiretAlreadyExists(siret: SiretDto): Promise<boolean>;
  requestEmailToEditForm(siret: SiretDto): Promise<void>;
  getFormEstablishmentFromJwt: (jwt: string) => Promise<FormEstablishmentDto>;
  updateFormEstablishment: (
    establishment: FormEstablishmentDto,
  ) => Promise<void>;
}
