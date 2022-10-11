import { parseISO } from "date-fns";
import {
  AgencyDto,
  AgencyDtoBuilder,
  ConventionDto,
  ConventionDtoBuilder,
  PeConnectIdentity,
  prettyPrintSchedule,
  reasonableSchedule,
} from "shared";
import { expectEmailFinalValidationConfirmationMatchingConvention } from "../../../_testBuilders/emailAssertions";
import { expectTypeToMatchAndEqual } from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryEmailGateway } from "../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../../adapters/secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import {
  getValidatedApplicationFinalConfirmationParams,
  NotifyAllActorsOfFinalApplicationValidation,
} from "../../../domain/convention/useCases/notifications/NotifyAllActorsOfFinalApplicationValidation";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../domain/core/ports/UnitOfWork";
import { ConventionPoleEmploiUserAdvisorEntity } from "../../../domain/peConnect/dto/PeConnect.dto";

const establishmentTutorEmail = "boss@mail.com";
const validConvention: ConventionDto = new ConventionDtoBuilder()
  .withEstablishmentTutorEmail(establishmentTutorEmail)
  .withEstablishmentRepresentativeEmail(establishmentTutorEmail)
  .build();

const counsellorEmail = "counsellor@email.fr";

const defaultAgency = AgencyDtoBuilder.create(validConvention.agencyId).build();

describe("NotifyAllActorsOfFinalApplicationValidation sends confirmation email to all actors", () => {
  let uow: UnitOfWork;
  let emailGw: InMemoryEmailGateway;
  let agency: AgencyDto;
  let unitOfWorkPerformer: UnitOfWorkPerformer;

  beforeEach(() => {
    uow = createInMemoryUow();
    agency = defaultAgency;
    uow.agencyRepository = new InMemoryAgencyRepository([defaultAgency]);
    emailGw = new InMemoryEmailGateway();

    unitOfWorkPerformer = new InMemoryUowPerformer(uow);
  });

  it("Default actors: beneficiary, establishement tutor, agency counsellor", async () => {
    agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();

    (uow.agencyRepository as InMemoryAgencyRepository).setAgencies([agency]);

    unitOfWorkPerformer = new InMemoryUowPerformer(uow);

    await new NotifyAllActorsOfFinalApplicationValidation(
      unitOfWorkPerformer,
      emailGw,
    ).execute(validConvention);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingConvention(
      [
        validConvention.signatories.beneficiary.email,
        validConvention.signatories.establishmentRepresentative.email,
        counsellorEmail,
      ],
      sentEmails[0],
      agency,
      validConvention,
    );
  });

  it("With different establishment tutor and establishment representative", async () => {
    agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();

    (uow.agencyRepository as InMemoryAgencyRepository).setAgencies([agency]);

    unitOfWorkPerformer = new InMemoryUowPerformer(uow);

    const conventionWithSpecificEstablishementEmail = new ConventionDtoBuilder()
      .withEstablishmentTutorEmail(establishmentTutorEmail)
      .build();
    await new NotifyAllActorsOfFinalApplicationValidation(
      unitOfWorkPerformer,
      emailGw,
    ).execute(conventionWithSpecificEstablishementEmail);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingConvention(
      [
        conventionWithSpecificEstablishementEmail.signatories.beneficiary.email,
        conventionWithSpecificEstablishementEmail.signatories
          .establishmentRepresentative.email,
        counsellorEmail,
        conventionWithSpecificEstablishementEmail.establishmentTutor.email,
      ],
      sentEmails[0],
      agency,
      validConvention,
    );
  });

  it("With a legal representative", async () => {
    const conventionWithBeneficiaryRepresentative = new ConventionDtoBuilder()
      .withBeneficiaryRepresentative({
        firstName: "Tom",
        lastName: "Cruise",
        phone: "0665454271",
        role: "beneficiary-representative",
        email: "beneficiary@representative.fr",
      })
      .build();

    agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();

    (uow.agencyRepository as InMemoryAgencyRepository).setAgencies([agency]);

    unitOfWorkPerformer = new InMemoryUowPerformer(uow);

    await new NotifyAllActorsOfFinalApplicationValidation(
      unitOfWorkPerformer,
      emailGw,
    ).execute(conventionWithBeneficiaryRepresentative);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingConvention(
      [
        conventionWithBeneficiaryRepresentative.signatories.beneficiary.email,
        conventionWithBeneficiaryRepresentative.signatories
          .establishmentRepresentative.email,
        conventionWithBeneficiaryRepresentative.signatories
          .beneficiaryRepresentative!.email,
        counsellorEmail,
      ],
      sentEmails[0],
      agency,
      conventionWithBeneficiaryRepresentative,
    );
  });
  it("With PeConnect Federated identity: beneficiary, establishment tutor, agency counsellor, and dedicated advisor", async () => {
    const userPeExternalId: PeConnectIdentity = `peConnect:i-am-an-external-id`;
    const userConventionAdvisor: ConventionPoleEmploiUserAdvisorEntity = {
      _entityName: "ConventionPoleEmploiAdvisor",
      conventionId: validConvention.id,
      email: "elsa.oldenburg@pole-emploi.net",
      firstName: "Elsa",
      lastName: "Oldenburg",
      userPeExternalId,
      type: "CAPEMPLOI",
    };

    (
      uow.conventionPoleEmploiAdvisorRepository as InMemoryConventionPoleEmploiAdvisorRepository
    ).setConventionPoleEmploiUsersAdvisor(userConventionAdvisor);

    agency = new AgencyDtoBuilder(defaultAgency)
      .withCounsellorEmails([counsellorEmail])
      .build();

    uow.agencyRepository = new InMemoryAgencyRepository([agency]);

    unitOfWorkPerformer = new InMemoryUowPerformer(uow);

    await new NotifyAllActorsOfFinalApplicationValidation(
      unitOfWorkPerformer,
      emailGw,
    ).execute(validConvention);

    const sentEmails = emailGw.getSentEmails();

    expect(sentEmails).toHaveLength(1);
    expectEmailFinalValidationConfirmationMatchingConvention(
      [
        validConvention.signatories.beneficiary.email,
        validConvention.signatories.establishmentRepresentative.email,
        counsellorEmail,
        userConventionAdvisor.email,
      ],
      sentEmails[0],
      agency,
      validConvention,
    );
  });
});

