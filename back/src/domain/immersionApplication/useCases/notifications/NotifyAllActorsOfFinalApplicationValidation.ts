import { AgencyCode } from "../../../../shared/agencies";
import { ImmersionApplicationDto } from "../../../../shared/ImmersionApplicationDto";
import {
  prettyPrintLegacySchedule,
  prettyPrintSchedule,
} from "../../../../shared/ScheduleUtils";
import { createLogger } from "../../../../utils/logger";
import { UseCase } from "../../../core/UseCase";
import {
  EmailGateway,
  ValidatedApplicationFinalConfirmationParams,
} from "../../ports/EmailGateway";

const logger = createLogger(__filename);
export class NotifyAllActorsOfFinalApplicationValidation
  implements UseCase<ImmersionApplicationDto>
{
  constructor(
    private readonly emailGateway: EmailGateway,
    private readonly emailAllowList: Readonly<Set<string>>,
    private readonly unrestrictedEmailSendingAgencies: Readonly<
      Set<AgencyCode>
    >,
    private readonly counsellorEmails: Readonly<Record<AgencyCode, string[]>>,
  ) {}

  public async execute(dto: ImmersionApplicationDto): Promise<void> {
    let recipients = [
      dto.email,
      dto.mentorEmail,
      ...(this.counsellorEmails[dto.agencyCode] || []),
    ];
    if (!this.unrestrictedEmailSendingAgencies.has(dto.agencyCode)) {
      recipients = recipients.filter((email) => {
        if (!this.emailAllowList.has(email)) {
          logger.info(`Skipped sending email to: ${email}`);
          return false;
        }
        return true;
      });
    }

    if (recipients.length > 0) {
      await this.emailGateway.sendValidatedApplicationFinalConfirmation(
        recipients,
        getValidatedApplicationFinalConfirmationParams(dto),
      );
    } else {
      logger.info(
        {
          id: dto.id,
          recipients,
          agencyCode: dto.agencyCode,
        },
        "Sending validation confirmation email skipped.",
      );
    }
  }
}

// Visible for testing.
export const getSignature = (agencyCode: AgencyCode): string => {
  switch (agencyCode) {
    case "AMIE_BOULONAIS":
      return "L'équipe de l'AMIE du Boulonnais";
    case "MLJ_GRAND_NARBONNE":
      return "L'équipe de la Mission Locale de Narbonne";
    default:
      return "L'immersion facile";
  }
};

// Visible for testing.
export const getQuestionnaireUrl = (agencyCode: AgencyCode): string => {
  switch (agencyCode) {
    case "AMIE_BOULONAIS":
      return "https://docs.google.com/document/d/1LLNoYByQzU6PXmOTN-MHbrhfOOglvTm1dBuzUzgesow/view";
    case "MLJ_GRAND_NARBONNE":
      return "https://drive.google.com/file/d/1GP4JX21uF5RCBk8kbjWtgZjiBBHPYSFO/view";
    default:
      return "";
  }
};

// Visible for testing.
export const getValidatedApplicationFinalConfirmationParams = (
  dto: ImmersionApplicationDto,
): ValidatedApplicationFinalConfirmationParams => {
  return {
    beneficiaryFirstName: dto.firstName,
    beneficiaryLastName: dto.lastName,
    dateStart: dto.dateStart,
    dateEnd: dto.dateEnd,
    mentorName: dto.mentor,
    scheduleText: dto.legacySchedule?.description
      ? prettyPrintLegacySchedule(dto.legacySchedule)
      : prettyPrintSchedule(dto.schedule),
    businessName: dto.businessName,
    immersionAddress: dto.immersionAddress || "",
    immersionProfession: dto.immersionProfession,
    immersionActivities: dto.immersionActivities,
    sanitaryPrevention:
      dto.sanitaryPrevention && dto.sanitaryPreventionDescription
        ? dto.sanitaryPreventionDescription
        : "non",
    individualProtection: dto.individualProtection ? "oui" : "non",
    questionnaireUrl: getQuestionnaireUrl(dto.agencyCode),
    signature: getSignature(dto.agencyCode),
  };
};
