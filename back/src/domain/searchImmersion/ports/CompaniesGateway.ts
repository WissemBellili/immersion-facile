import type { CompanyEntity } from "../entities/CompanyEntity";
import type { SearchParams } from "./ImmersionOfferRepository";
import type { UncompleteCompanyEntity } from "../entities/UncompleteCompanyEntity";

export interface CompaniesGateway {
  getCompanies: (
    searchParams: SearchParams,
  ) => Promise<UncompleteCompanyEntity[]>;
}
