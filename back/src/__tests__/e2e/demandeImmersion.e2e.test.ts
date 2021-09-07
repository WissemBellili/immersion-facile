import supertest, { SuperTest, Test } from "supertest";
import { createApp } from "../../adapters/primary/server";
import { demandesImmersionRoute } from "../../shared/routes";
import { DemandeImmersionDtoBuilder } from "../../_testBuilders/DemandeImmersionDtoBuilder";

describe("/demandes-immersion route", () => {
  let request: SuperTest<Test>;

  describe("When the ENABLE_VIEWABLE_APPLICATIONS feature flag is on", () => {
    beforeEach(() => {
      request = supertest(
        createApp({
          featureFlags: {
            enableViewableApplications: true,
          },
        })
      );
    });

    it("Creating an invalid application fails", async () => {
      await request
        .post(`/${demandesImmersionRoute}`)
        .send({ invalid_params: true })
        .expect(400);
    });

    it("Creating a valid application succeeds", async () => {
      const demandeImmersion = new DemandeImmersionDtoBuilder().build();

      // GET /demandes-immersion returns an empty list.
      await request
        .get(`/${demandesImmersionRoute}`)
        .auth("e2e_tests", "e2e")
        .expect("Content-Type", /json/)
        .expect(200, []);

      // POSTing a valid application succeeds.
      await request
        .post(`/${demandesImmersionRoute}`)
        .send(demandeImmersion)
        .expect("Content-Type", /json/)
        .expect(200, { id: demandeImmersion.id });

      // GETting the created application succeeds.
      await request
        .get(`/${demandesImmersionRoute}/${demandeImmersion.id}`)
        .expect("Content-Type", /json/)
        .expect(200, demandeImmersion);
    });

    it("Updating an existing application succeeds", async () => {
      const demandeImmersion = new DemandeImmersionDtoBuilder().build();

      // POSTing a valid application succeeds.
      await request
        .post(`/${demandesImmersionRoute}`)
        .send(demandeImmersion)
        .expect("Content-Type", /json/)
        .expect(200, { id: demandeImmersion.id });

      // POSTing an updated application to the same id succeeds.
      const updatedDemandeImmersion = {
        ...demandeImmersion,
        email: "new@email.fr",
      };
      await request
        .post(`/${demandesImmersionRoute}/${demandeImmersion.id}`)
        .send(updatedDemandeImmersion)
        .expect("Content-Type", /json/)
        .expect(200, { id: demandeImmersion.id });

      // GETting the updated application succeeds.
      await request
        .get(`/${demandesImmersionRoute}/${demandeImmersion.id}`)
        .expect("Content-Type", /json/)
        .expect(200, updatedDemandeImmersion);
    });

    it("Fetching unknown application IDs fails with 404 Not Found", async () => {
      await request
        .get(`/${demandesImmersionRoute}/unknown-demande-immersion-id`)
        .expect(404);
    });

    it("Updating an unknown application IDs fails with 404 Not Found", async () => {
      const unknownId = "unknown-demande-immersion-id";
      const demandeImmersionWithUnknownId = new DemandeImmersionDtoBuilder()
        .withId(unknownId)
        .build();
      await request
        .post(`/${demandesImmersionRoute}/${unknownId}`)
        .send(demandeImmersionWithUnknownId)
        .expect(404);
    });

    it("Creating an application with an existing ID fails with 409 Conflict", async () => {
      const demandeImmersion = new DemandeImmersionDtoBuilder().build();

      // POSTing a valid application succeeds.
      await request
        .post(`/${demandesImmersionRoute}`)
        .send(demandeImmersion)
        .expect("Content-Type", /json/)
        .expect(200, { id: demandeImmersion.id });

      // POSTing a another valid application with the same ID fails.
      await request
        .post(`/${demandesImmersionRoute}`)
        .send({
          ...demandeImmersion,
          email: "another@email.fr",
        })
        .expect(409);
    });

    it("Listing applications without credentials fails with 401 Unauthorized", async () => {
      await request.get(`/${demandesImmersionRoute}`).expect(401);
    });

    it("Listing applications with invalid credentials fails with 401 Unauthorized", async () => {
      await request
        .get(`/${demandesImmersionRoute}`)
        .auth("not real user", "not real password")
        .expect(401);
    });

    it("Listing applications with valid credentials succeeds", async () => {
      // GET /demandes-immersion succeeds with login/pass.
      await request
        .get(`/${demandesImmersionRoute}`)
        .auth("e2e_tests", "e2e")
        .expect("Content-Type", /json/)
        .expect(200);
    });
  });

  describe("When the ENABLE_VIEWABLE_APPLICATIONS feature flag is off", () => {
    beforeEach(() => {
      request = supertest(
        createApp({
          featureFlags: {
            enableViewableApplications: false,
          },
        })
      );
    });

    it("Listing applications fails with 404 Not Found despite valid credentials", async () => {
      await request
        .get(`/${demandesImmersionRoute}`)
        .auth("e2e_tests", "e2e")
        .expect(404);
    });

    it("Geting an existing application fails with 404 Not Found", async () => {
      const demandeImmersion = new DemandeImmersionDtoBuilder().build();

      // POSTing a valid application succeeds.
      await request
        .post(`/${demandesImmersionRoute}`)
        .send(demandeImmersion)
        .expect(200);

      // GETting the created application returns 404 Not Found.
      await request
        .get(`/${demandesImmersionRoute}/${demandeImmersion.id}`)
        .expect(404);
    });

    it("Updating an existing application fails with 404 Not Found", async () => {
      const demandeImmersion = new DemandeImmersionDtoBuilder().build();

      // POSTing a valid application succeeds.
      await request
        .post(`/${demandesImmersionRoute}`)
        .send(demandeImmersion)
        .expect(200);

      // POSTing a valid application returns 404 Not Found.
      await request
        .post(`/${demandesImmersionRoute}/${demandeImmersion.id}`)
        .send({
          ...demandeImmersion,
          email: "another@email.fr",
        })
        .expect(404);
    });
  });
});
