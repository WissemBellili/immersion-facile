import { AbsoluteUrl } from "shared";
import { frontRoutes } from "shared";
import { queryParamsAsString } from "shared";
import { z } from "zod";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import {
  ConventionPeConnectFields,
  ConventionPoleEmploiUserAdvisorEntity,
  toPartialConventionDtoWithPeIdentity,
} from "../dto/PeConnect.dto";
import {
  conventionPoleEmploiUserAdvisorFromDto,
  poleEmploiUserAdvisorDTOFromUserAndAdvisors,
} from "../entities/ConventionPoleEmploiAdvisorEntity";
import { PeConnectGateway } from "../port/PeConnectGateway";

export class LinkPoleEmploiAdvisorAndRedirectToConvention extends TransactionalUseCase<
  string,
  AbsoluteUrl
> {
  inputSchema = z.string();

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private peConnectGateway: PeConnectGateway,
    private baseUrlForRedirect: AbsoluteUrl,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    authorizationCode: string,
    uow: UnitOfWork,
  ): Promise<AbsoluteUrl> {
    const { user, advisors } = await this.peConnectGateway.getUserAndAdvisors(
      authorizationCode,
    );
    const poleEmploiUserAdvisorEntity: ConventionPoleEmploiUserAdvisorEntity =
      conventionPoleEmploiUserAdvisorFromDto(
        poleEmploiUserAdvisorDTOFromUserAndAdvisors({
          user,
          advisors,
        }),
      );

    await uow.conventionPoleEmploiAdvisorRepository.openSlotForNextConvention(
      poleEmploiUserAdvisorEntity,
    );

    const peQueryParams = queryParamsAsString<ConventionPeConnectFields>(
      toPartialConventionDtoWithPeIdentity(user),
    );

    return `${this.baseUrlForRedirect}/${frontRoutes.conventionImmersionRoute}?${peQueryParams}`;
  }
}
