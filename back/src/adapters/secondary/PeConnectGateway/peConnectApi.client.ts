import {
  configureHttpClient,
  createTargets,
  HandlerCreator,
  HttpClient,
} from "http-client";
import { AbsoluteUrl, queryParamsAsString } from "shared";
import { AccessTokenDto } from "../../../domain/peConnect/dto/AccessToken.dto";
import { PeConnectAdvisorDto } from "../../../domain/peConnect/dto/PeConnectAdvisor.dto";
import { PeConnectUserDto } from "../../../domain/peConnect/dto/PeConnectUser.dto";
import { AppConfig } from "../../primary/config/appConfig";
import {
  AccessTokenHttpRequestConfig,
  ExternalAccessToken,
  ExternalPeConnectAdvisor,
  ExternalPeConnectOAuthGrantPayload,
  ExternalPeConnectUser,
  PeConnectHeaders,
  PeConnectOauthConfig,
  PeConnectTargets,
} from "./peConnectApi.dto";

export const makePeConnectHttpClient = (
  handlerCreator: HandlerCreator,
  appConfig: AppConfig,
): HttpClient<PeConnectTargets> =>
  configureHttpClient(handlerCreator)<PeConnectTargets>(
    peConnectTargets(appConfig),
  );

export const peConnectNeededScopesForAllUsedApi = (clientId: string): string =>
  [
    `application_${clientId}`,
    "api_peconnect-individuv1",
    "api_peconnect-conseillersv1",
    "api_peconnect-statutv1",
    "individu",
    "openid",
    "profile",
    "email",
    "statut",
  ].join(" ");

export const peConnectTargets = (appConfig: AppConfig) =>
  createTargets<PeConnectTargets>({
    getAdvisorsInfo: {
      method: "GET",
      url: `${appConfig.peApiUrl}/partenaire/peconnect-conseillers/v1/contactspe/conseillers`,
    },
    getUserInfo: {
      method: "GET",
      url: `${appConfig.peApiUrl}/partenaire/peconnect-individu/v1/userinfo`,
    },
    getUserStatutInfo: {
      method: "GET",
      url: `${appConfig.peApiUrl}/partenaire/peconnect-statut/v1/statut`,
    },
    exchangeCodeForAccessToken: {
      method: "POST",
      url: `${appConfig.peAuthCandidatUrl}/connexion/oauth2/access_token?realm=%2Findividu`,
    },
  });

export const peConnectheadersWithBearerAuthToken = (
  accessToken: AccessTokenDto,
): PeConnectHeaders => ({
  "Content-Type": "application/json",
  Accept: "application/json",
  Authorization: `Bearer ${accessToken.value}`,
});

export const makePeConnectLoginPageUrl = (appConfig: AppConfig): AbsoluteUrl =>
  makeOauthGetAuthorizationCodeRedirectUrl(appConfig.peAuthCandidatUrl, {
    response_type: "code",
    client_id: appConfig.poleEmploiClientId,
    realm: "/individu",
    redirect_uri: `${appConfig.immersionFacileBaseUrl}/api/pe-connect`,
    scope: peConnectNeededScopesForAllUsedApi(appConfig.poleEmploiClientId),
  });

export const makeOauthGetAuthorizationCodeRedirectUrl = (
  peAuthCandidatUrl: AbsoluteUrl,
  authorizationCodePayload: ExternalPeConnectOAuthGrantPayload,
): AbsoluteUrl =>
  `${peAuthCandidatUrl}/connexion/oauth2/authorize?${queryParamsAsString<ExternalPeConnectOAuthGrantPayload>(
    authorizationCodePayload,
  )}`;

export const toAccessTokenHttpRequestConfig = (
  authorizationCode: string,
  configs: PeConnectOauthConfig,
): AccessTokenHttpRequestConfig => ({
  body: {
    client_id: configs.poleEmploiClientId,
    client_secret: configs.poleEmploiClientSecret,
    code: authorizationCode,
    grant_type: "authorization_code",
    redirect_uri: `${configs.immersionFacileBaseUrl}/api/pe-connect`,
  },
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

export const toPeConnectAdvisorDto = (
  fromApi: ExternalPeConnectAdvisor,
): PeConnectAdvisorDto => ({
  email: fromApi.mail,
  firstName: fromApi.prenom,
  lastName: fromApi.nom,
  type: fromApi.type,
});

export const toPeConnectUserDto = (
  externalPeConnectUser: ExternalPeConnectUser & { isUserJobseeker: boolean },
): PeConnectUserDto => ({
  isJobseeker: externalPeConnectUser.isUserJobseeker,
  email: externalPeConnectUser.email,
  firstName: externalPeConnectUser.given_name,
  lastName: externalPeConnectUser.family_name,
  peExternalId: externalPeConnectUser.idIdentiteExterne,
});

export const toAccessToken = (
  externalAccessToken: ExternalAccessToken,
): AccessTokenDto => ({
  value: externalAccessToken.access_token,
  expiresIn: externalAccessToken.expires_in,
});
