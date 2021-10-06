import { z } from "../../node_modules/zod";

export const zString = z.string({
  required_error: "Obligatoire",
  invalid_type_error: "Une chaine de caractères est attendue",
});

export const zRequiredString = zString
  .nonempty("Obligatoire")

  .refine((s) => s.trim() === s, "Obligatoire");

export const zEmail = zString
  .nonempty("Obligatoire")
  .email("Veuillez saisir une adresse e-mail valide");

export const zBoolean = z.boolean({
  required_error: "Obligatoire",
  invalid_type_error: "Un booléen est attendu",
});

export const zTrue = z
  .boolean()
  .refine((bool) => bool, "L'engagement est obligatoire");
