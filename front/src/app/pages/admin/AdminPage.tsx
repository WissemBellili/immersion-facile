import React from "react";
import { NavLink, TabLinks } from "react-design-system";
import { ImmersionHeader } from "src/app/components/layout/ImmersionHeader";
import { AddEstablishmentByBatchTab } from "src/app/pages/admin/AddEstablishmentByBatchTab";
import { AgencyTab } from "src/app/pages/admin/AgencyTab";
import { ConventionTab, EventsTab } from "src/app/pages/admin/DashboardTabs";
import { DataExportTab } from "src/app/pages/admin/DataExportTab";
import { EmailPreviewTab } from "src/app/pages/admin/EmailPreviewTab";
import { EmailsTab } from "src/app/pages/admin/EmailsTab";
import { TechnicalOptions } from "src/app/pages/admin/TechnicalOptions";
import { AdminTab } from "src/app/routes/route-params";
import { routes } from "src/app/routes/routes";
import { ENV } from "src/config/environmentVariables";
import { Route } from "type-route";

const getAdminNavLinkId = (chunk: string) => `im-admin-nav__${chunk}`;

const getNavLinks = (currentTab: AdminTab): NavLink[] => [
  {
    label: "Conventions",
    active: currentTab === "conventions",
    ...routes.adminTab({ tab: "conventions" }).link,
    id: getAdminNavLinkId("conventions"),
  },
  {
    label: "Evénements",
    active: currentTab === "events",
    ...routes.adminTab({ tab: "events" }).link,
    id: getAdminNavLinkId("events"),
  },
  {
    label: "Agences",
    active: currentTab === "agency-validation",
    ...routes.adminTab({ tab: "agency-validation" }).link,
    id: getAdminNavLinkId("agency-validation"),
  },
  {
    label: "Export de données",
    active: currentTab === "exports",
    ...routes.adminTab({ tab: "exports" }).link,
    id: getAdminNavLinkId("exports"),
  },
  {
    label: "Options techniques",
    active: currentTab === "technical-options",
    ...routes.adminTab({ tab: "technical-options" }).link,
    id: getAdminNavLinkId("technical-options"),
  },
  ...(ENV.envType !== "production"
    ? [
        {
          label: "Emails",
          active: currentTab === "emails",
          ...routes.adminTab({ tab: "emails" }).link,
          id: getAdminNavLinkId("emails"),
        },
      ]
    : []),
  {
    label: "Aperçu email",
    active: currentTab === "email-preview",
    ...routes.adminTab({ tab: "email-preview" }).link,
    id: getAdminNavLinkId("email-preview"),
  },
  {
    label: "Ajout d'établissements groupés",
    active: currentTab === "establishment-batch",
    ...routes.adminTab({ tab: "establishment-batch" }).link,
    id: getAdminNavLinkId("establishment-batch"),
  },
];

const tabsByName: Record<AdminTab, () => JSX.Element> = {
  "agency-validation": () => <AgencyTab />,
  "email-preview": () => <EmailPreviewTab />,
  "establishment-batch": () => <AddEstablishmentByBatchTab />,
  "technical-options": () => <TechnicalOptions />,
  conventions: () => <ConventionTab />,
  emails: () => <EmailsTab />,
  events: () => <EventsTab />,
  exports: () => <DataExportTab />,
};

export const AdminPage = ({
  route,
}: {
  route: Route<typeof routes.adminTab>;
}) => {
  const currentTab = route.params.tab;

  return (
    <>
      <ImmersionHeader />
      <div className="fr-container">
        <div className="fr-mt-2w">
          <TabLinks
            navLinks={getNavLinks(currentTab)}
            navWrapper={{
              role: "navigation",
              id: "menu-admin",
              className: "fr-nav fr-nav--admin",
              ariaLabel: "Menu admin",
              style: {
                marginBottom: "1.5rem",
              },
            }}
          />
          <div className="fr-tab-content">{tabsByName[currentTab]()}</div>
        </div>
      </div>
    </>
  );
};
