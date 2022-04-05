import { FormEstablishmentDto } from "../../../../../../shared/formEstablishment/FormEstablishment.dto";
import { Flavor } from "../../../../../../shared/typeFlavors";
import { OmitFromExistingKeys } from "../../../../../../shared/utils";

// prettier-ignore
export type ImmersionContactInEstablishmentId = Flavor<string, "ImmersionContactInEstablishmentId">;

export type BusinessContactDtoPublicV1 = {
  lastName: string;
  firstName: string;
  job: string;
  phone: string; // we have a very permissive regex /^\+?[0-9]+$/
  email: string; // a valid email
  contactMethod: ContactMethodPublicV1;
};

export type ContactMethodPublicV1 = "EMAIL" | "PHONE" | "IN_PERSON";

export type AppellationDtoPublicV1 = {
  romeLabel: string;
  romeCode: string;
  appellationLabel: string;
  appellationCode: string;
};

export type FormEstablishmentDtoPublicV1 = {
  siret: string; // 14 characters string
  businessName: string;
  businessNameCustomized?: string;
  businessAddress: string; // must include post code
  isEngagedEnterprise?: boolean;
  naf?: { code: string; nomenclature: string };
  appellations: AppellationDtoPublicV1[]; // at least one
  businessContact: BusinessContactDtoPublicV1;
  isSearchable: boolean;
};

export const formEstablishmentDtoPublicV1ToDomain = (
  publicV1: FormEstablishmentDtoPublicV1,
): OmitFromExistingKeys<FormEstablishmentDto, "source"> => publicV1;
