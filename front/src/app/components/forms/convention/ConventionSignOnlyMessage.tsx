import React from "react";
import { useFormContext } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";

import { ConventionReadDto } from "shared";

type SignOnlyMessageProps = {
  isAlreadySigned: boolean;
};

export const ConventionSignOnlyMessage = ({
  isAlreadySigned,
}: SignOnlyMessageProps) => {
  const { getValues } = useFormContext<ConventionReadDto>();
  const t = useConventionTexts(getValues().internshipKind);

  return (
    <div role="alert" className={fr.cx("fr-alert", "fr-alert--info")}>
      <p className={fr.cx("fr-alert__title")}>
        {isAlreadySigned
          ? t.conventionAlreadySigned
          : t.conventionReadyToBeSigned}
      </p>
      <p>
        {`${t.conventionNotEditable} ` +
          (isAlreadySigned
            ? t.conventionAlreadySigned
            : t.conventionToSignOrAskForChanges)}
      </p>
    </div>
  );
};
