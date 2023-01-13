import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import { Tooltip } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { prop } from "ramda";
import React from "react";
import { AgencyId, AgencyOption, propEq } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { agencyAdminSelectors } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.selectors";
import { useAgencyAdminAutocomplete } from "src/app/hooks/agenciesAdmin.hook";

type AgencyAutocompleteProps = {
  title: string;
  initialValue?: AgencyOption | undefined;
  className?: string;
  placeholder: string;
  tooltip?: string;
};

const isOneOfTheOptionsLabel = (options: AgencyOption[], searchTerm: string) =>
  options.map(prop("name")).includes(searchTerm);

export const AgencyAutocomplete = ({
  title,
  className,
  placeholder = "Ex : boulangère, infirmier",
  tooltip,
}: AgencyAutocompleteProps): JSX.Element => {
  // TODO Mutualiser juste l'autocomplete avec les conventions ? Ou passer le selecteur en param du composant
  const { agencySearchText, isSearching, selectedAgencyId, agencyOptions } =
    useAppSelector(agencyAdminSelectors.agencyState);
  const { updateSearchTerm, selectOption } = useAgencyAdminAutocomplete();

  const noOptionText =
    isSearching || !agencySearchText ? "..." : "Aucune agence trouvée";

  const getNameFromAgencyId = (agencyId?: AgencyId) => {
    if (!agencyId) return;
    return agencyOptions.find(propEq("id", agencyId))?.name;
  };

  return (
    <>
      <Autocomplete
        disablePortal
        filterOptions={(x) => x}
        options={agencyOptions.map(prop("id"))}
        value={selectedAgencyId}
        noOptionsText={
          agencySearchText ? noOptionText : "Saisissez le nom d'une agence"
        }
        getOptionLabel={(option: AgencyId) => option}
        renderOption={(props, option) => (
          <li {...props}>{getNameFromAgencyId(option)}</li>
        )}
        onChange={(_, selectedAgencyId: AgencyId | null) => {
          if (!selectedAgencyId) return;
          selectOption(selectedAgencyId);
        }}
        onInputChange={(_, newSearchTerm) => {
          if (!isOneOfTheOptionsLabel(agencyOptions, newSearchTerm)) {
            updateSearchTerm(newSearchTerm);
          }
        }}
        renderInput={(params) => (
          <div ref={params.InputProps.ref} className="if-autocomplete-search">
            <label className={`fr-label ${className ?? ""}`} htmlFor={"search"}>
              {title}
              {tooltip && tooltip !== "" && (
                <Tooltip title={tooltip} className={"fr-ml-1w"} placement="top">
                  <InfoRoundedIcon />
                </Tooltip>
              )}
            </label>
            <input
              {...params.inputProps}
              value={getNameFromAgencyId(params.inputProps.value?.toString())}
              className={"fr-input"}
              placeholder={placeholder}
              style={{ backgroundColor: "#fff" }}
              type="text"
            />
          </div>
        )}
      />
    </>
  );
};
