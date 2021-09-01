import { UseCase } from "../../core/UseCase";
import { DemandeImmersionEntity } from "../entities/DemandeImmersionEntity";
import { DemandeImmersionRepository } from "../ports/DemandeImmersionRepository";
import {
  UpdateDemandeImmersionRequestDto,
  UpdateDemandeImmersionResponseDto,
} from "../../../shared/DemandeImmersionDto";
import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";

type UpdateDemandeImmersionDependencies = {
  demandeImmersionRepository: DemandeImmersionRepository;
};

export class UpdateDemandeImmersion
  implements
    UseCase<
      UpdateDemandeImmersionRequestDto,
      UpdateDemandeImmersionResponseDto
    >
{
  private readonly demandeImmersionRepository: DemandeImmersionRepository;

  constructor({
    demandeImmersionRepository,
  }: UpdateDemandeImmersionDependencies) {
    this.demandeImmersionRepository = demandeImmersionRepository;
  }

  public async execute(
    params: UpdateDemandeImmersionRequestDto
  ): Promise<UpdateDemandeImmersionResponseDto> {
    const idEntity = params.id;
    const demandeImmersionEntity = DemandeImmersionEntity.create(
      params.demandeImmersion
    );
    return this.demandeImmersionRepository
      .updateDemandeImmersion(demandeImmersionEntity)
      .then((id) => {
        if (!id) {
          throw new NotFoundError(params.id);
        }
        return params.demandeImmersion;
      });
  }
}
