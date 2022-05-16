import { expectTypeToMatchAndEqual } from "../../../_testBuilders/test.helpers";
import { ConsoleAppLogger } from "../../../adapters/secondary/core/ConsoleAppLogger";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryPeAgenciesReferential } from "../../../adapters/secondary/immersionOffer/InMemoryPeAgenciesReferential";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { defaultQuestionnaireUrl } from "../../../domain/immersionOffer/useCases/AddAgency";
import { UpdateAllPeAgencies } from "../../../domain/immersionOffer/useCases/UpdateAllPeAgencies";
import { AgencyConfig } from "shared/src/agency/agency.dto";

const adminMail = "admin@mail.com";

describe("UpdateAllPeAgencies use case", () => {
  let updateAllPeAgencies: UpdateAllPeAgencies;
  let peAgenciesReferential: InMemoryPeAgenciesReferential;
  let agencyRepository: InMemoryAgencyRepository;
  let uuid: TestUuidGenerator;

  beforeEach(() => {
    peAgenciesReferential = new InMemoryPeAgenciesReferential();
    agencyRepository = new InMemoryAgencyRepository();
    uuid = new TestUuidGenerator();
    updateAllPeAgencies = new UpdateAllPeAgencies(
      peAgenciesReferential,
      agencyRepository,
      adminMail,
      uuid,
      new ConsoleAppLogger(),
    );
  });

  it("should save agencies which have never been saved", async () => {
    peAgenciesReferential.setPeAgencies([peReferentialAgency]);
    agencyRepository.setAgencies([]);
    uuid.setNextUuid("some-uuid");
    await updateAllPeAgencies.execute();
    expectTypeToMatchAndEqual(agencyRepository.agencies, [
      {
        id: "some-uuid",
        name: "Agence Pôle emploi MOLSHEIM",
        counsellorEmails: [],
        validatorEmails: ["molsheim@pole-emploi.fr"],
        adminEmails: [adminMail],
        address: "16 b RUE Gaston Romazzotti, 67120 MOLSHEIM",
        position: {
          lon: 7.511,
          lat: 48.532571,
        },
        signature: "L'équipe de l'Agence Pôle emploi MOLSHEIM",
        questionnaireUrl: defaultQuestionnaireUrl,
        agencySiret: "13000548120984",
        code: "GRE0187",
        kind: "pole-emploi",
        status: "from-api-PE",
      },
    ]);
  });
  describe("Agency already exists, should add the new emails, siret and code", () => {
    it("if PE agency has same email as existing", async () => {
      const commonEmail = "common@mail.com";
      peAgenciesReferential.setPeAgencies([
        {
          ...peReferentialAgency,
          contact: { ...peReferentialAgency.contact, email: commonEmail },
        },
      ]);
      const initialAgencyConfig: AgencyConfig = {
        id: "some-uuid",
        name: "Agence Pôle emploi Molsheim",
        counsellorEmails: [],
        validatorEmails: [commonEmail],
        adminEmails: ["someAdmin@mail.com"],
        address: "16B RUE Gaston Romazzotti, 67120 Molsheim",
        position: {
          lon: 7,
          lat: 49,
        },
        signature: "L'équipe de l'Agence Pôle emploi Molsheim",
        questionnaireUrl: "some-url",
        kind: "pole-emploi",
        status: "active",
      };
      agencyRepository.setAgencies([initialAgencyConfig]);
      uuid.setNextUuid("other-uuid");
      await updateAllPeAgencies.execute();

      expectTypeToMatchAndEqual(agencyRepository.agencies, [
        {
          ...initialAgencyConfig,
          validatorEmails: [commonEmail],
          agencySiret: "13000548120984",
          code: "GRE0187",
        },
      ]);
    });

    it("if PE agency is very close by", async () => {
      peAgenciesReferential.setPeAgencies([peReferentialAgency]);
      const initialAgencyConfig: AgencyConfig = {
        id: "some-uuid",
        name: "Agence Pôle emploi Molsheim",
        counsellorEmails: [],
        validatorEmails: ["existing@mail.com"],
        adminEmails: ["someAdmin@mail.com"],
        address: "16B RUE Gaston Romazzotti, 67120 Molsheim",
        position: {
          lon: 7,
          lat: 49,
        },
        signature: "L'équipe de l'Agence Pôle emploi Molsheim",
        questionnaireUrl: "some-url",
        kind: "pole-emploi",
        status: "active",
      };
      agencyRepository.setAgencies([initialAgencyConfig]);
      uuid.setNextUuid("other-uuid");
      await updateAllPeAgencies.execute();

      expectTypeToMatchAndEqual(agencyRepository.agencies, [
        {
          ...initialAgencyConfig,
          validatorEmails: [
            ...initialAgencyConfig.validatorEmails,
            "molsheim@pole-emploi.fr",
          ],
          agencySiret: "13000548120984",
          code: "GRE0187",
        },
      ]);
    });
  });

  it("if existing agency is not of kind pole-emploi it should not be considered, and a new one should be created", async () => {
    peAgenciesReferential.setPeAgencies([peReferentialAgency]);
    const initialAgencyConfig: AgencyConfig = {
      id: "some-uuid",
      name: "Agence Pôle emploi Molsheim",
      counsellorEmails: [],
      validatorEmails: ["existing@mail.com"],
      adminEmails: ["someAdmin@mail.com"],
      address: "16B RUE Gaston Romazzotti, 67120 Molsheim",
      position: {
        lon: 7,
        lat: 49,
      },
      signature: "L'équipe de l'Agence Pôle emploi Molsheim",
      questionnaireUrl: "some-url",
      kind: "mission-locale",
      status: "active",
    };
    agencyRepository.setAgencies([initialAgencyConfig]);
    uuid.setNextUuid("other-uuid");
    await updateAllPeAgencies.execute();

    expectTypeToMatchAndEqual(agencyRepository.agencies, [
      initialAgencyConfig,
      {
        id: "other-uuid",
        name: "Agence Pôle emploi MOLSHEIM",
        counsellorEmails: [],
        validatorEmails: ["molsheim@pole-emploi.fr"],
        adminEmails: [adminMail],
        address: "16 b RUE Gaston Romazzotti, 67120 MOLSHEIM",
        position: {
          lon: 7.511,
          lat: 48.532571,
        },
        signature: "L'équipe de l'Agence Pôle emploi MOLSHEIM",
        questionnaireUrl: defaultQuestionnaireUrl,
        agencySiret: "13000548120984",
        code: "GRE0187",
        kind: "pole-emploi",
        status: "from-api-PE",
      },
    ]);
  });
});

const peReferentialAgency = {
  code: "GRE0187",
  libelle: "MOLSHEIM",
  libelleEtendu: "Agence Pôle emploi MOLSHEIM",
  type: "APE",
  typeAccueil: "3",
  codeRegionINSEE: "44",
  dispositifADEDA: true,
  contact: { telephonePublic: "39-49", email: "molsheim@pole-emploi.fr" },
  siret: "13000548120984",
  adressePrincipale: {
    ligne4: "16 b RUE Gaston Romazzotti",
    ligne5: "",
    ligne6: "67120 MOLSHEIM",
    gpsLon: 7.511,
    gpsLat: 48.532571,
    communeImplantation: "67300",
    bureauDistributeur: "67120",
  },
};