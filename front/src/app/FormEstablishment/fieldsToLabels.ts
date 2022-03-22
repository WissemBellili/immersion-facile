import type { FormEstablishmentDto } from "src/shared/FormEstablishmentDto";

export type FieldsWithLabel = Exclude<
  keyof FormEstablishmentDto,
  "id" | "naf" | "businessContacts" | "source"
>;

export const fieldsToLabel: Record<FieldsWithLabel, string> = {
  businessAddress: "Vérifiez l'adresse de votre établissement",
  businessName: "Vérifiez le nom (raison sociale) de votre établissement",
  businessNameCustomized:
    "Indiquez le nom de l'enseigne de l'établissement d'accueil, si elle diffère de la raison sociale",
  preferredContactMethods:
    "Comment souhaitez-vous que les candidats vous contactent ?",
  professions: "Métiers ouverts à l'immersion",
  siret: "Indiquez le SIRET de la structure d'accueil",
  isEngagedEnterprise:
    "Mon entreprise est membre de la communauté « Les entreprises s'engagent »",
};
