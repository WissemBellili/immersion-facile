import React, { useLayoutEffect } from "react";
import { CrispChat } from "react-design-system";
import { useDispatch } from "react-redux";
import { useFetchFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { appIsReadyAction } from "src/core-logic/domain/actions";
import { ENV } from "src/config/environmentVariables";
import { Router } from "./routes/Router";

const useAppIsReady = () => {
  const dispatch = useDispatch();
  useLayoutEffect(() => {
    dispatch(appIsReadyAction());
  }, []);
};
export const App = () => {
  useFetchFeatureFlags();
  useAppIsReady();

  return (
    <>
      <Router />
      {ENV.crispWebSiteId && <CrispChat crispWebsiteId={ENV.crispWebSiteId} />}
    </>
  );
};
