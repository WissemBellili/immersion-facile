import { UseCase } from "../../../core/UseCase";
import { EmailGateway } from "../../ports/EmailGateway";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { frontRoutes } from "shared/src/routes";
import { GenerateVerificationMagicLink } from "../../../../adapters/primary/config";
import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { immersionApplicationSchema } from "shared/src/ImmersionApplication/immersionApplication.schema";

const logger = createLogger(__filename);

export class ConfirmToMentorThatApplicationCorrectlySubmittedRequestSignature extends UseCase<ImmersionApplicationDto> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateVerificationMagicLink,
  ) {
    super();
  }

  inputSchema = immersionApplicationSchema;

  public async _execute(application: ImmersionApplicationDto): Promise<void> {
    if (application.status === "PARTIALLY_SIGNED") {
      logger.info(
        `Skipping sending signature-requiring mentor confirmation as application is already partially signed`,
      );
      return;
    }

    const { id, mentorEmail, firstName, lastName, businessName, mentor } =
      application;

    logger.info(
      { immersionApplicationId: id },
      `------------- Entering execute`,
    );

    await this.emailFilter.withAllowedRecipients(
      [mentorEmail],
      ([mentorEmail]) =>
        this.emailGateway.sendEnterpriseSignatureRequestNotification(
          mentorEmail,
          {
            beneficiaryFirstName: firstName,
            beneficiaryLastName: lastName,
            magicLink: this.generateMagicLinkFn(
              application.id,
              "establishment",
              frontRoutes.immersionApplicationsToSign,
              mentorEmail,
            ),
            businessName,
            mentorName: mentor,
          },
        ),
      logger,
    );
  }
}
