import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { MainWrapper } from "react-design-system";
import { ConventionForm } from "src/app/components/forms/convention/ConventionForm";
import { conventionInitialValuesFromUrl } from "src/app/components/forms/convention/conventionHelpers";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { Route } from "type-route";

export type ConventionCustomAgencyPageRoute = Route<
  typeof routes.conventionCustomAgency
>;

export const ConventionCustomAgencyPage = ({
  route,
}: {
  route: ConventionCustomAgencyPageRoute;
}) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(conventionSlice.actions.preselectedAgencyIdRequested());
  }, []);
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="boxed">
        <ConventionForm
          properties={conventionInitialValuesFromUrl({
            route,
            internshipKind: "immersion",
          })}
          routeParams={route.params}
        />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};