import React from "react";
import { AutocompleteAttributeValue } from "./AutocompleteAttributeValue.type";

export type InputProperties = {
  name: string;
  value?: string;
  type?: React.HTMLInputTypeAttribute;
  onKeyPress?: React.KeyboardEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  >;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  readOnly?: boolean;
  autoComplete?: AutocompleteAttributeValue;
};
export const Input = ({
  name,
  value,
  type,
  onKeyPress,
  onChange,
  onBlur,
  error,
  placeholder,
  disabled,
  id,
  readOnly,
  autoComplete,
}: InputProperties): JSX.Element => (
  <input
    id={id}
    value={value}
    type={type}
    name={name}
    onKeyPress={onKeyPress}
    onChange={onChange}
    onBlur={onBlur}
    className={`fr-input${error ? " fr-input--error" : ""}`}
    placeholder={placeholder || ""}
    aria-describedby="text-input-error-desc-error"
    disabled={disabled}
    readOnly={readOnly}
    autoComplete={autoComplete}
  />
);
