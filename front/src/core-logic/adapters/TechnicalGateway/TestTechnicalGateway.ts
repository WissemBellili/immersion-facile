import { Subject } from "rxjs";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";

import {
  AbsoluteUrl,
  BackOfficeJwt,
  FeatureFlags,
  SetFeatureFlagParams,
} from "shared";

export class TestTechnicalGateway implements TechnicalGateway {
  getAllFeatureFlags = () => this.featureFlags$;
  setFeatureFlag = (
    params: SetFeatureFlagParams,
    _adminToken: BackOfficeJwt,
  ) => {
    this.setFeatureFlagLastCalledWith = params;
    return this.setFeatureFlagResponse$;
  };

  // eslint-disable-next-line @typescript-eslint/require-await
  uploadLogo = async (file: File): Promise<AbsoluteUrl> => {
    // eslint-disable-next-line no-console
    console.log("file uploaded : ", file);
    return `http://${file.name}-url`;
  };

  // test purposes only
  public featureFlags$ = new Subject<FeatureFlags>();
  public setFeatureFlagResponse$ = new Subject<void>();
  public setFeatureFlagLastCalledWith: SetFeatureFlagParams | undefined =
    undefined;
}
