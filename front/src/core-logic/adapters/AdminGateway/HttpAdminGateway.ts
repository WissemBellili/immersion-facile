import { from, Observable } from "rxjs";
import {
  AbsoluteUrl,
  AdminTargets,
  BackOfficeJwt,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  IcUserRoleForAgencyParams,
  InclusionConnectedUser,
  UserAndPassword,
} from "shared";
import { HttpClient } from "http-client";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class HttpAdminGateway implements AdminGateway {
  constructor(private readonly httpClient: HttpClient<AdminTargets>) {}

  public login(userAndPassword: UserAndPassword): Observable<BackOfficeJwt> {
    return from(
      this.httpClient
        .login({ body: userAndPassword })
        .then(({ responseBody }) => responseBody),
    );
  }

  public getDashboardUrl$(
    params: GetDashboardParams,
    token: BackOfficeJwt,
  ): Observable<AbsoluteUrl> {
    return from(
      this.httpClient
        .getDashboardUrl({
          urlParams: { dashboardName: params.name },
          queryParams: {
            ...(params.name === "agency" ? { agencyId: params.agencyId } : {}),
          },
          headers: {
            authorization: token,
          },
        })
        .then(({ responseBody }) => responseBody),
    );
  }
  public addEstablishmentBatch$(
    establishmentBatch: FormEstablishmentBatchDto,
    token: BackOfficeJwt,
  ): Observable<EstablishmentBatchReport> {
    return from(
      this.httpClient
        .addFormEstablishmentBatch({
          headers: {
            authorization: token,
          },
          body: establishmentBatch,
        })
        .then(({ responseBody }) => responseBody),
    );
  }

  public updateUserRoleForAgency$(
    params: IcUserRoleForAgencyParams,
    token: string,
  ): Observable<void> {
    return from(
      this.httpClient
        .updateUserRoleForAgency({
          body: params,
          headers: { authorization: token },
        })
        .then(({ responseBody }) => responseBody),
    );
  }

  public getInclusionConnectedUsersToReview$(
    token: BackOfficeJwt,
  ): Observable<InclusionConnectedUser[]> {
    return from(
      this.httpClient
        .getInclusionConnectedUsers({
          queryParams: { agencyRole: "toReview" },
          headers: { authorization: token },
        })
        .then(({ responseBody }) => responseBody),
    );
  }
}
