import { useAppSelector } from "src/app/utils/reduxHooks";
import { featureFlagsSelector } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import { loginPeConnect } from "shared/src/routes";
import React from "react";

export const PeConnect = () => {
  const featureFlags = useAppSelector(featureFlagsSelector);

  if (!featureFlags.enablePeConnectApi) return null;
  return (
    <>
      <div className="fr-text">
        <p>
          <b>
            Initier une demande de convention avec PeConnect
          </b>
        </p>
      </div>

      <div className="pe-connect flex justify-center">
        <a
          href={`/api/${loginPeConnect}`}
          className="button-pe-connect"
          title=""
        >
          <img
            className="icon-pe-connect"
            src="/pe-connect-barre-nav-b.svg"
            alt=""
            width="300"
            height="75"
          />
          <img
            className="icon-pe-connect-hover"
            src="/pe-connect-barre-nav-b-o.svg"
            alt=""
            width="300"
            height="75"
          />
        </a>
      </div>
    </>
  );
};
