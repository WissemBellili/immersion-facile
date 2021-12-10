import { InMemorySirenGateway } from "../../adapters/secondary/InMemorySirenGateway";
import { GetSiret } from "./../../domain/sirene/useCases/GetSiret";
import { parseISO } from "date-fns";
import { CustomClock } from "../../adapters/secondary/core/ClockImplementations";
import { AlwaysAllowEmailFilter } from "../../adapters/secondary/core/EmailFilterImplementations";
import { BasicEventCrawler } from "../../adapters/secondary/core/EventCrawlerImplementations";
import { InMemoryEventBus } from "../../adapters/secondary/core/InMemoryEventBus";
import { InMemoryOutboxRepository } from "../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryAgencyRepository } from "../../adapters/secondary/InMemoryAgencyRepository";
import {
  InMemoryEmailGateway,
  TemplatedEmail,
} from "../../adapters/secondary/InMemoryEmailGateway";
import { InMemoryImmersionApplicationRepository } from "../../adapters/secondary/InMemoryImmersionApplicationRepository";
import {
  CreateNewEvent,
  EventBus,
  makeCreateNewEvent,
} from "../../domain/core/eventBus/EventBus";
import { EmailFilter } from "../../domain/core/ports/EmailFilter";
import { OutboxRepository } from "../../domain/core/ports/OutboxRepository";
import { AgencyConfig } from "../../domain/immersionApplication/ports/AgencyRepository";
import { AddImmersionApplication } from "../../domain/immersionApplication/useCases/AddImmersionApplication";
import { ConfirmToBeneficiaryThatApplicationCorrectlySubmitted } from "../../domain/immersionApplication/useCases/notifications/ConfirmToBeneficiaryThatApplicationCorrectlySubmitted";
import { ConfirmToMentorThatApplicationCorrectlySubmitted } from "../../domain/immersionApplication/useCases/notifications/ConfirmToMentorThatApplicationCorrectlySubmitted";
import { NotifyAllActorsOfFinalApplicationValidation } from "../../domain/immersionApplication/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../domain/immersionApplication/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { ValidateImmersionApplication } from "../../domain/immersionApplication/useCases/ValidateImmersionApplication";
import { ImmersionApplicationDto } from "../../shared/ImmersionApplicationDto";
import { AgencyConfigBuilder } from "../../_testBuilders/AgencyConfigBuilder";
import {
  expectEmailAdminNotificationMatchingImmersionApplication,
  expectEmailBeneficiaryConfirmationMatchingImmersionApplication,
  expectEmailFinalValidationConfirmationMatchingImmersionApplication,
  expectEmailMentorConfirmationMatchingImmersionApplication,
} from "../../_testBuilders/emailAssertions";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../_testBuilders/test.helpers";

const adminEmail = "admin@email.fr";

