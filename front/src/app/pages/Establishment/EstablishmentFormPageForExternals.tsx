import { EstablishmentCreationForm } from "./EstablishmentCreationForm";
import { Route } from "type-route";
import { routes } from "src/app/routing/routes";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import React from "react";
import { FormEstablishmentSource } from "shared/src/formEstablishment/FormEstablishment.dto";

type EstablishmentFormForExternalsProps = {
  route: Route<typeof routes.formEstablishmentForExternals>;
};

const externalConsumers: Partial<
  Record<FormEstablishmentSource, { isIframe: boolean }>
> = {
  cci: { isIframe: false },
  cma: { isIframe: false },
  "lesentreprises-sengagent": { isIframe: true },
};

export const EstablishmentFormPageForExternals = ({
  route,
}: EstablishmentFormForExternalsProps) => {
  const { params } = route;

  const consumer = params.consumer as FormEstablishmentSource;
  const consumerConfig = externalConsumers[consumer];

  if (!consumerConfig)
    return (
      <HeaderFooterLayout>
        <div
          role="alert"
          className="fr-alert fr-alert--info w-5/6 m-auto mt-10"
        >
          <p className="fr-alert__title">
            La source '{consumer}' n'est pas référencée. Êtes vous certain
            d’avoir la bonne url ?
          </p>
          <p>Veuillez contacter immersion facile pour être référencé.</p>
        </div>
      </HeaderFooterLayout>
    );

  if (consumerConfig.isIframe)
    return <EstablishmentCreationForm source={consumer} />;

  return (
    <HeaderFooterLayout>
      <EstablishmentCreationForm source={consumer} />
    </HeaderFooterLayout>
  );
};
