import { addDays } from "date-fns";
import { ConventionId, frontRoutes } from "shared";
import { z } from "zod";
import { GenerateConventionMagicLink } from "../../../adapters/primary/config/createGenerateConventionMagicLink";
import { createLogger } from "../../../utils/logger";
import { notifyDiscord } from "../../../utils/notifyDiscord";
import { EmailGateway } from "../../convention/ports/EmailGateway";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { TimeGateway } from "../../core/ports/TimeGateway";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

const logger = createLogger(__filename);

export type ImmersionAssessmentEmailParams = {
  immersionId: ConventionId;
  establishmentTutorName: string;
  establishmentTutorEmail: string;
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
};

export class SendEmailsWithAssessmentCreationLink extends TransactionalUseCase<void> {
  inputSchema = z.void();

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private emailGateway: EmailGateway,
    private timeGateway: TimeGateway,
    private generateConventionMagicLink: GenerateConventionMagicLink,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  protected async _execute(_: void, uow: UnitOfWork): Promise<void> {
    const now = this.timeGateway.now();
    const tomorrow = addDays(now, 1);
    const assessmentEmailParamsOfImmersionEndingTomorrow =
      await uow.conventionQueries.getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink(
        tomorrow,
      );

    logger.info(
      `[${now.toISOString()}]: About to send assessment email to ${
        assessmentEmailParamsOfImmersionEndingTomorrow.length
      } establishments`,
    );
    if (assessmentEmailParamsOfImmersionEndingTomorrow.length === 0) return;

    const errors: Record<ConventionId, any> = {};
    await Promise.all(
      assessmentEmailParamsOfImmersionEndingTomorrow.map(
        async (immersionEndingTomorrow) => {
          await this._sendOneEmailWithImmersionAssessmentCreationLink(
            uow,
            immersionEndingTomorrow,
          ).catch((error: any) => {
            errors[immersionEndingTomorrow.immersionId] = error;
          });
        },
      ),
    );

    // Notify discord with a
    this.notifyDiscord(
      errors,
      assessmentEmailParamsOfImmersionEndingTomorrow.length,
    );
  }

  private async _sendOneEmailWithImmersionAssessmentCreationLink(
    uow: UnitOfWork,
    immersionAssessmentEmailParams: ImmersionAssessmentEmailParams,
  ) {
    const immersionAssessmentCreationLink = this.generateConventionMagicLink({
      id: immersionAssessmentEmailParams.immersionId,
      email: immersionAssessmentEmailParams.establishmentTutorEmail,
      role: "establishment",
      targetRoute: frontRoutes.immersionAssessment,
      now: this.timeGateway.now(),
    });

    await this.emailGateway.sendEmail({
      type: "CREATE_IMMERSION_ASSESSMENT",
      recipients: [immersionAssessmentEmailParams.establishmentTutorEmail],
      params: {
        immersionAssessmentCreationLink,
        establishmentTutorName:
          immersionAssessmentEmailParams.establishmentTutorName,
        beneficiaryFirstName:
          immersionAssessmentEmailParams.beneficiaryFirstName,
        beneficiaryLastName: immersionAssessmentEmailParams.beneficiaryLastName,
      },
    });

    const event = this.createNewEvent({
      topic: "EmailWithLinkToCreateAssessmentSent",
      payload: { id: immersionAssessmentEmailParams.immersionId },
    });
    await uow.outboxRepository.save(event);
  }

  private notifyDiscord(
    errors: Record<ConventionId, any>,
    numberOfAssessmentEndingTomorrow: number,
  ) {
    const nSendingEmailFailures = Object.keys(errors).length;
    const nSendingEmailSuccess =
      numberOfAssessmentEndingTomorrow - nSendingEmailFailures;

    const scriptSummaryMessage = `[triggerSendingEmailWithImmersionAssessmentCreationLinkOneDayBeforeItEnds] Script summary: Succeed: ${nSendingEmailSuccess}; Failed: ${nSendingEmailFailures}\nErrors were: ${Object.keys(
      errors,
    )
      .map(
        (immersionId) =>
          `For immersion ids ${immersionId} : ${errors[immersionId]} `,
      )
      .join("\n")}`;

    notifyDiscord(scriptSummaryMessage);
    logger.info(scriptSummaryMessage);
  }
}
