import promClient from "prom-client";
import { makeGenerateJwt } from "../../../domain/auth/jwt";
import { RealClock } from "../../secondary/core/ClockImplementations";
import {
  AllowListEmailFilter,
  AlwaysAllowEmailFilter,
} from "../../secondary/core/EmailFilterImplementations";
import { InMemoryEventBus } from "../../secondary/core/InMemoryEventBus";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import {
  createApiKeyAuthMiddlewareV0,
  createApiKeyAuthMiddlewareV1,
  createMagicLinkAuthMiddleware,
} from "../authMiddleware";
import { AppConfig } from "./appConfig";
import { createAuthChecker } from "./createAuthChecker";
import { createEventCrawler } from "./createEventCrawler";
import { createGenerateConventionMagicLink } from "./createGenerateConventionMagicLink";
import { createUseCases } from "./createUseCases";
import { createGetPgPoolFn, createRepositories } from "./repositoriesConfig";
import { createUowPerformer } from "./uowConfig";

const counterEventsMarkedAsPublished = new promClient.Counter({
  name: "pg_outbox_repository_events_marked_as_published",
  help: "The total count of events marked as published by PgOutboxRepository.",
  labelNames: ["topic"],
});

const clock = new RealClock();
const uuidGenerator = new UuidV4Generator();

export type AppDependencies = ReturnType<
  typeof createAppDependencies
> extends Promise<infer T>
  ? T
  : never;

export const createAppDependencies = async (config: AppConfig) => {
  const getPgPoolFn = createGetPgPoolFn(config);
  const repositories = await createRepositories(config, getPgPoolFn, clock);

  const eventBus = new InMemoryEventBus(clock, (event) => {
    counterEventsMarkedAsPublished.inc({ topic: event.topic });
    return repositories.outbox.save(event);
  });
  const uowPerformer = createUowPerformer(config, getPgPoolFn, repositories);
  const generateApiJwt = makeGenerateJwt(config.apiJwtPrivateKey);
  const generateMagicLinkJwt = makeGenerateJwt(config.magicLinkJwtPrivateKey);
  const generateMagicLinkFn = createGenerateConventionMagicLink(config);

  const emailFilter = config.skipEmailAllowlist
    ? new AlwaysAllowEmailFilter()
    : new AllowListEmailFilter(config.emailAllowList);

  return {
    useCases: createUseCases(
      config,
      repositories,
      generateMagicLinkJwt,
      generateMagicLinkFn,
      emailFilter,
      uowPerformer,
      clock,
      uuidGenerator,
    ),
    repositories,
    authChecker: createAuthChecker(config),
    applicationMagicLinkAuthMiddleware: createMagicLinkAuthMiddleware(
      config,
      "application",
    ),
    establishmentMagicLinkAuthMiddleware: createMagicLinkAuthMiddleware(
      config,
      "establishment",
    ),
    apiKeyAuthMiddlewareV0: await createApiKeyAuthMiddlewareV0(
      repositories.getApiConsumerById,
      clock,
      config,
    ),
    apiKeyAuthMiddleware: await createApiKeyAuthMiddlewareV1(
      repositories.getApiConsumerById,
      clock,
      config,
    ),
    generateMagicLinkJwt,
    generateApiJwt,
    eventBus,
    eventCrawler: createEventCrawler(
      config,
      repositories.outboxQueries,
      eventBus,
    ),
    clock,
  };
};
