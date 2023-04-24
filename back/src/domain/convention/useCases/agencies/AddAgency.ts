import { AgencyDto, CreateAgencyDto, createAgencySchema } from "shared";
import { CreateNewEvent } from "../../../core/eventBus/EventBus";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";

export const defaultQuestionnaireUrl =
  "https://docs.google.com/document/d/1pjsCZbu0CarBCR0GVJ1AmIgwkxGIsD6T/edit";

export class AddAgency extends TransactionalUseCase<CreateAgencyDto, void> {
  inputSchema = createAgencySchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    params: CreateAgencyDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency: AgencyDto = {
      ...params,
      adminEmails: [],
      status: "needsReview",
      questionnaireUrl: params.questionnaireUrl || defaultQuestionnaireUrl,
    };

    const newAgencyAddEvent = this.createNewEvent({
      topic: "NewAgencyAdded",
      payload: agency,
    });

    await Promise.all([
      uow.agencyRepository.insert(agency),
      uow.outboxRepository.save(newAgencyAddEvent),
    ]);
  }
}
