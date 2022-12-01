import React, { ReactNode } from "react";

export const ContainerLayout = ({ children }: { children: ReactNode }) => (
  <>
    <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
      <div className="fr-col-lg-8 fr-p-2w">{children}</div>
    </div>
  </>
);
