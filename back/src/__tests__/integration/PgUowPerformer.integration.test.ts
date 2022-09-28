import { Pool, PoolClient } from "pg";
import { FormEstablishmentDtoBuilder } from "shared";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { createPgUow } from "../../adapters/primary/config/uowConfig";
import { CustomClock } from "../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../adapters/secondary/core/UuidGeneratorImplementations";
import { PgUowPerformer } from "../../adapters/secondary/pg/PgUowPerformer";
import { makeCreateNewEvent } from "../../domain/core/eventBus/EventBus";
import { UnitOfWork } from "../../domain/core/ports/UnitOfWork";

const someSiret = "12345678901234";

describe("PgUowPerformer", () => {
  let pool: Pool;
  let client: PoolClient;
  const uuidGenerator = new TestUuidGenerator();
  const createNewEvent = makeCreateNewEvent({
    uuidGenerator,
    clock: new CustomClock(),
  });
  let pgUowPerformer: PgUowPerformer;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM form_establishments");
    await client.query("DELETE FROM outbox_failures");
    await client.query("DELETE FROM outbox_publications");
    await client.query("DELETE FROM outbox");
    pgUowPerformer = new PgUowPerformer(pool, createPgUow);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("saves everything when all goes fine", async () => {
    uuidGenerator.setNextUuid("11111111-1111-1111-1111-111111111111");
    await pgUowPerformer.perform(useCaseUnderTest);
    await expectLengthOfRepos({ formEstablishmentLength: 1, outboxLength: 1 });
  });

  it("keeps modifications atomic when something goes wrong", async () => {
    uuidGenerator.setNextUuid("a failing uuid");
    try {
      await pgUowPerformer.perform(useCaseUnderTest);
      expect("Should not be reached").toBe("");
    } catch (error: any) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(error.message).toBe(
        'invalid input syntax for type uuid: "a failing uuid"',
      );
    }

    await expectLengthOfRepos({ formEstablishmentLength: 0, outboxLength: 0 });
  });

  const useCaseUnderTest = async (uow: UnitOfWork) => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(someSiret)
      .build();

    await uow.formEstablishmentRepository.create(formEstablishment)!;

    const event = createNewEvent({
      topic: "FormEstablishmentAdded",
      payload: formEstablishment,
    });
    await uow.outboxRepository.save(event);
  };

  const expectLengthOfRepos = async ({
    formEstablishmentLength,
    outboxLength,
  }: {
    formEstablishmentLength: number;
    outboxLength: number;
  }) => {
    const { rows: formEstablishments } = await client.query(
      "SELECT * FROM form_establishments",
    );
    expect(formEstablishments).toHaveLength(formEstablishmentLength);

    const { rows: outbox } = await client.query("SELECT * FROM outbox");
    expect(outbox).toHaveLength(outboxLength);
  };
});
