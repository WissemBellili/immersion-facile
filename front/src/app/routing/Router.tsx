import React from "react";
import { SearchDebugPage } from "src/app/components/SearchDebugPage";
import { AdminPage } from "src/app/pages/admin/AdminPage";
import { AdminVerificationPage } from "src/app/pages/admin/AdminVerificationPage";
import { AddAgencyPage } from "src/app/pages/Agency/AddAgencyPage";
import { EstablishmentEditionFormPage } from "src/app/pages/Establishment/EstablishmentEditionFormPage";
import { EstablishmentFormPageForExternals } from "src/app/pages/Establishment/EstablishmentFormPageForExternals";
import { ConventionPage } from "src/app/pages/Convention/ConventionPage";
import { ConventionPageForUkraine } from "src/app/pages/Convention/ConventionPageForUkraine";
import { ConventionSignPage } from "src/app/pages/Convention/ConventionSignPage";
import { ConventionValidatePage } from "src/app/pages/Convention/ConventionValidatePage";
import { SearchPage } from "src/app/pages/Search/SearchPage";
import { LandingEstablishmentPage } from "src/app/pages/Static/LandingEstablishmentPage";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { ENV } from "src/environmentVariables";
import { RenewExpiredLinkPage } from "src/helpers/RenewExpiredLinkPage";
import { EstablishmentFormPage } from "../pages/Establishment/EstablishmentFormPage";
import { HomePage } from "../pages/home/HomePage";
import { ImmersionAssessmentPage } from "../pages/immersionAssessment/ImmersionAssessmentPage";
import { useRoute } from "./routes";

const { frontEnvType } = ENV;

const NotAvailable = () => <div>Cette page n'est pas disponible.</div>;

export const Router = () => {
  const route = useRoute();
  const featureFlags = useFeatureFlags();

  return (
    <>
      {route.name === false && <NotAvailable />}
      {route.name === "addAgency" && <AddAgencyPage />}
      {route.name === "admin" && <AdminPage route={route} />}
      {route.name === "adminVerification" &&
        (featureFlags.enableAdminUi ? (
          <AdminVerificationPage route={route} />
        ) : (
          <NotAvailable />
        ))}
      {route.name === "agencyAdmin" &&
        (featureFlags.enableAdminUi ? (
          <AdminPage route={route} />
        ) : (
          <NotAvailable />
        ))}
      {route.name === "editFormEstablishment" && (
        <EstablishmentEditionFormPage route={route} />
      )}
      {route.name === "formEstablishment" && (
        <EstablishmentFormPage route={route} />
      )}
      {route.name === "formEstablishmentForExternals" && (
        <EstablishmentFormPageForExternals route={route} />
      )}
      {route.name === "home" && <HomePage />}

      {route.name === "landingEstablishment" && <LandingEstablishmentPage />}
      {route.name === "convention" && <ConventionPage route={route} />}
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
      {route.name === "renewMagicLink" && (
        <RenewExpiredLinkPage route={route} />
      )}
      {route.name === "search" && <SearchPage />}
      {frontEnvType === "DEV" && route.name === "searchDebug" && (
        <SearchDebugPage />
      )}
    </>
  );
};
