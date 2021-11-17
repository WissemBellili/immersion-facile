import React, { useState } from "react";
import { routes } from "src/app/routes";
import { Button } from "src/components/Button";
import { ErrorMessage } from "src/components/form/ErrorMessage";
import { Route } from "type-route";
import { immersionApplicationGateway } from "../app/dependencies";
import { parseSearchParams } from "../app/parseSearchParams";

interface RenewExpiredLinkProps {
  route: Route<typeof routes.renewMagicLink>;
}

export const RenewExpiredLink = ({ route }: RenewExpiredLinkProps) => {
  // Flag that tracks if the link renewal had already been requested.
  const [requested, setRequested] = useState(false);
  // Tracks the success of the server request.
  const [requestSuccessful, setRequestSuccessful] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onClick = async () => {
    if (location.search.length === 0) {
      setErrorMessage("URL invalide");
      return;
    }

    const params = parseSearchParams(location.search);
    if (!params.id || !params.role) {
      setRequestSuccessful(false);
      setErrorMessage("URL invalide");
      return;
    }

    setRequested(true);
    immersionApplicationGateway
      .renewMagicLink(params.id, params.role)
      .then(() => {
        setRequestSuccessful(true);
      })
      .catch((e) => {
        setErrorMessage(e.message);
        setRequestSuccessful(true);
        setRequested(false);
      });
  };

  return (
    <>
      <div style={{ whiteSpace: "pre-line" }}>
        Votre lien a périmé. Voulez-vous recevoir un nouveau lien ?{" "}
      </div>
      {!requestSuccessful && (
        <Button disable={requested} onSubmit={onClick}>
          Demander un nouveau lien
        </Button>
      )}

      {requestSuccessful && (
        <p>
          Votre demande est enregistrée. Vous recevra une message avec le
          nouveau lien dans quelques instants.{" "}
        </p>
      )}
      {errorMessage && (
        <ErrorMessage title="Désolé: Erreur de traitement sur la plateforme, veuillez réessayer">
          {errorMessage}
        </ErrorMessage>
      )}
    </>
  );
};
