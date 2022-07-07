import { useField } from "formik";
import React, { useEffect } from "react";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { DateIntervalDto, ScheduleDto } from "shared/src/schedule/Schedule.dto";
import {
  reasonableSchedule,
  emptySchedule,
} from "shared/src/schedule/ScheduleUtils";
import { BoolRadioPicker } from "./BoolRadioPicker";
import { ComplexSchedulePicker } from "./ComplexSchedulePicker";
import { RegularSchedulePicker } from "./RegularSchedulePicker";
import "./SchedulePicker.css";
import { scheduleValidator } from "./utils/scheduleValidator";

type SchedulePickerProps = {
  disabled?: boolean;
  interval: DateIntervalDto;
};

export const SchedulePicker = (props: SchedulePickerProps): JSX.Element => {
  const name: keyof ConventionDto = "schedule";
  const [field, meta, { setValue, setError }] = useField<ScheduleDto>({ name });
  useEffect(() => {
    setError(scheduleValidator(field.value));
  }, [field.value, meta.error]);

  const onBoolRadioPickerChange = (isSimple: boolean): void =>
    setValue(
      isSimple
        ? reasonableSchedule(props.interval)
        : emptySchedule(props.interval),
    );

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
        disabled={props.disabled}
      />

      <h4>
        {field.value.isSimple
          ? "Sélectionnez la période des jours *"
          : "Sélectionnez les horaires de travail jour par jour *"}
      </h4>

      {meta.error && (
        <div id={name + "-error-description"} className="fr-error-text">
          {meta.error}
        </div>
      )}

      {!field.value.isSimple && (
        <ComplexSchedulePicker
          selectedIndex={field.value.selectedIndex}
          {...props}
        />
      )}
      {field.value.isSimple && <RegularSchedulePicker {...props} />}
    </>
  );
};
