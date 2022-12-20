import MuiChip from "@mui/material/Chip";
import { styled } from "@mui/material/styles";
import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "react-design-system/immersionFacile";
import {
  cleanStringToHTMLAttribute,
  notEqual,
  OmitFromExistingKeys,
} from "shared";
import { z } from "zod";

const immersionBlue = "#3458a2";

const Chip = styled(MuiChip)({
  borderColor: immersionBlue,
  color: immersionBlue,
  fontWeight: "bold",
  backgroundColor: "white",
});
const componentName = "im-fillable-list";
export const FillableList = (
  props: OmitFromExistingKeys<AddToListProps, "onAdd"> & {
    valuesInList: string[];
    setValues: (values: string[]) => void;
  },
) => {
  const { valuesInList, setValues, ...addToListProps } = props;

  return (
    <div className={`fr-input-group ${componentName}`}>
      <AddToList
        {...addToListProps}
        onAdd={(inputValue) => {
          setValues([...valuesInList, inputValue]);
        }}
      />
      {valuesInList.length > 0 && (
        <ListOfChip
          values={valuesInList}
          onDelete={(valueToDelete) => {
            setValues(valuesInList.filter(notEqual(valueToDelete)));
          }}
        />
      )}
    </div>
  );
};

type AddToListProps = {
  name: string;
  onAdd: (inputValue: string) => void;
  label?: string;
  placeholder?: string;
  description?: string;
  validationSchema?: z.ZodSchema<unknown>;
};

const createGetInputError =
  (validationSchema?: z.ZodSchema<unknown>) =>
  (stringToValidate: string): string | null => {
    if (!validationSchema) return null;

    try {
      validationSchema.parse(stringToValidate);
      return null;
    } catch (e: any) {
      const zodError: z.ZodError = e;
      return zodError.errors[0].message;
    }
  };

const AddToList = ({
  name,
  label,
  placeholder,
  description,
  onAdd,
  validationSchema,
}: AddToListProps) => {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const getInputError = createGetInputError(validationSchema);

  useEffect(() => {
    if (!inputValue || !error) return;
    setError(getInputError(inputValue));
  }, [error, inputValue]);

  const onAddClick = () => {
    if (!inputValue) return;

    const inputError = getInputError(inputValue);
    if (inputError) return setError(inputError);

    onAdd(inputValue);
    setInputValue("");
  };

  return (
    <div
      className={`fr-input-group${
        error ? " fr-input-group--error" : ""
      } ${componentName}__add-to-list-wrapper fr-mb-2w`}
    >
      <label className="fr-label" htmlFor={cleanStringToHTMLAttribute(name)}>
        {label}
      </label>
      {description && <span className="fr-hint-text">{description}</span>}
      <div className="flex items-center justify-center w-full">
        <input
          id={cleanStringToHTMLAttribute(name)}
          value={inputValue}
          type="text"
          name={name}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddClick();
            }
          }}
          onChange={(e) => setInputValue(e.target.value)}
          className={`fr-input${error ? " fr-input--error" : ""}`}
          placeholder={placeholder || ""}
          aria-describedby="text-input-error-desc-error"
        />
        <Button type="button" className="h-10" onSubmit={onAddClick}>
          Ajouter
        </Button>
      </div>
      {error && (
        <p id="text-input-email-error-desc-error" className="fr-error-text">
          {error}
        </p>
      )}
    </div>
  );
};

type ListOfChipProps = {
  values: string[];
  onDelete: (valueToDelete: string) => void;
};

const ListOfChip = ({ values, onDelete }: ListOfChipProps) => (
  <div className={`${componentName}__list-of-chip`}>
    {values.map((value, index) => (
      <span key={value} className={index ? "fr-px-1w" : ""}>
        <Chip
          variant="outlined"
          label={value}
          onDelete={() => onDelete(value)}
        />
      </span>
    ))}
  </div>
);
