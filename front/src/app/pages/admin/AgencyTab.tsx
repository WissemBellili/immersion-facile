import React from "react";
import { Notification } from "react-design-system";
import { AgencyDto } from "shared";

import { ActivateAgency } from "src/app/components/agency/ActivateAgency";
import { EditAgency } from "src/app/components/agency/EditAgency";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useAdminDashboard } from "src/app/pages/admin/useAdminDashboard";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { agencyAdminSelectors } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.selectors";

export const AgencyTab = () => {
  const agency = useAppSelector(agencyAdminSelectors.agency);

  return (
    <>
      <ActivateAgency />
      <EditAgency />

      {agency && <AgencyDashboard agency={agency} />}
    </>
  );
};

const AgencyDashboard = ({ agency }: { agency: AgencyDto }) => {
  const { url, error } = useAdminDashboard({
    name: "agency",
    agencyId: agency.id,
  });

  if (!agency) return null;

  return error ? (
    <Notification type="error" title="Erreur" children={error} />
  ) : (
    <MetabaseView title={agency.name} url={url} />
  );
};
