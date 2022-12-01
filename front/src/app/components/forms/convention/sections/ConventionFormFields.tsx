import { useFormikContext } from "formik";
import React, { useEffect } from "react";
import type { ConventionDto, Signatory } from "shared";
import { getConventionFieldName } from "shared";
import { Notification } from "react-design-system";
import { deviceRepository } from "src/config/dependencies";
import { makeValuesToWatchInUrl } from "src/app/components/forms/convention/makeValuesToWatchInUrl";
import { SignatureActions } from "src/app/components/forms/convention/SignatureActions";
import { SubmitButton } from "src/app/components/forms/convention/SubmitButtons";
import { useConventionWatchValuesInUrl } from "src/app/components/forms/convention/useConventionWatchValuesInUrl";
import { ConventionFrozenMessage } from "src/app/components/forms/convention/ConventionFrozenMessage";
import { ConventionSignOnlyMessage } from "src/app/components/forms/convention/ConventionSignOnlyMessage";
import { useConventionTextsFromFormikContext } from "src/app/contents/convention/textSetup";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { AgencyFormSection } from "src/app/components/forms/convention/sections/AgencyFormSection";
import { BeneficiaryFormSection } from "src/app/components/forms/convention/sections/beneficiary/BeneficiaryFormSection";
import { EstablishmentFormSection } from "src/app/components/forms/convention/sections/establishment/EstablishmentFormSection";
import { ImmersionConditionFormSection } from "src/app/components/forms/convention/sections/ImmersionConditionFormSection";

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
  useEffect(() => {
    deviceRepository.delete("partialConventionInUrl");
  }, []);

  const alreadySigned = !!signatory?.signedAt;
  const { errors, submitCount, isSubmitting, submitForm, values } =
    useFormikContext<ConventionDto>();
  const { enablePeConnectApi } = useFeatureFlags();
  const watchedValues = makeValuesToWatchInUrl(values);
  useConventionWatchValuesInUrl(watchedValues);
  const t = useConventionTextsFromFormikContext();

  return (
    <>
      {isFrozen && !isSignatureMode && <ConventionFrozenMessage />}
      {isFrozen && isSignatureMode && (
        <ConventionSignOnlyMessage isAlreadySigned={alreadySigned ?? false} />
      )}
      <input
        type="hidden"
        name={getConventionFieldName(
          "signatories.beneficiary.federatedIdentity",
        )}
      />

      <AgencyFormSection
        internshipKind={values.internshipKind}
        agencyId={values.agencyId}
        enablePeConnectApi={enablePeConnectApi}
        isFrozen={isFrozen}
      />

      <BeneficiaryFormSection isFrozen={isFrozen} />

      <EstablishmentFormSection
        isFrozen={isFrozen}
        federatedIdentity={values.signatories.beneficiary.federatedIdentity}
      />

      <ImmersionConditionFormSection
        federatedIdentity={values.signatories.beneficiary.federatedIdentity}
        isFrozen={isFrozen}
      />

      {!isSignatureMode &&
        submitCount !== 0 &&
        Object.values(errors).length > 0 && (
          <div className="fr-alert fr-alert--error">
            <p>{t.signatures.fixErrors}</p>
          </div>
        )}
      {!isFrozen && (
        <Notification title={""} type={"info"} className="fr-my-2w">
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
      {!isFrozen && !isSignatureMode && (
        <SubmitButton
          isSubmitting={isSubmitting}
          disabled={isFrozen || isSignatureMode}
          onSubmit={submitForm}
        />
      )}
      {isSignatureMode && (
        <>
          {alreadySigned ? (
            <p>{t.conventionAlreadySigned}</p>
          ) : (
            <SignatureActions
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
