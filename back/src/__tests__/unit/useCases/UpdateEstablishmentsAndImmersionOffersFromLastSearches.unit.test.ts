import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersonOfferRepository";
import { InMemoryLaBonneBoiteAPI } from "../../../adapters/secondary/immersionOffer/InMemoryLaBonneBoiteAPI";
import { InMemorySearchMadeRepository } from "../../../adapters/secondary/immersionOffer/InMemorySearchMadeRepository";
import { InMemorySireneRepository } from "../../../adapters/secondary/InMemorySireneRepository";
import { SearchMadeEntity } from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { UpdateEstablishmentsAndImmersionOffersFromLastSearches } from "../../../domain/immersionOffer/useCases/UpdateEstablishmentsAndImmersionOffersFromLastSearches";
import { LaBonneBoiteCompanyBuilder } from "../../../_testBuilders/LaBonneBoiteResponseBuilder";
import { SireneEstablishmentBuilder } from "../../../_testBuilders/SireneEstablishmentBuilder";

describe("UpdateEstablishmentsAndImmersionOffersFromLastSearches", () => {
  let testUuidGenerator: TestUuidGenerator;
  let updateEstablishmentsAndImmersionOffersFromLastSearches: UpdateEstablishmentsAndImmersionOffersFromLastSearches;
  let immersionOfferRepository: InMemoryImmersionOfferRepository;
  let searchesMadeRepository: InMemorySearchMadeRepository;
  let laBonneBoiteAPI: InMemoryLaBonneBoiteAPI;
  let sireneRepository: InMemorySireneRepository;

  beforeEach(() => {
    testUuidGenerator = new TestUuidGenerator();

    immersionOfferRepository = new InMemoryImmersionOfferRepository();

    searchesMadeRepository = new InMemorySearchMadeRepository();

    laBonneBoiteAPI = new InMemoryLaBonneBoiteAPI();

    sireneRepository = new InMemorySireneRepository();

    updateEstablishmentsAndImmersionOffersFromLastSearches =
      new UpdateEstablishmentsAndImmersionOffersFromLastSearches(
        testUuidGenerator,
        laBonneBoiteAPI,
        sireneRepository,
        searchesMadeRepository,
        immersionOfferRepository,
      );
  });

  it("when Immersion search have been made lately, their information gets persisted in our system", async () => {
    laBonneBoiteAPI.setNextResults([new LaBonneBoiteCompanyBuilder().build()]);
    // Prepare
    const search: SearchMadeEntity = {
      id: "searchMadeId",
      rome: "A1203",
      distance_km: 10.0,
      lat: 10.0,
      lon: 20.0,
      needsToBeSearched: true,
    };
    searchesMadeRepository.setSearchesMade([search]);

    // Act
    await updateEstablishmentsAndImmersionOffersFromLastSearches.execute();

    // Expect that all searches have been processed
    // Note : This assertion is confusing because it's highly dependent on how the  in-memory adapter...
    // Real problem is : we should have two method : one reading (getNextUnprocessedSearchMade),
    // the other writing ("setSearchMadeAsProcessed").
    expect(searchesMadeRepository.processedSearchesMadeIds.size).toBe(1);
    expect(
      searchesMadeRepository.processedSearchesMadeIds.has("searchMadeId"),
    ).toBe(true);

    // We expect to find the establishments in results
    const establishmentAggregatesInRepo =
      immersionOfferRepository.establishmentAggregates;

    expect(establishmentAggregatesInRepo).toHaveLength(1);

    // 1 offer from la bonne boite with 1 offer, no contact.
    const establishmentAggregateFromLaBonneBoiteInRepo =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      establishmentAggregatesInRepo.find(
        (aggregate) =>
          aggregate.establishment.dataSource === "api_labonneboite",
      )!;

    expect(establishmentAggregateFromLaBonneBoiteInRepo).toBeDefined();
    expect(
      establishmentAggregateFromLaBonneBoiteInRepo.immersionOffers,
    ).toHaveLength(1);
    expect(establishmentAggregateFromLaBonneBoiteInRepo.contacts).toHaveLength(
      0,
    );
  });
});

const prepareUseCase = () => {
  const testUuidGenerator = new TestUuidGenerator();

  const immersionOfferRepository = new InMemoryImmersionOfferRepository();

  const searchesMadeRepository = new InMemorySearchMadeRepository();

  const laBonneBoiteAPI = new InMemoryLaBonneBoiteAPI();

  const sireneRepository = new InMemorySireneRepository();

  const useCase = new UpdateEstablishmentsAndImmersionOffersFromLastSearches(
    testUuidGenerator,
    laBonneBoiteAPI,
    sireneRepository,
    searchesMadeRepository,
    immersionOfferRepository,
  );
  return {
    useCase,
    sireneRepository,
    searchesMadeRepository,
    immersionOfferRepository,
    testUuidGenerator,
    laBonneBoiteAPI,
  };
};

