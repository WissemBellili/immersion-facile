import { PoolClient } from "pg";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../domain/core/ports/UnitOfWork";
import { EstablishmentExportQueries } from "../../../domain/establishment/ports/EstablishmentExportQueries";
import { PostalCodeDepartmentRegionQueries } from "../../../domain/generic/geo/ports/PostalCodeDepartmentRegionQueries";
import { ImmersionApplicationQueries } from "../../../domain/immersionApplication/ports/ImmersionApplicationQueries";
import { InMemoryOutboxQueries } from "../../secondary/core/InMemoryOutboxQueries";
import { InMemoryOutboxRepository } from "../../secondary/core/InMemoryOutboxRepository";
import { InMemoryEstablishmentAggregateRepository } from "../../secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryAgencyRepository } from "../../secondary/InMemoryAgencyRepository";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryFormEstablishmentRepository } from "../../secondary/InMemoryFormEstablishmentRepository";
import { InMemoryImmersionApplicationQueries } from "../../secondary/InMemoryImmersionApplicationQueries";
import { InMemoryImmersionApplicationRepository } from "../../secondary/InMemoryImmersionApplicationRepository";
import { InMemoryImmersionAssessmentRepository } from "../../secondary/InMemoryImmersionAssessmentRepository";
import { InMemoryRomeRepository } from "../../secondary/InMemoryRomeRepository";
import { InMemoryUowPerformer } from "../../secondary/InMemoryUowPerformer";
import { makeStubGetFeatureFlags } from "../../secondary/makeStubGetFeatureFlags";
import { makePgGetFeatureFlags } from "../../secondary/pg/makePgGetFeatureFlags";
import { PgAgencyRepository } from "../../secondary/pg/PgAgencyRepository";
import { PgConventionPoleEmploiAdvisorRepository } from "../../secondary/pg/PgConventionPoleEmploiAdvisorRepository";
import { PgEstablishmentAggregateRepository } from "../../secondary/pg/PgEstablishmentAggregateRepository";
import { PgEstablishmentExportQueries } from "../../secondary/pg/PgEstablishmentExportQueries";
import { PgFormEstablishmentRepository } from "../../secondary/pg/PgFormEstablishmentRepository";
import { PgImmersionApplicationQueries } from "../../secondary/pg/PgImmersionApplicationQueries";
import { PgImmersionApplicationRepository } from "../../secondary/pg/PgImmersionApplicationRepository";
import { PgImmersionAssessmentRepository } from "../../secondary/pg/PgImmersionAssessmentRepository";
import { PgOutboxQueries } from "../../secondary/pg/PgOutboxQueries";
import { PgOutboxRepository } from "../../secondary/pg/PgOutboxRepository";
import { PgPostalCodeDepartmentRegionQueries } from "../../secondary/pg/PgPostalCodeDepartmentRegionQueries";
import { PgRomeRepository } from "../../secondary/pg/PgRomeRepository";
import { PgUowPerformer } from "../../secondary/pg/PgUowPerformer";
import { ExcelReportingGateway } from "../../secondary/reporting/ExcelReportingGateway";
import { InMemoryReportingGateway } from "../../secondary/reporting/InMemoryReportingGateway";
import { StubEstablishmentExportQueries } from "../../secondary/StubEstablishmentExportQueries";
import { StubPostalCodeDepartmentRegionQueries } from "../../secondary/StubPostalCodeDepartmentRegionQueries";
import { AppConfig } from "./appConfig";
import { GetPgPoolFn, Repositories } from "./repositoriesConfig";

export type InMemoryUnitOfWork = ReturnType<typeof createInMemoryUow>;
export const createInMemoryUow = (repositories?: Repositories) => {
  const outboxRepo =
    (repositories?.outbox as InMemoryOutboxRepository) ??
    new InMemoryOutboxRepository();
  const outboxQueries = new InMemoryOutboxQueries(outboxRepo);
  return {
    conventionPoleEmploiAdvisorRepo:
      new InMemoryConventionPoleEmploiAdvisorRepository(),
    immersionAssessmentRepository: new InMemoryImmersionAssessmentRepository(),
    romeRepo: repositories?.rome ?? new InMemoryRomeRepository(),
    outboxRepo,
    outboxQueries,
    formEstablishmentRepo:
      (repositories?.formEstablishment as InMemoryFormEstablishmentRepository) ??
      new InMemoryFormEstablishmentRepository(),
    establishmentAggregateRepo:
      (repositories?.immersionOffer as InMemoryEstablishmentAggregateRepository) ??
      new InMemoryEstablishmentAggregateRepository(),
    immersionApplicationRepo:
      (repositories?.immersionApplication as InMemoryImmersionApplicationRepository) ??
      new InMemoryImmersionApplicationRepository(),
    establishmentExportQueries:
      (repositories?.establishmentExport as EstablishmentExportQueries) ??
      StubEstablishmentExportQueries,
    immersionApplicationQueries:
      (repositories?.immersionApplicationQueries as ImmersionApplicationQueries) ??
      InMemoryImmersionApplicationQueries,
    postalCodeDepartmentRegionQueries:
      (repositories?.postalCodeDepartmentRegion as PostalCodeDepartmentRegionQueries) ??
      StubPostalCodeDepartmentRegionQueries,
    getFeatureFlags: makeStubGetFeatureFlags(),
    agencyRepo:
      (repositories?.agency as InMemoryAgencyRepository) ??
      new InMemoryAgencyRepository(),
    reportingGateway:
      (repositories?.reportingGateway as InMemoryReportingGateway) ??
      new InMemoryReportingGateway(),
  };
};

// for typechecking only
const _isAssignable = (inMemoryUow: InMemoryUnitOfWork): UnitOfWork =>
  inMemoryUow;

export const createPgUow = (client: PoolClient): UnitOfWork => ({
  conventionPoleEmploiAdvisorRepo: new PgConventionPoleEmploiAdvisorRepository(
    client,
  ),
  immersionAssessmentRepository: new PgImmersionAssessmentRepository(client),
  romeRepo: new PgRomeRepository(client),
  outboxRepo: new PgOutboxRepository(client),
  outboxQueries: new PgOutboxQueries(client),
  agencyRepo: new PgAgencyRepository(client),
  formEstablishmentRepo: new PgFormEstablishmentRepository(client),
  establishmentAggregateRepo: new PgEstablishmentAggregateRepository(client),
  immersionApplicationRepo: new PgImmersionApplicationRepository(client),
  establishmentExportQueries: new PgEstablishmentExportQueries(client),
  immersionApplicationQueries: new PgImmersionApplicationQueries(client),
  postalCodeDepartmentRegionQueries: new PgPostalCodeDepartmentRegionQueries(
    client,
  ),
  getFeatureFlags: makePgGetFeatureFlags(client),
  reportingGateway: new ExcelReportingGateway(),
});

export const createUowPerformer = (
  config: AppConfig,
  getPgPoolFn: GetPgPoolFn,
  repositories: Repositories,
): UnitOfWorkPerformer =>
  config.repositories === "PG"
    ? new PgUowPerformer(getPgPoolFn(), createPgUow)
    : new InMemoryUowPerformer(createInMemoryUow(repositories));
