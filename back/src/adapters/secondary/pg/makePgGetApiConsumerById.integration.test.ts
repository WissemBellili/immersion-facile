import { Pool, PoolClient } from "pg";
import { ApiConsumer, expectTypeToMatchAndEqual } from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";

import { makePgGetApiConsumerById } from "./makePgGetApiConsumerById";
import { GetApiConsumerById } from "../../../domain/core/ports/GetApiConsumerById";

describe("PG GetApiConsumerById", () => {
  let pool: Pool;
  let client: PoolClient;
  let getAuthorizedApiConsumersIds: GetApiConsumerById;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    await client.query("DELETE FROM api_consumers");
    getAuthorizedApiConsumersIds = makePgGetApiConsumerById(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("gets the ApiConsumer from it's ID", async () => {
    const apiConsumer: ApiConsumer = {
      id: "11111111-1111-1111-1111-111111111111",
      consumer: "passeEmploi",
      description: "my description",
      createdAt: new Date(),
      expirationDate: new Date(),
      isAuthorized: true,
    };

    await insertInTable(apiConsumer);

    const apiConsumerFetched = await getAuthorizedApiConsumersIds(
      apiConsumer.id,
    );

    expectTypeToMatchAndEqual(apiConsumerFetched, apiConsumer);
  });

  const insertInTable = async ({
    id,
    consumer,
    description,
    isAuthorized,
    createdAt,
    expirationDate,
  }: ApiConsumer) => {
    await client.query(
      `INSERT INTO api_consumers (id, consumer, description, is_authorized, created_at, expiration_date)
        VALUES ('${id}', '${consumer}', '${description}', ${isAuthorized}, '${createdAt.toISOString()}', '${expirationDate.toISOString()}');`,
    );
  };
});
