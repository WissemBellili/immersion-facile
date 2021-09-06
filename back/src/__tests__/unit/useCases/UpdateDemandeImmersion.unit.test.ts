import { UpdateDemandeImmersion } from "../../../domain/demandeImmersion/useCases/UpdateDemandeImmersion";
import {
  DemandesImmersion,
  InMemoryDemandeImmersionRepository,
} from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { validDemandeImmersion } from "../../../_testBuilders/DemandeImmersionIdEntityTestData";
import { DemandeImmersionEntity } from "../../../domain/demandeImmersion/entities/DemandeImmersionEntity";
import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { expectPromiseToFailWithError } from "../../../utils/test.helpers";

describe("Update demandeImmersion", () => {
  let repository: InMemoryDemandeImmersionRepository;
  let updateDemandeImmersion: UpdateDemandeImmersion;

  beforeEach(() => {
    repository = new InMemoryDemandeImmersionRepository();
    updateDemandeImmersion = new UpdateDemandeImmersion({
      demandeImmersionRepository: repository,
    });
  });

  describe("When the demandeImmersion is valid", () => {
    test("updates the demandeImmersion in the repository", async () => {
      const demandesImmersion: DemandesImmersion = {};
      demandesImmersion[validDemandeImmersion.id] =
        DemandeImmersionEntity.create(validDemandeImmersion);
      repository.setDemandesImmersion(demandesImmersion);

      const updatedDemandeImmersion = {
        ...validDemandeImmersion,
        email: "new@email.fr",
      };
      const { id } = await updateDemandeImmersion.execute({
        id: updatedDemandeImmersion.id,
        demandeImmersion: updatedDemandeImmersion,
      });
      expect(id).toEqual(updatedDemandeImmersion.id);

      const storedInRepo = await repository.getAll();
      expect(storedInRepo.map((entity) => entity.toDto())).toEqual([
        updatedDemandeImmersion,
      ]);
    });
  });

  describe("When no demandeImmersion with id exists", () => {
    it("throws NotFoundError", async () => {
      await expectPromiseToFailWithError(
        updateDemandeImmersion.execute({
          id: "unknown_demande_immersion_id",
          demandeImmersion: validDemandeImmersion,
        }),
        new NotFoundError("unknown_demande_immersion_id")
      );
    });
  });
});
