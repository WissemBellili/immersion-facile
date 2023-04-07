import React from "react";
import { CopyLink } from "src/app/components/forms/convention/CopyLink";
import { ShareLinkByEmail } from "src/app/components/forms/convention/ShareLinkByEmail";

import { FederatedIdentity, isPeConnectIdentity } from "shared";

export const ShareActions = (props: {
  isFrozen?: boolean;
  federatedIdentity?: FederatedIdentity;
}) => {
  if (props.isFrozen) return null;
  if (isPeConnectIdentity(props.federatedIdentity)) return null;

  return (
    <>
      <CopyLink />
      <ShareLinkByEmail />
    </>
  );
};
