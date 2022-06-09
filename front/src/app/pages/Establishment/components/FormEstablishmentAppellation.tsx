import { useField } from "formik";
import React from "react";
import { AppellationAutocomplete } from "src/app/components/AppellationAutocomplete";
import { AppellationDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import { ButtonDelete } from "react-design-system/immersionFacile";

type ProfessionProps = {
  name: string;
  onDelete: () => void;
};

export const FormEstablishmentAppellation = ({
  name,
  onDelete,
}: ProfessionProps) => {
  const [{ value }, _, { setValue }] = useField<AppellationDto>(name);

  return (
    <div className="flex items-end my-5">
      <div className="flex-1">
        <AppellationAutocomplete
          title="Rechercher un métier *"
          initialValue={value}
          setFormValue={setValue}
        />
      </div>
      <div>
        <ButtonDelete onClick={onDelete} />
      </div>
    </div>
  );
};
