import {
  BackOfficeJwtPayload,
  InclusionConnectedUser,
  WithAgencyRole,
  withAgencyRoleSchema,
} from "shared";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class GetInclusionConnectedUsers extends TransactionalUseCase<
  WithAgencyRole,
  InclusionConnectedUser[],
  BackOfficeJwtPayload
> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = withAgencyRoleSchema;

  protected async _execute(
    _: WithAgencyRole,
    _uow: UnitOfWork,
    jwtPayload?: BackOfficeJwtPayload,
  ): Promise<InclusionConnectedUser[]> {
    if (!jwtPayload) throw new ForbiddenError("No JWT token provided");
    if (jwtPayload.role !== "backOffice")
      throw new ForbiddenError(
        `This user is not a backOffice user, role was : '${jwtPayload?.role}'`,
      );

    await "";

    return [];
  }
}
