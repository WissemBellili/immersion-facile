import { createTargets, CreateTargets, HttpClient, Target } from "http-client";
import { from, Observable } from "rxjs";
import {
  AdminToken,
  agenciesIdAndNameSchema,
  agenciesRoute,
  agenciesSchema,
  AgencyDto,
  AgencyId,
  agencyIdResponseSchema,
  agencyImmersionFacileIdRoute,
  AgencyOption,
  AgencyPublicDisplayDto,
  agencyPublicDisplaySchema,
  agencyPublicInfoByIdRoute,
  agencySchema,
  AgencyStatus,
  CreateAgencyDto,
  DepartmentCode,
  ListAgenciesRequestDto,
  WithAgencyId,
  WithAuthorization,
} from "shared";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

type WithAgencyStatus = { status: AgencyStatus };

export type AgencyTargets = CreateTargets<{
  getAgencyAdminById: Target<
    void,
    void,
    WithAuthorization,
    `/admin/${typeof agenciesRoute}/:agencyId`
  >;
  updateAgencyStatus: Target<
    WithAgencyStatus,
    void,
    WithAuthorization,
    `/admin/${typeof agenciesRoute}/:agencyId`
  >;
  updateAgency: Target<
    AgencyDto,
    void,
    WithAuthorization,
    `/admin/${typeof agenciesRoute}/:agencyId`
  >;
  getImmersionFacileAgencyId: Target;
  addAgency: Target<CreateAgencyDto>;
  getAgencyPublicInfoById: Target<void, WithAgencyId>;
  listAgenciesNeedingReview: Target<void, WithAgencyStatus, WithAuthorization>;
  getFilteredAgencies: Target<void, ListAgenciesRequestDto>;
}>;

export const agencyTargets = createTargets<AgencyTargets>({
  getAgencyAdminById: {
    method: "GET",
    url: `/admin/${agenciesRoute}/:agencyId`,
  },
  updateAgencyStatus: {
    method: "PATCH",
    url: `/admin/${agenciesRoute}/:agencyId`,
  },
  updateAgency: {
    method: "PUT",
    url: `/admin/${agenciesRoute}/:agencyId`,
  },
  getImmersionFacileAgencyId: {
    method: "GET",
    url: `/${agencyImmersionFacileIdRoute}`,
  },
  addAgency: {
    method: "POST",
    url: `/${agenciesRoute}`,
  },
  getAgencyPublicInfoById: {
    method: "GET",
    url: `/${agencyPublicInfoByIdRoute}`,
  },
  listAgenciesNeedingReview: {
    method: "GET",
    url: `/admin/${agenciesRoute}`,
  },
  getFilteredAgencies: {
    method: "GET",
    url: `/${agenciesRoute}`,
  },
});

export class HttpAgencyGateway implements AgencyGateway {
  constructor(private readonly httpClient: HttpClient<AgencyTargets>) {}

  getImmersionFacileAgencyId$(): Observable<AgencyId | false> {
    return from(
      this.httpClient.getImmersionFacileAgencyId().then(({ responseBody }) => {
        const agencyIdResponse = agencyIdResponseSchema.parse(responseBody);
        return typeof agencyIdResponse === "string" ? agencyIdResponse : false;
      }),
    );
  }

  public getAgencyAdminById$(
    agencyId: AgencyId,
    adminToken: AdminToken,
  ): Observable<AgencyDto> {
    return from(this.getAdminAgencyById(agencyId, adminToken));
  }

  public updateAgency$(
    agencyDto: AgencyDto,
    adminToken: AdminToken,
  ): Observable<void> {
    return from(
      this.httpClient
        .updateAgency({
          body: agencyDto,
          headers: { authorization: adminToken },
          urlParams: { agencyId: agencyDto.id },
        })
        .then(() => {
          /* void if success */
        }),
    );
  }

  private getAdminAgencyById(
    agencyId: AgencyId,
    adminToken: AdminToken,
  ): Promise<AgencyDto> {
    return this.httpClient
      .getAgencyAdminById({
        urlParams: { agencyId },
        headers: { authorization: adminToken },
      })
      .then(({ responseBody }) => agencySchema.parse(responseBody));
  }

  public async addAgency(createAgencyParams: CreateAgencyDto): Promise<void> {
    await this.httpClient.addAgency({ body: createAgencyParams });
  }

  public getAgencyPublicInfoById(
    withAgencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto> {
    return this.httpClient
      .getAgencyPublicInfoById({ queryParams: withAgencyId })
      .then(({ responseBody }) =>
        agencyPublicDisplaySchema.parse(responseBody),
      );
  }

  public listAgenciesByDepartmentCodeWithoutCci(
    departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    const request: ListAgenciesRequestDto = {
      departmentCode,
      kind: "cciExcluded",
    };
    return this.getFilteredAgencies(request);
  }

  public listAgenciesByFilter$(
    filter: ListAgenciesRequestDto,
  ): Observable<AgencyOption[]> {
    return from(this.getFilteredAgencies(filter));
  }

  public listPeAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    const request: ListAgenciesRequestDto = {
      departmentCode,
      kind: "peOnly",
    };
    return this.getFilteredAgencies(request);
  }

  public listNonPeAgencies(
    departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    const request: ListAgenciesRequestDto = {
      departmentCode,
      kind: "peExcluded",
    };
    return this.getFilteredAgencies(request);
  }

  listCciAgencies(departmentCode: DepartmentCode): Promise<AgencyOption[]> {
    const request: ListAgenciesRequestDto = {
      departmentCode,
      kind: "cciOnly",
    };
    return this.getFilteredAgencies(request);
  }

  // TODO Mieux identifier l'admin
  public listAgenciesNeedingReview(
    adminToken: AdminToken,
  ): Promise<AgencyDto[]> {
    return this.httpClient
      .listAgenciesNeedingReview({
        queryParams: { status: "needsReview" },
        headers: { authorization: adminToken },
      })
      .then(({ responseBody }) => agenciesSchema.parse(responseBody));
  }

  // TODO Mieux identifier l'admin
  public async validateAgency(
    adminToken: AdminToken,
    agencyId: AgencyId,
  ): Promise<void> {
    await this.httpClient.updateAgencyStatus({
      body: { status: "active" },
      headers: { authorization: adminToken },
      urlParams: { agencyId },
    });
  }

  private getFilteredAgencies(
    request: ListAgenciesRequestDto,
  ): Promise<AgencyOption[]> {
    return this.httpClient
      .getFilteredAgencies({ queryParams: request })
      .then(({ responseBody }) => agenciesIdAndNameSchema.parse(responseBody));
  }
}
