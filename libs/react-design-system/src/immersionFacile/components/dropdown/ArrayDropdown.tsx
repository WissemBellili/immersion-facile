import React, { useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";

export interface ArrayDropdownProps<T extends string> {
  options: T[];
  onSelect: (option?: T) => void;
  defaultSelectedOption?: T;
  allowEmpty: boolean;
  label?: string;
}

export const ArrayDropdown = <T extends string>({
  options,
  onSelect,
  defaultSelectedOption,
  allowEmpty,
  label,
}: ArrayDropdownProps<T>) => {
  const displayOptions: (T | "")[] = allowEmpty ? ["", ...options] : options;

  const [selectedOption, setSelectedOption] = useState<T | "">(
    defaultSelectedOption ?? "",
  );
  const onChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    const index = event.currentTarget.selectedIndex;
    const option = displayOptions.at(index);
    setSelectedOption(option ?? "");
    return onSelect(option ? option : undefined);
  };
  return (
    <div>
      {label && <label className={fr.cx("fr-label")}>{label}</label>}
      <select
        className={fr.cx("fr-select")}
        id="roles-dropdown"
        name="select"
        onChange={onChange}
        style={{ width: "200px" }}
        onEmptied={() => setSelectedOption("")}
      >
        {displayOptions.map((option) => (
          <option
            value={option}
            key={option}
            selected={selectedOption === option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};
