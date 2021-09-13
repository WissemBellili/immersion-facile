import { throwIfNotInArray } from "src/shared/envHelpers";
import { getFeatureFlags } from "src/shared/featureFlags";

const windowEnv = (window as any)._env_;

const gateway = throwIfNotInArray({
  processEnv: windowEnv,
  authorizedValues: ["HTTP", "IN_MEMORY"],
  variableName: "GATEWAY",
});

export const ENV = {
  dev: import.meta.env.DEV,
  gateway,
  featureFlags: getFeatureFlags(windowEnv),
};
