import { templatesByName } from "./templatesByName";
import { ValueOf } from "../utils";

export type GenericTemplatedEmail<
  T extends string,
  P extends Record<string, unknown>,
> = {
  type: T;
  params: P;
  recipients: string[];
  cc?: string[];
};

export type EmailType = TemplatedEmail["type"];

export type EmailSentDto = {
  templatedEmail: TemplatedEmail;
  sentAt: string;
  error?: string;
};

type KeysOfUnion<T> = T extends T ? keyof T : never;
// https://stackoverflow.com/questions/49401866/all-possible-keys-of-an-union-type
export type EmailVariables = KeysOfUnion<TemplatedEmail["params"]>;

type TemplateByName = typeof templatesByName;
export type TemplatedEmail = ValueOf<{
  [K in keyof TemplateByName]: GenericTemplatedEmail<
    K,
    Parameters<TemplateByName[K]["createEmailVariables"]>[0]
  >;
}>;
