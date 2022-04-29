import { buildTestApp, TestAppAndDeps } from "../../_testBuilders/buildTestApp";
import { FormEstablishmentDtoBuilder } from "../../_testBuilders/FormEstablishmentDtoBuilder";
import { FormEstablishmentDtoPublicV0 } from "../../adapters/primary/routers/DtoAndSchemas/v0/input/FormEstablishmentPublicV0.dto";
import { FormEstablishmentDtoPublicV1 } from "../../adapters/primary/routers/DtoAndSchemas/v1/input/FormEstablishmentPublicV1.dto";
import { TEST_ESTABLISHMENT1_SIRET } from "../../adapters/secondary/InMemorySireneRepository";
import { FormEstablishmentDto } from "../../shared/formEstablishment/FormEstablishment.dto";
import { addEstablishmentFormRouteWithoutApiKey } from "../../shared/routes";

describe("Route to post addEstablishmentFormRouteWithoutApiKey", () => {
  // from front
  it("support posting valid establishment from front", async () => {
    const { request, reposAndGateways } = await buildTestApp();

    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(TEST_ESTABLISHMENT1_SIRET)
      .build();

    const response = await request
      .post(`/${addEstablishmentFormRouteWithoutApiKey}`)
      .send(formEstablishment);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(formEstablishment.siret);

    const inRepo = await reposAndGateways.formEstablishment.getAll();
    expect(inRepo).toEqual([formEstablishment]);
  });

  it("Check if email notification has been sent and published after FormEstablishment added", async () => {
    const { eventCrawler, reposAndGateways, request }: TestAppAndDeps =
      await buildTestApp();

    const formEstablishment: FormEstablishmentDto =
      FormEstablishmentDtoBuilder.valid()
        .withSiret(TEST_ESTABLISHMENT1_SIRET)
        .build();
    const formEstablishmentWithBusinessContact: FormEstablishmentDto = {
      ...formEstablishment,
      businessContact: {
        ...formEstablishment.businessContact,
        email: "tiredofthismess@seriously.com",
      },
    };

    const response = await request
      .post(`/${addEstablishmentFormRouteWithoutApiKey}`)
      .send(formEstablishmentWithBusinessContact);

    expect(response.status).toBe(200);

    await eventCrawler.processNewEvents();

    const sentEmails = reposAndGateways.email.getSentEmails();
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails.map((e) => e.recipients)).toEqual([
      ["tiredofthismess@seriously.com"],
    ]);
  });
});

describe("Route to post addEstablishmentFormRouteWithApiKey", () => {
  // from external
  describe("v0", () => {
    // we don't want to use variables from shared/routes.ts so that we can check if contract breaks
    it("forbids access to route if no api consumer", async () => {
      const { request } = await buildTestApp();

      const response = await request.post(`/immersion-offers`).send({});

      expect(response.status).toBe(403);
    });

    it("support adding establishment from known api consumer", async () => {
      const { request, generateApiJwt } = await buildTestApp();

      const formEstablishmentDtoPublicV0: FormEstablishmentDtoPublicV0 = {
        businessAddress: "1 Rue du Moulin 12345 Quelque Part",
        businessContacts: [
          {
            email: "amil@mail.com",
            firstName: "Esteban",
            lastName: "Ocon",
            phone: "+33012345678",
            job: "a job",
          },
        ],
        preferredContactMethods: ["EMAIL"],
        naf: { code: "A", nomenclature: "nomenclature code A" },
        businessName: "Mon entreprise",
        businessNameCustomized: "Ma belle enseigne du quartier",
        isEngagedEnterprise: false,
        siret: TEST_ESTABLISHMENT1_SIRET,
        professions: [
          {
            romeCodeMetier: "A1111",
            romeCodeAppellation: "11111",
            description: "Boulangerie",
          },
          {
            romeCodeMetier: "B9112",
            romeCodeAppellation: "22222",
            description: "Patissier",
          },
          {
            romeCodeMetier: "D1103",
            romeCodeAppellation: undefined,
            description: "Boucherie",
          },
        ],
      };

      const jwt = generateApiJwt({ id: "my-id" });

      const response = await request
        .post(`/immersion-offers`)
        .set("Authorization", jwt)
        .send(formEstablishmentDtoPublicV0);

      expect(response.body).toBe(formEstablishmentDtoPublicV0.siret);
      expect(response.status).toBe(200);
    });
  });

  describe("v1", () => {
    it("forbids access to route if no api consumer", async () => {
      const { request } = await buildTestApp();

      const response = await request
        .post(`/v1/add-establishment-form`)
        .send({});

      expect(response.status).toBe(403);
    });

    it("support adding establishment from known api consumer", async () => {
      const { request, generateApiJwt } = await buildTestApp();

      const formEstablishmentDtoPublicV1: FormEstablishmentDtoPublicV1 =
        FormEstablishmentDtoBuilder.valid()
          .withSiret(TEST_ESTABLISHMENT1_SIRET)
          .build();

      const jwt = generateApiJwt({ id: "my-id" });

      const response = await request
        .post(`/v1/add-establishment-form`)
        .set("Authorization", jwt)
        .send(formEstablishmentDtoPublicV1);

      expect(response.status).toBe(200);
    });
  });
});
