import { pipe } from "ramda";
import { z } from "zod";

export const zString = z
  .string({
    required_error: "Obligatoire",
    invalid_type_error: "Une chaine de caractères est attendue",
  })
  .nonempty("Obligatoire");

export const zTrimmedString = zString
  .transform((s) => s.trim())
  .refine((s) => s.length > 0, "Obligatoire");

const removeAccents = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const zEmail = z.preprocess(
  pipe(zString.parse, removeAccents),
  z.string().email("Veuillez saisir une adresse e-mail valide"),
);

export const zBoolean = z.boolean({
  required_error: "Obligatoire",
  invalid_type_error: "Un booléen est attendu",
});

type GuardedType<T> = T extends (x: any) => x is infer T ? T : never;

type TypeGuard<Input, Output extends Input> = (value: Input) => value is Output;

export const zCustom = <T extends TypeGuard<unknown, unknown>>(typeguard: T) => {
  return z.custom<GuardedType<T>>(typeguard);
};