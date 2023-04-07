import { RootState } from "src/core-logic/storeConfig/store";

import { propEq } from "shared";

export const romeAutocompleteSelector = (state: RootState) => ({
  ...state.romeAutocomplete,
  selectedRomeDto:
    state.romeAutocomplete.romeOptions.find(
      propEq("romeCode", state.romeAutocomplete.selectedRome ?? ""),
    ) ?? null,
});
