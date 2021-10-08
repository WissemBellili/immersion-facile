import { generateJwt } from "./../../domain/auth/jwt";
import { validateDemandeRoute } from "./../../shared/routes";
import supertest, { SuperTest, Test } from "supertest";
import { createApp } from "../../adapters/primary/server";
import { immersionApplicationsRoute } from "../../shared/routes";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { FeatureFlagsBuilder } from "../../_testBuilders/FeatureFlagsBuilder";
import {
  createMagicLinkPayload,
  Role,
} from "../../shared/tokens/MagicLinkPayload";

describe("/demandes-immersion route", () => {
  let request: SuperTest<Test>;

  describe("Backoffice", () => {
    beforeEach(() => {
      request = supertest(
        createApp({
          featureFlags: FeatureFlagsBuilder.allOff()
            .enableViewableApplications()
            .enableGenericApplicationForm()
            .build(),
        }),
      );
    });

    describe("Application validation", () => {
      const demandeImmersion = new ImmersionApplicationDtoBuilder()
        .withStatus("IN_REVIEW")
        .build();

      beforeEach(async () => {
        // POST a valid application.
        await request
          .post(`/${immersionApplicationsRoute}`)
          .send(demandeImmersion)
          .expect("Content-Type", /json/)
          .expect(200, { id: demandeImmersion.id });
      });

      it("Validating an existing application succeeds, with auth", async () => {
        // Validating an application with existing id succeeds (with auth).
        await request
          .get(`/${validateDemandeRoute}/${demandeImmersion.id}`)
          .auth("e2e_tests", "e2e")
          .expect("Content-Type", /json/)
          .expect(200, { id: demandeImmersion.id });

        const validatedDemandeImmersion = {
          ...demandeImmersion,
          status: "VALIDATED",
        };

        // Getting the application succeeds and shows that it's validated.
        await request
          .get(`/${immersionApplicationsRoute}/admin/${demandeImmersion.id}`)
          .auth("e2e_tests", "e2e")
          .expect("Content-Type", /json/)
          .expect(200, validatedDemandeImmersion);
      });

      it("Validating applications without credentials fails with 401 Unauthorized", async () => {
        await request
          .get(`/${validateDemandeRoute}/${demandeImmersion.id}`)
          .expect(401);

        // Getting the application succeeds and shows that it's NOT validated.
        await request
          .get(`/${immersionApplicationsRoute}/admin/${demandeImmersion.id}`)
          .auth("e2e_tests", "e2e")
          .expect("Content-Type", /json/)
          .expect(200, demandeImmersion);
      });

      it("Validating applications with invalid credentials fails with 401 Unauthorized", async () => {
        await request
          .get(`/${validateDemandeRoute}/${demandeImmersion.id}`)
          .auth("not real user", "not real password")
          .expect(401);

        // Getting the application succeeds and shows that it's NOT validated.
        await request
          .get(`/${immersionApplicationsRoute}/admin/${demandeImmersion.id}`)
          .auth("e2e_tests", "e2e")
          .expect("Content-Type", /json/)
          .expect(200, demandeImmersion);
      });

      it("Validating non-existent application with valid credentials fails with 404", async () => {
        await request
          .get(`/${validateDemandeRoute}/unknown-demande-immersion-id`)
          .auth("e2e_tests", "e2e")
          .expect(404);

        // Getting the existing application succeeds and shows that it's NOT validated.
        await request
          .get(`/${immersionApplicationsRoute}/admin/${demandeImmersion.id}`)
          .auth("e2e_tests", "e2e")
          .expect("Content-Type", /json/)
          .expect(200, demandeImmersion);
      });
    });
  });

  describe("DEV environment", () => {
    beforeEach(() => {
      request = supertest(
        createApp({
          featureFlags: FeatureFlagsBuilder.allOff()
            .enableViewableApplications()
            .enableGenericApplicationForm()
            .build(),
        }),
      );
    });

    it("Creating an invalid application fails", async () => {
      await request
        .post(`/${immersionApplicationsRoute}`)
        .send({ invalid_params: true })
        .expect(400);
    });

    it("Creating a valid application succeeds", async () => {
      const demandeImmersion = new ImmersionApplicationDtoBuilder().build();

      // GET /demandes-immersion returns an empty list.
      await request
        .get(`/${immersionApplicationsRoute}`)
        .auth("e2e_tests", "e2e")
        .expect("Content-Type", /json/)
        .expect(200, []);

      // POSTing a valid application succeeds.
      await request
        .post(`/${immersionApplicationsRoute}`)
        .send(demandeImmersion)
        .expect("Content-Type", /json/)
        .expect(200, { id: demandeImmersion.id });

      // GETting the created application succeeds.
      await request
        .get(`/${immersionApplicationsRoute}/admin/${demandeImmersion.id}`)
        .auth("e2e_tests", "e2e")
        .expect("Content-Type", /json/)
        .expect(200, demandeImmersion);
    });

    it("Creating an application with invalid sources fails with 404 Not Found", async () => {
      const application1 = new ImmersionApplicationDtoBuilder()
        .withSource("BOULOGNE_SUR_MER")
        .build();
      await request
        .post(`/${immersionApplicationsRoute}`)
        .send(application1)
        .expect(404);

      const application2 = new ImmersionApplicationDtoBuilder()
        .withSource("NARBONNE")
        .build();
      await request
        .post(`/${immersionApplicationsRoute}`)
        .send(application2)
        .expect(404);
    });

    describe("Getting an application", () => {
      let demandeImmersion = new ImmersionApplicationDtoBuilder().build();

      beforeEach(async () => {
        // GET /demandes-immersion returns an empty list.
        await request
          .get(`/${immersionApplicationsRoute}`)
          .auth("e2e_tests", "e2e")
          .expect("Content-Type", /json/)
          .expect(200, []);

        // POSTing a valid application succeeds.
        await request
          .post(`/${immersionApplicationsRoute}`)
          .send(demandeImmersion)
          .expect("Content-Type", /json/)
          .expect(200, { id: demandeImmersion.id });
      });

      it("succeeds with correct magic link", async () => {
        const payload = {
          applicationId: demandeImmersion.id,
          roles: ["beneficiary" as Role],
          iat: Math.round(Date.now() / 1000),
          exp: Math.round(Date.now() / 1000) + 31 * 24 * 3600,
          name: "Bobby",
        };
        const jwt = generateJwt(payload);

        // GETting the created application succeeds.
        await request
          .get(`/${immersionApplicationsRoute}/${jwt}`)
          .expect("Content-Type", /json/)
          .expect(200, demandeImmersion);
      });

      it("fails with expired magic link", async () => {
        const payload = createMagicLinkPayload(
          demandeImmersion.id,
          "beneficiary",
          1,
          undefined,
          undefined,
          Math.round(Date.now() / 1000) - 2 * 24 * 3600,
        );
        const jwt = generateJwt(payload);

        // GETting the created application fails due to token being expired.
        await request
          .get(`/${immersionApplicationsRoute}/${jwt}`)
          .expect("Content-Type", /json/)
          .expect(403);
      });
    });

    it("Updating an existing application succeeds", async () => {
      const demandeImmersion = new ImmersionApplicationDtoBuilder().build();

      // POSTing a valid application succeeds.
      await request
        .post(`/${immersionApplicationsRoute}`)
        .send(demandeImmersion)
        .expect("Content-Type", /json/)
        .expect(200, { id: demandeImmersion.id });

      // POSTing an updated application to the same id succeeds.
      const updatedDemandeImmersion = {
        ...demandeImmersion,
        email: "new@email.fr",
      };

      const link = generateJwt(
        createMagicLinkPayload(demandeImmersion.id, "beneficiary"),
      );

      await request
        .post(`/${immersionApplicationsRoute}/${link}`)
        .send(updatedDemandeImmersion)
        .expect("Content-Type", /json/)
        .expect(200);

      // GETting the updated application succeeds.
      await request
        .get(`/${immersionApplicationsRoute}/admin/${demandeImmersion.id}`)
        .auth("e2e_tests", "e2e")
        .expect("Content-Type", /json/)
        .expect(200, updatedDemandeImmersion);
    });

    it("Fetching unknown application IDs fails with 404 Not Found", async () => {
      const link = generateJwt(
        createMagicLinkPayload("unknown-demande-immersion-id", "beneficiary"),
      );
      await request.get(`/${immersionApplicationsRoute}/${link}`).expect(404);

      await request
        .get(
          `/${immersionApplicationsRoute}/admin/unknown-demande-immersion-id`,
        )
        .auth("e2e_tests", "e2e")
        .expect(404);
    });

    it("Updating an unknown application IDs fails with 404 Not Found", async () => {
      const unknownId = "unknown-demande-immersion-id";
      const demandeImmersionWithUnknownId = new ImmersionApplicationDtoBuilder()
        .withId(unknownId)
        .build();

      const link = generateJwt(
        createMagicLinkPayload(unknownId, "beneficiary"),
      );

      await request
        .post(`/${immersionApplicationsRoute}/${link}`)
        .send(demandeImmersionWithUnknownId)
        .expect(404);
    });

    it("Creating an application with an existing ID fails with 409 Conflict", async () => {
      const demandeImmersion = new ImmersionApplicationDtoBuilder().build();

      // POSTing a valid application succeeds.
      await request
        .post(`/${immersionApplicationsRoute}`)
        .send(demandeImmersion)
        .expect("Content-Type", /json/)
        .expect(200, { id: demandeImmersion.id });

      // POSTing a another valid application with the same ID fails.
      await request
        .post(`/${immersionApplicationsRoute}`)
        .send({
          ...demandeImmersion,
          email: "another@email.fr",
        })
        .expect(409);
    });

    it("Listing applications without credentials fails with 401 Unauthorized", async () => {
      await request.get(`/${immersionApplicationsRoute}`).expect(401);
    });

    it("Listing applications with invalid credentials fails with 401 Unauthorized", async () => {
      await request
        .get(`/${immersionApplicationsRoute}`)
        .auth("not real user", "not real password")
        .expect(401);
    });

    it("Listing applications with valid credentials succeeds", async () => {
      // GET /demandes-immersion succeeds with login/pass.
      await request
        .get(`/${immersionApplicationsRoute}`)
        .auth("e2e_tests", "e2e")
        .expect("Content-Type", /json/)
        .expect(200);
    });
  });

  describe("BETA environment", () => {
    beforeEach(() => {
      request = supertest(
        createApp({
          featureFlags: FeatureFlagsBuilder.allOff()
            .enableBoulogneSurMerApplicationForm()
            .enableNarbonneApplicationForm()
            .build(),
        }),
      );
    });

    it("Creating an application with valid sources succeeds", async () => {
      const application1 = new ImmersionApplicationDtoBuilder()
        .withId("id1")
        .withSource("BOULOGNE_SUR_MER")
        .build();
      await request
        .post(`/${immersionApplicationsRoute}`)
        .send(application1)
        .expect(200, { id: "id1" });

      const application2 = new ImmersionApplicationDtoBuilder()
        .withId("id2")
        .withSource("NARBONNE")
        .build();
      await request
        .post(`/${immersionApplicationsRoute}`)
        .send(application2)
        .expect(200, { id: "id2" });
    });

    it("Creating an application with invalid sources fails with 404 Not Found", async () => {
      const demandeImmersion = new ImmersionApplicationDtoBuilder()
        .withSource("GENERIC")
        .build();
      await request
        .post(`/${immersionApplicationsRoute}`)
        .send(demandeImmersion)
        .expect(404);
    });

    it("Listing applications fails with 404 Not Found despite valid credentials", async () => {
      await request
        .get(`/${immersionApplicationsRoute}`)
        .auth("e2e_tests", "e2e")
        .expect(404);
    });

    it("Geting an existing application succeeds", async () => {
      const demandeImmersion = new ImmersionApplicationDtoBuilder()
        .withSource("BOULOGNE_SUR_MER")
        .build();

      // POSTing a valid application succeeds.
      await request
        .post(`/${immersionApplicationsRoute}`)
        .send(demandeImmersion)
        .expect(200);

      // GETting the created application succeeds.
      await request
        .get(`/${immersionApplicationsRoute}/admin/${demandeImmersion.id}`)
        .auth("e2e_tests", "e2e")
        .expect(200, demandeImmersion);
    });

    it("Updating an existing application fails with 404 Not Found", async () => {
      const demandeImmersion = new ImmersionApplicationDtoBuilder()
        .withSource("NARBONNE")
        .build();

      // POSTing a valid application succeeds.
      await request
        .post(`/${immersionApplicationsRoute}`)
        .send(demandeImmersion)
        .expect(200);

      // POSTing a valid application returns 403 Not Authorized because id is not a jwt.
      await request
        .post(`/${immersionApplicationsRoute}/${demandeImmersion.id}`)
        .send({
          ...demandeImmersion,
          email: "another@email.fr",
        })
        .expect(403);
    });
  });
});
