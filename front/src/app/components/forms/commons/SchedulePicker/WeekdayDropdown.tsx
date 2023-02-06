import React, { ChangeEvent } from "react";
import { weekdays } from "shared";
import { fr } from "@codegouvfr/react-dsfr";

type WeekdayDropdownProps = {
  name: string;
  minDay: number;
  maxDay: number;
  selected: number;
  onValueChange: (pickedDay: number) => void;
  disabled?: boolean;
  id: string;
};
export const WeekdayDropdown = ({
  name,
  minDay,
  maxDay,
  selected,
  onValueChange,
  disabled,
  id,
}: WeekdayDropdownProps) => {
  const onChangeHandler = (evt: ChangeEvent) => {
    const target = evt.currentTarget as HTMLSelectElement;
    onValueChange(Number(target.value));
  };

  return (
    <select
      className={fr.cx("fr-select")}
      id={id}
      name={name}
      value={selected}
      onChange={onChangeHandler}
      disabled={disabled}
      aria-label="Choisissez un jour de la semaine"
    >
      {weekdays
        .filter((_, index) => index >= minDay && index <= maxDay)
        .map((day, index) => (
          <option value={index + minDay} key={name + day}>
            {day}
          </option>
        ))}
    </select>
  );
};
