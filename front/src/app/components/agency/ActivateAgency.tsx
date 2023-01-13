import React, { ReactNode, useEffect } from "react";
import {
  DsfrTitle,
  Select,
  SelectOption,
} from "react-design-system/immersionFacile";
import { useDispatch } from "react-redux";
import { AgencyDto, AgencyOption } from "shared";
import "src/assets/admin.css";
import { agencyAdminSlice } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.slice";
import { AgencyDetails } from "../admin/AgencyDetails";
import { useAppSelector } from "../../hooks/reduxHooks";
import { agencyAdminSelectors } from "../../../core-logic/domain/agenciesAdmin/agencyAdmin.selectors";

const toSelectOption = (option: AgencyOption): SelectOption => ({
  label: option.name,
  value: option.id,
});

const useFetchAgenciesNeedingReview = () => {
  const {
    agencyNeedingReviewOptions,
    selectedAgencyId,
    selectedAgencyNeedingReviewId,
  } = useAppSelector(agencyAdminSelectors.agencyState);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(agencyAdminSlice.actions.fetchAgenciesNeedingReviewRequested());
  }, []);

  return {
    agencyNeedingReviewOptions,
    selectedAgencyId,
    selectedAgencyNeedingReviewId,
  };
};

export const ActivateAgency = () => {
  const {
    agencyNeedingReviewOptions,
    selectedAgencyId,
    selectedAgencyNeedingReviewId,
  } = useFetchAgenciesNeedingReview();

  const dispatch = useDispatch();

  return (
    <>
      <DsfrTitle
        level={5}
        text="Activer ou Rejeter une agence"
        className="fr-mt-4w"
      />
      <div
        className="w-2/3 p-5"
        style={{
          backgroundColor: "#E5E5F4",
        }}
      >
        {agencyNeedingReviewOptions.length} agence(s) en attente de revue
        {agencyNeedingReviewOptions.length > 0 && (
          <Select
            label={selectedAgencyId ?? "Pas d'agence"}
            id={"IDJDJD"}
            options={agencyNeedingReviewOptions.map(toSelectOption)}
            onChange={(event) =>
              dispatch(
                agencyAdminSlice.actions.setSelectedAgencyNeedingReviewId(
                  event.currentTarget.value,
                ),
              )
            }
          />
        )}
        <AgencyDetails />
        {selectedAgencyNeedingReviewId && (
          <>
            <UpdateAgencyStatusButton status={"active"}>
              Activer cette agence
            </UpdateAgencyStatusButton>
            <UpdateAgencyStatusButton status={"rejected"}>
              Rejeter cette agence
            </UpdateAgencyStatusButton>
          </>
        )}
      </div>
    </>
  );
};

const UpdateAgencyStatusButton = ({
  children,
  status,
}: {
  children: ReactNode;
  status: "active" | "rejected";
}) => {
  const dispatch = useDispatch();
  const agency: AgencyDto | null = useAppSelector(agencyAdminSelectors.agency);
  return (
    <button
      className="fr-btn flex"
      //onClick={() => selectedAgency && validateAgency(selectedAgency)}
      onClick={() => {
        //setActivationButtonDisabled(true);
        if (!agency) return;
        dispatch(
          agencyAdminSlice.actions.updateAgencyRequested({
            ...agency,
            status,
          }),
        );
      }}
    >
      {children}
    </button>
  );
};
