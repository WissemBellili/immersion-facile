import { AdminToken } from "shared/src/admin/admin.dto";
import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import { agenciesRoute } from "shared/src/routes";
import { SuperTest, Test } from "supertest";
import {
  buildTestApp,
  InMemoryGateways,
} from "../../_testBuilders/buildTestApp";
import { AppConfig } from "../../adapters/primary/config/appConfig";
import { InMemoryUnitOfWork } from "../../adapters/primary/config/uowConfig";
import { BasicEventCrawler } from "../../adapters/secondary/core/EventCrawlerImplementations";

describe(`/${agenciesRoute} route`, () => {
  let request: SuperTest<Test>;
  let gateways: InMemoryGateways;
  let inMemoryUow: InMemoryUnitOfWork;
  let eventCrawler: BasicEventCrawler;
  let adminToken: AdminToken;
  let appConfig: AppConfig;

  beforeEach(async () => {
    ({ request, gateways, eventCrawler, appConfig, inMemoryUow } =
      await buildTestApp());

    const response = await request.post("/admin/login").send({
      user: appConfig.backofficeUsername,
      password: appConfig.backofficePassword,
    });
    adminToken = response.body;
  });

  const agency1ActiveNearBy = AgencyDtoBuilder.create("test-agency-1")
    .withName("Test Agency 1")
    .withStatus("active")
    .withPosition(10.11, 10.12)
    .build();

  const agency2ActiveNearBy = AgencyDtoBuilder.create("test-agency-2")
    .withName("Test Agency 2")
    .withStatus("active")
    .withPosition(10, 10)
    .build();

  const agency3ActiveFarAway = AgencyDtoBuilder.create("test-agency-3")
    .withName("Test Agency 3")
    .withStatus("active")
    .withPosition(1, 2)
    .build();
  const agency4NeedsReview = AgencyDtoBuilder.create("test-agency-4")
    .withName("Test Agency 4")
    .withStatus("needsReview")
    .withValidatorEmails(["emmanuelle@email.com"])
    .build();

  describe("public route to get agencies with name and position given filters", () => {
    it("returns agency list with name and position nearby a given position", async () => {
      // Prepare
      await Promise.all(
        [
          agency1ActiveNearBy,
          agency2ActiveNearBy,
          agency3ActiveFarAway,
          agency4NeedsReview,
        ].map(async (agencyDto) =>
          inMemoryUow.agencyRepository.insert(agencyDto),
        ),
      );
      // Act and asseer
      await request.get(`/${agenciesRoute}?countyCode=75`).expect(200, [
        {
          id: agency1ActiveNearBy.id,
          name: agency1ActiveNearBy.name,
          position: agency1ActiveNearBy.position,
        },
        {
          id: agency2ActiveNearBy.id,
          name: agency2ActiveNearBy.name,
          position: agency2ActiveNearBy.position,
        },
      ]);
    });
  });
  describe("private route to get agencies full dto given filters", () => {
    it("Returns Forbidden if no token provided", async () => {
      const response = await request.get(
        `/admin/${agenciesRoute}?status=needsReview`,
      );

      expect(response.body).toEqual({
        error: "You need to authenticate first",
      });
      expect(response.status).toBe(401);
    });

    it("Returns all agency dtos with a given status", async () => {
      // Prepare
      await Promise.all(
        [agency1ActiveNearBy, agency4NeedsReview].map(async (agencyDto) =>
          inMemoryUow.agencyRepository.insert(agencyDto),
        ),
      );
      // Getting the application succeeds and shows that it's validated.
      await request
        .get(`/admin/${agenciesRoute}?status=needsReview`)
        .set("Authorization", adminToken)
        .expect(200, [agency4NeedsReview]);
    });
  });

  describe("private route to update an agency", () => {
    it("Updates the agency, sends an email to validators and returns code 200", async () => {
      // Prepare
      await inMemoryUow.agencyRepository.insert(agency4NeedsReview);

      // Act and assert
      await request
        .patch(`/admin/${agenciesRoute}/test-agency-4`)
        .set("Authorization", adminToken)
        .send({ status: "active" })
        .expect(200);

      expect(
        (await inMemoryUow.agencyRepository.getById("test-agency-4"))?.status,
      ).toBe("active");
      expect(inMemoryUow.outboxRepository.events).toHaveLength(1);

      await eventCrawler.processNewEvents();
      expect(gateways.email.getSentEmails()).toHaveLength(1);
    });
  });
});
