import { Logger } from "pino";
import * as SibApiV3Sdk from "sib-api-v3-typescript";
import type {
  EmailType,
  NewApplicationAdminNotificationParams,
  NewApplicationBeneficiaryConfirmationParams,
  NewApplicationMentorConfirmationParams,
} from "../../domain/demandeImmersion/ports/EmailGateway";
import { EmailGateway } from "../../domain/demandeImmersion/ports/EmailGateway";
import { DemandeImmersionDto } from "../../shared/DemandeImmersionDto";
import { logger } from "../../utils/logger";

const emailTypeToTemplateId: Record<EmailType, number> = {
  // https://my.sendinblue.com/camp/template/3/message-setup
  NEW_APPLICATION_ADMIN_NOTIFICATION: 3,

  // https://my.sendinblue.com/camp/template/4/message-setup
  NEW_APPLICATION_BENEFICIARY_CONFIRMATION: 4,

  // https://my.sendinblue.com/camp/template/5/message-setup
  NEW_APPLICATION_MENTOR_CONFIRMATION: 5,

  // https://my.sendinblue.com/camp/template/6/message-setup
  VALIDATED_APPLICATION_FINAL_CONFIRMATION: 6,
};

export class SendinblueEmailGateway implements EmailGateway {
  private readonly logger: Logger = logger.child({
    logsource: "SendinblueEmailGateway",
  });

  private constructor(
    private readonly apiInstance: SibApiV3Sdk.TransactionalEmailsApi
  ) {}

  public static create(apiKey: string): SendinblueEmailGateway {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(
      SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
      apiKey
    );
    return new SendinblueEmailGateway(apiInstance);
  }

  public async sendNewApplicationBeneficiaryConfirmation(
    recipient: string,
    params: NewApplicationBeneficiaryConfirmationParams
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
    params: NewApplicationMentorConfirmationParams
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
    params: NewApplicationAdminNotificationParams
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
    };
    this.sendTransacEmail(sibEmail);
  }

  public async sendValidatedApplicationFinalConfirmation(
    recipients: string[],
    dto: DemandeImmersionDto
  ): Promise<void> {
    const sibEmail = new SibApiV3Sdk.SendSmtpEmail();
    sibEmail.templateId =
      emailTypeToTemplateId.VALIDATED_APPLICATION_FINAL_CONFIRMATION;
    sibEmail.to = recipients.map((email) => ({ email }));
    sibEmail.params = {}; // TODO: add params.
    this.sendTransacEmail(sibEmail);
  }

  private async sendTransacEmail(sibEmail: SibApiV3Sdk.SendSmtpEmail) {
    this.logger.info(sibEmail, "Sending email");
    try {
      const data = await this.apiInstance.sendTransacEmail(sibEmail);
      this.logger.info(data, "Email sending succeeded");
    } catch (e: any) {
      this.logger.error(e, "Email sending failed");
    }
  }
}
