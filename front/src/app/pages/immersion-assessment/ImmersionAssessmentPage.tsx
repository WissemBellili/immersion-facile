import React from "react";
import { Loader, MainWrapper, Notification } from "react-design-system";
import {
  ConventionMagicLinkPayload,
  decodeMagicLinkJwtWithoutSignatureCheck,
} from "shared";
import { ImmersionAssessmentForm } from "src/app/components/forms/immersion-assessment/ImmersionAssessmentForm";
import { ImmersionDescription } from "src/app/components/forms/immersion-assessment/ImmersionDescription";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useConvention } from "src/app/hooks/convention.hooks";
import { ShowErrorOrRedirectToRenewMagicLink } from "src/app/pages/convention/ShowErrorOrRedirectToRenewMagicLink";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";

type ImmersionAssessmentRoute = Route<typeof routes.immersionAssessment>;

interface ImmersionAssessmentPageProps {
  route: ImmersionAssessmentRoute;
}

export const ImmersionAssessmentPage = ({
  route,
}: ImmersionAssessmentPageProps) => {
  const { role } =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionMagicLinkPayload>(
      route.params.jwt,
    );
  const { convention, fetchConventionError, isLoading } = useConvention(
    route.params.jwt,
  );
  const canCreateAssessment = convention?.status === "ACCEPTED_BY_VALIDATOR";
  const hasRight =
    role === "establishment" || role === "establishment-representative";

  if (fetchConventionError)
    return (
      <ShowErrorOrRedirectToRenewMagicLink
        errorMessage={fetchConventionError}
        jwt={route.params.jwt}
      />
    );

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="boxed">
        {!hasRight ? (
          <Notification type="error" title="Erreur">
            Vous n'êtes pas autorisé a accéder à cette page
          </Notification>
        ) : (
          <>
            {convention && !canCreateAssessment && (
              <Notification
                type="error"
                title="Votre convention n'est pas prête à recevoir un bilan"
              >
                Seule une convention entièrement validée peut recevoir un bilan
              </Notification>
            )}
            {convention && (
              <h1>
                {convention.internshipKind === "immersion"
                  ? "Bilan de l'immersion"
                  : "Bilan du mini-stage"}{" "}
                de {convention.signatories.beneficiary.firstName}
                {convention.signatories.beneficiary.lastName}
              </h1>
            )}
            {canCreateAssessment && (
              <>
                <ImmersionDescription convention={convention} />
                <ImmersionAssessmentForm
                  convention={convention}
                  jwt={route.params.jwt}
                />
              </>
            )}
          </>
        )}
        {isLoading && <Loader />}
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
