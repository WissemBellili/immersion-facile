import { GenerateVerificationMagicLink } from "../../../../adapters/primary/config";
import {
  ImmersionApplicationDto,
  immersionApplicationSchema,
} from "../../../../shared/ImmersionApplicationDto";
import { frontRoutes } from "../../../../shared/routes";
import { Role } from "../../../../shared/tokens/MagicLinkPayload";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import { EmailGateway } from "../../ports/EmailGateway";

const logger = createLogger(__filename);

export class NotifyBeneficiaryOrEnterpriseThatApplicationWasSignedByOtherParty extends UseCase<ImmersionApplicationDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly agencyRepository: AgencyRepository,
    private readonly generateMagicLinkFn: GenerateVerificationMagicLink,
  ) {
    super();
  }

  inputSchema = immersionApplicationSchema;

  public async _execute(application: ImmersionApplicationDto): Promise<void> {
    const agencyConfig = await this.agencyRepository.getById(
      application.agencyId,
    );
    if (!agencyConfig) {
      throw new Error(
        `Unable to send mail. No agency config found for ${application.agencyId}`,
      );
    }

    const whoSigned: Role = application.beneficiaryAccepted
      ? "beneficiary"
      : "establishment";
    const recipientRole: Role = application.beneficiaryAccepted
      ? "establishment"
      : "beneficiary";
    const recipientEmail =
      recipientRole === "establishment"
        ? application.mentorEmail
        : application.email;
    const magicLink = this.generateMagicLinkFn(
      application.id,
      recipientRole,
      frontRoutes.immersionApplicationsRoute,
      recipientEmail,
    );

    const existingSignatureName =
      recipientRole === "establishment"
        ? application.mentor
        : application.lastName.toUpperCase() + " " + application.firstName;
    const missingSignatureName =
      recipientRole === "establishment"
        ? application.lastName.toUpperCase() + " " + application.firstName
        : application.mentor;

    await this.emailFilter.withAllowedRecipients(
      [recipientEmail],
      ([recipientEmail]) =>
        this.emailGateway.sendSignedByOtherPartyNotification(recipientEmail, {
          magicLink,
          existingSignatureName,
          missingSignatureName,
          beneficiaryFirstName: application.firstName,
          beneficiaryLastName: application.lastName,
          immersionProfession: application.immersionProfession,
        }),
      logger,
    );
  }
}
