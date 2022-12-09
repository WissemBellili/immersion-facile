import React from "react";
import { useDispatch } from "react-redux";
import { FederatedIdentity } from "shared";
import { RadioGroup } from "src/app/components/forms/commons/RadioGroup";
import { ShareActions } from "src/app/components/forms/convention/ShareActions";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { useTutorIsEstablishmentRepresentative } from "src/app/hooks/convention.hooks";
import { useSiretFetcher } from "src/app/hooks/siret.hooks";
import { FormSectionTitle } from "src/app/components/forms/commons/FormSectionTitle";
import { useConventionTextsFromFormikContext } from "src/app/contents/convention/textSetup";
import { EstablishementTutorFields } from "./EstablishementTutorFields";
import { EstablishmentBusinessFields } from "./EstablishmentBusinessFields";
import { EstablishmentRepresentativeFields } from "./EstablishmentRepresentativeFields";
import { Notification } from "react-design-system";

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
        {t.establishmentSection.title}
        <ShareActions
          isFrozen={isFrozen || isFetchingSiret}
          federatedIdentity={federatedIdentity}
        />
      </FormSectionTitle>
      <Notification type="info" title="" className="fr-my-2w">
        {t.establishmentSection.subtitle}
      </Notification>
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
        groupLabel={`${t.establishmentSection.isEstablishmentTutorIsEstablishmentRepresentative} *`}
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
