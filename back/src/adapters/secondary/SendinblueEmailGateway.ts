import * as SibApiV3Sdk from "sib-api-v3-typescript";
import type {
  EmailType,
  NewApplicationAdminNotificationParams,
  NewApplicationBeneficiaryConfirmationParams,
  NewApplicationMentorConfirmationParams,
  ValidatedApplicationFinalConfirmationParams,
  RejectedApplicationNotificationParams,
  NewImmersionApplicationReviewForEligibilityOrValidationParams,
} from "../../domain/immersionApplication/ports/EmailGateway";
import { EmailGateway } from "../../domain/immersionApplication/ports/EmailGateway";
import { createLogger } from "./../../utils/logger";

const logger = createLogger(__filename);

const emailTypeToTemplateId: Record<EmailType, number> = {
  // https://my.sendinblue.com/camp/template/3/message-setup
  NEW_APPLICATION_ADMIN_NOTIFICATION: 3,

  // https://my.sendinblue.com/camp/template/4/message-setup
  NEW_APPLICATION_BENEFICIARY_CONFIRMATION: 4,

  // https://my.sendinblue.com/camp/template/5/message-setup
  NEW_APPLICATION_MENTOR_CONFIRMATION: 5,

  // https://my.sendinblue.com/camp/template/6/message-setup
  VALIDATED_APPLICATION_FINAL_CONFIRMATION: 6,

  // https://my.sendinblue.com/camp/template/9/message-setup
  REJECTED_APPLICATION_NOTIFICATION: 9,

  // https://my.sendinblue.com/camp/template/9/message-setup
  NEW_APPLICATION_REVIEW_FOR_ELIGIBILITY: 10,

  // https://my.sendinblue.com/camp/template/9/message-setup
  NEW_APPLICATION_REVIEW_FOR_VALIDATION: 11,
};

export class SendinblueEmailGateway implements EmailGateway {
  private constructor(
    private readonly apiInstance: SibApiV3Sdk.TransactionalEmailsApi,
  ) {}

  public static create(apiKey: string): SendinblueEmailGateway {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(
      SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
      apiKey,
    );
    return new SendinblueEmailGateway(apiInstance);
  }

  public async sendNewApplicationBeneficiaryConfirmation(
    recipient: string,
    params: NewApplicationBeneficiaryConfirmationParams,
  ): Promise<void> {
    const sibEmail = new SibApiV3Sdk.SendSmtpEmail();
    sibEmail.templateId =
      emailTypeToTemplateId.NEW_APPLICATION_BENEFICIARY_CONFIRMATION;
    sibEmail.to = [{ email: recipient }];
    sibEmail.params = {
      DEMANDE_ID: params.demandeId,
      FIRST_NAME: params.firstName,
      LAST_NAME: params.lastName,
    };
    this.sendTransacEmail(sibEmail);
  }

  public async sendNewApplicationMentorConfirmation(
    recipient: string,
    params: NewApplicationMentorConfirmationParams,
  ): Promise<void> {
    const sibEmail = new SibApiV3Sdk.SendSmtpEmail();
    sibEmail.templateId =
      emailTypeToTemplateId.NEW_APPLICATION_MENTOR_CONFIRMATION;
    sibEmail.to = [{ email: recipient }];
    sibEmail.params = {
      DEMANDE_ID: params.demandeId,
      MENTOR_NAME: params.mentorName,
      BENEFICIARY_FIRST_NAME: params.beneficiaryFirstName,
      BENEFICIARY_LAST_NAME: params.beneficiaryLastName,
    };
    this.sendTransacEmail(sibEmail);
  }

  public async sendNewApplicationAdminNotification(
    recipients: string[],
    params: NewApplicationAdminNotificationParams,
  ) {
    const sibEmail = new SibApiV3Sdk.SendSmtpEmail();
    sibEmail.templateId =
      emailTypeToTemplateId.NEW_APPLICATION_ADMIN_NOTIFICATION;
    sibEmail.to = recipients.map((email) => ({ email }));
    sibEmail.params = {
      DEMANDE_ID: params.demandeId,
      FIRST_NAME: params.firstName,
      LAST_NAME: params.lastName,
      DATE_START: params.dateStart,
      DATE_END: params.dateEnd,
      BUSINESS_NAME: params.businessName,
      MAGIC_LINK: params.magicLink,
    };
    this.sendTransacEmail(sibEmail);
  }

