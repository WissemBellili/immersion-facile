import { ErrorMessage } from "../../components/form/ErrorMessage";
import { SuccessMessage } from "../../components/form/SuccessMessage";
import React from "react";

export type SuccessFeedbackKind =
  | "justSubmitted"
  | "signedSuccessfully"
  | "modificationsAsked";

type SubmitFeedbackProps = {
  submitFeedback: SuccessFeedbackKind | Error | null;
};

export const SubmitFeedback = ({ submitFeedback }: SubmitFeedbackProps) => {
  if (submitFeedback === null) return null;

  return (
    <>
      {submitFeedback instanceof Error ? (
        <ErrorMessage title="Désolé : nous n'avons pas été en mesure d'enregistrer vos informations. Veuillez réessayer ultérieurement">
          {getErrorMessage(submitFeedback)}
        </ErrorMessage>
      ) : (
        <SuccessMessage title="Succès de l'envoi">
          {messageByKind[submitFeedback]}
        </SuccessMessage>
      )}
    </>
  );
};

const InitialSubmitSuccessMessage = () => (
  <>
    Merci d'avoir complété cette demande de convention.
    <br />
    <br />
    <ul>
      <li>
        Vous devez maintenant confirmer et signer cette demande (un mail avec
        lien de confirmation vous a été envoyé).
      </li>
      <li>
        Votre tuteur doit confirmer et signer cette demande (un mail avec lien
        de confirmation lui a été envoyé).
      </li>
    </ul>
    <br />
    <i>
      N'hésitez pas à prévenir et relancer votre tuteur, sans votre signature et
      celle de l'entreprise, la demande ne peut pas être étudiée par votre
      conseiller.
    </i>
    <br />
    <br />
    Pensez à vérifier votre boîte mail et vos spams.
    <br /> Si vous ne recevez rien, alertez nous:{" "}
    <a href="mailto:contact@immersion-facile.beta.gouv.fr">
      contact@immersion-facile.beta.gouv.fr
    </a>
  </>
);

const messageByKind: Record<SuccessFeedbackKind, React.ReactNode> = {
  justSubmitted: <InitialSubmitSuccessMessage />,
  modificationsAsked: "Vous avez renvoyé la demande pour modification.",
  signedSuccessfully: "Votre accord a été enregistré.",
};

const getErrorMessage = (submitError: Error) => {
  return (submitError as any)?.response?.data?.errors ?? submitError?.message;
};
