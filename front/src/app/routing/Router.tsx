import React from "react";
import { SearchDebugPage } from "src/app/components/SearchDebugPage";
import { AdminPage } from "src/app/pages/admin/AdminPage";
import { AdminVerificationPage } from "src/app/pages/admin/AdminVerificationPage";
import { AddAgencyPage } from "src/app/pages/Agency/AddAgencyPage";
import { EstablishmentEditionFormPage } from "src/app/pages/Establishment/EstablishmentEditionFormPage";
import { EstablishmentFormImmersionFacilePage } from "src/app/pages/Establishment/EstablishmentFormImmersionFacilePage";
import { EstablishmentFormPageForExternals } from "src/app/pages/Establishment/EstablishmentFormPageForExternals";
import { ImmersionApplicationPage } from "src/app/pages/ImmersionApplication/ImmersionApplicationPage";
import { ImmersionApplicationPageForUkraine } from "src/app/pages/ImmersionApplication/ImmersionApplicationPageForUkraine";
import { ImmersionApplicationSignPage } from "src/app/pages/ImmersionApplication/ImmersionApplicationSignPage";
import { ImmersionApplicationValidatePage } from "src/app/pages/ImmersionApplication/ImmersionApplicationValidatePage";
import { SearchPage } from "src/app/pages/Search/SearchPage";
import { HomePage } from "src/app/pages/Static/HomePage";
import { LandingEstablishmentPage } from "src/app/pages/Static/LandingEstablishmentPage";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { featureFlagsSelector } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import { ENV } from "src/environmentVariables";
import { RenewExpiredLinkPage } from "src/helpers/RenewExpiredLinkPage";
import { useRoute } from "./routes";

const { envType } = ENV;

const NotAvailable = () => <div>Cette page n'est pas disponible.</div>;

export const Router = () => {
  const route = useRoute();
  const featureFlags = useAppSelector(featureFlagsSelector);

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
        <EstablishmentFormImmersionFacilePage />
      )}
      {route.name === "formEstablishmentForExternals" && (
        <EstablishmentFormPageForExternals route={route} />
      )}
      {route.name === "home" && <HomePage showDebugInfo={envType === "DEV"} />}

      {route.name === "landingEstablishment" && <LandingEstablishmentPage />}
      {route.name === "immersionApplication" && (
        <ImmersionApplicationPage route={route} />
      )}
      {route.name === "immersionApplicationForUkraine" && (
        <ImmersionApplicationPageForUkraine route={route} />
      )}
      {route.name === "immersionApplicationsToValidate" && (
        <ImmersionApplicationValidatePage route={route} />
      )}
      {route.name === "immersionApplicationsToSign" && (
        <ImmersionApplicationSignPage route={route} />
      )}
      {route.name === "renewMagicLink" && (
        <RenewExpiredLinkPage route={route} />
      )}
      {route.name === "search" && <SearchPage />}
      {envType === "DEV" && route.name === "searchDebug" && <SearchDebugPage />}
    </>
  );
};
