import React, { useState } from "react";
import "./searchdropdown.css";

type StaticDropdownProps = {
  title: string;
  onSelection: (value: string, index: number) => void;
  inputStyle?: any;
  options: string[];
  defaultSelectedIndex?: number;
  placeholder: string;
};

export const StaticDropdown = ({
  title,
  onSelection,
  inputStyle,
  options,
  defaultSelectedIndex = 0,
  placeholder,
}: StaticDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(defaultSelectedIndex);

  return (
    <div className="autocomplete">
      <label className="inputLabel searchdropdown-header" htmlFor={"search"}>
        {title}
      </label>

      <div style={{ position: "relative" }}>
        <button
          type={"button"}
          className={"searchdropdown__toggler"}
          onClick={() => {
            setIsOpen(!isOpen);
          }}
        ></button>
        <input
          readOnly
          id="search"
          type="text"
          className="fr-input autocomplete-input"
          autoComplete="off"
          value={selectedIndex > -1 ? options[selectedIndex] : ""}
          style={{ cursor: "pointer", ...inputStyle }}
          placeholder={placeholder}
        />
      </div>

      {isOpen && (
        <div className="autocomplete-items">
          {options.map((option, index) => (
            <div
              key={option}
              className="dropdown-proposal"
              onClick={() => {
                onSelection(option, index);
                setSelectedIndex(index);
                setIsOpen(!isOpen);
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
