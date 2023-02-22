import { ImmersionContactInEstablishmentId } from "shared";

export type ContactMethod = "EMAIL" | "PHONE" | "IN_PERSON";

export type ContactEntityV2 = {
  id: ImmersionContactInEstablishmentId;
  lastName: string;
  firstName: string;
  email: string;
  job: string;
  phone: string;
  contactMethod: ContactMethod;
  copyEmails: string[];
  maxContactPerWeek?: number;
};
