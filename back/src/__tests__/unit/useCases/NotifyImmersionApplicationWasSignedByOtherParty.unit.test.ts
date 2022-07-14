import { ConventionDto } from "shared/src/convention/convention.dto";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { frontRoutes } from "shared/src/routes";
import { Role } from "shared/src/tokens/MagicLinkPayload";
import {
  expectTypeToMatchAndEqual,
  fakeGenerateMagicLinkUrlFn,
} from "../../../_testBuilders/test.helpers";
import { InMemoryEmailGateway } from "../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { NotifyImmersionApplicationWasSignedByOtherParty } from "../../../domain/convention/useCases/notifications/NotifyImmersionApplicationWasSignedByOtherParty";

const beneficiaryEmail = "beneficiary@mail.com";
const mentorEmail = "mentor@mail.com";

const conventionBuilder = new ConventionDtoBuilder()
  .withFirstName("Benoit")
  .withLastName("Martin")
  .withMentor("Tom Tuteur")
  .withEmail(beneficiaryEmail)
  .withMentorEmail(mentorEmail)
  .notSigned();

describe("NotifyImmersionApplicationWasSignedByOtherParty", () => {
  let emailGateway: InMemoryEmailGateway;
  let notifySignedByOtherParty: NotifyImmersionApplicationWasSignedByOtherParty;

  beforeEach(() => {
    emailGateway = new InMemoryEmailGateway();

    notifySignedByOtherParty =
      new NotifyImmersionApplicationWasSignedByOtherParty(
        emailGateway,
        fakeGenerateMagicLinkUrlFn,
      );
  });

  it("should send an email to the establishment notifying that the beneficiary signed", async () => {
    const conventionSignedByBeneficiary = conventionBuilder
      .signedByBeneficiary()
      .build();

    await notifySignedByOtherParty.execute(conventionSignedByBeneficiary);

    expectEmailSentToOtherParty(conventionSignedByBeneficiary, {
      recipientRole: "establishment",
      recipientEmail: mentorEmail,
      existingSignatureName: "Benoit MARTIN",
    });
  });

  it("should send an email to the beneficiary notifying that the establishment signed", async () => {
    const conventionSignedByEstablishment = conventionBuilder
      .signedByEnterprise()
      .build();

    await notifySignedByOtherParty.execute(conventionSignedByEstablishment);

    expectEmailSentToOtherParty(conventionSignedByEstablishment, {
      recipientRole: "beneficiary",
      recipientEmail: beneficiaryEmail,
      existingSignatureName: conventionSignedByEstablishment.mentor,
    });
  });

  const expectEmailSentToOtherParty = (
    application: ConventionDto,
    {
      existingSignatureName,
      recipientEmail,
      recipientRole,
    }: {
      existingSignatureName: string;
      recipientEmail: string;
      recipientRole: Role;
    },
  ) => {
    const params = {
      beneficiaryFirstName: application.firstName,
      beneficiaryLastName: application.lastName,
      existingSignatureName,
      immersionProfession: application.immersionAppellation.appellationLabel,
      magicLink: fakeGenerateMagicLinkUrlFn({
        id: application.id,
        role: recipientRole,
        targetRoute: frontRoutes.conventionToSign,
        email: mentorEmail,
      }),
      mentor: application.mentor,
      businessName: application.businessName,
    };

    expectTypeToMatchAndEqual(emailGateway.getSentEmails(), [
      {
        type: "BENEFICIARY_OR_MENTOR_ALREADY_SIGNED_NOTIFICATION",
        recipients: [recipientEmail],
        params,
      },
    ]);
  };
});
