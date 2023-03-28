import {
  defaultMaxContactsPerWeek as defaultMaxContactsPerWeek,
  FormEstablishmentDto,
  OmitFromExistingKeys,
  SiretDto,
} from "shared";

export const defaultInitialValue = (
  siret?: SiretDto,
): OmitFromExistingKeys<FormEstablishmentDto, "source"> => ({
  siret: siret || "",
  businessName: "",
  businessAddress: "",
  appellations: [
    {
      appellationCode: "",
      appellationLabel: "",
      romeCode: "",
      romeLabel: "",
    },
  ],
  businessContact: {
    firstName: "",
    lastName: "",
    job: "",
    phone: "",
    email: "",
    contactMethod: "EMAIL",
    copyEmails: [],
  },
  website: "",
  additionalInformation: "",
  maxContactsPerWeek: defaultMaxContactsPerWeek,
});
