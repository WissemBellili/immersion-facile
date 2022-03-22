import { addHours } from "date-fns";
import { SuperTest, Test } from "supertest";
import { EstablishmentPayload } from "../../shared/tokens/MagicLinkPayload";
import {
  buildTestApp,
  InMemoryRepositories,
} from "../../_testBuilders/buildTestApp";

describe("Route to generate an establishment edition link", () => {
  let request: SuperTest<Test>;
  let reposAndGateways: InMemoryRepositories;

  beforeEach(async () => {
    ({ request, reposAndGateways } = await buildTestApp());
    reposAndGateways.immersionOffer.getContactEmailFromSiret = async () =>
      "erik@gmail.com";
  });
  it("Returns 500 with an error message if previous edit link for this siret has not yet expired", async () => {
    // Prepare
    const now = new Date();
    const lastPayload: EstablishmentPayload = {
      siret: "11111111111111",
      iat: now.getTime(),
      exp: addHours(now, 24).getTime(),
      version: 1,
    };
    reposAndGateways.outbox.getLastPayloadOfFormEstablishmentEditLinkSentWithSiret =
      async () => lastPayload;

    // Act and assert
    await request
      .get("/request-email-to-update-form/11111111111111")
      .expect(500, {
        errors: `Un email a déjà été envoyé au contact référent de l'établissement le ${new Date(
          lastPayload.iat,
        ).toLocaleDateString("fr-FR")}`,
      });
  });

  it("Returns 200  if an edit link for this siret is still valid", async () => {
    await request
      .get("/request-email-to-update-form/11111111111111")
      .expect(200, '{"success":true}');
  });
});
