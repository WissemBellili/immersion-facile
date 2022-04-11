import React, { useContext, useEffect, useState } from "react";
import { featureFlagGateway } from "src/app/config/dependencies";
import { FeatureFlags } from "src/shared/featureFlags";

const defaultFeatureFlags: FeatureFlags = {
  enableAdminUi: false,
  enableInseeApi: true,
  enablePeConnectApi: false,
};

export const useFetchFeatureFlags = () => {
  const [featureFlags, setFeatureFlags] =
    useState<FeatureFlags>(defaultFeatureFlags);

  useEffect(() => {
    featureFlagGateway.getAll().then(setFeatureFlags);
  }, []);

  return featureFlags;
};

export const FeatureFlagsContext = React.createContext(defaultFeatureFlags);

export const useFeatureFlagsContext = () => {
  const featureFlagContext = useContext(FeatureFlagsContext);
  if (!featureFlagContext) {
    throw new Error(
      "usePostsContext must be used within the PostsContext.Provider",
    );
  }
  return featureFlagContext;
};
