import { useField } from "formik";
import React, { useEffect, useState } from "react";
import { routes } from "src/app/routing/routes";
import { establishmentGateway } from "src/app/config/dependencies";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { featureFlagsSelector } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import { AddressAutocomplete } from "src/uiComponents/AddressAutocomplete";
import { TextInput } from "src/uiComponents/form/TextInput";
import { Route } from "type-route";
import { defaultInitialValue } from "./components/defaultInitialValue";
import {
  EstablishmentFormikForm,
  getLabelAndName,
  getMandatoryLabelAndName,
} from "./components/EstablishmentFormikForm";

export const EstablishmentEditionFormPage = ({
  route,
}: {
  route: Route<typeof routes.editFormEstablishment>;
}) => {
  const [initialValues, setInitialValues] = useState<FormEstablishmentDto>({
    source: "immersion-facile",
    ...defaultInitialValue(),
  });

  useEffect(() => {
    if (!route.params.jwt) return;
    establishmentGateway
      .getFormEstablishmentFromJwt(route.params.jwt)
      .then((savedValues) =>
        setInitialValues({ ...initialValues, ...savedValues }),
      );
  }, [route.params.jwt]);

  if (!route.params.jwt) {
    return <p>Lien non valide</p>;
  }

  return (
    <EstablishmentFormikForm
      initialValues={initialValues}
      saveForm={(data) =>
        establishmentGateway.updateFormEstablishment(
          { ...data },
          route.params.jwt,
        )
      }
      isEditing
    >
      <EditionSiretRelatedInputs
        businessAddress={initialValues.businessAddress}
      />
    </EstablishmentFormikForm>
  );
};

const EditionSiretRelatedInputs = ({
  businessAddress,
}: {
  businessAddress: string;
}) => {
  const featureFlags = useAppSelector(featureFlagsSelector);
  const businessLabelAndName = getMandatoryLabelAndName("businessAddress");
  const [_, __, { setValue: setAddressValue }] = useField<string>(
    businessLabelAndName.name,
  );

  return (
    <>
      <TextInput {...getMandatoryLabelAndName("siret")} disabled={true} />

      <TextInput
        {...getMandatoryLabelAndName("businessName")}
        disabled={featureFlags.enableInseeApi}
      />
      <TextInput {...getLabelAndName("businessNameCustomized")} />
      <AddressAutocomplete
        initialSearchTerm={businessAddress}
        label={businessLabelAndName.label}
        setFormValue={(address) => setAddressValue(address.label)}
      />
    </>
  );
};
