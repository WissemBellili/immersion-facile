import supertest from "supertest";
import { AppConfig } from "../adapters/primary/appConfig";
import type { Repositories } from "../adapters/primary/config";
import { createApp } from "../adapters/primary/server";
import { BasicEventCrawler } from "../adapters/secondary/core/EventCrawlerImplementations";
import type { InMemoryOutboxRepository } from "../adapters/secondary/core/InMemoryOutboxRepository";
import { InMemoryImmersionOfferRepository } from "../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { InMemoryLaBonneBoiteAPI } from "../adapters/secondary/immersionOffer/InMemoryLaBonneBoiteAPI";
import { InMemorySearchMadeRepository } from "../adapters/secondary/immersionOffer/InMemorySearchMadeRepository";
import { InMemoryLaBonneBoiteRequestRepository } from "../adapters/secondary/immersionOffer/InMemoryLaBonneBoiteRequestRepository";
import type { InMemoryAgencyRepository } from "../adapters/secondary/InMemoryAgencyRepository";
import type { InMemoryEmailGateway } from "../adapters/secondary/InMemoryEmailGateway";
import { InMemoryFormEstablishmentRepository } from "../adapters/secondary/InMemoryFormEstablishmentRepository";
import type { InMemoryImmersionApplicationRepository } from "../adapters/secondary/InMemoryImmersionApplicationRepository";
import { InMemoryRomeGateway } from "../adapters/secondary/InMemoryRomeGateway";
import { InMemorySireneRepository } from "../adapters/secondary/InMemorySireneRepository";
import { GetApiConsumerById } from "../domain/core/ports/GetApiConsumerById";
import { GetFeatureFlags } from "../domain/core/ports/GetFeatureFlags";
import { AgencyConfigBuilder } from "./AgencyConfigBuilder";
import { AppConfigBuilder } from "./AppConfigBuilder";
import { ImmersionApplicationDtoBuilder } from "./ImmersionApplicationDtoBuilder";
import { ImmersionApplicationExportQueries } from "../domain/immersionApplication/ports/ImmersionApplicationExportQueries";
import { GenerateApiConsumerJtw } from "../domain/auth/jwt";
import { EstablishmentExportQueries } from "../domain/establishment/ports/EstablishmentExportQueries";
import { PostalCodeDepartmentRegionQueries } from "../domain/generic/geo/ports/PostalCodeDepartmentRegionQueries";

export type InMemoryRepositories = {
  outbox: InMemoryOutboxRepository;
  immersionOffer: InMemoryImmersionOfferRepository;
  agency: InMemoryAgencyRepository;
  formEstablishment: InMemoryFormEstablishmentRepository;
  immersionApplication: InMemoryImmersionApplicationRepository;
  searchesMade: InMemorySearchMadeRepository;
  rome: InMemoryRomeGateway;
  email: InMemoryEmailGateway;
  sirene: InMemorySireneRepository;
  laBonneBoiteAPI: InMemoryLaBonneBoiteAPI;
  laBonneBoiteRequest: InMemoryLaBonneBoiteRequestRepository;
  immersionApplicationExport: ImmersionApplicationExportQueries;
  establishmentExport: EstablishmentExportQueries;
  postalCodeDepartmentRegion: PostalCodeDepartmentRegionQueries;
  getApiConsumerById: GetApiConsumerById;
  getFeatureFlags: GetFeatureFlags;
};

// following function only to type check that InMemoryRepositories is assignable to Repositories :
// prettier-ignore
const isAssignable = (inMemoryRepos: InMemoryRepositories): Repositories => inMemoryRepos;

export type TestAppAndDeps = {
  request: supertest.SuperTest<supertest.Test>;
  reposAndGateways: InMemoryRepositories;
  eventCrawler: BasicEventCrawler;
  appConfig: AppConfig;
  generateApiJwt: GenerateApiConsumerJtw;
};

export const buildTestApp = async (
  appConfigOverrides?: AppConfig,
): Promise<TestAppAndDeps> => {
  const adminEmail = "admin@email.fr";
  const validImmersionApplication =
    new ImmersionApplicationDtoBuilder().build();
  const agencyConfig = AgencyConfigBuilder.create(
    validImmersionApplication.agencyId,
  )
    .withName("TEST-name")
    .withAdminEmails([adminEmail])
    .withQuestionnaireUrl("TEST-questionnaireUrl")
    .withSignature("TEST-signature")
    .build();

  const appConfig = new AppConfigBuilder({
    ENABLE_ENTERPRISE_SIGNATURE: "TRUE",
    SKIP_EMAIL_ALLOW_LIST: "TRUE",
    EMAIL_GATEWAY: "IN_MEMORY",
    SIRENE_REPOSITORY: "IN_MEMORY",
    DOMAIN: "my-domain",
    REPOSITORIES: "IN_MEMORY",
    LA_BONNE_BOITE_GATEWAY: "IN_MEMORY",
    EVENT_CRAWLER_PERIOD_MS: "0", // will not crawl automatically
    ...appConfigOverrides?.configParams,
  }).build();

  if (appConfig.emailGateway !== "IN_MEMORY") throwNotSupportedError();
  if (appConfig.repositories !== "IN_MEMORY") throwNotSupportedError();
  if (appConfig.sireneRepository !== "IN_MEMORY") throwNotSupportedError();

  const {
    app,
    repositories,
    eventCrawler: rawEventCrawler,
    generateApiJwt,
  } = await createApp(appConfig);

  const request = supertest(app);
  const eventCrawler = rawEventCrawler as BasicEventCrawler;
  const reposAndGateways = repositories as InMemoryRepositories;

  await reposAndGateways.agency.insert(agencyConfig);

  return {
    request,
    reposAndGateways,
    eventCrawler,
    appConfig,
    generateApiJwt,
  };
};

const throwNotSupportedError = () => {
  throw new Error("AppConfig not supported.");
};
