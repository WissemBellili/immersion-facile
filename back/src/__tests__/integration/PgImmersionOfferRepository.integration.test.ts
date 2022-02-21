import { Pool, PoolClient } from "pg";
import {
  PgContactMethod,
  PgDataSource,
  PgImmersionOfferRepository,
} from "../../adapters/secondary/pg/PgImmersionOfferRepository";
import {
  DataSource,
  EstablishmentEntityV2,
} from "../../domain/immersionOffer/entities/EstablishmentEntity";
import { SearchMade } from "../../domain/immersionOffer/entities/SearchMadeEntity";
import {
  LatLonDto,
  SearchImmersionResultDto,
} from "../../shared/SearchImmersionDto";
import { ContactEntityV2Builder } from "../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../_testBuilders/EstablishmentEntityV2Builder";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { ImmersionOfferEntityV2Builder } from "../../_testBuilders/ImmersionOfferEntityV2Builder";

const testUid1 = "11111111-a2a5-430a-b558-ed3e2f03512d";
const testUid2 = "22222222-a2a5-430a-b558-ed3e2f03512d";
const testUid3 = "33333333-a2a5-430a-b558-ed3e2f03512d";
const testUid4 = "44444444-a2a5-430a-b558-ed3e2f03512d";

describe("Postgres implementation of immersion offer repository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgImmersionOfferRepository: PgImmersionOfferRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("TRUNCATE immersion_contacts CASCADE");
    await client.query("TRUNCATE establishments CASCADE");
    await client.query("TRUNCATE immersion_offers CASCADE");
    pgImmersionOfferRepository = new PgImmersionOfferRepository(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  describe("Pg implementation of method getSearchImmersionResultDtoFromSearchMade", () => {
    const searchedRome = "M1808";
    const searchedPosition = { lat: 49, lon: 6 };
    const notMatchingRome = "A1111";
    const farFromSearchedPosition = { lat: 32, lon: 89 };
    const searchMade: SearchMade = {
      rome: searchedRome,
      ...searchedPosition,
      distance_km: 30,
    };
    test("Returns empty list when repo is empty", async () => {
      // Act
      const searchWithNoRomeResult =
        await pgImmersionOfferRepository.getSearchImmersionResultDtoFromSearchMade(
          searchMade,
        );
      // Assert
      expect(searchWithNoRomeResult).toHaveLength(0);
    });
    test("Returns only active establishments only ", async () => {
      // Prepare : establishment in geographical area but not active
      const notActiveSiret = "78000403200029";

      await insertEstablishment({
        siret: notActiveSiret,
        isActive: false,
        position: searchedPosition,
      });
      await insertImmersionOffer({
        uuid: testUid1,
        rome: searchedRome,
        siret: notActiveSiret,
      });

      // Act
      const searchWithNoRomeResult =
        await pgImmersionOfferRepository.getSearchImmersionResultDtoFromSearchMade(
          searchMade,
        );
      // Assert
      expect(searchWithNoRomeResult).toHaveLength(0);
    });
    const insertActiveEstablishmentAndOfferAndEventuallyContact = async (
      offerUid: string,
      siret: string,
      rome: string,
      establishmentPosition: LatLonDto,
      offerPosition: LatLonDto,
      offerContactUid?: string,
    ) => {
      await insertEstablishment({
        siret,
        isActive: true,
        position: establishmentPosition,
      });
      if (offerContactUid) {
        await insertImmersionContact({
          uuid: offerContactUid,
          siret_establishment: siret,
        });
      }
      await insertImmersionOffer({
        uuid: offerUid,
        siret,
        rome,
        position: offerPosition,
        contactUid: offerContactUid,
      });
    };
    test("Returns establishments with offers of given rome code and located within given geographical area", async () => {
      // Prepare
      /// Establishment with offer inside geographical area with searched rome
      const siretMatchingToSearch = "78000403200029";
      const immersionOfferIdMatchingSearch = testUid1;
      await insertActiveEstablishmentAndOfferAndEventuallyContact(
        immersionOfferIdMatchingSearch,
        siretMatchingToSearch,
        searchedRome, // Matching
        farFromSearchedPosition, // Establishment position not matching (but no importance ! )
        searchedPosition, // Offer position matching
      );
      const contactUid = testUid1;
      await insertImmersionContact({
        uuid: contactUid,
        siret_establishment: siretMatchingToSearch,
      });

      /// Establishment located inside geo area but its offer ouside geo area with searched rome
      await insertActiveEstablishmentAndOfferAndEventuallyContact(
        testUid2,
        "77000403200029",
        searchedRome, // Matching
        searchedPosition, // Offer position not matching
        farFromSearchedPosition, // Establishment position not matching (but no importance !)
      );
      /// Establishment with offer inside geographical area but an other rome
      await insertActiveEstablishmentAndOfferAndEventuallyContact(
        testUid3,
        "88000403200029",
        notMatchingRome, // Not matching
        searchedPosition,
        searchedPosition,
      );

      /// Establishment with offer with searched rome but oustide geographical area
      await insertActiveEstablishmentAndOfferAndEventuallyContact(
        testUid4,
        "99000403200029",
        searchedRome,
        farFromSearchedPosition,
        farFromSearchedPosition, // Not matching
      );

      // Act
      const searchResult: SearchImmersionResultDto[] =
        await pgImmersionOfferRepository.getSearchImmersionResultDtoFromSearchMade(
          searchMade,
        );

      // Assert : one match and defined contact details
      expect(searchResult).toHaveLength(1);

      const expectedResult: Partial<SearchImmersionResultDto> = {
        id: immersionOfferIdMatchingSearch,
        rome: searchedRome,
        romeLabel: "Information géographique",
        siret: siretMatchingToSearch,
        distance_m: 0,
      };

      expect(searchResult).toMatchObject([expectedResult]);
    });
    test("Returns also contact details if offer has contact uuid and flag is True", async () => {
      // Prepare
      /// Establishment with offer inside geographical area with searched rome
      const siretMatchingToSearch = "78000403200029";
      const contactUidOfOfferMatchingSearch = testUid1;

      await insertActiveEstablishmentAndOfferAndEventuallyContact(
        testUid1,
        siretMatchingToSearch,
        searchedRome, // Matching
        farFromSearchedPosition, // Establishment position not matching (but no importance ! )
        searchedPosition, // Offer position matching
        contactUidOfOfferMatchingSearch,
      );

      // Act
      const searchResult: SearchImmersionResultDto[] =
        await pgImmersionOfferRepository.getSearchImmersionResultDtoFromSearchMade(
          searchMade,
          true, // withContactDetails
        );

      // Assert : one match and defined contact details
      expect(searchResult).toHaveLength(1);
      expect(searchResult[0].contactDetails?.id).toEqual(
        contactUidOfOfferMatchingSearch,
      );
    });
  });

  describe("getEstablishmentByImmersionOfferId", () => {
    test("fetches existing establishment", async () => {
      // Prepare
      const immersionOfferId = "fdc2c62d-103d-4474-a546-8bf3fbebe83f";
      const storedEstablishment = new EstablishmentEntityV2Builder()
        .withNaf("8520A")
        .build();

      // Act
      await pgImmersionOfferRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(storedEstablishment)
          .withImmersionOffers([
            new ImmersionOfferEntityV2Builder()
              .withId(immersionOfferId)
              .build(),
          ])
          .build(),
      ]);

      // Assert
      const establishment =
        await pgImmersionOfferRepository.getAnnotatedEstablishmentByImmersionOfferId(
          immersionOfferId,
        );
      expect(establishment).toEqual({
        ...storedEstablishment,
        nafLabel: "Enseignement primaire",
      });
    });

    test("returns undefined for missing establishment", async () => {
      const missingOfferId = "82e37a80-eb0b-4de6-a531-68d30af7887a";
      expect(
        await pgImmersionOfferRepository.getAnnotatedEstablishmentByImmersionOfferId(
          missingOfferId,
        ),
      ).toBeUndefined();
    });
  });

  describe("getContactByImmersionOfferId", () => {
    test("fetches existing contact", async () => {
      const immersionOfferId = "fdc2c62d-103d-4474-a546-8bf3fbebe83f";
      const storedContact = new ContactEntityV2Builder().build();
      await pgImmersionOfferRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(new EstablishmentEntityV2Builder().build())
          .withContacts([storedContact])
          .withImmersionOffers([
            new ImmersionOfferEntityV2Builder()
              .withId(immersionOfferId)
              .build(),
          ])
          .build(),
      ]);
      const contact =
        await pgImmersionOfferRepository.getContactByImmersionOfferId(
          immersionOfferId,
        );
      expect(contact).toEqual(storedContact);
    });

    test("returns undefined for offer without contact", async () => {
      const immersionOfferId = "fdc2c62d-103d-4474-a546-8bf3fbebe83f";
      await pgImmersionOfferRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(new EstablishmentEntityV2Builder().build())
          .withContacts([]) // no contact
          .withImmersionOffers([
            new ImmersionOfferEntityV2Builder()
              .withId(immersionOfferId)
              .build(),
          ])
          .build(),
      ]);
      expect(
        await pgImmersionOfferRepository.getContactByImmersionOfferId(
          immersionOfferId,
        ),
      ).toBeUndefined();
    });

    test("returns undefined for missing offer", async () => {
      const missingOfferId = "82e37a80-eb0b-4de6-a531-68d30af7887a";
      expect(
        await pgImmersionOfferRepository.getContactByImmersionOfferId(
          missingOfferId,
        ),
      ).toBeUndefined();
    });
  });

  describe("getImmersionOfferById", () => {
    test("fetches existing offer", async () => {
      const immersionOfferId = "fdc2c62d-103d-4474-a546-8bf3fbebe83f";
      const storedImmersionOffer = new ImmersionOfferEntityV2Builder()
        .withId(immersionOfferId)
        .withRome("M1808")
        .build();
      await pgImmersionOfferRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(new EstablishmentEntityV2Builder().build())
          .withImmersionOffers([storedImmersionOffer])
          .build(),
      ]);
      const immersionOffer =
        await pgImmersionOfferRepository.getAnnotatedImmersionOfferById(
          immersionOfferId,
        );
      expect(immersionOffer).toEqual({
        ...storedImmersionOffer,
        romeLabel: "Information géographique",
      });
    });

    test("returns undefined for missing offer", async () => {
      const missingOfferId = "82e37a80-eb0b-4de6-a531-68d30af7887a";
      expect(
        await pgImmersionOfferRepository.getAnnotatedImmersionOfferById(
          missingOfferId,
        ),
      ).toBeUndefined();
    });
  });

  const position: LatLonDto = {
    lat: 20,
    lon: 3,
  };
  describe("Pg implementation of method getActiveEstablishmentSiretsNotUpdatedSince", () => {
    it("Returns a siret list of establishments having field `update_date` < parameter `since` ", async () => {
      // Prepare
      const since = new Date("2020-05-05T12:00:00.000");
      const siretOfClosedEstablishmentNotUpdatedSince = "78000403200021";
      const siretOfActiveEstablishmentNotUpdatedSince = "78000403200022";
      const siretOfActiveEstablishmentUpdatedSince = "78000403200023";
      const siretOfActiveFormEstablishmentUpdatedSince = "78000403200024";

      const beforeSince = new Date("2020-04-14T12:00:00.000");
      const afterSince = new Date("2020-05-15T12:00:00.000");

      await Promise.all([
        // Should NOT update because not active
        insertEstablishment({
          siret: siretOfClosedEstablishmentNotUpdatedSince,
          updatedAt: beforeSince,
          isActive: false,
          position,
          dataSource: "api_labonneboite",
        }),
        insertEstablishment({
          // Should update because from LBB, before the date and active
          siret: siretOfActiveEstablishmentNotUpdatedSince,
          updatedAt: beforeSince,
          isActive: true,
          position,
          dataSource: "api_labonneboite",
        }),
        insertEstablishment({
          // Should NOT update because from form
          siret: siretOfActiveFormEstablishmentUpdatedSince,
          updatedAt: beforeSince,
          isActive: true,
          position,
          dataSource: "form",
        }),
        insertEstablishment({
          // Should NOT update because already updated since date
          siret: siretOfActiveEstablishmentUpdatedSince,
          updatedAt: afterSince,
          isActive: true,
          position,
          dataSource: "api_labonneboite",
        }),
      ]);

      // Act
      const actualResult =
        await pgImmersionOfferRepository.getActiveEstablishmentSiretsFromLaBonneBoiteNotUpdatedSince(
          since,
        );

      // Assert
      const expectedResult: string[] = [
        siretOfActiveEstablishmentNotUpdatedSince,
      ];
      expect(actualResult).toEqual(expectedResult);
    });
    it("Returns a siret list of all establishmetns having same `update_date` and `create_date` (which means they have never been updated !) ", async () => {
      // Prepare
      const neverUpdatedEstablishmentSiret = "88000403200022";
      await insertEstablishment({
        siret: neverUpdatedEstablishmentSiret,
        isActive: true,
        position,
      });
      // Act
      const actualResult =
        await pgImmersionOfferRepository.getActiveEstablishmentSiretsFromLaBonneBoiteNotUpdatedSince(
          new Date("2020-04-14T12:00:00.000"), // whatever date
        );

      // Assert
      const expectedResult: string[] = [neverUpdatedEstablishmentSiret];
      expect(actualResult).toEqual(expectedResult);
    });
  });

  describe("Pg implementation of method updateEstablishment", () => {
    it("Updates the parameter `updatedAt` and `isActive if given", async () => {
      // Prepare
      const siretOfEstablishmentToUpdate = "78000403200021";

      await insertEstablishment({
        siret: siretOfEstablishmentToUpdate,
        updatedAt: new Date("2020-04-14T12:00:00.000"),
        isActive: true,
        position,
      });

      // Act
      const updatedAt = new Date("2020-05-15T12:00:00.000");
      await pgImmersionOfferRepository.updateEstablishment(
        siretOfEstablishmentToUpdate,
        {
          isActive: false,
          updatedAt,
        },
      );

      // Assert
      const establishmentRowInDB = await retrieveEstablishmentWithSiret(
        siretOfEstablishmentToUpdate,
      );
      expect(establishmentRowInDB).toMatchObject({
        is_active: false,
        update_date: updatedAt,
      });
    });

    it("Updates parameters `naf`, `nb of employe`, `adress` and `position` if given and `updatedAt`", async () => {
      // Prepare
      const siretOfEstablishmentToUpdate = "78000403200021";

      const updateProps: Pick<
        EstablishmentEntityV2,
        "address" | "position" | "naf" | "numberEmployeesRange"
      > = {
        naf: "8722B",
        numberEmployeesRange: 1,
        position: { lon: 21, lat: 23 },
        address: "4 rue de l'île de Bitche 44000 Nantes",
      };
      await insertEstablishment({
        siret: siretOfEstablishmentToUpdate,
        updatedAt: new Date("2020-04-14T12:00:00.000"),
        isActive: true,
        position,
      });

      // Act
      const updatedAt = new Date("2020-05-15T12:00:00.000");
      await pgImmersionOfferRepository.updateEstablishment(
        siretOfEstablishmentToUpdate,
        {
          ...updateProps,
          updatedAt,
        },
      );

      // Assert
      const actualEstablishmentRowInDB = await retrieveEstablishmentWithSiret(
        siretOfEstablishmentToUpdate,
      );
      const partialExpectedEstablishmentRowInDB: Partial<PgEstablishmentRowWithGeo> =
        {
          update_date: updatedAt,
          naf: updateProps.naf,
          number_employees: updateProps.numberEmployeesRange,
          address: updateProps.address,
          longitude: updateProps?.position?.lon,
          latitude: updateProps?.position?.lat,
        };
      expect(actualEstablishmentRowInDB).toMatchObject(
        partialExpectedEstablishmentRowInDB,
      );
    });
  });

  describe("Pg implementation of method insertEstablishmentAggregates", () => {
    const siret1 = "11111111111111";
    const siret2 = "22222222222222";
    describe("Create new establishments", () => {
      it("does nothing if empty list given", async () => {
        await pgImmersionOfferRepository.insertEstablishmentAggregates([]);
        expect(await getAllEstablishmentsRows()).toHaveLength(0);
      });
      it("adds the establishment values in `establishments` table when one new establishment is given", async () => {
        // Prepare
        const establishmentToInsert = new EstablishmentEntityV2Builder()
          .withContactMode("EMAIL")
          .build();

        // Act
        await pgImmersionOfferRepository.insertEstablishmentAggregates([
          new EstablishmentAggregateBuilder()
            .withEstablishment(establishmentToInsert)
            .build(),
        ]);

        // Assert
        const expectedEstablishmentRow: Partial<PgEstablishmentRow> = {
          siret: establishmentToInsert.siret,
          name: establishmentToInsert.name,
          address: establishmentToInsert.address,
          number_employees: establishmentToInsert.numberEmployeesRange,
          naf: establishmentToInsert.naf,
          contact_mode: "mail",
          data_source: establishmentToInsert.dataSource,
          update_date: establishmentToInsert.updatedAt,
          is_active: establishmentToInsert.isActive,
        };
        const actualEstablishmentRows = await getAllEstablishmentsRows();
        expect(actualEstablishmentRows).toHaveLength(1);
        expect(actualEstablishmentRows[0]).toMatchObject(
          expectedEstablishmentRow,
        );
      });
      it("adds one new row per establishment in `establishments` table when multiple establishments are given", async () => {
        // Act
        await pgImmersionOfferRepository.insertEstablishmentAggregates([
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret1)
            .build(),
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret2)
            .build(),
        ]);
        // Assert
        const establishmentsRows = await getAllEstablishmentsRows();
        expect(establishmentsRows).toHaveLength(2);
        expect(establishmentsRows.map((row) => row.siret)).toEqual([
          siret1,
          siret2,
        ]);
      });
      it("adds a new row in contact table with first contact referencing the establishment siret, if multiple contacts are given", async () => {
        // Prepare
        const firstContactId = "3ca6e619-d654-4d0d-8fa6-2febefbe953d";
        const firstContact = new ContactEntityV2Builder()
          .withId(firstContactId)
          .build();

        // Act
        await pgImmersionOfferRepository.insertEstablishmentAggregates([
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret1)
            .withContacts([firstContact])
            .build(),
        ]);

        // Assert
        const actualImmersionContactRows = await getAllImmersionContactsRows();
        expect(actualImmersionContactRows).toHaveLength(1);
        const expectedImmersionContactRow: PgImmersionContactRow = {
          uuid: firstContact.id,
          email: firstContact.email,
          phone: firstContact.phone,
          name: firstContact.lastName,
          firstname: firstContact.firstName,
          role: firstContact.job,
          siret_establishment: siret1,
        };
        expect(actualImmersionContactRows[0]).toEqual(
          expectedImmersionContactRow,
        );
      });
      it("adds as many row as immersion offers in table `immersion_offers`, each referencing the establishment siret and the contact uuid", async () => {
        // Act
        const offer1 = new ImmersionOfferEntityV2Builder()
          .withId("11111111-a2a5-430a-b558-ed3e2f03512d")
          .withRome("A1111")
          .build();
        const offer2 = new ImmersionOfferEntityV2Builder()
          .withId("22222222-a2a5-430a-b558-ed3e2f03512d")
          .withRome("A2222")
          .build();

        const contactId = "3ca6e619-d654-4d0d-8fa6-2febefbe953d";
        const establishmentAggregateToInsert =
          new EstablishmentAggregateBuilder()
            .withEstablishmentSiret(siret1)
            .withImmersionOffers([offer1, offer2])
            .withContactId(contactId)
            .build();

        await pgImmersionOfferRepository.insertEstablishmentAggregates([
          establishmentAggregateToInsert,
        ]);

        // Assert
        const actualImmersionOfferRows = await getAllImmersionOfferRows();
        expect(actualImmersionOfferRows).toHaveLength(2);

        const expectedFirstImmersionOfferRow: Partial<PgImmersionOfferRow> = {
          uuid: offer1.id,
          rome: offer1.rome,
          score: offer1.score,

          siret: siret1,

          naf: establishmentAggregateToInsert.establishment.naf,
          naf_division: establishmentAggregateToInsert.establishment.naf.slice(
            0,
            2,
          ),
          name: establishmentAggregateToInsert.establishment.name,
          voluntary_to_immersion:
            establishmentAggregateToInsert.establishment.voluntaryToImmersion,
          data_source: establishmentAggregateToInsert.establishment.dataSource,
          contact_in_establishment_uuid: contactId,
        };
        expect(actualImmersionOfferRows[0]).toMatchObject(
          expectedFirstImmersionOfferRow,
        );
      });
    });
    describe("When the establishment siret already exists and active ", () => {
      const existingSiret = "88888888888888";
      const existingUpdateAt = new Date("2021-01-01T10:10:00.000Z");
      const existingEstablishmentAddress = "7 rue guillaume tell, 75017 Paris";
      const insertExistingEstablishmentWithDataSource = async (
        dataSource: DataSource,
      ) => {
        await insertEstablishment({
          siret: existingSiret,
          isActive: true,
          position: { lat: 88, lon: 3 },
          address: existingEstablishmentAddress,
          naf: "A1111",
          numberEmployeesRange: 1,
          updatedAt: existingUpdateAt,
          dataSource,
        });
      };
      describe("Existing establishment's data source is `form` and new data source is `api_labonneboite`", () => {
        it("adds a new offer with source `api_labonneboite` and contact_uid null (even if an offer with same rome and siret already exists)", async () => {
          // Prepare : this establishment has once been inserted with an offer through source `form`
          const offerRome = "A1111";
          const existingSiret = "88888888888888";
          const updatedAt = new Date("2021-01-01T10:10:00.000Z");
          await insertExistingEstablishmentWithDataSource("form");
          await insertImmersionOffer({
            uuid: testUid1,
            rome: offerRome,
            siret: existingSiret,
            dataSource: "form",
            voluntaryToImmersion: true,
          });

          // Act : An aggregate with same siret and rome offer needs to be inserted from source `api_labonneboite`
          await pgImmersionOfferRepository.insertEstablishmentAggregates([
            new EstablishmentAggregateBuilder()
              .withEstablishment(
                new EstablishmentEntityV2Builder()
                  .withSiret(existingSiret)
                  .withDataSource("api_labonneboite")
                  .withAddress("LBB address should be ignored")
                  .build(),
              )
              .build(),
          ]);
          // Assert : establishment is not updated, but
          /// Update date and address should not have changed
          const actualEstablishmentRowInDB = await getEstablishmentsRowsBySiret(
            existingSiret,
          );
          expect(actualEstablishmentRowInDB?.update_date).toEqual(updatedAt);
          expect(actualEstablishmentRowInDB?.address).toEqual(
            existingEstablishmentAddress,
          );

          /// Offer should have been added
          const actualImmersionOfferRows = await getAllImmersionOfferRows();
          expect(actualImmersionOfferRows).toHaveLength(2);
          expect(actualImmersionOfferRows[0]?.data_source).toEqual("form");
          expect(actualImmersionOfferRows[1]?.data_source).toEqual(
            "api_labonneboite",
          );

          // /// Contact should not have been added
          // expect(await getAllImmersionContactsRows()).toHaveLength(0); // TODO : fix me ?
        });
      });
      describe("Existing establishment's data source is `api_labonneboite` and new data source is also `api_labonneboite`", () => {
        it("updates the data in the establishments table", async () => {
          // Prepare
          await insertExistingEstablishmentWithDataSource("api_labonneboite");

          // Act
          const newAddress = "New establishment address, 44000 Nantes";
          await pgImmersionOfferRepository.insertEstablishmentAggregates([
            new EstablishmentAggregateBuilder()
              .withEstablishment(
                new EstablishmentEntityV2Builder()
                  .withSiret(existingSiret)
                  .withAddress(newAddress)
                  .withDataSource("api_labonneboite")
                  .build(),
              )
              .withImmersionOffers([
                new ImmersionOfferEntityV2Builder().build(),
              ])
              .build(),
          ]);
          // Assert
          /// Address (amongst other fields) should have been updated
          expect(
            (await getEstablishmentsRowsBySiret(existingSiret))?.address,
          ).toEqual(newAddress);
          /// Offer should have been added
          expect(await getAllImmersionOfferRows()).toHaveLength(1);
        });
      });
      describe("Existing establishment's data source is `api_labonneboite` and new data source is `form`", () => {
        it("updates the data in the establishments table (dataSource, ...), contact table and adds the offers (no matter if same rome, siret already has offer) .", async () => {
          // Prepare : an establishment with offer rome A1111 and no contact has previously been inserted by source La Bonne Boite
          const offerRome = "A1111";
          await insertExistingEstablishmentWithDataSource("api_labonneboite");
          await insertImmersionOffer({
            uuid: "22222222-a2a5-430a-b558-ed3e2f03512d",
            rome: offerRome,
            siret: existingSiret,
            dataSource: "api_labonneboite",
            voluntaryToImmersion: false,
            contactUid: undefined,
          });
          // Act : an establishment aggregate with this siret is inserted by source Form
          await pgImmersionOfferRepository.insertEstablishmentAggregates([
            new EstablishmentAggregateBuilder()
              .withEstablishment(
                new EstablishmentEntityV2Builder()
                  .withSiret(existingSiret)
                  .withDataSource("form")
                  .build(),
              )
              .withImmersionOffers([
                new ImmersionOfferEntityV2Builder().build(),
              ])
              .build(),
          ]);
          // Assert
          /// Data Source (amongst other fields) should have been updated
          expect(
            (await getEstablishmentsRowsBySiret(existingSiret))?.data_source,
          ).toEqual("form");
          /// Offer should have been added
          const allImmersionOffeRows = await getAllImmersionOfferRows();
          expect(allImmersionOffeRows).toHaveLength(2);
          /// Offer added from source La Bonne Boite remains unchanged (eg. no contact uuid associated)
          expect(
            allImmersionOffeRows[0].contact_in_establishment_uuid,
          ).toBeNull();
        });
      });
    });
  });

  type PgEstablishmentRow = {
    siret: string;
    name: string;
    address: string;
    number_employees: number;
    naf: string;
    contact_mode?: PgContactMethod;
    data_source: string;
    gps: string;
    update_date?: Date;
    is_active: boolean;
  };

  const getAllEstablishmentsRows = (): Promise<PgEstablishmentRow[]> =>
    client.query("SELECT * FROM establishments").then((res) => res.rows);

  const getEstablishmentsRowsBySiret = (
    siret: string,
  ): Promise<PgEstablishmentRow | undefined> =>
    client
      .query("SELECT * FROM establishments WHERE siret=$1", [siret])
      .then((res) => res.rows[0]);

  type PgImmersionContactRow = {
    uuid: string;
    name: string;
    firstname: string;
    role: string;
    email: string;
    phone: string;
    siret_establishment: string;
  };

  const getAllImmersionContactsRows = (): Promise<PgImmersionContactRow[]> =>
    client.query("SELECT * FROM immersion_contacts").then((res) => res.rows);

  type PgImmersionOfferRow = {
    uuid: string;
    rome: string;
    naf_division: string;
    siret: string;
    naf: string;
    name: string;
    voluntary_to_immersion: boolean;
    data_source: PgDataSource;
    contact_in_establishment_uuid: string;
    score: number;
    gps: string;
  };

  const getAllImmersionOfferRows = (): Promise<PgImmersionOfferRow[]> =>
    client.query("SELECT * FROM immersion_offers").then((res) => res.rows);

  type PgEstablishmentRowWithGeo = PgEstablishmentRow & {
    longitude: number;
    latitude: number;
  };

  const retrieveEstablishmentWithSiret = async (
    siret: string,
  ): Promise<PgEstablishmentRowWithGeo | undefined> => {
    const pgResult = await client.query(
      `SELECT *, ST_X(gps::geometry) AS longitude, ST_Y(gps::geometry) AS latitude 
       FROM establishments WHERE siret='${siret}' LIMIT 1;`,
    );
    return pgResult.rows[0] ?? (pgResult.rows[0] as PgEstablishmentRowWithGeo);
  };
  const insertEstablishment = async (props: {
    siret: string;
    updatedAt?: Date;
    isActive: boolean;
    naf?: string;
    numberEmployeesRange?: number;
    address?: string;
    position: LatLonDto;
    dataSource?: DataSource;
  }) => {
    const insertQuery = `INSERT INTO establishments (
      siret, name, address, number_employees, naf, contact_mode, data_source, update_date, is_active, gps
    ) VALUES ($1, '', $2, $3, $4, null,  $5, $6, $7, ST_GeographyFromText('POINT(${props.position.lon} ${props.position.lat})'))`;
    await client.query(insertQuery, [
      props.siret,
      props.address ?? "7 rue guillaume tell, 75017 Paris",
      props.numberEmployeesRange ?? null,
      props.naf ?? "8622B",
      props.dataSource ?? "api_labonneboite",
      props.updatedAt ? `'${props.updatedAt.toISOString()}'` : null,
      props.isActive,
    ]);
  };
  const insertImmersionOffer = async (props: {
    uuid: string;
    rome: string;
    siret: string;
    contactUid?: string;
    dataSource?: DataSource;
    voluntaryToImmersion?: boolean;
    position?: LatLonDto;
  }) => {
    const position = props.position ?? { lon: 3, lat: 99 };
    const insertQuery = `INSERT INTO immersion_offers (
      uuid, rome, siret, data_source, voluntary_to_immersion, contact_in_establishment_uuid, naf, naf_division, name, score, gps
    ) VALUES
     ($1, $2, $3, $4,  $5, $6, '8520A', '85', '', 4,  ST_GeographyFromText('POINT(${
       position.lon ?? 3
     } ${position.lat ?? 44})'))`;
    await client.query(insertQuery, [
      props.uuid,
      props.rome,
      props.siret,
      props.dataSource ?? "api_labonneboite",
      props.voluntaryToImmersion ?? false,
      props.contactUid ?? null,
    ]);
  };
  const insertImmersionContact = async (props: {
    uuid: string;
    name?: string;
    siret_establishment: string;
  }) => {
    const insertQuery = `INSERT INTO immersion_contacts (
      uuid, name, siret_establishment, firstname, role, email, phone
    ) VALUES
     ($1, $2, $3, '', '', '', '')`;
    await client.query(insertQuery, [
      props.uuid,
      props.name ?? "Jacques",
      props.siret_establishment,
    ]);
  };
});
