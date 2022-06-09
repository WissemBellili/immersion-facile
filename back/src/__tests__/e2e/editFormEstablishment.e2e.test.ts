import { buildTestApp } from "../../_testBuilders/buildTestApp";
import { FormEstablishmentDtoBuilder } from "shared/src/formEstablishment/FormEstablishmentDtoBuilder";
import { TEST_ESTABLISHMENT1_SIRET } from "../../adapters/secondary/InMemorySireneGateway";
import { formEstablishmentsRoute } from "shared/src/routes";
import { createEstablishmentMagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import { makeGenerateJwt } from "../../domain/auth/jwt";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";
import { subYears } from "date-fns";

describe("Route to post edited form establishments", () => {
  it("Throws 401 if not authenticated", async () => {
    const { request } = await buildTestApp();

    const response = await request.put(`/${formEstablishmentsRoute}`).send({});

    // Assert
    expect(response.body).toEqual({ error: "forbidden: unauthenticated" });
    expect(response.status).toBe(401);
  });

  it("Throws 401 if Jwt is generated from wrong private key", async () => {
    const config = new AppConfigBuilder().withTestPresetPreviousKeys().build();
    const { request } = await buildTestApp();
    const generateJwtWithWrongKey = makeGenerateJwt(config.apiJwtPrivateKey); // Private Key is the wrong one !

    const wrongJwt = generateJwtWithWrongKey(
      createEstablishmentMagicLinkPayload({
        siret: "12345678901234",
        durationDays: 1,
        now: new Date(),
      }),
    );
    const response = await request
      .put(`/${formEstablishmentsRoute}`)
      .set("Authorization", wrongJwt)
      .send({});

    // Assert
    expect(response.body).toEqual({ error: "Provided token is invalid" });
    expect(response.status).toBe(401);
  });
  it("Throws 401 if jwt is malformed", async () => {
    const { request } = await buildTestApp();
    const response = await request
      .put(`/${formEstablishmentsRoute}`)
      .set("Authorization", "malformed-jwt")
      .send({});
    // Assert
    expect(response.body).toEqual({ error: "Provided token is invalid" });
    expect(response.status).toBe(401);
  });

  it("Throws 401 if Jwt is expired", async () => {
    const config = new AppConfigBuilder().withTestPresetPreviousKeys().build();
    const { request, clock } = await buildTestApp();
    const generateJwtWithWrongKey = makeGenerateJwt(config.apiJwtPrivateKey); // Private Key is the wrong one !

    const wrongJwt = generateJwtWithWrongKey(
      createEstablishmentMagicLinkPayload({
        siret: "12345678901234",
        durationDays: 1,
        now: subYears(clock.now(), 1),
      }),
    );
    const response = await request
      .put(`/${formEstablishmentsRoute}`)
      .set("Authorization", wrongJwt)
      .send({});

    // Assert
    expect(response.body).toEqual({ error: "Provided token is invalid" });
    expect(response.status).toBe(401);
  });

  it("Supports posting already existing form establisment when authenticated", async () => {
    // Prepare
    const { request, reposAndGateways, generateMagicLinkJwt } =
      await buildTestApp();

    const validJwt = generateMagicLinkJwt(
      createEstablishmentMagicLinkPayload({
        siret: TEST_ESTABLISHMENT1_SIRET,
        durationDays: 1,
        now: new Date(),
      }),
    );
    await reposAndGateways.formEstablishment.create(
      FormEstablishmentDtoBuilder.valid()
        .withSiret(TEST_ESTABLISHMENT1_SIRET)
        .build(),
    );

    // Act
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(TEST_ESTABLISHMENT1_SIRET)
      .build();
    const response = await request
      .put(`/${formEstablishmentsRoute}`)
      .set("Authorization", validJwt)
      .send(formEstablishment);

    // Assert
    expect(response.status).toBe(200);

    expect(reposAndGateways.outbox.events).toHaveLength(1);
    expect(await reposAndGateways.formEstablishment.getAll()).toEqual([
      formEstablishment,
    ]);
  });
});
