import promClient from "prom-client";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { frontRoutes } from "shared/src/routes";
import {
  makeGenerateJwtES256,
  makeGenerateJwtHS256,
} from "../../../domain/auth/jwt";
import { RealClock } from "../../secondary/core/ClockImplementations";
import { InMemoryEventBus } from "../../secondary/core/InMemoryEventBus";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { makeAdminAuthMiddleware } from "../adminAuthMiddleware";
import {
  createApiKeyAuthMiddlewareV0,
  makeApiKeyAuthMiddlewareV1,
  makeMagicLinkAuthMiddleware,
} from "../authMiddleware";
import {
  makeHandleManagedRedirectResponseError,
  makeHandleRawRedirectResponseError,
} from "../helpers/handleRedirectResponseError";
import { AppConfig } from "./appConfig";
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
  const generateApiJwt = makeGenerateJwtES256(config.apiJwtPrivateKey);
  const generateMagicLinkJwt = makeGenerateJwtES256(
    config.magicLinkJwtPrivateKey,
  );
  const generateAdminJwt = makeGenerateJwtHS256(config.adminJwtSecret, "365d");
  const generateMagicLinkFn = createGenerateConventionMagicLink(config);

  const redirectErrorUrl: AbsoluteUrl = `${config.immersionFacileBaseUrl}/${frontRoutes.error}`;
  const errorHandlers = {
    handleManagedRedirectResponseError:
      makeHandleManagedRedirectResponseError(redirectErrorUrl),
    handleRawRedirectResponseError:
      makeHandleRawRedirectResponseError(redirectErrorUrl),
  };

  return {
    useCases: createUseCases(
      config,
      repositories,
      generateMagicLinkJwt,
      generateMagicLinkFn,
      generateAdminJwt,
      uowPerformer,
      clock,
      uuidGenerator,
    ),
    repositories,
    applicationMagicLinkAuthMiddleware: makeMagicLinkAuthMiddleware(
      config,
      "application",
    ),
    errorHandlers,
    establishmentMagicLinkAuthMiddleware: makeMagicLinkAuthMiddleware(
      config,
      "establishment",
    ),
    apiKeyAuthMiddlewareV0: createApiKeyAuthMiddlewareV0(
      repositories.getApiConsumerById,
      clock,
      config,
    ),
    apiKeyAuthMiddleware: makeApiKeyAuthMiddlewareV1(
      repositories.getApiConsumerById,
      clock,
      config,
    ),
    adminAuthMiddleware: await makeAdminAuthMiddleware(
      config.adminJwtSecret,
      clock,
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
