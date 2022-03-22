import { createInMemoryUow } from "../../../adapters/primary/config";
import { InMemoryImmersionOfferRepository } from "../../../adapters/secondary/immersionOffer/InMemoryImmersionOfferRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { RetrieveFormEstablishmentFromAggregates } from "../../../domain/immersionOffer/useCases/RetrieveFormEstablishmentFromAggregates";
import { FormEstablishmentDto } from "../../../shared/FormEstablishmentDto";
import { EditFormEstablishmentPayload } from "../../../shared/tokens/MagicLinkPayload";
import { ContactEntityV2Builder } from "../../../_testBuilders/ContactEntityV2Builder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

const prepareUseCase = () => {
  const immersionOfferRepo = new InMemoryImmersionOfferRepository();
  const uowPerformer = new InMemoryUowPerformer({
    ...createInMemoryUow(),
    immersionOfferRepo,
  });
  const useCase = new RetrieveFormEstablishmentFromAggregates(uowPerformer);
  return { useCase, immersionOfferRepo };
};

describe("Retrieve Form Establishment From Aggregate when payload is valid", () => {
  const siret = "12345678901234";
  const jwtPayload: EditFormEstablishmentPayload = {
    siret,
    expiredAt: 2,
    issuedAt: 1,
  };
  it("throws an error if there is no establishment with this siret", async () => {
    const { useCase } = prepareUseCase();
    await expectPromiseToFailWithError(
      useCase.execute(void 0, jwtPayload),
      new Error(
        "No establishment found with siret 12345678901234 and form data source. ",
      ),
    );
  });
  it("throws an error if there is no establishment from form with this siret", async () => {
    // Prepare : there is an establishment with the siret, but from LBB
    const { useCase, immersionOfferRepo } = prepareUseCase();
    await immersionOfferRepo.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(
          new EstablishmentEntityV2Builder()
            .withSiret(siret)
            .withDataSource("api_labonneboite")
            .build(),
        )
        .build(),
    ]);
    // Act and assert
    await expectPromiseToFailWithError(
      useCase.execute(void 0, jwtPayload),
      new Error(
        "No establishment found with siret 12345678901234 and form data source. ",
      ),
    );
  });
  it("returns a reconstructed form if establishment with siret exists with dataSource=form", async () => {
    const { useCase, immersionOfferRepo } = prepareUseCase();
    const establishment = new EstablishmentEntityV2Builder()
      .withSiret(siret)
      .withDataSource("form")
      .build();
    const contact = new ContactEntityV2Builder().build();
    const offer = new ImmersionOfferEntityV2Builder()
      .withRomeCode("A1101")
      .withRomeAppellation(11987)
      .build();

    await immersionOfferRepo.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContact(contact)
        .withImmersionOffers([offer])
        .build(),
    ]);
    // Act
    // TODO : find a way to give the JWT Payload

    const retrievedForm = await useCase.execute(void 0, jwtPayload);
    // Assert
    expect(retrievedForm).toBeDefined();
    const expectedForm: FormEstablishmentDto = {
      siret,
      source: "immersion-facile",
      businessName: establishment.name,
      businessNameCustomized: establishment.customizedName,
      businessAddress: establishment.address,
      isEngagedEnterprise: establishment.isCommited,
      naf: establishment.nafDto,
      professions: [
        {
          description: "",
          romeCodeMetier: "A1101",
          romeCodeAppellation: "11987",
        },
      ],
      businessContacts: [
        {
          email: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
          job: contact.job,
          phone: contact.phone,
        },
      ],
      preferredContactMethods: [contact.contactMethod],
    };
  });
});
