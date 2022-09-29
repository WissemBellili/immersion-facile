import { useField } from "formik";
import React from "react";
import { ConventionDto, DateIntervalDto, ScheduleDto } from "shared";
import { DayPicker } from "./DayPicker";
import { HourPicker } from "./HourPicker";

type ComplexSchedulePickerProps = {
  selectedIndex: number;
  onChange: () => void;
  disabled?: boolean;
  interval: DateIntervalDto;
};

export const ComplexSchedulePicker = (props: ComplexSchedulePickerProps) => {
  const name: keyof ConventionDto = "schedule";
  const [field, _, { setValue }] = useField<ScheduleDto>({ name });

  return (
    <div className="flex flex-col items-center">
      <DayPicker
        complexSchedule={field.value.complexSchedule}
        selectedIndex={field.value.selectedIndex}
        onChange={(lastClickedIndex) => {
          const schedule = field.value;
          schedule.selectedIndex = lastClickedIndex;
          setValue(schedule);
          props.onChange();
        }}
      />

      <HourPicker
        name={name}
        timePeriods={
          field.value.complexSchedule[field.value.selectedIndex]
            ? field.value.complexSchedule[field.value.selectedIndex].timePeriods
            : []
        }
        onValueChange={(newHours) => {
          const schedule: ScheduleDto = { ...field.value };
          schedule.complexSchedule[schedule.selectedIndex].timePeriods =
            newHours;
          setValue(schedule);
          props.onChange();
        }}
        disabled={props.disabled}
      />
    </div>
  );
};
