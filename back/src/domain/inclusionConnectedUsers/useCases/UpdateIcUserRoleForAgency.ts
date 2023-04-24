import {
  BackOfficeJwtPayload,
  IcUserRoleForAgencyParams,
  icUserRoleForAgencyParamsSchema,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class UpdateIcUserRoleForAgency extends TransactionalUseCase<
  IcUserRoleForAgencyParams,
  void,
  BackOfficeJwtPayload
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = icUserRoleForAgencyParamsSchema;

  protected async _execute(
    params: IcUserRoleForAgencyParams,
    uow: UnitOfWork,
    jwtPayload: BackOfficeJwtPayload,
  ): Promise<void> {
    if (!jwtPayload) throw new ForbiddenError("No JWT token provided");
    if (jwtPayload.role !== "backOffice")
      throw new ForbiddenError(
        `This user is not a backOffice user, role was : '${jwtPayload?.role}'`,
      );

    const user = await uow.inclusionConnectedUserRepository.getById(
      params.userId,
    );
    if (!user)
      throw new NotFoundError(`User with id ${params.userId} not found`);

    const agencyRightToUpdate = user.agencyRights.find(
      ({ agency }) => agency.id === params.agencyId,
    );

    if (!agencyRightToUpdate)
      throw new NotFoundError(
        `Agency with id ${params.agencyId} is not registered for user with id ${params.userId}`,
      );

    agencyRightToUpdate.role = params.role;
    await uow.inclusionConnectedUserRepository.update(user);
  }
}