describe("Update establishments and offers based on searches made during the day", () => {
  describe("One immersion search has been made during the day and needs to be processed", () => {
    describe("when LBB API returns 2 establishments", () => {
      describe("LBB establishments siren exist", () => {
        it("Should add those 2 establishments, each with one offer", async () => {
          // Prepare
          const {
            searchesMadeRepository,
            laBonneBoiteAPI,
            sireneRepository,
            testUuidGenerator,
            immersionOfferRepository,
            useCase,
          } = prepareUseCase();

          searchesMadeRepository.setSearchesMade([
            { id: "searchMadeId" } as SearchMadeEntity,
          ]);
          const matchedRomeCode = "A1201";
          laBonneBoiteAPI.setNextResults([
            new LaBonneBoiteCompanyBuilder()
              .withSiret("siretLBB1")
              .withStars(1)
              .withMatchedRomeCode(matchedRomeCode)
              .build(),
            new LaBonneBoiteCompanyBuilder()
              .withSiret("siretLBB2")
              .withStars(2)
              .withMatchedRomeCode(matchedRomeCode)
              .build(),
          ]);

          sireneRepository.setEstablishment(
            new SireneEstablishmentBuilder().withSiret("siretLBB1").build(),
          );
          sireneRepository.setEstablishment(
            new SireneEstablishmentBuilder().withSiret("siretLBB2").build(),
          );
          testUuidGenerator.setNextUuids(["uuidLBB1", "uuidLBB2"]);
          // Act
          await useCase.execute();
          // Assert
          expect(laBonneBoiteAPI.nbOfCalls).toBe(1);
          expect(immersionOfferRepository.establishmentAggregates).toHaveLength(
            2,
          );
          expect(
            immersionOfferRepository.establishmentAggregates[0].immersionOffers,
          ).toEqual([
            {
              id: "uuidLBB1",
              rome: matchedRomeCode,
              score: 1,
            },
          ]);
          expect(
            immersionOfferRepository.establishmentAggregates[1].immersionOffers,
          ).toEqual([
            {
              id: "uuidLBB2",
              rome: matchedRomeCode,
              score: 2,
            },
          ]);
        });
      });
      describe("LBB establishments siren don't exist", () => {
        it("Should not insert establishment", async () => {
          // Prepare
          const {
            laBonneBoiteAPI,
            searchesMadeRepository,
            useCase,
            immersionOfferRepository,
          } = prepareUseCase();
          searchesMadeRepository.setSearchesMade([
            { id: "searchMadeId" } as SearchMadeEntity,
          ]);
          laBonneBoiteAPI.setNextResults([
            new LaBonneBoiteCompanyBuilder().withSiret("unknownSiret").build(),
          ]);
          // Act
          await useCase.execute();
          // Assert
          expect(immersionOfferRepository.establishmentAggregates).toHaveLength(
            0,
          );
        });
      });
      it("Should turn the search made flag `needs to be processed` to False", async () => {
        // Prepare
        const { laBonneBoiteAPI, searchesMadeRepository, useCase } =
          prepareUseCase();
        searchesMadeRepository.setSearchesMade([
          { id: "searchMadeId" } as SearchMadeEntity,
        ]);
        laBonneBoiteAPI.setNextResults([
          new LaBonneBoiteCompanyBuilder().build(),
        ]);
        // Act
        await useCase.execute();
        // Assert
        expect(
          searchesMadeRepository.processedSearchesMadeIds.has("searchMadeId"),
        ).toBe(true);
      });
    });
    describe("when LBB API has an error", () => {
      const {
        laBonneBoiteAPI,
        searchesMadeRepository,
        useCase,
        immersionOfferRepository,
      } = prepareUseCase();

      searchesMadeRepository.setSearchesMade([
        { id: "searchMadeId" } as SearchMadeEntity,
      ]);
      laBonneBoiteAPI.setError(Error("La Bonne Boite API is down :("));
      useCase.execute();

      it("Should not add any establishment", () => {
        // Assert
        expect(laBonneBoiteAPI.nbOfCalls).toBe(1);
        expect(immersionOfferRepository.establishmentAggregates).toHaveLength(
          0,
        );
      });
      it("Should leave the search made flag `needs to be processed` to True", () => {
        // Assert
        expect(
          searchesMadeRepository.processedSearchesMadeIds.has("searchMadeId"),
        ).toBe(false);
      });
    });
  });
  describe("when two searches have same ROME and very close location", () => {
    // Prepare
    const { laBonneBoiteAPI, searchesMadeRepository, useCase } =
      prepareUseCase();
    const rome = "A1203";
    const makeSearchMadeInParis17 = (id?: string): SearchMadeEntity =>
      ({
        id,
        rome,
        lat: 48.862725, // 7 rue guillaume Tell, 75017 Paris
        lon: 2.287592,
      } as SearchMadeEntity);
    const makeSearchMadeInParis10 = (id?: string): SearchMadeEntity =>
      ({
        id,
        rome,
        lat: 48.8841446, // 169 Bd de la Villette, 75010 Paris
        lon: 2.3651789,
      } as SearchMadeEntity);

    it("Should call LBC API only one", () => {
      // Prepare
      searchesMadeRepository.setSearchesMade([
        makeSearchMadeInParis17(),
        makeSearchMadeInParis10(),
      ]);
      // Act
      useCase.execute();
      // Assert
      expect(laBonneBoiteAPI.nbOfCalls).toBe(1);
    });
    it("Should turn the search made flag `needs to be processed` of those two searches to False", () => {
      // Prepare
      searchesMadeRepository.setSearchesMade([
        makeSearchMadeInParis17("searchParis17"),
        makeSearchMadeInParis10("searchParis10"),
      ]);
      // Act
      useCase.execute();
      // Assert
      expect(
        searchesMadeRepository.processedSearchesMadeIds.has("searchParis17"),
      ).toBe(true);
      expect(
        searchesMadeRepository.processedSearchesMadeIds.has("searchPardis10"),
      ).toBe(true);
    });
  });
});
