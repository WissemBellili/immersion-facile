import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useDispatch } from "react-redux";
import {
  ConventionDto,
  ConventionReadDto,
  conventionWithoutExternalIdSchema,
  isBeneficiaryMinor,
  isEstablishmentTutorIsEstablishmentRepresentative,
  isPeConnectIdentity,
} from "shared";
import { ConventionFeedbackNotification } from "src/app/components/forms/convention/ConventionFeedbackNotification";
import {
  ConventionPresentation,
  isConventionFrozen,
  undefinedIfEmptyString,
} from "src/app/components/forms/convention/conventionHelpers";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { ShowErrorOrRedirectToRenewMagicLink } from "src/app/pages/convention/ShowErrorOrRedirectToRenewMagicLink";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { useExistingSiret } from "src/app/hooks/siret.hooks";
import { toFormikValidationSchema } from "src/app/components/forms/commons/zodValidate";
import { ConventionFormFields } from "src/app/components/forms/convention/ConventionFormFields";
import { useMatomo } from "src/app/hooks/useMatomo";
import { useStyles } from "tss-react/dsfr";
import { fr } from "@codegouvfr/react-dsfr";
import { Stepper } from "@codegouvfr/react-dsfr/Stepper";

const useClearConventionSubmitFeedbackOnUnmount = () => {
  const dispatch = useDispatch();
  useEffect(
    () => () => {
      dispatch(conventionSlice.actions.clearFeedbackTriggered());
    },
    [],
  );
};

const useWaitForReduxFormUiReadyBeforeFormikInitialisation = (
  initialValues: ConventionPresentation,
) => {
  const [reduxFormUiReady, setReduxFormUiReady] = useState<boolean>(false);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      conventionSlice.actions.isMinorChanged(isBeneficiaryMinor(initialValues)),
    );
    dispatch(
      conventionSlice.actions.isTutorEstablishmentRepresentativeChanged(
        isEstablishmentTutorIsEstablishmentRepresentative(initialValues),
      ),
    );
    setReduxFormUiReady(true);
  }, []);

  return reduxFormUiReady;
};

type ConventionFormProps = {
  properties: ConventionPresentation;
  routeParams?: { jwt?: string };
};

export const ConventionForm = ({
  properties,
  routeParams = {},
}: ConventionFormProps) => {
  const { cx } = useStyles();
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);
  const [currentFormStep, setCurrentFormStep] = useState<number>(0);

  const peConnectIdentity =
    federatedIdentity && isPeConnectIdentity(federatedIdentity)
      ? federatedIdentity
      : undefined;

  const [initialValues] = useState<ConventionPresentation>({
    ...properties,

    signatories: {
      ...properties.signatories,
      beneficiary: {
        ...properties.signatories.beneficiary,
        federatedIdentity:
          properties.signatories.beneficiary.federatedIdentity ??
          peConnectIdentity,
      },
    },
  });

  useExistingSiret(initialValues.siret);
  const submitFeedback = useAppSelector(conventionSelectors.feedback);
  const fetchedConvention: ConventionReadDto | null = useAppSelector(
    conventionSelectors.convention,
  );
  const fetchConventionError = useAppSelector(conventionSelectors.fetchError);
  const dispatch = useDispatch();

  useMatomo(properties.internshipKind);

  useEffect(() => {
    if (
      (!("demandeId" in routeParams) && !("jwt" in routeParams)) ||
      !("jwt" in routeParams) ||
      routeParams.jwt === undefined
    ) {
      dispatch(conventionSlice.actions.clearFetchedConvention());
      return;
    }
    dispatch(conventionSlice.actions.jwtProvided(routeParams.jwt));
    dispatch(conventionSlice.actions.fetchConventionRequested(routeParams.jwt));
  }, []);

  const reduxFormUiReady =
    useWaitForReduxFormUiReadyBeforeFormikInitialisation(initialValues);

  useClearConventionSubmitFeedbackOnUnmount();

  const t = useConventionTexts(initialValues.internshipKind);

  const isFrozen = isConventionFrozen(
    fetchedConvention ? fetchedConvention.status : initialValues.status,
  );

  if (!reduxFormUiReady) return null;

  if (routeParams.jwt && fetchConventionError)
    return (
      <ShowErrorOrRedirectToRenewMagicLink
        errorMessage={fetchConventionError}
        jwt={routeParams.jwt}
      />
    );

  return (
    <div
      className={fr.cx(
        "fr-grid-row",
        "fr-grid-row--gutters",
        "fr-grid-row--top",
      )}
    >
      <div className={fr.cx("fr-col-12", "fr-col-lg-7")}>
        <div className={cx("fr-text")}>{t.intro.welcome}</div>
        <Alert
          severity="info"
          small
          description={t.intro.conventionWelcomeNotification}
        />

        <p className={fr.cx("fr-text--xs", "fr-mt-3w")}>
          Tous les champs marqués d'une astérisque (*) sont obligatoires.
        </p>

        <Formik
          enableReinitialize={true}
          initialValues={fetchedConvention ?? initialValues}
          validationSchema={toFormikValidationSchema(
            conventionWithoutExternalIdSchema,
          )}
          onSubmit={(values) => {
            const conventionToSave = {
              ...values,
              workConditions: undefinedIfEmptyString(values.workConditions),
            } as ConventionDto;
            dispatch(
              conventionSlice.actions.saveConventionRequested(conventionToSave),
            );
          }}
        >
          {(props) => (
            <form onReset={props.handleReset} onSubmit={props.handleSubmit}>
              <ConventionFormFields
                currentFormStep={currentFormStep}
                onCurrentFormStepChange={setCurrentFormStep}
                isFrozen={isFrozen}
              />
              <ConventionFeedbackNotification
                submitFeedback={submitFeedback}
                signatories={props.values.signatories}
              />
            </form>
          )}
        </Formik>
      </div>
      <aside
        className={fr.cx("fr-col-12", "fr-col-lg-5")}
        style={{
          position: "sticky",
          top: "1rem",
          overflow: "clip",
        }}
      >
        <Stepper
          title={"Informations sur la structure d’accompagnement du candidat"}
          currentStep={currentFormStep + 1}
          stepCount={4}
        />
      </aside>
    </div>
  );
};
