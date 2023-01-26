import Autocomplete from "@mui/material/Autocomplete";
import React, { useState } from "react";
import { AutocompleteInput } from "react-design-system";
import { LookupSearchResult } from "shared";
import { apiAddressGateway } from "src/config/dependencies";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";

export type PlaceAutocompleteProps = {
  label: string;
  initialValue?: string;
  disabled?: boolean;
  headerClassName?: string;
  styles?: React.CSSProperties;
  placeholder?: string;
  description?: string;
  id?: string;
  onValueChange: (value: LookupSearchResult | null) => void;
};

export const PlaceAutocomplete = ({
  label,
  disabled,
  headerClassName,
  styles,
  initialValue = "",
  placeholder = "Ex : Saint-Emilion",
  description,
  onValueChange,
  id = "im-place-autocomplete",
}: PlaceAutocompleteProps) => {
  const { cx } = useStyles();
  const [selectedOption, setSelectedOption] =
    useState<LookupSearchResult | null>(null);
  const [searchValue, setSearchValue] = useState<string>(initialValue);

  const [options, setOptions] = useState<LookupSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const noOptionText = isSearching ? "..." : "Aucun lieu trouvé 😥";
  const onInputChange = async (value: string) => {
    setSearchValue(value);
    if (value.length < 3) return;
    setIsSearching(true);
    const results = await apiAddressGateway.lookupLocation(value);
    setIsSearching(false);
    setOptions(results);
  };
  const onValueSelected = (value: LookupSearchResult | null) => {
    onValueChange(value);
    setSelectedOption(value);
    setSearchValue(value ? value.label : "");
  };
  return (
    <div className={fr.cx("fr-input-group")}>
      <Autocomplete
        loading={isSearching}
        loadingText="Recherche de ville en cours... 🔎"
        disablePortal
        noOptionsText={
          searchValue ? noOptionText : "Saisissez un lieu ou une ville ⌨️"
        }
        options={options}
        inputValue={searchValue || initialValue}
        value={selectedOption}
        id={id}
        getOptionLabel={(option) => option.label}
        onChange={(_, value) => onValueSelected(value)}
        onInputChange={(_, inputValue) => onInputChange(inputValue)}
        filterOptions={(option) => option}
        renderInput={AutocompleteInput(
          headerClassName,
          label,
          styles,
          disabled,
          placeholder,
          id,
        )}
      />
      {description && (
        <span className={cx("if-autocomplete-input__notice")}>
          {description}
        </span>
      )}
    </div>
  );
};
