import React from "react";
import { AdminPage } from "src/app/pages/admin/AdminPage";
import { AddAgencyPage } from "src/app/pages/Agency/AddAgencyPage";
import { ConventionImmersionPage } from "src/app/pages/Convention/ConventionImmersionPage";
import { ConventionMiniStagePage } from "src/app/pages/Convention/ConventionMiniStagePage";
import { ConventionPageForUkraine } from "src/app/pages/Convention/ConventionPageForUkraine";
import { ConventionSignPage } from "src/app/pages/Convention/ConventionSignPage";
import { ConventionValidatePage } from "src/app/pages/Convention/ConventionValidatePage";
import { ErrorRedirectPage } from "src/app/pages/Error/ErrorRedirectPage";
import { EstablishmentEditionFormPage } from "src/app/pages/Establishment/EstablishmentEditionFormPage";
import { EstablishmentFormPageForExternals } from "src/app/pages/Establishment/EstablishmentFormPageForExternals";
import { SearchPage } from "src/app/pages/Search/SearchPage";
import { LandingEstablishmentPage } from "src/app/pages/Static/LandingEstablishmentPage";
import { StatsPage } from "src/app/pages/StatsPage";
import { PrivateRoute } from "src/app/components/layout/PrivateRoute";
import { RenewExpiredLinkPage } from "src/app/pages/RenewExpiredLinkPage";
import { EstablishmentFormPage } from "../pages/Establishment/EstablishmentFormPage";
import { HomePage } from "../pages/home/HomePage";
import { ImmersionAssessmentPage } from "../pages/immersionAssessment/ImmersionAssessmentPage";
import { routes, useRoute } from "./routes";

const NotAvailable = () => <div>Cette page n'est pas disponible.</div>;

export const Router = () => {
  const route = useRoute();

  return (
    <>
      {route.name === false && <NotAvailable />}
      {route.name === "addAgency" && <AddAgencyPage />}
      {route.name === "adminTab" && (
        <PrivateRoute>
          <AdminPage route={route} />
        </PrivateRoute>
      )}
      {route.name === "adminRoot" &&
        routes.adminTab({ tab: "conventions" }).replace()}
      {route.name === "editFormEstablishment" && (
        <EstablishmentEditionFormPage route={route} />
      )}
      {route.name === "errorRedirect" && <ErrorRedirectPage route={route} />}
      {route.name === "formEstablishment" && (
        <EstablishmentFormPage route={route} />
      )}
      {route.name === "formEstablishmentForExternals" && (
        <EstablishmentFormPageForExternals route={route} />
      )}
      {route.name === "home" && <HomePage type="default" />}
      {route.name === "homeCandidates" && <HomePage type="candidate" />}
      {route.name === "homeEstablishments" && <HomePage type="establishment" />}
      {route.name === "homeAgencies" && <HomePage type="agency" />}
      {route.name === "landingEstablishment" && <LandingEstablishmentPage />}
      {route.name === "conventionImmersion" && (
        <ConventionImmersionPage route={route} />
      )}
      {route.name === "conventionMiniStage" && (
        <ConventionMiniStagePage route={route} />
      )}
      {route.name === "conventionForUkraine" && (
        <ConventionPageForUkraine route={route} />
      )}
      {route.name === "conventionToValidate" && (
        <ConventionValidatePage route={route} />
      )}
      {route.name === "conventionToSign" && (
        <ConventionSignPage route={route} />
      )}
      {route.name === "immersionAssessment" && (
        <ImmersionAssessmentPage route={route} />
      )}
      {route.name === "renewConventionMagicLink" && (
        <RenewExpiredLinkPage route={route} />
      )}
      {route.name === "search" && <SearchPage route={route} />}
      {route.name === "stats" && <StatsPage />}
    </>
  );
};
