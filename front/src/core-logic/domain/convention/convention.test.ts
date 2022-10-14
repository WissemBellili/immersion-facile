import {
  Beneficiary,
  ConventionDtoBuilder,
  ConventionReadDto,
  expectObjectsToMatch,
  expectToEqual,
  SignatoryRole,
} from "shared";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { conventionSlice, ConventionState } from "./convention.slice";

describe("Convention slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("sets JWT in store", () => {
    const jwt = "some-jwt";
    store.dispatch(conventionSlice.actions.jwtProvided(jwt));
    expectConventionState({ jwt });
  });

  describe("Save convention", () => {
    it("saves a new convention", () => {
      const convention = new ConventionDtoBuilder().build();
      store.dispatch(
        conventionSlice.actions.saveConventionRequested(convention),
      );
      expectConventionState({
        isLoading: true,
      });
      feedGatewayWithAddConventionSuccess();
      expectConventionState({
        isLoading: false,
        feedback: { kind: "justSubmitted" },
      });
      expectAddConventionToHaveBeenCalled(1);
      expectUpdateConventionToHaveBeenCalled(0);
    });

    it("saves an already existing convention base (base on presence of JWT)", () => {
      ({ store, dependencies } = createTestStore({
        convention: {
          jwt: "some-correct-jwt",
          convention: null,
          isLoading: false,
          fetchError: null,
          feedback: { kind: "idle" },
          currentSignatoryRole: null,
        },
      }));
      const convention = new ConventionDtoBuilder().build();
      store.dispatch(
        conventionSlice.actions.saveConventionRequested(convention),
      );
      expectConventionState({
        isLoading: true,
      });
      feedGatewayWithUpdateConventionSuccess();
      expectConventionState({
        isLoading: false,
        feedback: { kind: "justSubmitted" },
      });
      expectUpdateConventionToHaveBeenCalled(1);
      expectAddConventionToHaveBeenCalled(0);
    });

    it("shows message when something goes wrong when saving", () => {
      const convention = new ConventionDtoBuilder().build();
      store.dispatch(
        conventionSlice.actions.saveConventionRequested(convention),
      );
      expectConventionState({
        isLoading: true,
      });
      const errorMessage = "Une erreur lors de la sauvegarde ! ";
      feedGatewayWithAddConventionError(new Error(errorMessage));
      expectConventionState({
        isLoading: false,
        feedback: { kind: "errored", errorMessage },
      });
    });
  });

  describe("Get convention", () => {
    it("stores null as Convention without a convention matching in backend", () => {
      expectConventionState({
        isLoading: false,
        convention: null,
      });
      store.dispatch(
        conventionSlice.actions.fetchConventionRequested("my-jwt"),
      );
      expectConventionState({ isLoading: true });
      feedGatewayWithConvention(undefined);
      expectConventionState({
        convention: null,
        isLoading: false,
      });
    });

    it("stores the Convention if one matches in backend", () => {
      const convention = new ConventionDtoBuilder().build();
      const conventionRead = { ...convention, agencyName: "agency" };
      expectConventionState({
        isLoading: false,
        convention: null,
      });
      store.dispatch(
        conventionSlice.actions.fetchConventionRequested("my-jwt"),
      );
      expectConventionState({ isLoading: true });
      feedGatewayWithConvention(conventionRead);
      expectConventionState({
        convention: conventionRead,
        isLoading: false,
      });
    });

    it("stores error if failure during fetch", () => {
      expectConventionState({
        isLoading: false,
        convention: null,
        fetchError: null,
      });
      store.dispatch(
        conventionSlice.actions.fetchConventionRequested("my-jwt"),
      );
      expectConventionState({ isLoading: true });
      feedGatewayWithErrorOnConventionFetch(new Error("I failed !"));
      expectConventionState({
        convention: null,
        isLoading: false,
        fetchError: "I failed !",
      });
    });

    it("clears initial submit feedback kind if it was not idle when it started to fetch", () => {
      expectConventionState({
        isLoading: false,
        convention: null,
        fetchError: null,
      });
      ({ store } = createTestStore({
        convention: {
          feedback: { kind: "justSubmitted" },
          isLoading: false,
          convention: null,
          fetchError: null,
          jwt: null,
          currentSignatoryRole: null,
        },
      }));
      store.dispatch(
        conventionSlice.actions.fetchConventionRequested("my-jwt"),
      );
      expectConventionState({ isLoading: true, feedback: { kind: "idle" } });
    });
  });

  describe("Signatory data from convention selector", () => {
    it("returns null values when there is no convention", () => {
      const signatoryData = conventionSelectors.signatoryData(store.getState());
      expectToEqual(signatoryData, {
        signatory: null,
        signedAtFieldName: null,
      });
    });

    it("returns null values when no there is no current signatory", () => {
      const convention = {
        ...new ConventionDtoBuilder().build(),
        agencyName: "My agency",
      };
      ({ store, dependencies } = createTestStore({
        convention: {
          jwt: null,
          fetchError: null,
          isLoading: false,
          feedback: { kind: "idle" },
          convention,
          currentSignatoryRole: null,
        },
      }));
      const signatoryData = conventionSelectors.signatoryData(store.getState());
      expectToEqual(signatoryData, {
        signatory: null,
        signedAtFieldName: null,
      });
    });

    it("selects signatory data in convention when there is convention and currentSignatoryRole", () => {
      const beneficiary: Beneficiary = {
        email: "benef@mail.com",
        role: "beneficiary",
        phone: "0614000000",
        firstName: "John",
        lastName: "Doe",
      };
      const convention = {
        ...new ConventionDtoBuilder().withBeneficiary(beneficiary).build(),
        agencyName: "My agency",
      };

      ({ store, dependencies } = createTestStore({
        convention: {
          jwt: null,
          fetchError: null,
          isLoading: false,
          feedback: { kind: "idle" },
          convention,
          currentSignatoryRole: "beneficiary",
        },
      }));

      const signatoryData = conventionSelectors.signatoryData(store.getState());

      expectToEqual(signatoryData, {
        signatory: beneficiary,
        signedAtFieldName: "signatories.beneficiary.signedAt",
      });
    });
  });

  describe("Convention signature", () => {
    it("signs the conventions with role from jwt", () => {
      const jwt = "some-correct-jwt";
      store.dispatch(conventionSlice.actions.signConventionRequested(jwt));
      expectConventionState({
        isLoading: true,
      });
      feedGatewayWithSignSuccess();
      expectConventionState({
        isLoading: false,
        feedback: { kind: "signedSuccessfully" },
      });
    });

    it("gets error message when signature fails", () => {
      const jwt = "some-correct-jwt";
      store.dispatch(conventionSlice.actions.signConventionRequested(jwt));
      expectConventionState({
        isLoading: true,
      });
      const errorMessage = "You are not allowed to sign";
      feedGatewayWithSignError(new Error(errorMessage));
      expectConventionState({
        isLoading: false,
        feedback: { kind: "errored", errorMessage },
      });
    });
  });

  describe("Convention status change", () => {
    it("sends modification request with provided justification", () => {
      const jwt = "some-correct-jwt";
      store.dispatch(
        conventionSlice.actions.statusChangeRequested({
          newStatus: "DRAFT",
          feedbackKind: "modificationsAskedFromSignatory",
          justification: "There is a mistake in my last name",
          jwt,
        }),
      );
      expectConventionState({
        isLoading: true,
      });
      feedGatewayWithModificationSuccess();
      expectConventionState({
        isLoading: false,
        feedback: { kind: "modificationsAskedFromSignatory" },
      });
    });

    it("gets error message when modification fails", () => {
      const jwt = "some-correct-jwt";
      store.dispatch(
        conventionSlice.actions.statusChangeRequested({
          newStatus: "DRAFT",
          feedbackKind: "modificationsAskedFromSignatory",
          justification: "There is a mistake in my last name",
          jwt,
        }),
      );
      expectConventionState({
        isLoading: true,
      });
      const errorMessage = "You are not allowed to ask for modifications";
      feedGatewayWithModificationFailure(new Error(errorMessage));
      expectConventionState({
        isLoading: false,
        feedback: { kind: "errored", errorMessage },
      });
    });
  });

  it("stores the current signatory role", () => {
    expectConventionState({ currentSignatoryRole: null });
    const newRole: SignatoryRole = "beneficiary";
    store.dispatch(
      conventionSlice.actions.currentSignatoryRoleChanged(newRole),
    );
    expectConventionState({ currentSignatoryRole: newRole });
  });

  it("changes the feedback to idle when asked", () => {
    ({ store } = createTestStore({
      convention: {
        jwt: null,
        convention: null,
        feedback: { kind: "modificationsAskedFromSignatory" },
        isLoading: false,
        fetchError: null,
        currentSignatoryRole: null,
      },
    }));
    store.dispatch(conventionSlice.actions.clearFeedbackTriggered());
    expectConventionState({ feedback: { kind: "idle" } });
  });

  const expectConventionState = (conventionState: Partial<ConventionState>) => {
    expectObjectsToMatch(store.getState().convention, conventionState);
  };

  const feedGatewayWithAddConventionSuccess = () => {
    dependencies.conventionGateway.addConventionResult$.next(undefined);
  };

  const feedGatewayWithAddConventionError = (error: Error) => {
    dependencies.conventionGateway.addConventionResult$.error(error);
  };

  const feedGatewayWithUpdateConventionSuccess = () => {
    dependencies.conventionGateway.updateConventionResult$.next(undefined);
  };

  // const feedGatewayWithUpdateConventionError = (error: Error) => {
  //   dependencies.conventionGateway.updateConventionResult$.error(error);
  // };

  const expectAddConventionToHaveBeenCalled = (numberOfCalls: number) => {
    expect(dependencies.conventionGateway.addConventionCallCount).toBe(
      numberOfCalls,
    );
  };

  const expectUpdateConventionToHaveBeenCalled = (numberOfCalls: number) => {
    expect(dependencies.conventionGateway.updateConventionCallCount).toBe(
      numberOfCalls,
    );
  };

  const feedGatewayWithErrorOnConventionFetch = (error: Error) => {
    dependencies.conventionGateway.convention$.error(error);
  };

  const feedGatewayWithConvention = (
    convention: ConventionReadDto | undefined,
  ) => {
    dependencies.conventionGateway.convention$.next(convention);
  };

  const feedGatewayWithSignSuccess = () => {
    dependencies.conventionGateway.conventionSignedResult$.next(undefined);
  };

  const feedGatewayWithSignError = (error: Error) => {
    dependencies.conventionGateway.conventionSignedResult$.error(error);
  };

  const feedGatewayWithModificationSuccess = () => {
    dependencies.conventionGateway.conventionModificationResult$.next(
      undefined,
    );
  };

  const feedGatewayWithModificationFailure = (error: Error) => {
    dependencies.conventionGateway.conventionModificationResult$.error(error);
  };
});