describe("getValidatedApplicationFinalConfirmationParams", () => {
  const agency = new AgencyDtoBuilder(defaultAgency)
    .withQuestionnaireUrl("testQuestionnaireUrl")
    .withSignature("testSignature")
    .build();

  it("simple application", () => {
    const application = new ConventionDtoBuilder()
      .withImmersionAddress("immersionAddress")
      .withSanitaryPrevention(true)
      .withSanitaryPreventionDescription("sanitaryPreventionDescription")
      .withIndividualProtection(true)
      .withSchedule(reasonableSchedule)
      .build();

    expectTypeToMatchAndEqual(
      getValidatedApplicationFinalConfirmationParams(agency, application),
      {
        totalHours: 70,
        beneficiaryFirstName: application.signatories.beneficiary.firstName,
        beneficiaryLastName: application.signatories.beneficiary.lastName,
        emergencyContact: application.signatories.beneficiary.emergencyContact,
        emergencyContactPhone:
          application.signatories.beneficiary.emergencyContactPhone,
        dateStart: parseISO(application.dateStart).toLocaleDateString("fr"),
        dateEnd: parseISO(application.dateEnd).toLocaleDateString("fr"),
        establishmentTutorName: `${application.establishmentTutor.firstName} ${application.establishmentTutor.lastName}`,
        scheduleText: prettyPrintSchedule(application.schedule).split("\n"),
        businessName: application.businessName,
        immersionAddress: "immersionAddress",
        immersionAppellationLabel:
          application.immersionAppellation.appellationLabel,
        immersionActivities: application.immersionActivities,
        immersionSkills: application.immersionSkills ?? "Non renseigné",
        establishmentRepresentativeName: `${application.signatories.establishmentRepresentative.firstName} ${application.signatories.establishmentRepresentative.lastName}`,
        sanitaryPrevention: "sanitaryPreventionDescription",
        individualProtection: "oui",
        questionnaireUrl: agency.questionnaireUrl,
        signature: agency.signature,
        workConditions: application.workConditions,
      },
    );
  });

  it("prints correct sanitaryPreventionMessage when missing", () => {
    const application = new ConventionDtoBuilder()
      .withSanitaryPrevention(false)
      .build();

    const actualParms = getValidatedApplicationFinalConfirmationParams(
      agency,
      application,
    );

    expect(actualParms.sanitaryPrevention).toBe("non");
  });

  it("prints correct individualProtection when missing", () => {
    const application = new ConventionDtoBuilder()
      .withIndividualProtection(false)
      .build();

    const actualParms = getValidatedApplicationFinalConfirmationParams(
      agency,
      application,
    );

    expect(actualParms.individualProtection).toBe("non");
  });
});
