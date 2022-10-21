import { CircularProgress } from "@mui/material";
import React from "react";
import {
  MainWrapper,
  Notification,
  Title,
} from "react-design-system/immersionFacile";
import { ConventionMagicLinkPayload } from "shared";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { routes } from "src/app/routing/routes";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import { useConvention } from "src/hooks/convention.hooks";
import { Route } from "type-route";
import { ImmersionAssessmentForm } from "./components/ImmersionAssessmentForm";
import { ImmersionDescription } from "./components/ImmersionDescription";

type ImmersionAssessmentRoute = Route<typeof routes.immersionAssessment>;

interface ImmersionAssessmentPageProps {
  route: ImmersionAssessmentRoute;
}

export const ImmersionAssessmentPage = ({
  route,
}: ImmersionAssessmentPageProps) => {
  const { role } = decodeJwt<ConventionMagicLinkPayload>(route.params.jwt);
  const { convention, fetchConventionError, isLoading } = useConvention(
    route.params.jwt,
  );
  const canCreateAssessment = convention?.status === "ACCEPTED_BY_VALIDATOR";
  const hasRight =
    role === "establishment" || role === "establishment-representative";
  return (
    <HeaderFooterLayout>
      <MainWrapper className="fr-container fr-grid--center">
        <div className="fr-grid-row fr-grid-row--center">
          <div className="fr-col-lg-7 fr-px-2w">
            {!hasRight ? (
              <Notification type="error" title="Erreur">
                Vous n'êtes pas autorisé a accéder à cette page
              </Notification>
            ) : (
              <>
                {fetchConventionError && (
                  <Notification type="error" title="Erreur">
                    {fetchConventionError}
                  </Notification>
                )}
                {convention && !canCreateAssessment && (
                  <Notification
                    type="error"
                    title="Votre convention n'est pas prête à recevoir un bilan"
                  >
                    Seule une convention entièrement validée peut recevoir un
                    bilan
                  </Notification>
                )}
                <Title>
                  Bilan de l'immersion
                  {convention
                    ? ` de ${convention.signatories.beneficiary.firstName} ${convention.signatories.beneficiary.lastName}`
                    : ""}
                </Title>
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
            {isLoading && <CircularProgress />}
          </div>
        </div>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
