import { useFormikContext } from "formik";
import React from "react";
import { useDispatch } from "react-redux";
import { ConventionDto, getConventionFieldName } from "shared";
import { RadioGroup } from "src/app/components/RadioGroup";
import { useAppSelector } from "src/hooks/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { DateInput } from "src/app/components/forms/commons/DateInput";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { FormSectionTitle } from "src/app/components/FormSectionTitle";
import { ConventionEmailWarning } from "src/app/components/forms/convention/ConventionEmailWarning";
import { useConventionTextsFromFormikContext } from "src/app/contents/convention/textSetup";
import { BeneficiaryCurrentEmployerFields } from "./BeneficiaryCurrentEmployerFields";
import { BeneficiaryEmergencyContactFields } from "./BeneficiaryEmergencyContactFields";
import { BeneficiaryRepresentativeFields } from "./BeneficiaryRepresentativeFields";

type beneficiaryFormSectionProperties = {
  isFrozen: boolean | undefined;
};
export const BeneficiaryFormSection = ({
  isFrozen,
}: beneficiaryFormSectionProperties): JSX.Element => {
  const isMinor = useAppSelector(conventionSelectors.isMinor);
  const hasCurrentEmployer = useAppSelector(
    conventionSelectors.hasCurrentEmployer,
  );
  const { setFieldValue } = useFormikContext<ConventionDto>();
  const dispatch = useDispatch();
  const t = useConventionTextsFromFormikContext();
  const { values } = useFormikContext<ConventionDto>();
  return (
    <>
      <FormSectionTitle>{t.beneficiarySection.title}</FormSectionTitle>
      <TextInput
        label={`${t.beneficiarySection.firstNameLabel} *`}
        name={getConventionFieldName("signatories.beneficiary.firstName")}
        type="text"
        placeholder=""
        description=""
        disabled={isFrozen}
      />
      <TextInput
        label={`${t.beneficiarySection.lastNameLabel} *`}
        name={getConventionFieldName("signatories.beneficiary.lastName")}
        type="text"
        placeholder=""
        description=""
        disabled={isFrozen}
      />
      <DateInput
        label={`${t.beneficiarySection.birthdate} *`}
        name={getConventionFieldName("signatories.beneficiary.birthdate")}
        disabled={isFrozen}
        onDateChange={(date) => {
          setFieldValue(
            "signatories.beneficiary.birthdate",
            new Date(date).toISOString(),
          );
        }}
      />
      <TextInput
        label={`${t.beneficiarySection.email.label} *`}
        name={getConventionFieldName("signatories.beneficiary.email")}
        type="email"
        placeholder={t.beneficiarySection.email.placeholder}
        description={t.beneficiarySection.email.description}
        disabled={isFrozen}
      />
      {values.signatories.beneficiary.email && <ConventionEmailWarning />}
      <TextInput
        label={`${t.beneficiarySection.phone.label} *`}
        name={getConventionFieldName("signatories.beneficiary.phone")}
        type="tel"
        placeholder={t.beneficiarySection.phone.placeholder}
        description={t.beneficiarySection.phone.description}
        disabled={isFrozen}
      />
      <RadioGroup
        id="is-minor"
        disabled={isFrozen}
        currentValue={isMinor}
        setCurrentValue={(value) =>
          dispatch(conventionSlice.actions.isMinorChanged(value))
        }
        groupLabel={`${t.beneficiarySection.isMinorLabel} *`}
        options={[
          { label: t.yes, value: true },
          { label: t.no, value: false },
        ]}
      />
      {isMinor ? (
        <BeneficiaryRepresentativeFields disabled={isFrozen} />
      ) : (
        <BeneficiaryEmergencyContactFields disabled={isFrozen} />
      )}
      <RadioGroup
        id="is-current-employer"
        disabled={isFrozen}
        currentValue={hasCurrentEmployer}
        setCurrentValue={(value) =>
          dispatch(conventionSlice.actions.isCurrentEmployerChanged(value))
        }
        groupLabel={`${t.beneficiarySection.beneficiaryCurrentEmployer.hasCurrentEmployerLabel} *`}
        options={[
          { label: t.yes, value: true },
          { label: t.no, value: false },
        ]}
      />
      {hasCurrentEmployer && (
        <BeneficiaryCurrentEmployerFields disabled={isFrozen} />
      )}
    </>
  );
};
