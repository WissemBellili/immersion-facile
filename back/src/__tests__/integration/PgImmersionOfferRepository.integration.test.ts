import { AppConfig } from "./../../adapters/primary/appConfig";
import { PgImmersionOfferRepository } from "../../adapters/secondary/searchImmersion/PgImmersionOfferRepository";
import { SearchImmersion } from "../../domain/searchImmersion/useCases/SearchImmersion";
import {
  AccessTokenGateway,
  GetAccessTokenResponse,
} from "../../domain/core/ports/AccessTokenGateway";
import {
  LaBonneBoiteGateway,
  EstablishmentFromLaBonneBoite,
  HttpCallsToLaBonneBoite,
  httpCallToLaBonneBoite,
} from "../../adapters/secondary/searchImmersion/LaBonneBoiteGateway";

import { ImmersionOfferEntity } from "../../domain/searchImmersion/entities/ImmersionOfferEntity";
import {} from "../../adapters/secondary/searchImmersion/LaBonneBoiteGateway";
import {
  httpCallToLaPlateFormeDeLInclusion,
  LaPlateFormeDeLInclusionGateway,
  EstablishmentFromLaPlateFormeDeLInclusion,
  HttpCallsToLaPlateFormeDeLInclusion,
} from "../../adapters/secondary/searchImmersion/LaPlateFormeDeLInclusionGateway";
import {
  Position,
  EstablishmentEntity,
} from "../../domain/searchImmersion/entities/EstablishmentEntity";
import {
  UncompleteEstablishmentEntity,
  GetPosition,
  GetExtraEstablishmentInfos,
  ExtraEstablishmentInfos,
} from "../../domain/searchImmersion/entities/UncompleteEstablishmentEntity";
import { SearchParams } from "../../domain/searchImmersion/ports/ImmersionOfferRepository";
import { fakeEstablishmentsLaPlateFormeDeLInclusion } from "../../adapters/secondary/searchImmersion/fakeEstablishmentsLaPlateFormeDeLInclusion";
import { fakeEstablishmentsLaBonneBoite } from "../../adapters/secondary/searchImmersion/fakeEstablishmentsLaBonneBoite";
import { PoleEmploiAccessTokenGateway } from "../../adapters/secondary/PoleEmploiAccessTokenGateway";
import { Client } from "pg";
import { UpdateEstablishmentsAndImmersionOffersFromLastSearches } from "../../domain/searchImmersion/useCases/UpdateEstablishmentsAndImmersionOffersFromLastSearches";
import {
  fakeLaBonneBoiteGateway,
  fakeLaPlateFormeDeLInclusionGateway,
  fakeGetPosition,
  fakeGetExtraEstablishmentInfos,
} from "../../_testBuilders/FakeHttpCalls";

let client: Client;

