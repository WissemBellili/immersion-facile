import { Pool, PoolClient } from "pg";
import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import { ConventionId } from "shared/src/convention/convention.dto";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { RealClock } from "../../adapters/secondary/core/ClockImplementations";
import { UuidV4Generator } from "../../adapters/secondary/core/UuidGeneratorImplementations";
import { PgAgencyRepository } from "../../adapters/secondary/pg/PgAgencyRepository";
import { PgConventionQueries } from "../../adapters/secondary/pg/PgConventionQueries";
import { PgConventionRepository } from "../../adapters/secondary/pg/PgConventionRepository";
import { PgOutboxRepository } from "../../adapters/secondary/pg/PgOutboxRepository";
import { ConventionRawBeforeExport } from "../../domain/convention/useCases/ExportConventionsReport";
import { makeCreateNewEvent } from "../../domain/core/eventBus/EventBus";
import { ImmersionAssessmentEmailParams } from "../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";

describe("Pg implementation of ConventionQueries", () => {
  let pool: Pool;
  let client: PoolClient;
  let conventionQueries: PgConventionQueries;
  let agencyRepo: PgAgencyRepository;
  let conventionRepository: PgConventionRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM conventions");
    await client.query(
      "TRUNCATE TABLE convention_external_ids RESTART IDENTITY;",
    );
    await client.query("DELETE FROM agencies");

    conventionQueries = new PgConventionQueries(client);
    agencyRepo = new PgAgencyRepository(client);
    conventionRepository = new PgConventionRepository(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });
  describe("get for export", () => {
    it("retrieves all convention exports", async () => {
      // Prepare
      const appleAgencyId = "11111111-1111-1111-1111-111111111111";
      const appleAgency = AgencyDtoBuilder.create(appleAgencyId)
        .withName("apple")
        .build();

      const ConventionId: ConventionId = "aaaaac99-9c0b-aaaa-aa6d-6bb9bd38aaaa";

      const convention = new ConventionDtoBuilder()
        .withId(ConventionId)
        .withDateStart(new Date("2021-01-15").toISOString())
        .withDateEnd(new Date("2021-01-20").toISOString())
        .withDateSubmission(new Date("2021-01-10").toISOString())
        .withDateValidation(new Date("2021-01-12").toISOString())
        .withAgencyId(appleAgencyId)
        .withoutWorkCondition()
        .build();

      await agencyRepo.insert(appleAgency);
      await conventionRepository.save(convention);

      // Act
      const actualExport: ConventionRawBeforeExport[] =
        await conventionQueries.getAllConventionsForExport();

      const {
        agencyId,
        id,
        immersionActivities,
        immersionSkills,
        individualProtection,
        sanitaryPrevention,
        sanitaryPreventionDescription,
        immersionAppellation,
        externalId,
        immersionAddress,
        ...filteredProperties
      } = convention;
      // Assert
      expect(actualExport[0]).toStrictEqual({
        ...filteredProperties,
        agencyName: appleAgency.name,
        immersionProfession: convention.immersionAppellation.appellationLabel,
        status: convention.status,
        dateEnd: new Date("2021-01-20").toISOString(),
        dateStart: new Date("2021-01-15").toISOString(),
        dateSubmission: new Date("2021-01-10").toISOString(),
        dateValidation: new Date("2021-01-12").toISOString(),
      });
    });
  });
  describe("PG implementation of method getLatestUpdated", () => {
    beforeEach(async () => {
      const agencyRepository = new PgAgencyRepository(client);
      await agencyRepository.insert(AgencyDtoBuilder.create().build());
    });
    it("Gets saved immersion", async () => {
      const idA: ConventionId = "aaaaac99-9c0b-aaaa-aa6d-6bb9bd38aaaa";
      const conventionA = new ConventionDtoBuilder().withId(idA).build();

      const idB: ConventionId = "bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb";
      const conventionB = new ConventionDtoBuilder().withId(idB).build();

      const externalIdA = await conventionRepository.save(conventionA);
      const externalIdB = await conventionRepository.save(conventionB);

      const resultA = await conventionRepository.getById(idA);
      expect(resultA).toEqual({ ...conventionA, externalId: externalIdA });

      const resultAll = await conventionQueries.getLatestUpdated();
      expect(resultAll).toEqual([
        { ...conventionB, externalId: externalIdB },
        { ...conventionA, externalId: externalIdA },
      ]);
    });
  });

  describe("PG implementation of method getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink", () => {
    beforeEach(async () => {
      const agencyRepository = new PgAgencyRepository(client);
      await agencyRepository.insert(AgencyDtoBuilder.create().build());
      await client.query("DELETE FROM outbox_failures");
      await client.query("DELETE FROM outbox_publications");
      await client.query("DELETE FROM outbox");
    });
    it("Gets all email params of validated immersions ending at given date that did not received any assessment link yet", async () => {
      // Prepare : insert an immersion ending the 14/05/2022 and two others ending the 15/05/2022 amongst which one already received an assessment link.
      const conventionRepo = new PgConventionRepository(client);
      const outboxRepo = new PgOutboxRepository(client);
      const validatedImmersionEndingThe14th = new ConventionDtoBuilder()
        .withId("aaaaac14-9c0a-aaaa-aa6d-6aa9ad38aaaa")
        .validated()
        .withDateEnd("2022-05-14")
        .build();
      const validatedImmersionEndingThe15thThatAlreadyReceivedAnEmail =
        new ConventionDtoBuilder()
          .withId("aaaaac15-9c0a-aaaa-aa6d-6aa9ad38aaaa")
          .validated()
          .withDateEnd("2022-05-15")
          .build();
      const validatedImmersionEndingThe15th = new ConventionDtoBuilder()
        .withId("bbbbbc15-9c0a-aaaa-aa6d-6aa9ad38aaaa")
        .validated()
        .withDateEnd("2022-05-15")
        .build();
      const ongoingImmersionEndingThe15th = new ConventionDtoBuilder()
        .withId("cccccc15-9c0a-aaaa-aa6d-6aa9ad38aaaa")
        .withDateEnd("2022-05-15")
        .withStatus("IN_REVIEW")
        .build();
      await Promise.all(
        [
          validatedImmersionEndingThe14th,
          validatedImmersionEndingThe15thThatAlreadyReceivedAnEmail,
          validatedImmersionEndingThe15th,
          ongoingImmersionEndingThe15th,
        ].map((params) => conventionRepo.save(params)),
      );

      const createNewEvent = makeCreateNewEvent({
        clock: new RealClock(),
        uuidGenerator: new UuidV4Generator(),
      });
      const eventEmailSentToImmersion1 = createNewEvent({
        topic: "EmailWithLinkToCreateAssessmentSent",
        payload: {
          id: validatedImmersionEndingThe15thThatAlreadyReceivedAnEmail.id,
        },
      });
      await outboxRepo.save(eventEmailSentToImmersion1);

      // Act
      const queryResults =
        await conventionQueries.getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink(
          new Date("2022-05-15"),
        );

      // Assert
      expect(queryResults).toHaveLength(1);
      const expectedResult: ImmersionAssessmentEmailParams = {
        immersionId: validatedImmersionEndingThe15th.id,
        mentorEmail: validatedImmersionEndingThe15th.mentorEmail,
        mentorName: validatedImmersionEndingThe15th.mentor,
        beneficiaryFirstName: validatedImmersionEndingThe15th.firstName,
        beneficiaryLastName: validatedImmersionEndingThe15th.lastName,
      };
      expect(queryResults[0]).toEqual(expectedResult);
    });
  });
});