  public async sendValidatedApplicationFinalConfirmation(
    recipients: string[],
    params: ValidatedApplicationFinalConfirmationParams,
  ): Promise<void> {
    const sibEmail = new SibApiV3Sdk.SendSmtpEmail();
    sibEmail.templateId =
      emailTypeToTemplateId.VALIDATED_APPLICATION_FINAL_CONFIRMATION;
    sibEmail.to = recipients.map((email) => ({ email }));
    sibEmail.params = {
      BENEFICIARY_FIRST_NAME: params.beneficiaryFirstName,
      BENEFICIARY_LAST_NAME: params.beneficiaryLastName,
      DATE_START: params.dateStart,
      DATE_END: params.dateEnd,
      MENTOR_NAME: params.mentorName,
      SCHEDULE_LINES: params.scheduleText.split("\n"),
      BUSINESS_NAME: params.businessName,
      IMMERSION_ADDRESS: params.immersionAddress,
      IMMERSION_PROFESSION: params.immersionProfession,
      IMMERSION_ACTIVITIES: params.immersionActivities,
      SANITARY_PREVENTION_DESCRIPTION: params.sanitaryPrevention,
      INDIVIDUAL_PROTECTION: params.individualProtection,
      QUESTIONNAIRE_URL: params.questionnaireUrl,
      SIGNATURE: params.signature,
    };
    this.sendTransacEmail(sibEmail);
  }

  public async sendRejectedApplicationNotification(
    recipient: string[],
    params: RejectedApplicationNotificationParams,
  ): Promise<void> {
    const sibEmail = new SibApiV3Sdk.SendSmtpEmail();
    sibEmail.templateId =
      emailTypeToTemplateId.REJECTED_APPLICATION_NOTIFICATION;
    if (recipient.length !== 3)
      logger.error(
        `Expecting 3 recipients to send Immersion Application rejection mail, got ${recipient.length}`,
      );
    else {
      sibEmail.to = [
        { email: recipient[0] },
        { email: recipient[1] },
        { email: recipient[2] },
      ];
      sibEmail.params = {
        FIRST_NAME: params.beneficiaryFirstName,
        LAST_NAME: params.beneficiaryLastName,
        BUSINESS_NAME: params.businessName,
        REASON: params.rejectionReason,
        IMMERSION_PROFESSION: params.immersionProfession,
        AGENCY: params.agency,
      };
      this.sendTransacEmail(sibEmail);
    }
  }

  public async sendNewApplicationForReviewNotification(
    recipients: string[],
    params: NewImmersionApplicationReviewForEligibilityOrValidationParams,
  ): Promise<void> {
    const sibEmail = new SibApiV3Sdk.SendSmtpEmail();
    sibEmail.templateId =
      emailTypeToTemplateId.NEW_APPLICATION_REVIEW_FOR_ELIGIBILITY;
    sibEmail.to = recipients.map((email) => ({ email }));
    sibEmail.params = {
      BENEFICIARY_FIRST_NAME: params.beneficiaryFirstName,
      BENEFICIARY_LAST_NAME: params.beneficiaryLastName,
      BUSINESS_NAME: params.businessName,
      SIGNATURE: params.agencySignature,
      MAGIC_LINK: params.magicLink,
    };
    this.sendTransacEmail(sibEmail);
  }

  private async sendTransacEmail(sibEmail: SibApiV3Sdk.SendSmtpEmail) {
    logger.info(sibEmail, "Sending email");
    try {
      const data = await this.apiInstance.sendTransacEmail(sibEmail);
      logger.info(data, "Email sending succeeded");
    } catch (e: any) {
      logger.error(e, "Email sending failed");
    }
  }
}
