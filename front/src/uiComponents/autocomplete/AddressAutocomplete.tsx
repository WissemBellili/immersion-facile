import Autocomplete from "@mui/material/Autocomplete";
import React, { useEffect, useState } from "react";
import { AutocompleteInput } from "react-design-system/immersionFacile";
import { AddressAndPosition } from "shared/src/address/address.dto";
import { addressDtoToString } from "shared/src/utils/address";
import { useDebounce } from "src/app/utils/useDebounce";
import { getAddressesFromApi } from "./getAddressesFromApi";

export type AddressAutocompleteProps = {
  label: string;
  initialSearchTerm?: string;
  disabled?: boolean;
  headerClassName?: string;
  inputStyle?: React.CSSProperties;
  setFormValue: (p: AddressAndPosition) => void;
};

export const AddressAutocomplete = ({
  label,
  setFormValue,
  disabled,
  headerClassName,
  inputStyle,
  initialSearchTerm = "",
}: AddressAutocompleteProps) => {
  const [selectedOption, setSelectedOption] =
    useState<AddressAndPosition | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
  const [options, setOptions] = useState<AddressAndPosition[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceSearchTerm = useDebounce(searchTerm, 400);
  useEffect(
    () =>
      useEffectInitialSearchTerm(
        initialSearchTerm,
        selectedOption,
        setOptions,
        setIsSearching,
        setSelectedOption,
      ),
    [initialSearchTerm],
  );

  useEffect(
    () =>
      useEffectDebounceSearchTerm(
        debounceSearchTerm,
        initialSearchTerm,
        selectedOption,
        setOptions,
        setIsSearching,
      ),
    [debounceSearchTerm],
  );

  const noOptionText =
    isSearching || !debounceSearchTerm ? "..." : "Aucune adresse trouvée.";

  return (
    <Autocomplete
      loading={isSearching}
      loadingText="Recherche d'adresse en cours... 🔎"
      disablePortal
      noOptionsText={searchTerm ? noOptionText : "Saisissez une adresse."}
      options={options}
      value={selectedOption}
      getOptionLabel={(option) => addressDtoToString(option.address)}
      onChange={onAutocompleteChange(setSelectedOption, setFormValue)}
      onInputChange={onAutocompleteInput(setSearchTerm)}
      renderInput={AutocompleteInput(
        headerClassName,
        label,
        inputStyle,
        disabled,
      )}
    />
  );
};

const onAutocompleteInput =
  (setSearchTerm: React.Dispatch<React.SetStateAction<string>>) =>
  (_: React.SyntheticEvent<Element, Event>, newSearchTerm: string) =>
    setSearchTerm(newSearchTerm);

const onAutocompleteChange =
  (
    setSelectedOption: React.Dispatch<
      React.SetStateAction<AddressAndPosition | null>
    >,
    setFormValue: (p: AddressAndPosition) => void,
  ) =>
  (
    _: React.SyntheticEvent<Element, Event>,
    selectedOption: AddressAndPosition | null,
  ) => {
    setSelectedOption(selectedOption ?? null);
    setFormValue(
      selectedOption
        ? selectedOption
        : {
            address: {
              streetNumberAndAddress: "",
              postcode: "",
              city: "",
              departmentCode: "",
            },
            position: { lat: 0, lon: 0 },
          },
    );
  };

const useEffectDebounceSearchTerm = (
  debounceSearchTerm: string,
  initialSearchTerm: string,
  selectedOption: AddressAndPosition | null,
  setOptions: React.Dispatch<React.SetStateAction<AddressAndPosition[]>>,
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>,
): void => {
  if (
    !debounceSearchTerm ||
    initialSearchTerm === debounceSearchTerm ||
    (selectedOption &&
      addressDtoToString(selectedOption.address) === debounceSearchTerm)
  )
    return;
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  getAddressesFromApi(debounceSearchTerm, setOptions, setIsSearching);
};

const useEffectInitialSearchTerm = (
  initialSearchTerm: string,
  selectedOption: AddressAndPosition | null,
  setOptions: React.Dispatch<React.SetStateAction<AddressAndPosition[]>>,
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>,
  setSelectedOption: React.Dispatch<
    React.SetStateAction<AddressAndPosition | null>
  >,
): void => {
  if (
    initialSearchTerm &&
    (!selectedOption ||
      initialSearchTerm !== addressDtoToString(selectedOption.address))
  )
    getAddressesFromApi(initialSearchTerm, setOptions, setIsSearching)
      .then((addresses) => setSelectedOption(addresses?.[0] ?? null))
      .catch((error: any) => {
        // eslint-disable-next-line no-console
        console.error("getAddressesFromApi", error);
      });
};
