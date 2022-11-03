import React, { useEffect } from "react";
import { getConventionFieldName, Role } from "shared";
import { Notification } from "react-design-system";
import { useConventionTextsFromFormikContext } from "src/app/pages/Convention/texts/textSetup";
import { TextInput } from "src/uiComponents/form/TextInput";
import { useField } from "formik";

type BeneficiaryCurrentEmployerFieldsProperties = {
  disabled: boolean | undefined;
};

export const BeneficiaryCurrentEmployerFields = ({
  disabled,
}: BeneficiaryCurrentEmployerFieldsProperties): JSX.Element => {
  const t = useConventionTextsFromFormikContext();
  const [, , { setValue: setBeneficiaryCurrentEmployer }] = useField(
    getConventionFieldName("signatories.beneficiaryCurrentEmployer"),
  );
  const [, , { setValue: setRole }] = useField<Role>(
    getConventionFieldName("signatories.beneficiaryCurrentEmployer.role"),
  );
  useEffect(() => {
    setRole("beneficiary-current-employer");
    return () => setBeneficiaryCurrentEmployer(undefined);
  }, []);
  return (
    <>
      <Notification type="info" title="Accord de l'employeur obligatoire">
        Le bénéficiaire peut effectuer son immersion sur son temps de travail.
        Dans ce cas, l’accord de son employeur actuel est nécessaire. Le contrat
        de travail n’est pas suspendu et l’employeur actuel couvre le risque
        accident du travail pendant la durée de l’immersion.
      </Notification>
      <TextInput
        label={t.beneficiaryCurrentEmployer.businessSiretLabel}
        name={getConventionFieldName(
          "signatories.beneficiaryCurrentEmployer.businessSiret",
        )}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={t.beneficiaryCurrentEmployer.businessNameLabel}
        name={getConventionFieldName(
          "signatories.beneficiaryCurrentEmployer.businessName",
        )}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={t.beneficiaryCurrentEmployer.firstNameLabel}
        name={getConventionFieldName(
          "signatories.beneficiaryCurrentEmployer.firstName",
        )}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={t.beneficiaryCurrentEmployer.lastNameLabel}
        name={getConventionFieldName(
          "signatories.beneficiaryCurrentEmployer.lastName",
        )}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={t.beneficiaryCurrentEmployer.jobLabel}
        name={getConventionFieldName(
          "signatories.beneficiaryCurrentEmployer.job",
        )}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={t.beneficiaryCurrentEmployer.phoneLabel}
        name={getConventionFieldName(
          "signatories.beneficiaryCurrentEmployer.phone",
        )}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
      <TextInput
        label={t.beneficiaryCurrentEmployer.emailLabel}
        name={getConventionFieldName(
          "signatories.beneficiaryCurrentEmployer.email",
        )}
        type="text"
        placeholder=""
        description=""
        disabled={disabled}
      />
    </>
  );
};
