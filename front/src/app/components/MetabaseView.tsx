import React from "react";
import { DsfrTitle } from "react-design-system";
import { AbsoluteUrl } from "shared";

export const MetabaseView = ({
  title,
  url,
}: {
  url?: AbsoluteUrl;
  title: string;
}) =>
  url ? (
    <div>
      <DsfrTitle level={5} text={title} />
      <iframe src={url} frameBorder="0" width="100%" height="800"></iframe>
    </div>
  ) : (
    <p>Chargement...</p>
  );
