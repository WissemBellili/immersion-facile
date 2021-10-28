import { createGenerateVerificationMagicLink } from "../../adapters/primary/config";
import { AppConfig } from "../../adapters/primary/appConfig";
import { InMemoryAgencyRepository } from "../../adapters/secondary/InMemoryAgencyRepository";
import { SendinblueEmailGateway } from "../../adapters/secondary/SendinblueEmailGateway";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../domain/immersionApplication/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { AgencyCode } from "../../shared/agencies";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";

// These tests are not hermetic and not meant for automated testing. They will send emails using
// sendinblue, use up production quota, and fail for uncontrollable reasons such as quota
// errors.
//
// Requires the following environment variables to be set for the tests to pass:
// - SENDINBLUE_API_KEY

const validDemandeImmersion = new ImmersionApplicationDtoBuilder()
  .withEmail("jean-francois.macresy@beta.gouv.fr")
  .withMentorEmail("jean-francois.macresy+mentor@beta.gouv.fr")
  .build();

const counsellorEmail = "jean-francois.macresy@beta.gouv.fr";

describe("NotifyToTeamApplicationSubmittedByBeneficiary", () => {
  let emailGw: SendinblueEmailGateway;
  let allowList: Set<string>;
  let unrestrictedEmailSendingAgencies: Set<AgencyCode>;
  let counsellorEmails: Record<AgencyCode, string[]>;
  let notifyToTeamApplicationSubmittedByBeneficiary: NotifyToTeamApplicationSubmittedByBeneficiary;
  let agencyRepo: InMemoryAgencyRepository;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    emailGw = SendinblueEmailGateway.create(config.sendinblueApiKey);
    allowList = new Set();
    unrestrictedEmailSendingAgencies = new Set();
    counsellorEmails = {} as Record<AgencyCode, string[]>;
    notifyToTeamApplicationSubmittedByBeneficiary =
      new NotifyToTeamApplicationSubmittedByBeneficiary(
        emailGw,
        agencyRepo,
        createGenerateVerificationMagicLink(config),
      );
  });

  test("Sends no emails when allowList and unrestrictedEmailSendingAgencies is empty", async () => {
    counsellorEmails[validDemandeImmersion.agencyCode] = [counsellorEmail];
    unrestrictedEmailSendingAgencies.add(validDemandeImmersion.agencyCode);

    validDemandeImmersion.mentorEmail = "jeanfrancois.macresy@gmail.com";
    validDemandeImmersion.email = "jeanfrancois.macresy+beneficiary@gmail.com";

    allowList.add(validDemandeImmersion.mentorEmail);
    allowList.add(validDemandeImmersion.email);
    allowList.add(counsellorEmail);

    await notifyToTeamApplicationSubmittedByBeneficiary.execute(
      validDemandeImmersion,
    );
  });
});
