import { Input } from "@codegouvfr/react-dsfr/Input";

import React from "react";
import { useFormContext } from "react-hook-form";
import { ConventionDto } from "shared";
import { ConventionEmailWarning } from "src/app/components/forms/convention/ConventionEmailWarning";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useFormContents } from "src/app/hooks/formContents.hooks";

type EstablishmentRepresentativeFieldsProperties = {
  disabled: boolean | undefined;
};

export const EstablishmentRepresentativeFields = ({
  disabled,
}: EstablishmentRepresentativeFieldsProperties): JSX.Element => {
  const { getValues, register } = useFormContext<ConventionDto>();
  const values = getValues();
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();
  return (
    <>
      <Input
        {...formContents["signatories.establishmentRepresentative.firstName"]}
        nativeInputProps={{
          ...formContents["signatories.establishmentRepresentative.firstName"],
          ...register("signatories.establishmentRepresentative.firstName"),
        }}
        disabled={disabled}
      />
      <Input
        {...formContents["signatories.establishmentRepresentative.lastName"]}
        nativeInputProps={{
          ...formContents["signatories.establishmentRepresentative.lastName"],
          ...register("signatories.establishmentRepresentative.lastName"),
        }}
        disabled={disabled}
      />
      <Input
        {...formContents["signatories.establishmentRepresentative.phone"]}
        nativeInputProps={{
          ...formContents["signatories.establishmentRepresentative.phone"],
          ...register("signatories.establishmentRepresentative.phone"),
          type: "tel",
        }}
        disabled={disabled}
      />
      <Input
        {...formContents["signatories.establishmentRepresentative.email"]}
        nativeInputProps={{
          ...formContents["signatories.establishmentRepresentative.email"],
          ...register("signatories.establishmentRepresentative.email"),
          type: "email",
        }}
        disabled={disabled}
      />
      {values.signatories.establishmentRepresentative?.email && (
        <ConventionEmailWarning />
      )}
    </>
  );
};
