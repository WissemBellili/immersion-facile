import { NotFoundError } from "../../../adapters/primary/helpers/sendHttpResponse";
import { InMemoryDemandeImmersionRepository } from "../../../adapters/secondary/InMemoryDemandeImmersionRepository";
import { GetDemandeImmersion } from "../../../domain/demandeImmersion/useCases/GetDemandeImmersion";
import { FeatureFlags } from "../../../shared/featureFlags";
import { DemandeImmersionEntityBuilder } from "../../../_testBuilders/DemandeImmersionEntityBuilder";
import { FeatureFlagsBuilder } from "../../../_testBuilders/FeatureFlagsBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

describe("Get DemandeImmersion", () => {
  let getDemandeImmersion: GetDemandeImmersion;
  let repository: InMemoryDemandeImmersionRepository;
  let featureFlags: FeatureFlags;

  beforeEach(() => {
    repository = new InMemoryDemandeImmersionRepository();
    featureFlags = FeatureFlagsBuilder.allOff().build();
  });

  const createGetDemandeImmersionUseCase = () => {
    return new GetDemandeImmersion(repository);
  };

  describe("When enableViewableApplication in on", () => {
    beforeEach(() => {
      featureFlags = FeatureFlagsBuilder.allOff()
        .enableViewableApplications()
        .build();
      getDemandeImmersion = createGetDemandeImmersionUseCase();
    });

    describe("When the DemandeImmersion does not exist", () => {
      it("throws NotFoundError", async () => {
        expectPromiseToFailWithError(
          getDemandeImmersion.execute({ id: "unknown_demande_immersion_id" }),
          new NotFoundError("unknown_demande_immersion_id"),
        );
      });
    });

    describe("When a DemandeImmersion is stored", () => {
      it("returns the DemandeImmersion", async () => {
        const entity = new DemandeImmersionEntityBuilder().build();
        repository.setDemandesImmersion({ [entity.id]: entity });

        const demandeImmersion = await getDemandeImmersion.execute({
          id: entity.id,
        });
        expect(demandeImmersion).toEqual(entity.toDto());
      });
    });
  });
});
