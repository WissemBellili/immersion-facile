import { useField } from "formik";
import React from "react";
import { FormEstablishmentProfession } from "src/app/FormEstablishment/FormEstablishmentProfession";
import { ButtonAdd } from "src/components/ButtonAdd";
import { ProfessionDto } from "src/../../../../back/src/shared/romeAndAppelationDtos/rome";
import { removeAtIndex } from "src/shared/utils";

type ProfessionListProps = {
  name: string;
  title?: string;
};

export const ProfessionList = ({ name, title }: ProfessionListProps) => {
  const [field, { touched, error }, { setValue }] = useField<ProfessionDto[]>({
    name,
  });

  const professions = field.value;
  const onDelete = (index: number) => {
    setValue(removeAtIndex(professions, index));
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div className="w-full">
        {title && <h5 className="text-lg font-semibold mt-6">{title}</h5>}
        {professions.map(({ description }, index) => (
          <FormEstablishmentProfession
            name={`${name}[${index}]`}
            label={description}
            onDelete={() => onDelete(index)}
            key={index}
          />
        ))}
      </div>
      <ButtonAdd
        onClick={() =>
          setValue([...field.value, { romeCodeMetier: "", description: "" }])
        }
      >
        Ajouter un métier
      </ButtonAdd>

      {touched && error && (
        <div id={name + "-error-description"} className="fr-error-text">
          {typeof error === "string" ? error : "Indiquez au moins 1 métier."}
        </div>
      )}
    </div>
  );
};