describe("Add immersionApplication Notifications, then checks the mails are sent (trigerred by events)", () => {
  let addDemandeImmersion: AddImmersionApplication;
  let validateDemandeImmersion: ValidateImmersionApplication;
  let applicationRepository: InMemoryImmersionApplicationRepository;
  let sireneRepository: InMemorySirenGateway;
  let outboxRepository: OutboxRepository;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;
  let createNewEvent: CreateNewEvent;
  let emailGw: InMemoryEmailGateway;
  let confirmToBeneficiary: ConfirmToBeneficiaryThatApplicationCorrectlySubmitted;
  let confirmToMentor: ConfirmToMentorThatApplicationCorrectlySubmitted;
  let notifyToTeam: NotifyToTeamApplicationSubmittedByBeneficiary;
  let validDemandeImmersion: ImmersionApplicationDto;
  let eventBus: EventBus;
  let eventCrawler: BasicEventCrawler;
  let emailFilter: EmailFilter;
  let sentEmails: TemplatedEmail[];
  let agencyConfig: AgencyConfig;
  let getSiret: GetSiret;

  beforeEach(() => {
    applicationRepository = new InMemoryImmersionApplicationRepository();
    outboxRepository = new InMemoryOutboxRepository();
    clock = new CustomClock();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });
    emailGw = new InMemoryEmailGateway();
    validDemandeImmersion = new ImmersionApplicationDtoBuilder().build();
    eventBus = new InMemoryEventBus();
    eventCrawler = new BasicEventCrawler(eventBus, outboxRepository);
    sireneRepository = new InMemorySirenGateway();
    getSiret = new GetSiret(sireneRepository);

    addDemandeImmersion = new AddImmersionApplication(
      applicationRepository,
      createNewEvent,
      outboxRepository,
      getSiret,
    );
    validateDemandeImmersion = new ValidateImmersionApplication(
      applicationRepository,
      createNewEvent,
      outboxRepository,
    );
    emailFilter = new AlwaysAllowEmailFilter();

    agencyConfig = AgencyConfigBuilder.create(validDemandeImmersion.agencyId)
      .withName("TEST-name")
      .withAdminEmails([adminEmail])
      .withQuestionnaireUrl("TEST-questionnaireUrl")
      .withSignature("TEST-signature")
      .build();
    const agencyRepository = new InMemoryAgencyRepository([agencyConfig]);

    confirmToBeneficiary =
      new ConfirmToBeneficiaryThatApplicationCorrectlySubmitted(
        emailFilter,
        emailGw,
      );

    confirmToMentor = new ConfirmToMentorThatApplicationCorrectlySubmitted(
      emailFilter,
      emailGw,
    );

    notifyToTeam = new NotifyToTeamApplicationSubmittedByBeneficiary(
      emailGw,
      agencyRepository,
      fakeGenerateMagicLinkUrlFn,
    );
  });

  // Creates a DemandeImmersion, check it is saved properly and that event had been triggered (thanks to subscription),
  // then check mails have been sent trough the inmemory mail gateway
  test("saves valid applications in the repository", async () => {
    addDemandeImmersion = new AddImmersionApplication(
      applicationRepository,
      createNewEvent,
      outboxRepository,
      getSiret,
    );

    eventBus.subscribe("ImmersionApplicationSubmittedByBeneficiary", (event) =>
      confirmToBeneficiary.execute(event.payload),
    );

    eventBus.subscribe("ImmersionApplicationSubmittedByBeneficiary", (event) =>
      confirmToMentor.execute(event.payload),
    );

    eventBus.subscribe("ImmersionApplicationSubmittedByBeneficiary", (event) =>
      notifyToTeam.execute(event.payload),
    );

    // We expect this execute to trigger an event on ImmersionApplicationSubmittedByBeneficiary topic
    const result = await addDemandeImmersion.execute(validDemandeImmersion);
    expect(result).toEqual({ id: validDemandeImmersion.id });

    // the following line triggers the eventCrawler (in prod it would be triggered every 10sec or so)
    await eventCrawler.processEvents();

    sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(3);

    expectEmailBeneficiaryConfirmationMatchingImmersionApplication(
      sentEmails[0],
      validDemandeImmersion,
    );

    expectEmailMentorConfirmationMatchingImmersionApplication(
      sentEmails[1],
      validDemandeImmersion,
    );

    expectEmailAdminNotificationMatchingImmersionApplication(sentEmails[2], {
      recipients: [adminEmail],
      immersionApplication: {
        ...validDemandeImmersion,
        dateStart: parseISO(validDemandeImmersion.dateStart).toLocaleDateString(
          "fr",
        ),
        dateEnd: parseISO(validDemandeImmersion.dateEnd).toLocaleDateString(
          "fr",
        ),
      },
      magicLink: fakeGenerateMagicLinkUrlFn(
        validDemandeImmersion.id,
        "admin",
        "",
      ),
      agencyConfig,
    });
  });

  test("When an application receives the final validation, all actors are sent confirmation emails", async () => {
    const demandeImmersionInReview = new ImmersionApplicationDtoBuilder()
      .withStatus("IN_REVIEW")
      .build();

    const result = await addDemandeImmersion.execute(demandeImmersionInReview);

    const counsellorEmail = "counsellor@email.fr";
    agencyConfig = new AgencyConfigBuilder(agencyConfig)
      .withCounsellorEmails([counsellorEmail])
      .build();

    const notifyAllActors = new NotifyAllActorsOfFinalApplicationValidation(
      emailFilter,
      emailGw,
      new InMemoryAgencyRepository([agencyConfig]),
    );

    eventBus.subscribe("FinalImmersionApplicationValidationByAdmin", (event) =>
      notifyAllActors.execute(event.payload),
    );

    // We expect this execute to trigger an event on ImmersionApplicationSubmittedByBeneficiary topic
    const resultValidate = await validateDemandeImmersion.execute(result.id);
    expect(resultValidate).toEqual({ id: demandeImmersionInReview.id });

    // the following line triggers the eventCrawler (in prod it would be triggered every 10sec or so)
    await eventCrawler.processEvents();

    sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    await notifyAllActors.execute(demandeImmersionInReview);

    // Expecting 2 emails as we got one when we initially created the application
    expect(sentEmails).toHaveLength(2);
    expectEmailFinalValidationConfirmationMatchingImmersionApplication(
      [
        demandeImmersionInReview.email,
        demandeImmersionInReview.mentorEmail,
        counsellorEmail,
      ],
      sentEmails[1],
      agencyConfig,
      demandeImmersionInReview,
    );
  });
});
