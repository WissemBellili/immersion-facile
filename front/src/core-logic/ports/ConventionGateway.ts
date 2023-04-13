import { Observable } from "rxjs";

import {
  AbsoluteUrl,
  BackOfficeJwt,
  ConventionDto,
  ConventionId,
  ConventionMagicLinkJwt,
  ConventionReadDto,
  Role,
  ShareLinkByEmailDto,
  UpdateConventionStatusRequestDto,
} from "shared";

import { FetchConventionRequestedPayload } from "../domain/convention/convention.slice";

export interface ConventionGateway {
  retrieveFromToken$(
    payload: FetchConventionRequestedPayload,
  ): Observable<ConventionReadDto | undefined>;
  add$(conventionDto: ConventionDto): Observable<void>;

  // Get an immersion application through backoffice, password-protected route.
  getById(id: ConventionId): Promise<ConventionReadDto>;

  update$(conventionDto: ConventionDto, jwt: string): Observable<void>;

  updateStatus$(
    params: UpdateConventionStatusRequestDto,
    conventionId: ConventionId,
    jwt: ConventionMagicLinkJwt | BackOfficeJwt,
  ): Observable<void>;

  signConvention$(jwt: string): Observable<void>;

  generateMagicLink(
    adminToken: BackOfficeJwt,
    applicationId: ConventionId,
    role: Role,
    expired: boolean,
  ): Promise<string>;

  renewMagicLink(expiredJwt: string, originalUrl: string): Promise<void>;

  // shareLinkByEmailDTO
  shareLinkByEmail(shareLinkByEmailDTO: ShareLinkByEmailDto): Promise<boolean>;

  getConventionStatusDashboardUrl$(jwt: string): Observable<AbsoluteUrl>;
}
