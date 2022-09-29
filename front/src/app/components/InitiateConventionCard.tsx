import { keys } from "ramda";
import React from "react";
import { ButtonHome } from "react-design-system";
import { Section } from "src/app/components/Section";
import { deviceRepository } from "src/app/config/dependencies";
import { ConventionImmersionPageRoute } from "src/app/pages/Convention/ConventionImmersionPage";
import { PeConnectButton } from "src/app/pages/Convention/PeConnectButton";
import { EstablishmentSubTitle } from "src/app/pages/home/components/EstablishmentSubTitle";
import { useRoute } from "src/app/routing/routes";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { useRedirectToConventionWithoutIdentityProvider } from "src/hooks/redirections.hooks";

const storeConventionRouteParamsOnDevice = (
  routeParams: ConventionImmersionPageRoute["params"],
) => {
  const { federatedIdentity, jwt, ...partialConvention } = routeParams;
  if (keys(partialConvention).length) {
    deviceRepository.set("partialConventionInUrl", partialConvention);
  }
};

type InitiateConventionCardProps = {
  title: string;
  peConnectNotice: string;
  showFormButtonLabel: string;
  otherCaseNotice: string;
};

export const InitiateConventionCard = ({
  title,
  peConnectNotice,
  showFormButtonLabel,
  otherCaseNotice,
}: InitiateConventionCardProps) => {
  const { enablePeConnectApi } = useFeatureFlags();
  const currentRoute = useRoute();
  const redirectToConventionWithoutIdentityProvider =
    useRedirectToConventionWithoutIdentityProvider();

  return (
    <Section type="candidate">
      <EstablishmentSubTitle type={"candidateForm"} text={title} />
      <div className="flex flex-col w-full h-full items-center justify-center">
        {enablePeConnectApi && (
          <>
            <p className="text-center text-sm fr-mb-2w">{peConnectNotice}</p>
            <PeConnectButton
              onClick={() => {
                if (currentRoute.name === "conventionImmersion")
                  storeConventionRouteParamsOnDevice(currentRoute.params);
              }}
            />
            <a
              className="small mt-1"
              href="https://candidat.pole-emploi.fr/compte/identifiant/choixcontact"
              target="_blank"
            >
              Je ne connais pas mes identifiants
            </a>
            <strong className="pt-4">ou bien</strong>
            <p className="text-center text-sm fr-my-2w">{otherCaseNotice}</p>
          </>
        )}
        {/*TODO : change HomeButton to take 'candidate' and 'establishment' as type params ('error' is very confusing here...)*/}
        <ButtonHome
          type="candidate"
          onClick={redirectToConventionWithoutIdentityProvider}
        >
          {showFormButtonLabel}
        </ButtonHome>
      </div>
    </Section>
  );
};
