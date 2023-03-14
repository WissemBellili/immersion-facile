import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { useFormikContext } from "formik";
import React from "react";
import { useDispatch } from "react-redux";
import { ConventionDto } from "shared";
import { RadioGroup } from "src/app/components/forms/commons/RadioGroup";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useConventionTextsFromFormikContext } from "src/app/contents/forms/convention/textSetup";
import { useTutorIsEstablishmentRepresentative } from "src/app/hooks/convention.hooks";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useSiretFetcher } from "src/app/hooks/siret.hooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { EstablishementTutorFields } from "./EstablishementTutorFields";
import { EstablishmentBusinessFields } from "./EstablishmentBusinessFields";
import { EstablishmentRepresentativeFields } from "./EstablishmentRepresentativeFields";

type EstablishmentFormSectionParams = {
  isFrozen: boolean | undefined;
};

export const EstablishmentFormSection = ({
  isFrozen,
}: EstablishmentFormSectionParams): JSX.Element => {
  useTutorIsEstablishmentRepresentative();

  const dispatch = useDispatch();
  const isTutorEstablishmentRepresentative = useAppSelector(
    conventionSelectors.isTutorEstablishmentRepresentative,
  );
  const { values } = useFormikContext<ConventionDto>();
  const t = useConventionTextsFromFormikContext();
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();
  const { isFetchingSiret } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: true,
  });

  return (
    <>
      <Alert
        severity="info"
        small
        className={fr.cx("fr-my-2w")}
        description={t.establishmentSection.subtitle}
      />

      <EstablishmentBusinessFields disabled={isFrozen || isFetchingSiret} />
      <RadioGroup
        {...formContents.isEstablishmentTutorIsEstablishmentRepresentative}
        disabled={isFrozen || isFetchingSiret}
        currentValue={isTutorEstablishmentRepresentative}
        setCurrentValue={(value) => {
          dispatch(
            conventionSlice.actions.isTutorEstablishmentRepresentativeChanged(
              value,
            ),
          );
        }}
        groupLabel={
          formContents.isEstablishmentTutorIsEstablishmentRepresentative.label
        }
        options={[
          { label: t.yes, value: true },
          { label: t.no, value: false },
        ]}
      />
      <EstablishementTutorFields disabled={isFrozen} />
      {!isTutorEstablishmentRepresentative && (
        <EstablishmentRepresentativeFields
          disabled={isFrozen || isFetchingSiret}
        />
      )}
    </>
  );
};
