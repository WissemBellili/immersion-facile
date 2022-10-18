import React from "react";
import { useDispatch } from "react-redux";
import { FederatedIdentity } from "shared";
import { RadioGroup } from "src/app/components/RadioGroup";
import { ShareActions } from "src/app/pages/Convention/ConventionFields/ShareActions";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { useTutorIsEstablishmentRepresentative } from "src/hooks/convention.hooks";
import { useSiretFetcher } from "src/hooks/siret.hooks";
import { FormSectionTitle } from "src/uiComponents/FormSectionTitle";
import { useConventionTextsFromFormikContext } from "../../../texts/textSetup";
import { EstablishementTutorFields } from "./EstablishementTutorFields";
import { EstablishmentBusinessFields } from "./EstablishmentBusinessFields";
import { EstablishmentRepresentativeFields } from "./EstablishmentRepresentativeFields";

type EstablishmentFormSectionParams = {
  isFrozen: boolean | undefined;
  federatedIdentity: FederatedIdentity | undefined;
};

export const EstablishmentFormSection = ({
  isFrozen,
  federatedIdentity,
}: EstablishmentFormSectionParams): JSX.Element => {
  useTutorIsEstablishmentRepresentative();

  const dispatch = useDispatch();
  const isTutorEstablishmentRepresentative = useAppSelector(
    conventionSelectors.isTutorEstablishmentRepresentative,
  );

  const t = useConventionTextsFromFormikContext();

  const { isFetchingSiret } = useSiretFetcher({
    shouldFetchEvenIfAlreadySaved: true,
  });

  return (
    <>
      <FormSectionTitle>
        {t.sectionTitles.establishment}
        <ShareActions
          isFrozen={isFrozen || isFetchingSiret}
          federatedIdentity={federatedIdentity}
        />
      </FormSectionTitle>
      <h4>{t.establishment.subtitle}</h4>
      <EstablishmentBusinessFields disabled={isFrozen || isFetchingSiret} />
      <RadioGroup
        id="is-establishmentRepresentative"
        disabled={isFrozen || isFetchingSiret}
        currentValue={isTutorEstablishmentRepresentative}
        setCurrentValue={(value) => {
          dispatch(
            conventionSlice.actions.isTutorEstablishmentRepresentativeChanged(
              value,
            ),
          );
        }}
        groupLabel={`${t.establishment.isEstablishmentTutorIsEstablishmentRepresentative} *`}
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
