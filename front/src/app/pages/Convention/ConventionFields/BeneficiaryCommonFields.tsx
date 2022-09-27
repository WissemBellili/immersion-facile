import { useField } from "formik";
import React, { useState, useEffect } from "react";
import { getConventionFieldName } from "shared/src/convention/convention";
import { RadioGroup } from "src/app/components/RadioGroup";
import { LegalRepresentativeFields } from "src/app/pages/Convention/ConventionFields/LegalRepresentativeFields";
import { useConventionTextsFromFormikContext } from "src/app/pages/Convention/texts/textSetup";
import { TextInput } from "src/uiComponents/form/TextInput";

const useIsMinor = () => {
  const [isMinor, setIsMinor] = useState<boolean>(false);

  const [{ value: legalRepresentative }] = useField(
    getConventionFieldName("signatories.legalRepresentative"),
  );

  const isMinorFromData = !!legalRepresentative;

  useEffect(() => {
    if (isMinorFromData) setIsMinor(true);
  }, [isMinorFromData]);

  return { isMinor, setIsMinor };
};

export const BeneficiaryCommonFields = ({
  disabled,
}: {
  disabled?: boolean;
}) => {
  const { isMinor, setIsMinor } = useIsMinor();
  const t = useConventionTextsFromFormikContext();

  return (
    <>
      <TextInput
        label={`${t.beneficiary.firstNameLabel} *`}
        name={getConventionFieldName("signatories.beneficiary.firstName")}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={`${t.beneficiary.lastNameLabel} *`}
        name={getConventionFieldName("signatories.beneficiary.lastName")}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={`${t.beneficiary.email.label} *`}
        name={getConventionFieldName("signatories.beneficiary.email")}
        type="email"
        placeholder={t.beneficiary.email.placeholder}
        description={t.beneficiary.email.description}
        disabled={disabled}
      />
      <TextInput
        label={`${t.beneficiary.phone.label} *`}
        name={getConventionFieldName("signatories.beneficiary.phone")}
        type="tel"
        placeholder={t.beneficiary.phone.placeholder}
        description={t.beneficiary.phone.description}
        disabled={disabled}
      />
      <RadioGroup
        id="is-minor"
        disabled={disabled}
        currentValue={isMinor}
        setCurrentValue={() => setIsMinor(!isMinor)}
        groupLabel={`${t.beneficiary.isMinorLabel} *`}
        options={[
          { label: t.yes, value: true },
          { label: t.no, value: false },
        ]}
      />

      {isMinor ? (
        <LegalRepresentativeFields disabled={disabled} />
      ) : (
        <>
          <TextInput
            label={t.emergencyContact.nameLabel}
            name={getConventionFieldName(
              "signatories.beneficiary.emergencyContact",
            )}
            type="text"
            placeholder=""
            description=""
            disabled={disabled}
          />
          <TextInput
            label={t.emergencyContact.phone.label}
            name={getConventionFieldName(
              "signatories.beneficiary.emergencyContactPhone",
            )}
            type="tel"
            placeholder={t.emergencyContact.phone.placeholder}
            description=""
            disabled={disabled}
          />
        </>
      )}
    </>
  );
};
