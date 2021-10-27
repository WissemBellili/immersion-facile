import supertest, { SuperTest, Test } from "supertest";
import { createApp } from "../../adapters/primary/server";
import { TEST_ESTABLISHMENT1 } from "../../adapters/secondary/InMemorySireneRepository";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";

describe("/siret route", () => {
  let request: SuperTest<Test>;

  beforeEach(async () => {
    request = supertest(await createApp(new AppConfigBuilder().build()));
  });

  test("processes valid requests", async () => {
    await request.get(`/siret/${TEST_ESTABLISHMENT1.siret}`).expect(200, {
      siret: "12345678901234",
      businessName: "MA P'TITE BOITE",
      businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
      naf: { code: "78.3Z", nomenclature: "Ref2" },
    });
  });

  test("returns 400 Bad Request for invalid request", async () => {
    await request.get("/siret/not_a_valid_siret").expect(400);
  });

  test("returns 404 Not Found for unknown siret", async () => {
    await request.get("/siret/40400000000404").expect(404);
  });
});
