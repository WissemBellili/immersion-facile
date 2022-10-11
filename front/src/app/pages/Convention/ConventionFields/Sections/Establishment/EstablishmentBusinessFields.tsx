import React from "react";
import { useField } from "formik";
import { ConventionStatus, getConventionFieldName } from "shared";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { useSiretFetcher, useSiretRelatedField } from "src/hooks/siret.hooks";
import { useConventionTextsFromFormikContext } from "../../../texts/textSetup";
import {
  TextInputControlled,
  TextInput,
} from "src/uiComponents/form/TextInput";

export const EstablishmentBusinessFields = ({
  disabled,
}: {
  disabled: undefined | boolean;
}): JSX.Element => {
  const t = useConventionTextsFromFormikContext();
  const { enableInseeApi } = useFeatureFlags();
  const { updateSiret, currentSiret, siretErrorToDisplay } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: true,
  });
  const [conventionStatus] = useField<ConventionStatus>("status");
  useSiretRelatedField("businessName", {
    disabled: conventionStatus.value !== "DRAFT",
  });
  return (
    <>
      <TextInputControlled
        value={currentSiret}
        setValue={updateSiret}
        error={siretErrorToDisplay}
        label={`${t.establishment.siret.label} *`}
        name="siret"
        placeholder={t.establishment.siret.placeholder}
        description={t.establishment.siret.description}
        disabled={disabled}
      />
      <TextInput
        label={`${t.establishment.businessNameLabel} *`}
        name={getConventionFieldName("businessName")}
        type="text"
        placeholder=""
        description=""
        disabled={enableInseeApi}
      />
    </>
  );
};