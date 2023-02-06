import { fr } from "@codegouvfr/react-dsfr";
import { useFormikContext } from "formik";
import React, { useEffect } from "react";
import { ErrorNotifications, Notification } from "react-design-system";
import {
  ConventionDto,
  convertStringToFederatedIdentity,
  Signatory,
  toDotNotation,
} from "shared";
import { ConventionFrozenMessage } from "src/app/components/forms/convention/ConventionFrozenMessage";
import { ConventionSignOnlyMessage } from "src/app/components/forms/convention/ConventionSignOnlyMessage";
import { makeValuesToWatchInUrl } from "src/app/components/forms/convention/makeValuesToWatchInUrl";
import { SignatureActions } from "src/app/components/forms/convention/SignatureActions";
import { SubmitButton } from "src/app/components/forms/convention/SubmitButton";
import { useConventionWatchValuesInUrl } from "src/app/components/forms/convention/useConventionWatchValuesInUrl";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useConventionTextsFromFormikContext } from "src/app/contents/forms/convention/textSetup";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { useRoute } from "src/app/routes/routes";
import { deviceRepository } from "src/config/dependencies";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { AgencyFormSection } from "./sections/agency/AgencyFormSection";
import { BeneficiaryFormSection } from "./sections/beneficiary/BeneficiaryFormSection";
import { EstablishmentFormSection } from "./sections/establishment/EstablishmentFormSection";
import { ImmersionConditionFormSection } from "./sections/immersion-conditions/ImmersionConditionFormSection";

type ConventionFieldsProps = {
  isFrozen?: boolean;
  onModificationsRequired?: () => Promise<void>; //< called when the form is sent back for modifications in signature mode
} & (
  | { isSignOnly: true; signatory: Signatory }
  | { isSignOnly?: false; signatory?: undefined }
);

export const ConventionFormFields = ({
  isFrozen,
  isSignOnly: isSignatureMode,
  signatory,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onModificationsRequired = async () => {},
}: ConventionFieldsProps): JSX.Element => {
  const {
    errors,
    submitCount,
    isSubmitting,
    submitForm,
    setFieldValue,
    values: conventionValues,
  } = useFormikContext<ConventionDto>();
  const preselectedAgencyId = useAppSelector(
    conventionSelectors.preselectedAgencyId,
  );
  const route = useRoute();

  useEffect(() => {
    deviceRepository.delete("partialConventionInUrl");
  }, []);

  useEffect(() => {
    if (route.name === "conventionCustomAgency" && preselectedAgencyId) {
      setFieldValue("agencyId", preselectedAgencyId);
    }
  }, [preselectedAgencyId]);

  const alreadySigned = !!signatory?.signedAt;

  const { enablePeConnectApi } = useFeatureFlags();
  const watchedValues = makeValuesToWatchInUrl(conventionValues);
  useConventionWatchValuesInUrl(watchedValues);
  const { getFormFields, getFormErrors } = useFormContents(
    formConventionFieldsLabels(conventionValues.internshipKind),
  );
  const formContents = getFormFields();
  const t = useConventionTextsFromFormikContext();
  const federatedIdentity =
    conventionValues.signatories.beneficiary.federatedIdentity &&
    convertStringToFederatedIdentity(
      conventionValues.signatories.beneficiary.federatedIdentity,
    );

  return (
    <>
      {isFrozen && !isSignatureMode && <ConventionFrozenMessage />}
      {isFrozen && isSignatureMode && (
        <ConventionSignOnlyMessage isAlreadySigned={alreadySigned ?? false} />
      )}
      <input
        type="hidden"
        {...formContents["signatories.beneficiary.federatedIdentity"]}
      />
      {route.name !== "conventionCustomAgency" && (
        <AgencyFormSection
          internshipKind={conventionValues.internshipKind}
          agencyId={conventionValues.agencyId}
          enablePeConnectApi={enablePeConnectApi}
          isFrozen={isFrozen}
        />
      )}

      <input type="hidden" {...formContents.agencyId} />
      <BeneficiaryFormSection
        isFrozen={isFrozen}
        internshipKind={conventionValues.internshipKind}
      />

      <EstablishmentFormSection
        isFrozen={isFrozen}
        federatedIdentity={federatedIdentity}
      />

      <ImmersionConditionFormSection
        federatedIdentity={federatedIdentity}
        isFrozen={isFrozen}
      />
      {!isFrozen && (
        <Notification title={""} type={"warning"} className={fr.cx("fr-my-2w")}>
          <ol>
            <li>
              Une fois le formulaire envoyé, chaque signataire de la convention
              va recevoir un email.
            </li>
            <li>
              Pensez à vérifier votre boîte email et votre dossier de spams.
            </li>
            <li>
              Pensez également à informer les autres signataires de la
              convention qu'ils devront vérifier leur boîte email et leur
              dossier de spams.
            </li>
          </ol>
        </Notification>
      )}
      {!isSignatureMode && (
        <ErrorNotifications
          labels={getFormErrors()}
          errors={toDotNotation(errors)}
          visible={submitCount !== 0 && Object.values(errors).length > 0}
        />
      )}

      {!isFrozen && !isSignatureMode && (
        <div className={fr.cx("fr-mt-4w")}>
          <SubmitButton
            isSubmitting={isSubmitting}
            disabled={isFrozen || isSignatureMode}
            onSubmit={submitForm}
          />
        </div>
      )}
      {isSignatureMode && (
        <>
          {alreadySigned ? (
            <p>{t.conventionAlreadySigned}</p>
          ) : (
            <SignatureActions
              internshipKind={conventionValues.internshipKind}
              alreadySigned={alreadySigned}
              signatory={signatory}
              isSubmitting={isSubmitting}
              onSubmit={submitForm}
              onModificationRequired={onModificationsRequired}
            />
          )}
        </>
      )}
    </>
  );
};
