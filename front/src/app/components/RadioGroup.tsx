import { useField } from "formik";
import React from "react";
import { CheckboxGroupProps } from "src/uiComponents/form/CheckboxGroup";
import { cleanStringToHTMLAttribute } from "shared";
type BoolRadioProps = {
  name: string;
  label: string;
  disabled?: boolean;
};

// Like MyRadioGroup, but backs a boolean value.
export const BoolRadioGroup = ({ name, label, disabled }: BoolRadioProps) => {
  const [field, meta, { setValue }] = useField<boolean>({ name });
  const error = meta.touched && meta.error;

  return (
    <RadioGroup
      id={name}
      currentValue={field.value}
      setCurrentValue={setValue}
      groupLabel={label}
      error={error}
      disabled={disabled}
      options={[
        { label: "Oui", value: true },
        { label: "Non", value: false },
      ]}
    />
  );
};

export const RadioGroupForField = ({
  name,
  label,
  options,
  disabled,
}: CheckboxGroupProps) => {
  const [field, meta, { setValue }] = useField({ name });
  const error = meta.touched && meta.error;

  return (
    <RadioGroup
      id={name}
      groupLabel={label}
      options={options}
      currentValue={field.value}
      error={error}
      setCurrentValue={setValue}
      disabled={disabled}
    />
  );
};

type ValueAndLabel<T> = {
  value: T;
  label?: string;
};

type RadioGroupProps<T> = {
  id: string;
  currentValue: T;
  setCurrentValue: (newValue: T) => void;
  groupLabel: string;
  options: ValueAndLabel<T>[];
  error?: false | string;
  disabled?: boolean;
};

export const RadioGroup = <T extends string | number | string[] | boolean>({
  id,
  currentValue,
  setCurrentValue,
  groupLabel,
  options,
  error,
  disabled,
}: RadioGroupProps<T>) => (
  <>
    <div className="fr-form-group fr-input-group">
      <fieldset
        className={error ? "fr-fieldset fr-fieldset--error" : "fr-fieldset"}
        aria-labelledby={
          error ? "radio-error-legend radio-error-desc-error" : ""
        }
        role="group"
      >
        <legend className="fr-fieldset__legend fr-text--regular">
          {groupLabel}
        </legend>
        <div className="fr-fieldset__content">
          {options.map(({ value, label }) => {
            const inputValue = getInputValue(value);
            const optionId = makeOptionId(value, id);

            return (
              <div className="fr-radio-group" key={optionId}>
                <input
                  id={optionId}
                  type="radio"
                  disabled={disabled}
                  value={inputValue}
                  checked={isEqual(value, currentValue)}
                  onChange={() => setCurrentValue(value)}
                />
                <label className="fr-label" htmlFor={optionId}>
                  {label ?? value}
                </label>
              </div>
            );
          })}
        </div>
        {error && (
          <p id="radio-error-desc-error" className="fr-error-text">
            {error}
          </p>
        )}
      </fieldset>
    </div>
  </>
);

const makeOptionId = (
  value: string | boolean | number | string[],
  id: string,
): string => {
  let optionId = value.toString();
  if (value instanceof Array) {
    optionId = value[0].toString();
  }
  return cleanStringToHTMLAttribute(`${id}${optionId}`);
};

const getInputValue = (
  value: string | boolean | number | string[],
): string | number | string[] => {
  if (value instanceof Array) return value[0].toString();
  if (typeof value === "boolean") return value.toString();
  return value;
};

const isEqual = <T,>(a: T, b: T): boolean => {
  if (a instanceof Array && b instanceof Array) {
    if (a[0] === undefined || b[0] === undefined) return false;
    return a[0] === b[0];
  }
  return a === b;
};
