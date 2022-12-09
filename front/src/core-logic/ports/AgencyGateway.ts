import { Observable } from "rxjs";
import {
  AdminToken,
  AgencyDto,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  DepartmentCode,
  ListAgenciesRequestDto,
  WithAgencyId,
} from "shared";

export interface AgencyGateway {
  addAgency(agency: CreateAgencyDto): Promise<void>;
  listImmersionAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]>;

  listMiniStageAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]>;
  listImmersionWithoutPeAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]>;
  listImmersionOnlyPeAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]>;
  listAgenciesNeedingReview(adminToken: AdminToken): Promise<AgencyDto[]>;
  validateAgency(adminToken: AdminToken, agencyId: AgencyId): Promise<void>;

  getAgencyAdminById$(
    agencyId: AgencyId,
    adminToken: AdminToken,
  ): Observable<AgencyDto | undefined>;

  getAgencyPublicInfoById(
    agencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto>;

  listAgenciesByFilter$(
    filter: ListAgenciesRequestDto,
  ): Observable<AgencyOption[]>;
  getImmersionFacileAgencyId$(): Observable<AgencyId | false>;
  updateAgency$(agencyDto: AgencyDto, adminToken: AdminToken): Observable<void>;
}
