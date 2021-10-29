import { AgencyCode } from "../../../shared/agencies";

export type AgencyConfig = {
  id: string;
  name: string;
  counsellorEmails: string[];
  validatorEmails: string[];
  adminEmails: string[];
  questionnaireUrl: string;
  signature: string;
};

export interface AgencyRepository {
  getConfig: (agencyCode: AgencyCode) => Promise<AgencyConfig | undefined>;
}
