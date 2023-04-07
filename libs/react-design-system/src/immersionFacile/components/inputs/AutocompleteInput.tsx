import { AutocompleteRenderInputParams } from "@mui/material/Autocomplete";
import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import "./AutocompleteInput.css";

type AutocompleteInputProps = {
  headerClassName: string | undefined;
  label: string;
  inputStyle: React.CSSProperties | undefined;
  disabled: boolean | undefined;
  placeholder: string | undefined;
  id: string | undefined;
  params: AutocompleteRenderInputParams;
};

export const AutocompleteInput = ({
  headerClassName,
  label,
  inputStyle,
  disabled,
  placeholder,
  id,
  params,
}: AutocompleteInputProps) => {
  const { cx } = useStyles();
  return (
    <div ref={params.InputProps.ref} className={cx("if-autocomplete-input")}>
      <div className={cx("if-autocomplete-input__wrapper")}>
        <label className={cx(fr.cx("fr-label"), headerClassName)} htmlFor={id}>
          {label}
        </label>

        <input
          {...params.inputProps}
          id={id}
          style={inputStyle}
          disabled={disabled}
          className={fr.cx("fr-input")}
          placeholder={placeholder}
          type="text"
        />
      </div>
    </div>
  );
};
