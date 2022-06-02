import { parseISO } from "date-fns";
import { frontRoutes } from "shared/src/routes";
import { GenerateConventionMagicLink } from "../../../../adapters/primary/config/createGenerateConventionMagicLink";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import { AgencyRepository } from "../../ports/AgencyRepository";
import { EmailGateway } from "../../ports/EmailGateway";
import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { immersionApplicationSchema } from "shared/src/ImmersionApplication/immersionApplication.schema";

const logger = createLogger(__filename);
export class NotifyToTeamApplicationSubmittedByBeneficiary extends UseCase<ImmersionApplicationDto> {
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly agencyRepository: AgencyRepository,
    private readonly generateMagicLinkFn: GenerateConventionMagicLink,
  ) {
    super();
  }

  inputSchema = immersionApplicationSchema;

  public async _execute({
    id,
    agencyId,
    firstName,
    lastName,
    dateStart,
    dateEnd,
    businessName,
  }: ImmersionApplicationDto): Promise<void> {
    logger.info(
      {
        immersionApplicationId: id,
      },
      "------------- Entering execute.",
    );

    const agency = await this.agencyRepository.getById(agencyId);
    if (!agency) {
      throw new Error(
        `Unable to send mail. No agency config found for ${agencyId}`,
      );
    }

    if (agency.adminEmails.length < 1) {
      logger.info({ demandeId: id, agencyId }, "No adminEmail.");
      return;
    }

    await Promise.all(
      agency.adminEmails.map((email) =>
        this.emailGateway.sendNewApplicationAdminNotification([email], {
          demandeId: id,
          firstName,
          lastName,
          dateStart: parseISO(dateStart).toLocaleDateString("fr"),
          dateEnd: parseISO(dateEnd).toLocaleDateString("fr"),
          businessName,
          agencyName: agency.name,
          magicLink: this.generateMagicLinkFn({
            id,
            role: "admin",
            targetRoute: frontRoutes.immersionApplicationsToValidate,
            email,
          }),
        }),
      ),
    );
  }
}
