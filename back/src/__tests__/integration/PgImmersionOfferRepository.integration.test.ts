import { Pool, PoolClient } from "pg";
import { PgImmersionOfferRepository } from "../../adapters/secondary/pg/PgImmersionOfferRepository";
import { EstablishmentEntity } from "../../domain/immersionOffer/entities/EstablishmentEntity";
import {
  ImmersionEstablishmentContact,
  ImmersionOfferEntity,
} from "../../domain/immersionOffer/entities/ImmersionOfferEntity";
import {
  SearchContact,
  SearchImmersionResultDto,
} from "../../shared/SearchImmersionDto";
import { ContactEntityV2Builder } from "../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityBuilder } from "../../_testBuilders/EstablishmentEntityBuilder";
import { EstablishmentEntityV2Builder } from "../../_testBuilders/EstablishmentEntityV2Builder";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { ImmersionOfferEntityV2Builder } from "../../_testBuilders/ImmersionOfferEntityV2Builder";

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

  describe("Insert immersions and retrieves them back", () => {
    test("Using V2 interface", async () => {
      await pgImmersionOfferRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment({
            address: "fake address establishment 1",
            name: "Company from la bonne boite for search",
            voluntaryToImmersion: false,
            siret: "78000403200029",
            dataSource: "api_labonneboite",
            numberEmployeesRange: 1,
            position: { lat: 49, lon: 6 },
            naf: "8539A",
            contactMethod: "EMAIL",
          })
          .withImmersionOffers([
            {
              id: "13df03a5-a2a5-430a-b558-111111111122",
              rome: "M1907",
              score: 4.5,
            },
          ])
          .build(),
        new EstablishmentAggregateBuilder()
          .withEstablishment({
            address: "fake address establishment 2",
            name: "Company from api sirene for search",
            voluntaryToImmersion: false,
            siret: "78000403200040",
            dataSource: "api_sirene",
            numberEmployeesRange: 1,
            position: { lat: 49.05, lon: 6.05 },
            naf: "8539A",
            contactMethod: "PHONE",
          })
          .withContacts([
            {
              id: "93144fe8-56a7-4807-8990-726badc6332b",
              lastName: "Doe",
              firstName: "John",
              email: "joe@mail.com",
              job: "super job",
              phone: "0640404040",
            },
          ])
          .withImmersionOffers([
            {
              id: "13df03a5-a2a5-430a-b558-333333333344",
              rome: "M1907",
              score: 4.5,
            },
          ])
          .build(),
      ]);

      await checkDatabaseContents();
    });

    test("Using V1 (deprecated) interface", async () => {
      await pgImmersionOfferRepository.insertEstablishments([
        new EstablishmentEntity({
          id: "13df03a5-a2a5-430a-b558-111111111111",
          address: "fake address establishment 1",
          name: "Fake Establishment from la plate forme de l'inclusion",
          voluntaryToImmersion: false,
          score: 5,
          romes: ["M1907"],
          siret: "78000403200029",
          dataSource: "api_laplateformedelinclusion",
          numberEmployeesRange: 1,
          position: { lat: 10, lon: 15 },
          naf: "8539A",
          contactMode: "EMAIL",
        }),
      ]);
      await pgImmersionOfferRepository.insertEstablishments([
        new EstablishmentEntity({
          id: "13df03a5-a2a5-430a-b558-222222222222",
          address: "fake address establishment 2",
          name: "Fake Establishment from la plate forme de l'inclusion",
          voluntaryToImmersion: false,
          score: 5,
          romes: ["M1907"],
          siret: "78000403200040",
          dataSource: "api_laplateformedelinclusion",
          numberEmployeesRange: 1,
          position: { lat: 11, lon: 16 },
          naf: "8539A",
          contactMode: "PHONE",
        }),
      ]);

      const contactInEstablishment: ImmersionEstablishmentContact = {
        id: "93144fe8-56a7-4807-8990-726badc6332b",
        lastName: "Doe",
        firstName: "John",
        email: "joe@mail.com",
        role: "super job",
        siretEstablishment: "78000403200040",
        phone: "0640404040",
      };

      await pgImmersionOfferRepository.insertEstablishmentContact(
        contactInEstablishment,
      );

      await pgImmersionOfferRepository.insertImmersions([
        new ImmersionOfferEntity({
          id: "13df03a5-a2a5-430a-b558-111111111122",
          rome: "M1907",
          naf: "8539A",
          siret: "78000403200029",
          name: "Company from la bonne boite for search",
          voluntaryToImmersion: false,
          data_source: "api_labonneboite",
          contactInEstablishment: undefined,
          score: 4.5,
          position: { lat: 49, lon: 6 },
        }),
      ]);

      await pgImmersionOfferRepository.insertImmersions([
        new ImmersionOfferEntity({
          id: "13df03a5-a2a5-430a-b558-333333333344",
          rome: "M1907",
          naf: "8539A",
          siret: "78000403200040",
          name: "Company from api sirene for search",
          voluntaryToImmersion: false,
          data_source: "api_sirene",
          contactInEstablishment,
          score: 4.5,
          position: { lat: 49.05, lon: 6.05 },
        }),
      ]);

      await checkDatabaseContents();
    });

    const checkDatabaseContents = async () => {
      const searchResult = await pgImmersionOfferRepository.getFromSearch({
        rome: "M1907",
        distance_km: 30,
        lat: 49.1,
        lon: 6.1,
        nafDivision: "85",
      });
      expect(searchResult).toHaveLength(2);
      const expectedResult1: SearchImmersionResultDto = {
        id: "13df03a5-a2a5-430a-b558-333333333344",
        address: "fake address establishment 2",
        name: "Company from api sirene for search",
        naf: "8539A",
        contactMode: "PHONE",
        location: { lat: 49.05, lon: 6.05 },
        voluntaryToImmersion: false,
        rome: "M1907",
        siret: "78000403200040",
        distance_m: 6653,
        city: "xxxx",
        nafLabel: "xxxx",
        romeLabel: "xxxx",
      };
      const expectedResult2: SearchImmersionResultDto = {
        id: "13df03a5-a2a5-430a-b558-111111111122",
        address: "fake address establishment 1",
        name: "Company from la bonne boite for search",
        voluntaryToImmersion: false,
        rome: "M1907",
        siret: "78000403200029",
        location: { lat: 49, lon: 6 },
        distance_m: 13308,
        naf: "8539A",
        contactMode: "EMAIL",
        city: "xxxx",
        nafLabel: "xxxx",
        romeLabel: "xxxx",
      };

      expect(searchResult).toMatchObject([expectedResult1, expectedResult2]);

      const searchResuts = await pgImmersionOfferRepository.getFromSearch({
        rome: "M1907",
        distance_km: 30,
        lat: 49.1,
        lon: 6.1,
        nafDivision: "85",
        siret: "78000403200040",
      });
      expect(searchResuts).toHaveLength(1);
      expect(searchResuts[0].siret).toBe("78000403200040");
      expect(searchResuts[0].contactDetails).toBeUndefined();

      const searchResultsWithDetails =
        await pgImmersionOfferRepository.getFromSearch(
          {
            rome: "M1907",
            distance_km: 30,
            lat: 49.1,
            lon: 6.1,
            nafDivision: "85",
            siret: "78000403200040",
          },
          true,
        );
      expect(searchResultsWithDetails).toHaveLength(1);
      expect(searchResultsWithDetails[0].siret).toBe("78000403200040");

      const expectedContactDetails: SearchContact = {
        id: "93144fe8-56a7-4807-8990-726badc6332b",
        lastName: "Doe",
        firstName: "John",
        email: "joe@mail.com",
        role: "super job",
        phone: "0640404040",
      };
      expect(searchResultsWithDetails[0].contactDetails).toEqual(
        expectedContactDetails,
      );
    };
  });

  describe("Insert immersion does not crash if empty array is provided", () => {
    test("Using V2 interface", async () => {
      await pgImmersionOfferRepository.insertEstablishmentAggregates([]);
    });

    test("Using V1 (deprecated) interface", async () => {
      await pgImmersionOfferRepository.insertImmersions([]);
    });
  });

  describe("getEstablishmentByImmersionOfferId", () => {
    test("fetches existing establishment", async () => {
      const immersionOfferId = "fdc2c62d-103d-4474-a546-8bf3fbebe83f";
      const storedEstablishment = new EstablishmentEntityV2Builder().build();
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
      const establishment =
        await pgImmersionOfferRepository.getEstablishmentByImmersionOfferId(
          immersionOfferId,
        );
      expect(establishment).toEqual(storedEstablishment);
    });

    test("returns undefined for missing establishment", async () => {
      const missingOfferId = "82e37a80-eb0b-4de6-a531-68d30af7887a";
      expect(
        await pgImmersionOfferRepository.getEstablishmentByImmersionOfferId(
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
        .build();
      await pgImmersionOfferRepository.insertEstablishmentAggregates([
        new EstablishmentAggregateBuilder()
          .withEstablishment(new EstablishmentEntityV2Builder().build())
          .withImmersionOffers([storedImmersionOffer])
          .build(),
      ]);
      const immersionOffer =
        await pgImmersionOfferRepository.getImmersionOfferById(
          immersionOfferId,
        );
      expect(immersionOffer).toEqual(storedImmersionOffer);
    });

    test("returns undefined for missing offer", async () => {
      const missingOfferId = "82e37a80-eb0b-4de6-a531-68d30af7887a";
      expect(
        await pgImmersionOfferRepository.getImmersionOfferById(missingOfferId),
      ).toBeUndefined();
    });
  });

  test("Insert establishments & immersions and retrieves them back", async () => {
    await pgImmersionOfferRepository.insertEstablishments([
      new EstablishmentEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f035443",
        address: "fake address",
        name: "Fake Establishment from la plate forme de l'inclusion",
        score: 5,
        voluntaryToImmersion: false,
        romes: ["M1607"],
        siret: "78000403200019",
        dataSource: "api_labonneboite",
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
        score: 5,
        voluntaryToImmersion: false,
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
        voluntaryToImmersion: false,
        score: 5,
        romes: ["M1607"],
        siret: "78000403200019",
        dataSource: "api_labonneboite",
        numberEmployeesRange: 1,
        position: { lat: 10.0, lon: 10.3 },
        naf: "8539A",
      }),
    ]);

    const establishments = await getEstablishmentsFromSiret("78000403200019");
    expect(establishments).toHaveLength(1);
    expect(establishments[0].name).toBe("Fake Establishment from form");

    const contactInEstablishment: ImmersionEstablishmentContact = {
      id: "93144fe8-56a7-4807-8990-726badc6332b",
      lastName: "Doe",
      firstName: "John",
      email: "joe@mail.com",
      role: "super job",
      siretEstablishment: "78000403200019",
      phone: "0640295453",
    };

    await pgImmersionOfferRepository.insertEstablishmentContact(
      contactInEstablishment,
    );

    await pgImmersionOfferRepository.insertImmersions([
      new ImmersionOfferEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f03536d",
        rome: "M1607",
        naf: "8539A",
        siret: "78000403200019",
        name: "Company from form",
        voluntaryToImmersion: false,
        data_source: "form",
        contactInEstablishment,
        score: 4.5,
        position: { lat: 48.8666, lon: 2.3333 },
      }),
      new ImmersionOfferEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f03536d",
        rome: "M1607",
        naf: "8539A",
        siret: "78000403200019",
        name: "Company from la bonne boite",
        voluntaryToImmersion: false,
        data_source: "api_labonneboite",
        contactInEstablishment: undefined,
        score: 4.5,
        position: { lat: 46.8666, lon: 3.3333 },
      }),
    ]);
  });

  test("Insert establishment contact", async () => {
    await pgImmersionOfferRepository.insertEstablishments([
      new EstablishmentEntity({
        id: "13df03a5-a2a5-430a-b558-ed3e2f035443",
        address: "fake address",
        name: "Fake Establishment from form",
        score: 5,
        voluntaryToImmersion: false,
        romes: ["M1607"],
        siret: "11112222333344",
        dataSource: "form",
        numberEmployeesRange: 1,
        position: { lat: 10.1, lon: 10.2 },
        naf: "8539A",
      }),
    ]);

    const establishmentContact: ImmersionEstablishmentContact = {
      id: "84007f00-f1fb-4458-a41f-492143ffc8df",
      email: "some@mail.com",
      firstName: "Bob",
      lastName: "MyName",
      role: "Chauffeur",
      siretEstablishment: "11112222333344",
      phone: "0640295453",
    };

    await pgImmersionOfferRepository.insertEstablishmentContact(
      establishmentContact,
    );

    const { rows } = await client.query("SELECT * FROM immersion_contacts");
    expect(rows).toHaveLength(1);
    expect(rows).toEqual([
      {
        uuid: "84007f00-f1fb-4458-a41f-492143ffc8df",
        name: "MyName",
        firstname: "Bob",
        email: "some@mail.com",
        role: "Chauffeur",
        siret_establishment: "11112222333344",
        phone: "0640295453",
      },
    ]);
  });

  const getEstablishmentsFromSiret = (siret: string) =>
    client
      .query("SELECT * FROM establishments WHERE siret=$1", [siret])
      .then((res) => res.rows);
});
