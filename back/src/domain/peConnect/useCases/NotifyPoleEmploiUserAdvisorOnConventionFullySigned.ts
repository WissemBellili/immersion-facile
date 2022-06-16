import { ConventionDto } from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";
import { frontRoutes } from "shared/src/routes";
import { GenerateConventionMagicLink } from "../../../adapters/primary/config/createGenerateConventionMagicLink";
import { createLogger } from "../../../utils/logger";
import { EmailGateway } from "../../convention/ports/EmailGateway";
import { EmailFilter } from "../../core/ports/EmailFilter";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { ConventionPoleEmploiUserAdvisorEntity } from "../dto/PeConnect.dto";

const logger = createLogger(__filename);

export class NotifyPoleEmploiUserAdvisorOnConventionFullySigned extends TransactionalUseCase<ConventionDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly emailFilter: EmailFilter,
    private readonly emailGateway: EmailGateway,
    private readonly generateMagicLinkFn: GenerateConventionMagicLink,
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionSchema;

  public async _execute(
    conventionFromEvent: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const conventionUserAdvisor:
      | ConventionPoleEmploiUserAdvisorEntity
      | undefined = await uow.conventionPoleEmploiAdvisorRepo.getByConventionId(
      conventionFromEvent.id,
    );

    if (!conventionUserAdvisor) {
      logger.info(
        `Convention ${conventionFromEvent.id} federated identity is not of format peConnect, aborting NotifyPoleEmploiUserAdvisorOnConventionFullySigned use case`,
      );
      return;
    }

    await this.emailFilter.withAllowedRecipients(
      [conventionUserAdvisor.email],
      async (filteredRecipients) => {
        await Promise.all(
          filteredRecipients.map((advisorEmail) =>
            this.emailGateway.sendToPoleEmploiAdvisorOnConventionFullySigned(
              advisorEmail,
              {
                advisorFirstName: conventionUserAdvisor.firstName,
                advisorLastName: conventionUserAdvisor.lastName,
                businessName: conventionFromEvent.businessName,
                dateEnd: conventionFromEvent.dateEnd,
                dateStart: conventionFromEvent.dateStart,
                beneficiaryFirstName: conventionFromEvent.firstName,
                beneficiaryLastName: conventionFromEvent.lastName,
                beneficiaryEmail: conventionFromEvent.email,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                immersionAddress: conventionFromEvent.immersionAddress!,
                magicLink: this.generateMagicLinkFn({
                  id: conventionFromEvent.id,
                  role: "counsellor",
                  targetRoute: frontRoutes.conventionToValidate,
                  email: advisorEmail,
                }),
              },
            ),
          ),
        );
      },
      logger,
    );
  }
}
