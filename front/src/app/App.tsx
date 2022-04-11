import React from "react";
import { store } from "src/app/config/dependencies";
import {
  FeatureFlagsContext,
  useFetchFeatureFlags,
} from "./utils/FeatureFlagContext";
import { Navigation } from "./components/Navigation";
import { Router } from "./routing/Router";
import { Provider } from "react-redux";
import { ENV } from "src/environmentVariables";

const { dev } = ENV;

export const App = () => {
  const featureFlags = useFetchFeatureFlags();

  return (
    <Provider store={store}>
      <FeatureFlagsContext.Provider value={featureFlags}>
        {dev && <Navigation />}
        <Router />
      </FeatureFlagsContext.Provider>
    </Provider>
  );
};
