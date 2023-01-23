import { useField } from "formik";
import React from "react";
import { fr } from "@codegouvfr/react-dsfr";

type BoolCheckboxGroupProps = {
  label: string;
  description?: string;
  descriptionLink?: string;
  disabled?: boolean;
  name: string;
};

export const BoolCheckboxGroup = (props: BoolCheckboxGroupProps) => {
  const [field, meta] = useField<boolean>({ name: props.name });
  const isError = meta.touched && meta.error;
  const htmlName = isError ? "checkBox-error" : "checkbox";
  const id = htmlName + props.name;
  return (
    <>
      <div className={fr.cx("fr-input-group")}>
        <fieldset
          className={isError ? "fr-fieldset fr-fieldset--error" : "fr-fieldset"}
          aria-labelledby={
            "checkboxes-error-legend" + isError
              ? " checkboxes-error-desc-error"
              : ""
          }
          role="group"
        >
          <legend
            className={fr.cx("fr-fieldset__legend", "fr-text--regular")}
            id="checkboxes-error-legend"
          >
            {props.label}
          </legend>
          {props.description && (
            <span className={fr.cx("fr-hint-text")}>
              <a href={props.descriptionLink} target="_blank">
                {props.description}
              </a>
            </span>
          )}
          <div className={fr.cx("fr-fieldset__content")}>
            <div className={fr.cx("fr-checkbox-group")} key={id}>
              <input
                {...field}
                value={""}
                type="checkbox"
                id={id}
                checked={field.value}
                disabled={props.disabled}
              />
              <label className={fr.cx("fr-label")} htmlFor={id}>
                oui
              </label>
            </div>
          </div>
          {isError && (
            <p
              id="checkboxes-error-desc-error"
              className={fr.cx("fr-error-text")}
            >
              {meta.error}
            </p>
          )}
        </fieldset>
      </div>
    </>
  );
};

type DateCheckboxGroupProps = {
  label: string;
  description?: string;
  descriptionLink?: string;
  disabled?: boolean;
  name: string;
};

export const DateCheckboxGroup = (props: DateCheckboxGroupProps) => {
  const [field, meta, { setValue }] = useField<string | undefined>({
    name: props.name,
  });
  const isError = meta.touched && meta.error;
  const htmlName = isError ? "checkBox-error" : "checkbox";

  return (
    <>
      <div className={fr.cx("fr-input-group")}>
        <fieldset
          className={isError ? "fr-fieldset fr-fieldset--error" : "fr-fieldset"}
          aria-labelledby={
            "checkboxes-error-legend" + isError
              ? " checkboxes-error-desc-error"
              : ""
          }
          role="group"
        >
          <legend
            className={fr.cx("fr-fieldset__legend", "fr-text--regular")}
            id="checkboxes-error-legend"
          >
            {props.label}
            {props.description && (
              <span className={fr.cx("fr-hint-text")}>
                <a href={props.descriptionLink} target="_blank">
                  {props.description}
                </a>
              </span>
            )}
          </legend>

          <div className={fr.cx("fr-fieldset__content")}>
            <div
              className={fr.cx("fr-checkbox-group")}
              key={htmlName + props.name + "_oui"}
            >
              <input
                {...field}
                value={""}
                type="checkbox"
                id={htmlName}
                checked={!!field.value}
                disabled={props.disabled}
              />
              <label
                className={fr.cx("fr-label")}
                htmlFor={htmlName + "oui"}
                onClick={() =>
                  setValue(field.value ? undefined : new Date().toISOString())
                }
              >
                oui
              </label>
            </div>
          </div>
          {isError && (
            <p
              id="checkboxes-error-desc-error"
              className={fr.cx("fr-error-text")}
            >
              {meta.error}
            </p>
          )}
        </fieldset>
      </div>
    </>
  );
};
