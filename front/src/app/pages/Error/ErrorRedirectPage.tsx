import React, { ReactNode } from "react";
import { isManagedError } from "shared/src/errors/managedErrors";
import { ContainerLayout } from "src/app/layouts/ContainerLayout";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { routes } from "src/app/routing/routes";
import { Route } from "type-route";
import { ManagedErrorSelector } from "./ManagedErrors";

export type ErrorRedirectRoute = Route<typeof routes.errorRedirect>;

interface ErrorRedirectProps {
  route: ErrorRedirectRoute;
}

export const ErrorRedirectPage = ({ route }: ErrorRedirectProps) => (
  <HeaderFooterLayout>
    <ContainerLayout>{renderer({ route })}</ContainerLayout>
  </HeaderFooterLayout>
);

const renderer = ({ route }: ErrorRedirectProps): ReactNode =>
  isManagedError(route.params.kind) ? (
    <ManagedErrorSelector kind={route.params.kind} />
  ) : (
    <RedirectErrorFromUrl {...propertiesFromUrl(route)} />
  );

type RedirectErrorProps = {
  message: string;
  title: string;
};

const RedirectErrorFromUrl = (error: RedirectErrorProps) => (
  <div role="alert" className={`fr-alert fr-alert--error`}>
    <p className="fr-alert__title">{error.title}</p>
    {`${error.message}`}
  </div>
);

const propertiesFromUrl = (route: ErrorRedirectRoute): RedirectErrorProps => ({
  message: route.params.message ?? "Une erreur inattendue est survenue",
  title: route.params.title ?? "Une erreur est survenue",
});
