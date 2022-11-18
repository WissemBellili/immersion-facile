import { useField } from "formik";
import React from "react";
import {
  ConventionDto,
  DateIntervalDto,
  reasonableSchedule,
  ScheduleDto,
  scheduleWithFirstDayActivity,
} from "shared";
import { BoolRadioPicker } from "./BoolRadioPicker";
import { ComplexSchedulePicker } from "./ComplexSchedulePicker";
import { RegularSchedulePicker } from "./RegularSchedulePicker";
import "./SchedulePicker.css";

type SchedulePickerProps = {
  disabled?: boolean;
  interval: DateIntervalDto;
};

export const SchedulePicker = ({
  interval,
  disabled,
}: SchedulePickerProps): JSX.Element => {
  const name: keyof ConventionDto = "schedule";
  const [field, meta, { setValue }] = useField<ScheduleDto>({ name });

  const onBoolRadioPickerChange = (isSimple: boolean): void => {
    setValue(
      isSimple
        ? reasonableSchedule(interval)
        : scheduleWithFirstDayActivity(interval),
    );
  };
  return (
    <>
      <BoolRadioPicker
        name="schedule.isSimple"
        label="Les horaires quotidiens sont-ils réguliers ? *"
        description="Ex : (Non) chaque jour a des horaires bien spécifiques, (Oui) “Du lundi au vendredi de 8h00 à 17h00”"
        yesLabel="Oui"
        noLabel="Non, irréguliers"
        checked={field.value.isSimple}
        setFieldValue={onBoolRadioPickerChange}
        disabled={disabled}
      />
      <h4>
        {field.value.isSimple
          ? "Sélectionnez la période des jours *"
          : "Sélectionnez les horaires de travail jour par jour *"}
      </h4>
      {!field.value.isSimple && (
        <p className="fr-hint-text">
          Les horaires hebdomadaires ne doivent pas dépasser 35h.
        </p>
      )}
      {meta.error && (
        <div id={name + "-error-description"} className="fr-error-text">
          {meta.error}
        </div>
      )}
      {field.value.isSimple ? (
        <RegularSchedulePicker interval={interval} disabled={disabled} />
      ) : (
        <ComplexSchedulePicker disabled={disabled} />
      )}
    </>
  );
};