describe("Postgres implementation of immersion offer repository", () => {
  beforeAll(async () => {
    const config = AppConfig.createFromEnv();
    const client = new Client(config.pgImmersionDbUrl);
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  test.skip("Insert search works", async () => {
    const pgImmersionOfferRepository = new PgImmersionOfferRepository(client);

    await pgImmersionOfferRepository.insertSearch({
      ROME: "M1607",
      distance: 30,
      lat: 49.119146,
      lon: 6.17602,
    });
    await pgImmersionOfferRepository.insertSearch({
      ROME: "M1607",
      distance: 30,
      lat: 48.119146,
      lon: 6.17602,
    });
    await pgImmersionOfferRepository.insertSearch({
      ROME: "M1607",
      distance: 30,
      lat: 48.119146,
      lon: 5.17602,
    });
    await pgImmersionOfferRepository.insertSearch({
      ROME: "M1607",
      distance: 30,
      lat: 48.119146,
      lon: 4.17602,
    });
    await pgImmersionOfferRepository.insertSearch({
      ROME: "M1607",
      distance: 30,
      lat: 48.129146,
      lon: 4.17602,
    });
    await pgImmersionOfferRepository.insertSearch({
      ROME: "M1608",
      distance: 30,
      lat: 48.129146,
      lon: 4.17602,
    });
    expect(
      (
        await pgImmersionOfferRepository.getSearchInDatabase({
          ROME: "M1607",
          distance: 30,
          lat: 49.119146,
          lon: 6.17602,
        })
      )[0].rome,
    ).toBe("M1607");

    //We empty the searches for the next tests
    await pgImmersionOfferRepository.markPendingResearchesAsProcessedAndRetrieveThem();
  });

  test.skip("Grouping searches close geographically works", async () => {
    const pgImmersionOfferRepository = new PgImmersionOfferRepository(client);

    await pgImmersionOfferRepository.insertSearch({
      ROME: "M1607",
      distance: 30,
      lat: 49.119146,
      lon: 6.17602,
    });
    await pgImmersionOfferRepository.insertSearch({
      ROME: "M1607",
      distance: 30,
      lat: 48.119146,
      lon: 6.17602,
    });
    await pgImmersionOfferRepository.insertSearch({
      ROME: "M1607",
      distance: 30,
      lat: 48.119146,
      lon: 5.17602,
    });
    await pgImmersionOfferRepository.insertSearch({
      ROME: "M1607",
      distance: 30,
      lat: 48.119146,
      lon: 4.17602,
    });
    await pgImmersionOfferRepository.insertSearch({
      ROME: "M1607",
      distance: 30,
      lat: 48.129146,
      lon: 4.17602,
    });
    await pgImmersionOfferRepository.insertSearch({
      ROME: "M1608",
      distance: 30,
      lat: 48.129146,
      lon: 4.17602,
    });
    //We expect that two of the 6 searches have been grouped by
    expect(
      await pgImmersionOfferRepository.markPendingResearchesAsProcessedAndRetrieveThem(),
    ).toHaveLength(5);

    //We expect then that all searches have been retrieved
    expect(
      await pgImmersionOfferRepository.markPendingResearchesAsProcessedAndRetrieveThem(),
    ).toHaveLength(0);

    //We expect that all searches are not to be searched anymore
    const allSearches = (await pgImmersionOfferRepository.getAllSearches())
      .rows;
    allSearches.map((row) => {
      expect(row.needstobesearched).toBe(false);
    });
  });

  test.skip("Insert establishments and retreives them back", async () => {
    const pgImmersionOfferRepository = new PgImmersionOfferRepository(client);

    await pgImmersionOfferRepository.insertEstablishments([
      new EstablishmentEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f035443",
        address: "fake address",
        name: "Fake Establishment from la plate forme de l'inclusion",
        city: "Paris",
        score: 5,
        romes: ["M1607"],
        siret: "78000403200019",
        dataSource: "api_laplateformedelinclusion",
        numberEmployeesRange: 1,
        position: { lat: 10.1, lon: 10.1 },
        naf: "8539A",
      }),
    ]);
    await pgImmersionOfferRepository.insertEstablishments([
      new EstablishmentEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f035443",
        address: "fake address",
        name: "Fake Establishment from form",
        city: "Paris",
        score: 5,
        romes: ["M1607"],
        siret: "78000403200019",
        dataSource: "form",
        numberEmployeesRange: 1,
        position: { lat: 10.1, lon: 10.2 },
        naf: "8539A",
      }),
    ]);
    await pgImmersionOfferRepository.insertEstablishments([
      new EstablishmentEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f035443",
        address: "fake address",
        name: "Fake Establishment from la bonne boite",
        city: "Paris",
        score: 5,
        romes: ["M1607"],
        siret: "78000403200019",
        dataSource: "api_labonneboite",
        numberEmployeesRange: 1,
        position: { lat: 10.0, lon: 10.3 },
        naf: "8539A",
      }),
    ]);

    expect(
      (
        await pgImmersionOfferRepository.getEstablishmentFromSiret(
          "78000403200019",
        )
      )[0].name,
    ).toBe("Fake Establishment from form");

    await pgImmersionOfferRepository.insertImmersions([
      new ImmersionOfferEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f03536d",
        rome: "M1607",
        naf: "8539A",
        siret: "78000403200019",
        name: "Company from form",
        voluntary_to_immersion: false,
        data_source: "form",
        contact_in_establishment: undefined,
        score: 4.5,
        position: { lat: 48.8666, lon: 2.3333 },
      }),
    ]);
    await pgImmersionOfferRepository.insertImmersions([
      new ImmersionOfferEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f03536d",
        rome: "M1607",
        naf: "8539A",
        siret: "78000403200019",
        name: "Company from plateforme de l'inclusion",
        voluntary_to_immersion: false,
        data_source: "api_laplateformedelinclusion",
        contact_in_establishment: undefined,
        score: 4.5,
        position: { lat: 46.8666, lon: 3.3333 },
      }),
    ]);
    await pgImmersionOfferRepository.insertImmersions([
      new ImmersionOfferEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f03536d",
        rome: "M1607",
        naf: "8539A",
        siret: "78000403200019",
        name: "Company from la bonne boite",
        voluntary_to_immersion: false,
        data_source: "api_labonneboite",
        contact_in_establishment: undefined,
        score: 4.5,
        position: { lat: 43.8666, lon: 8.3333 },
      }),
    ]);

    expect(
      (
        await pgImmersionOfferRepository.getImmersionsFromSiret(
          "78000403200019",
        )
      )[0].name,
    ).toBe("Company from form");
  });
});
