import React from "react";
import { ImmersionApplicationForm } from "src/app/pages/ImmersionApplication/ImmersionApplicationForm";
import { ImmersionApplicationFormContainerLayout } from "src/app/pages/ImmersionApplication/ImmersionApplicationFormContainerLayout";
import { immersionApplicationInitialValuesFromUrl } from "src/app/pages/ImmersionApplication/immersionApplicationHooks";

import { routes } from "src/app/routing/routes";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { Route } from "type-route";
import { ImmersionApplicationDto } from "src/shared/ImmersionApplication/ImmersionApplication.dto";

export type ImmersionApplicationPageRoute = Route<
  typeof routes.immersionApplication
>;

export interface ImmersionApplicationPageProps {
  route: ImmersionApplicationPageRoute;
}

export type ImmersionApplicationPresentation = Exclude<
  Partial<ImmersionApplicationDto>,
  "id" | "rejectionJustification" | "legacySchedule"
> & {
  beneficiaryAccepted: boolean;
  enterpriseAccepted: boolean;
  jwt?: string;
  demandeId?: string;
};

export const ImmersionApplicationPage = ({
  route,
}: ImmersionApplicationPageProps) => {
  return (
    <HeaderFooterLayout>
      <ImmersionApplicationFormContainerLayout>
        <ImmersionApplicationForm
          properties={immersionApplicationInitialValuesFromUrl(route)}
        />
      </ImmersionApplicationFormContainerLayout>
    </HeaderFooterLayout>
  );
};
