import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { dashboardUrlsSlice } from "src/core-logic/domain/admin/dashboardUrls/dashboardUrls.slice";

import { GetAdminDashboardParams } from "shared";

export const useAdminDashboard = (params: GetAdminDashboardParams) => {
  const dashboardUrls = useAppSelector(adminSelectors.dashboardUrls.urls);
  const dashboardError = useAppSelector(adminSelectors.dashboardUrls.error);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(dashboardUrlsSlice.actions.dashboardUrlRequested(params));
  }, [params.name]);

  return {
    url: dashboardUrls[params.name] ?? undefined,
    error: dashboardError,
  };
};
