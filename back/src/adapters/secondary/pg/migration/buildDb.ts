import fs from "fs";
import { Client } from "pg";
import format from "pg-format";
import { promisify } from "util";
import { sleep } from "../../../../shared/utils";
import { createLogger } from "../../../../utils/logger";
import { AppConfig } from "../../../primary/appConfig";
import { createAgencyConfigsFromAppConfig } from "../../InMemoryAgencyRepository";
import { AgencyConfigs } from "./../../InMemoryAgencyRepository";

const logger = createLogger(__filename);

const readFile = promisify(fs.readFile);

const tryToConnect = async (
  connectionString: string,
  tryNumber = 0,
): Promise<Client> => {
  if (tryNumber >= 5)
    throw new Error("Tried to connect 5 times without success");
  try {
    logger.info("Trying to connect to DB ...");
    const client = new Client({ connectionString });
    await client.connect();
    logger.info("Successfully connected");
    return client;
  } catch (e: any) {
    const newTryNumber = tryNumber + 1;
    logger.error(
      `Could not connect to DB (error: ${e.message}). Try number: ${newTryNumber}, will try again in 15s`,
    );
    await sleep(15000);
    return await tryToConnect(connectionString, newTryNumber);
  }
};

const buildDb = async () => {
  // It should be the same AppConfig than the one in startServer.ts
  const appConfig = AppConfig.createFromEnv();
  const providedPgUrl = process.argv[2];

  // during CI we don't have repositories set in config, but we provide a PG_URL, that's why we need the extra check below
  if (appConfig.repositories !== "PG" && !providedPgUrl) {
    logger.info(
      `Repositories are ${process.env.REPOSITORIES}, so the Postgres buildDb script won't be run`,
    );
    return;
  }

  const pgUrl = providedPgUrl ?? appConfig.pgImmersionDbUrl;
  if (!pgUrl) throw new Error("Please provide PG url");
  logger.info(`Starting build db script for db url : ${pgUrl} -- end`);

  const client = await tryToConnect(pgUrl);
  const checkIfTableExists = makeCheckIfTableAlreadyExists(client);

  // prettier-ignore
  const immersionOffersTableAlreadyExists = await checkIfTableExists("immersion_offers");
  if (!immersionOffersTableAlreadyExists) {
    logger.info("We will thus construct the database");
    await buildSearchImmersionDb(client);
  }

  // prettier-ignore
  const immersionApplicationTableAlreadyExists = await checkIfTableExists("immersion_applications");
  if (!immersionApplicationTableAlreadyExists) {
    logger.info("We will thus create the immersion_applications table");
    await buildImmersionApplication(client);
  }

  // prettier-ignore
  const formEstablishmentTableAlreadyExists = await checkIfTableExists("form_establishments");
  if (!formEstablishmentTableAlreadyExists) {
    logger.info("We will thus create the form_establishments table");
    await buildFormEstablishment(client);
  }

  // prettier-ignore
  const agenciesTableAlreadyExists = await checkIfTableExists("agencies");
  if (!agenciesTableAlreadyExists) {
    logger.info("We will thus create the agencies table");
    await buildAgencies(client);
    if (shouldPopulateWithTestData(appConfig)) {
      await insertTestAgencies(
        client,
        createAgencyConfigsFromAppConfig(appConfig),
      );
    }
  }

  await client.end();
};

const makeCheckIfTableAlreadyExists =
  (client: Client) =>
  async (tableName: string): Promise<boolean> => {
    try {
      // template strings for sql queries should be avoided, but how to pass table name otherwise ?
      await client.query(`SELECT * FROM ${tableName} LIMIT 1`);
      logger.info(`${tableName} table already exists`);
      return true;
    } catch (e: any) {
      logger.info(
        `${tableName} does not exists, trying to query got: ${e.message}`,
      );
      return false;
    }
  };

const buildSearchImmersionDb = async (client: Client) => {
  const file = await readFile(__dirname + "/database.sql");
  const sql = file.toString();
  await client.query(sql);
};

const buildImmersionApplication = async (client: Client) => {
  // prettier-ignore
  const file = await readFile(__dirname + "/createImmersionApplicationsTable.sql");
  const sql = file.toString();
  await client.query(sql);
};

const buildFormEstablishment = async (client: Client) => {
  const file = await readFile(__dirname + "/createFormEstablishmentsTable.sql");
  const sql = file.toString();
  await client.query(sql);
};

const buildAgencies = async (client: Client) => {
  const file = await readFile(__dirname + "/createAgenciesTable.sql");
  const sql = file.toString();
  await client.query(sql);
};

const shouldPopulateWithTestData = (appConfig: AppConfig) => {
  switch (appConfig.nodeEnv) {
    case "local":
    case "test":
      return true;
    case "production":
      switch (appConfig.envType) {
        case "dev":
        case "staging":
          return true;
      }
  }
  return false;
};

const insertTestAgencies = async (client: Client, agencies: AgencyConfigs) => {
  const query = `INSERT INTO public.agencies(
    id, name, counsellor_emails, validator_emails, admin_emails, questionnaire_url, email_signature
  ) VALUES %L`;
  const values = Object.values(agencies).map((agency) => [
    agency.uuid,
    agency.name,
    JSON.stringify(agency.counsellorEmails),
    JSON.stringify(agency.validatorEmails),
    JSON.stringify(agency.adminEmails),
    agency.questionnaireUrl || null,
    agency.signature,
  ]);
  await client.query(format(query, values));
};

buildDb().then(() => {
  logger.info("Migrated db successfully");
});
