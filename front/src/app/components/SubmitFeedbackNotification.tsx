import React from "react";
import { Notification } from "react-design-system";
import {
  SubmitFeedBack,
  isFeedbackError,
} from "src/core-logic/domain/SubmitFeedback";
import { fr } from "@codegouvfr/react-dsfr";

export type SubmitFeedbackProps<T extends string> = {
  submitFeedback: SubmitFeedBack<T>;
  messageByKind: Record<T, React.ReactNode>;
};

export const SubmitFeedbackNotification = <T extends string>({
  submitFeedback,
  messageByKind,
}: SubmitFeedbackProps<T>) => {
  if (submitFeedback.kind === "idle") return null;

  return (
    <div className={fr.cx("fr-mt-4w")}>
      {isFeedbackError(submitFeedback) ? (
        <Notification
          type="error"
          title="Désolé : nous n'avons pas été en mesure d'enregistrer vos informations. Veuillez réessayer ultérieurement"
        >
          {submitFeedback.errorMessage}
        </Notification>
      ) : (
        <Notification type="success" title="Succès">
          {messageByKind[submitFeedback.kind]}
        </Notification>
      )}
    </div>
  );
};
