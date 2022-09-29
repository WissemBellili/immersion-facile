import { Pool, PoolClient } from "pg";
import { AgencyDtoBuilder } from "shared";
import { ConventionDtoBuilder } from "shared";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { expectObjectsToMatch } from "../../_testBuilders/test.helpers";
import { PgAgencyRepository } from "../../adapters/secondary/pg/PgAgencyRepository";
import { PgConventionPoleEmploiAdvisorRepository } from "../../adapters/secondary/pg/PgConventionPoleEmploiAdvisorRepository";
import { PgConventionRepository } from "../../adapters/secondary/pg/PgConventionRepository";
import {
  ConventionPoleEmploiUserAdvisorEntity,
  PoleEmploiUserAdvisorDto,
} from "../../domain/peConnect/dto/PeConnect.dto";

const conventionId = "88401348-bad9-4933-87c6-405b8a8fe4cc";
const userPeExternalId = "92f44bbf-103d-4312-bd74-217c7d79f618";

const convention = new ConventionDtoBuilder().withId(conventionId).build();

const poleEmploiFirstUserAdvisor: PoleEmploiUserAdvisorDto = {
  userPeExternalId,
  firstName: "Jean",
  lastName: "Dupont",
  email: "jean.dupont@pole-emploi.fr",
  type: "PLACEMENT",
};

const poleEmploiUpdatedUserAdvisor: PoleEmploiUserAdvisorDto = {
  userPeExternalId,
  firstName: "Jeanne",
  lastName: "Delamare",
  email: "jeanne.delamare@pole-emploi.fr",
  type: "CAPEMPLOI",
};

describe("PgConventionPoleEmploiAdvisorRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let conventionPoleEmploiAdvisorRepository: PgConventionPoleEmploiAdvisorRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    await client.query("DELETE FROM partners_pe_connect");
    // REVIEW I had to add this not to have an error
    // TODO Remove when https://git.beta.pole-emploi.fr/jburkard/immersion-facile/-/merge_requests/967 is merged ?
    await client.query("DELETE FROM immersion_assessments");
    await client.query("DELETE FROM conventions");
    await client.query("DELETE FROM agencies");
    const agencyRepository = new PgAgencyRepository(client);
    await agencyRepository.insert(AgencyDtoBuilder.create().build());
    const conventionRepository = new PgConventionRepository(client);
    const { externalId, ...createConventionParams } = convention;
    await conventionRepository.save(createConventionParams);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM partners_pe_connect");
    conventionPoleEmploiAdvisorRepository =
      new PgConventionPoleEmploiAdvisorRepository(client);
  });

  describe("openSlotForNextConvention", () => {
    it("should open a slot if no open slot is present", async () => {
      await conventionPoleEmploiAdvisorRepository.openSlotForNextConvention(
        poleEmploiFirstUserAdvisor,
      );
      const inDb = await client.query("SELECT * FROM partners_pe_connect");
      expect(inDb.rows).toHaveLength(1);
      expectObjectsToMatch(inDb.rows[0], {
        user_pe_external_id: poleEmploiFirstUserAdvisor.userPeExternalId,
        convention_id: "00000000-0000-0000-0000-000000000000",
        firstname: poleEmploiFirstUserAdvisor.firstName,
        lastname: poleEmploiFirstUserAdvisor.lastName,
        email: poleEmploiFirstUserAdvisor.email,
        type: poleEmploiFirstUserAdvisor.type,
      });
    });

    it("should update the open slot if it already exist", async () => {
      await conventionPoleEmploiAdvisorRepository.openSlotForNextConvention(
        poleEmploiFirstUserAdvisor,
      );

      await conventionPoleEmploiAdvisorRepository.openSlotForNextConvention(
        poleEmploiUpdatedUserAdvisor,
      );

      const inDb = await client.query("SELECT * FROM partners_pe_connect");
      expect(inDb.rows).toHaveLength(1);
      expectObjectsToMatch(inDb.rows[0], {
        user_pe_external_id: poleEmploiUpdatedUserAdvisor.userPeExternalId,
        convention_id: "00000000-0000-0000-0000-000000000000",
        firstname: poleEmploiUpdatedUserAdvisor.firstName,
        lastname: poleEmploiUpdatedUserAdvisor.lastName,
        email: poleEmploiUpdatedUserAdvisor.email,
        type: poleEmploiUpdatedUserAdvisor.type,
      });
    });
  });

  describe("associateConventionAndUserAdvisor", () => {
    it("should throw a not found error if no suitable opened conventionPoleEmploiUserAdvisor is present", async () => {
      await expect(
        conventionPoleEmploiAdvisorRepository.associateConventionAndUserAdvisor(
          conventionId,
          userPeExternalId,
        ),
      ).rejects.toThrow(
        new Error(
          "Association between Convention and userAdvisor failed. rowCount: 0, conventionId: 88401348-bad9-4933-87c6-405b8a8fe4cc, peExternalId: 92f44bbf-103d-4312-bd74-217c7d79f618",
        ),
      );
    });

    it("should update the entity in db if a suitable conventionPoleEmploiUserAdvisor was found", async () => {
      await conventionPoleEmploiAdvisorRepository.openSlotForNextConvention(
        poleEmploiFirstUserAdvisor,
      );
      await conventionPoleEmploiAdvisorRepository.associateConventionAndUserAdvisor(
        conventionId,
        userPeExternalId,
      );

      const inDb = await client.query("SELECT * FROM partners_pe_connect");
      expect(inDb.rows).toHaveLength(1);
      expectObjectsToMatch(inDb.rows[0], {
        user_pe_external_id: poleEmploiFirstUserAdvisor.userPeExternalId,
        convention_id: conventionId,
      });
    });
  });

  describe("retreive pole emploi user advisor", () => {
    it("should return undefined if no convention Advisor", async () => {
      const conventionAdvisor:
        | ConventionPoleEmploiUserAdvisorEntity
        | undefined = await conventionPoleEmploiAdvisorRepository.getByConventionId(
        conventionId,
      );

      expect(conventionAdvisor).toBeUndefined();
    });

    it("should get the convention Advisor by the convention id", async () => {
      await conventionPoleEmploiAdvisorRepository.openSlotForNextConvention(
        poleEmploiFirstUserAdvisor,
      );
      await conventionPoleEmploiAdvisorRepository.associateConventionAndUserAdvisor(
        conventionId,
        userPeExternalId,
      );

      const conventionAdvisor:
        | ConventionPoleEmploiUserAdvisorEntity
        | undefined = await conventionPoleEmploiAdvisorRepository.getByConventionId(
        conventionId,
      );

      expectObjectsToMatch(conventionAdvisor!, {
        userPeExternalId: poleEmploiFirstUserAdvisor.userPeExternalId,
        conventionId,
        firstName: poleEmploiFirstUserAdvisor.firstName,
        lastName: poleEmploiFirstUserAdvisor.lastName,
        email: poleEmploiFirstUserAdvisor.email,
        type: poleEmploiFirstUserAdvisor.type,
      });
    });
  });
});
