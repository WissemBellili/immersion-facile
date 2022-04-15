import { AllowListEmailFilter } from "../../../adapters/secondary/core/EmailFilterImplementations";
import {
  InMemoryEstablishmentAggregateRepository,
  TEST_ROME_LABEL,
} from "../../../adapters/secondary/immersionOffer/InMemoryEstablishmentAggregateRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { EmailFilter } from "../../../domain/core/ports/EmailFilter";
import { NotifyContactRequest } from "../../../domain/immersionOffer/useCases/notifications/NotifyContactRequest";
import { ContactEstablishmentRequestDto } from "../../../shared/contactEstablishment";
import { ContactEntityV2Builder } from "../../../_testBuilders/ContactEntityV2Builder";
import {
  expectContactByEmailRequest,
  expectContactByPhoneInstructions,
  expectContactInPersonInstructions,
} from "../../../_testBuilders/emailAssertions";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { EstablishmentEntityV2Builder } from "../../../_testBuilders/EstablishmentEntityV2Builder";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";

const immersionOffer = new ImmersionOfferEntityV2Builder().build();

const siret = "11112222333344";
const contactId = "theContactId";

const payload: ContactEstablishmentRequestDto = {
  siret,
  romeLabel: TEST_ROME_LABEL,
  contactMode: "PHONE",
  potentialBeneficiaryFirstName: "potential_beneficiary_name",
  potentialBeneficiaryLastName: "potential_beneficiary_last_name",
  potentialBeneficiaryEmail: "potential_beneficiary@email.fr",
};

const allowedContactEmail = "toto@gmail.com";
const allowedCopyEmail = "copy@gmail.com";

describe("NotifyContactRequest", () => {
  let establishmentAggregateRepository: InMemoryEstablishmentAggregateRepository;
  let emailGw: InMemoryEmailGateway;
  let emailFilter: EmailFilter;

  beforeEach(() => {
    establishmentAggregateRepository =
      new InMemoryEstablishmentAggregateRepository();
    emailGw = new InMemoryEmailGateway();
    emailFilter = new AllowListEmailFilter([
      allowedContactEmail,
      payload.potentialBeneficiaryEmail,
    ]);
  });

  const createUseCase = () =>
    new NotifyContactRequest(
      establishmentAggregateRepository,
      emailFilter,
      emailGw,
    );

  it("Sends ContactByEmailRequest email to establishment", async () => {
    const validEmailPayload: ContactEstablishmentRequestDto = {
      ...payload,
      contactMode: "EMAIL",
      message: "message_to_send",
    };
    const establishment = new EstablishmentEntityV2Builder()
      .withSiret(siret)
      .build();
    const contact = new ContactEntityV2Builder()
      .withId(contactId)
      .withContactMethod("EMAIL")
      .withEmail(allowedContactEmail)
      .withCopyEmails([allowedCopyEmail])
      .build();
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContact(contact)
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    await createUseCase().execute(validEmailPayload);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectContactByEmailRequest(
      sentEmails[0],
      [contact.email],
      {
        ...immersionOffer,
        romeLabel: TEST_ROME_LABEL,
      },
      establishment,
      contact,
      validEmailPayload,
      contact.copyEmails,
    );
  });

  it("Sends ContactByPhoneRequest email to potential beneficiary", async () => {
    const validPhonePayload: ContactEstablishmentRequestDto = {
      ...payload,
      contactMode: "PHONE",
    };
    const establishment = new EstablishmentEntityV2Builder()
      .withSiret(siret)
      .build();
    const contact = new ContactEntityV2Builder()
      .withId(contactId)
      .withContactMethod("PHONE")
      .build();
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContact(contact)
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    await createUseCase().execute(validPhonePayload);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectContactByPhoneInstructions(
      sentEmails[0],
      [payload.potentialBeneficiaryEmail],
      establishment,
      contact,
      validPhonePayload,
    );
  });

  it("Sends ContactInPersonRequest email to potential beneficiary", async () => {
    const validInPersonPayload: ContactEstablishmentRequestDto = {
      ...payload,
      contactMode: "IN_PERSON",
    };
    const establishment = new EstablishmentEntityV2Builder()
      .withSiret(siret)
      .build();
    const contact = new ContactEntityV2Builder()
      .withId(contactId)
      .withContactMethod("IN_PERSON")
      .build();
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContact(contact)
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    await createUseCase().execute(validInPersonPayload);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectContactInPersonInstructions(
      sentEmails[0],
      [payload.potentialBeneficiaryEmail],
      establishment,
      contact,
      validInPersonPayload,
    );
  });

  it("Sends no email when allowList is enforced and empty", async () => {
    emailFilter = new AllowListEmailFilter([]);

    const validInPersonPayload: ContactEstablishmentRequestDto = {
      ...payload,
      contactMode: "IN_PERSON",
    };
    const establishment = new EstablishmentEntityV2Builder()
      .withSiret(siret)
      .build();
    await establishmentAggregateRepository.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishment(establishment)
        .withContact(
          new ContactEntityV2Builder()
            .withId(contactId)
            .withContactMethod("IN_PERSON")
            .build(),
        )
        .withImmersionOffers([immersionOffer])
        .build(),
    ]);

    await createUseCase().execute(validInPersonPayload);

    expect(emailGw.getSentEmails()).toHaveLength(0);
  });
});
