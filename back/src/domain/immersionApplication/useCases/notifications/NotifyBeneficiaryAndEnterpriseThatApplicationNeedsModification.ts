import { z } from "zod";
import { GenerateVerificationMagicLink } from "../../../../adapters/primary/config";
import {
  ImmersionApplicationDto,
  immersionApplicationSchema,
} from "../../../../shared/ImmersionApplicationDto";
import { frontRoutes } from "../../../../shared/routes";
import { allRoles } from "../../../../shared/tokens/MagicLinkPayload";
import { zString } from "../../../../shared/zodUtils";
import { createLogger } from "../../../../utils/logger";
import { EmailFilter } from "../../../core/ports/EmailFilter";
import { UseCase } from "../../../core/UseCase";
import { AgencyConfig, AgencyRepository } from "../../ports/AgencyRepository";
import {
  EmailGateway,
  ModificationRequestApplicationNotificationParams,
} from "../../ports/EmailGateway";

const logger = createLogger(__filename);

// prettier-ignore
export type ImmersionApplicationRequiresModificationPayload = z.infer<typeof immersionApplicationRequiresModificationSchema>
const immersionApplicationRequiresModificationSchema = z.object({
  application: immersionApplicationSchema,
  reason: zString,
  roles: z.array(z.enum(allRoles)),
});

// prettier-ignore
export type RenewMagicLinkPayload = z.infer<typeof renewMagicLinkPayloadSchema>
export const renewMagicLinkPayloadSchema = z.object({
  emails: z.array(z.string()),
  magicLink: z.string(),
});

export type RequestSignaturePayload = z.infer<
  typeof requestSignaturePayloadSchema
>;
export const requestSignaturePayloadSchema = z.object({
  application: immersionApplicationSchema,
  magicLink: z.string(),
});

export class NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification extends UseCase<ImmersionApplicationRequiresModificationPayload> {
  constructor(
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly agencyRepository: AgencyRepository,
    private readonly generateMagicLinkFn: GenerateVerificationMagicLink,
  ) {
    super();
  }

  inputSchema = immersionApplicationRequiresModificationSchema;

  public async _execute({
    application,
    reason,
    roles,
  }: ImmersionApplicationRequiresModificationPayload): Promise<void> {
    const agencyConfig = await this.agencyRepository.getById(
      application.agencyId,
    );
    if (!agencyConfig) {
      throw new Error(
        `Unable to send mail. No agency config found for ${application.agencyId}`,
      );
    }

    const unfilteredRecipients = [];
    if (roles.includes("beneficiary")) {
      unfilteredRecipients.push(application.email);
    }

    const recipients = this.emailFilter.filter([application.email], {
      onRejected: (email) => logger.info(`Skipped sending email to: ${email}`),
    });

    for (const role of roles) {
      let email: string | undefined = undefined;
      if (role === "beneficiary") {
        email = application.email;
      } else if (role === "establishment") {
        email = application.mentorEmail;
      }

      if (!email) {
        throw new Error(
          "unexpected role for beneficiary/enterprise modificaton request notification: " +
            role,
        );
      }

      if (
        this.emailFilter.filter([email], {
          onRejected: (email) =>
            logger.info(`Skipped sending email to: ${email}`),
        }).length === 0
      ) {
        continue;
      }

      await this.emailGateway.sendModificationRequestApplicationNotification(
        [email],
        getModificationRequestApplicationNotificationParams(
          application,
          agencyConfig,
          reason,
          this.generateMagicLinkFn(
            application.id,
            role,
            frontRoutes.immersionApplicationsRoute,
          ),
        ),
      );
    }
  }
}

const getModificationRequestApplicationNotificationParams = (
  dto: ImmersionApplicationDto,
  agencyConfig: AgencyConfig,
  reason: string,
  magicLink: string,
): ModificationRequestApplicationNotificationParams => {
  return {
    beneficiaryFirstName: dto.firstName,
    beneficiaryLastName: dto.lastName,
    businessName: dto.businessName,
    reason,
    signature: agencyConfig.signature,
    agency: agencyConfig.name,
    immersionProfession: dto.immersionProfession,
    magicLink,
  };
};
