import { CircularProgress } from "@mui/material";
import { useField } from "formik";
import React, { useEffect, useState } from "react";
import { agencyGateway } from "src/app/config/dependencies";
import { AgencyId, AgencyInListDto } from "src/shared/agency/agency.dto";
import type { ImmersionApplicationDto } from "src/shared/ImmersionApplication/ImmersionApplication.dto";
import { LatLonDto } from "src/shared/latLon";

import { PostcodeAutocomplete } from "../../uiComponents/form/PostcodeAutocomplete";
import { Agencies } from "./Agency";

const placeholderAgency: AgencyInListDto = {
  id: "",
  name: "Veuillez indiquer un code postal",
  position: { lat: 0, lon: 0 },
};

type AgencyDisplayProps = {
  label: string;
  description?: string;
  agencyId?: string;
};

export const AgencyDisplay = ({
  label,
  description,
  agencyId,
}: AgencyDisplayProps) => {
  const name: keyof ImmersionApplicationDto = "agencyId";
  const [{ value, onBlur }, { touched, error }, { setValue }] =
    useField<AgencyId>({ name });

  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [position, setPosition] = useState<LatLonDto | null>(null);
  const [agencies, setAgencies] = useState([placeholderAgency]);

  useEffect(() => {
    if (!agencyId) return;

    agencyGateway
      .getAgencyPublicInfoById({ id: agencyId! })
      .then((agency) => {
        setAgencies([
          {
            id: "",
            name: "",
            position: {
              lat: 0,
              lon: 0,
            },
          },
          { ...agency },
        ]);
        if (agencyId && agencies.map((agency) => agency.id).includes(agencyId))
          setValue(agencyId);
        setLoaded(true);
        setLoadingError(false);
      })
      .catch((e) => {
        console.log(e);
        setAgencies([]);
        setLoaded(false);
        setLoadingError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [position]);

  const userError = touched && error;
  const showError = userError || loadingError;

  return (
    <div
      className={`fr-input-group${showError ? " fr-input-group--error" : ""}`}
    >
      <PostcodeAutocomplete onFound={setPosition} disabled={true} />
      <label className="fr-label pt-4" htmlFor={name}>
        {label}
      </label>
      {description && (
        <span className="fr-hint-text" id="select-hint-desc-hint">
          {description}
        </span>
      )}
      <div className="flex">
        {isLoading && (
          <div className="flex justify-center items-center pr-2">
            <CircularProgress size="20px" />{" "}
          </div>
        )}
        <select
          className="fr-select"
          id={name}
          name={name}
          value={value}
          onChange={(evt) => {
            setValue(evt.currentTarget.value);
          }}
          onBlur={onBlur}
          aria-describedby={`agency-code-{name}-error-desc-error`}
          disabled={true}
        >
          <Agencies agencies={agencies} />
        </select>
      </div>
      {showError && (
        <p id={`agency-code-{name}-error-desc-error`} className="fr-error-text">
          {loadingError
            ? "Erreur de chargement de la liste. Veuillez réessayer plus tard."
            : ""}
          {userError ? error : ""}
        </p>
      )}
    </div>
  );
};
