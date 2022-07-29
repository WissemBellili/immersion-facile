import { Pool } from "pg";
import { random, sleep } from "shared/src/utils";
import { UpdateAllPeAgencies } from "../../../domain/convention/useCases/UpdateAllPeAgencies";
import { noRateLimit } from "../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../domain/core/ports/RetryStrategy";
import { RealClock } from "../../secondary/core/ClockImplementations";
import { ConsoleAppLogger } from "../../secondary/core/ConsoleAppLogger";
import {
  defaultMaxBackoffPeriodMs,
  defaultRetryDeadlineMs,
} from "../../secondary/core/ExponentialBackoffRetryStrategy";
import { ExponentialBackoffRetryStrategy } from "../../secondary/core/ExponentialBackoffRetryStrategy";
import { QpsRateLimiter } from "../../secondary/core/QpsRateLimiter";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { HttpAdresseAPI } from "../../secondary/immersionOffer/HttpAdresseAPI";
import { HttpPeAgenciesReferential } from "../../secondary/immersionOffer/HttpPeAgenciesReferential";
import { PoleEmploiAccessTokenGateway } from "../../secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { AppConfig } from "../config/appConfig";
import { createUowPerformer } from "../config/uowConfig";

const updateAllPeAgenciesScript = async () => {
  const config = AppConfig.createFromEnv();
  const accessTokenGateway = new PoleEmploiAccessTokenGateway(
    config.poleEmploiAccessTokenConfig,
    noRateLimit,
    noRetries,
  );

  const httpPeAgenciesReferential = new HttpPeAgenciesReferential(
    config.peApiUrl,
    accessTokenGateway,
    config.poleEmploiClientId,
  );

  const maxQpsAdresseApi = 0.2;
  const clock = new RealClock();

  const adressAPI = new HttpAdresseAPI(
    new QpsRateLimiter(maxQpsAdresseApi, clock, sleep),
    new ExponentialBackoffRetryStrategy(
      defaultMaxBackoffPeriodMs,
      defaultRetryDeadlineMs,
      clock,
      sleep,
      random,
    ),
  );

  const dbUrl = config.pgImmersionDbUrl;
  const pool = new Pool({
    connectionString: dbUrl,
  });

  const { uowPerformer } = createUowPerformer(config, () => pool);

  const updateAllPeAgencies = new UpdateAllPeAgencies(
    uowPerformer,
    httpPeAgenciesReferential,
    adressAPI,
    config.defaultAdminEmail,
    new UuidV4Generator(),
    new ConsoleAppLogger(),
  );

  await updateAllPeAgencies.execute();
};

/* eslint-disable no-console */
updateAllPeAgenciesScript()
  .then(() => {
    console.log("Finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed with error : ", error);
    process.exit(1);
  });
