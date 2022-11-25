import React from "react";
import {
  FixedStamp,
  HeroHeader,
  HeroHeaderNavCard,
  MainWrapper,
  SectionFaq,
  SectionStats,
  SectionTextEmbed,
} from "react-design-system/immersionFacile";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { routes } from "src/app/routing/routes";
import logoLeMoisLesEntreprises from "/src/assets/img/logo-le-mois-les-entreprises.svg";
import {
  heroHeaderContent,
  heroHeaderNavCards,
  sectionFaqData,
  sectionStatsData,
} from "./data/content";
import { useDispatch } from "react-redux";
import { SiretModal, useSiretModal } from "src/app/components/SiretModal";
import {
  PeConnectModal,
  usePeConnectModal,
} from "src/app/components/PeConnectModal";

import { AnyAction, Dispatch } from "@reduxjs/toolkit";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";

export type UserType = "default" | "candidate" | "establishment" | "agency";

type HomePageProps = {
  type: UserType;
};

export const HomePage = ({ type }: HomePageProps) => {
  const featureFlags = useFeatureFlags();
  const storeDispatch = useDispatch();
  const { modalState: siretModalState, dispatch: siretModalDispatch } =
    useSiretModal();
  const { modalState: peConnectModalState, dispatch: peConnectModalDispatch } =
    usePeConnectModal();
  const heroHeaderNavCardsWithDispatch = heroHeaderNavCards(
    storeDispatch,
    siretModalDispatch as Dispatch<AnyAction>,
    peConnectModalDispatch as Dispatch<AnyAction>,
  );
  const { title, subtitle, displayName, icon, illustration } =
    heroHeaderContent[type];
  const sectionStatsDataForType = sectionStatsData[type];
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="fullscreen" vSpacing={0} useBackground>
        <HeroHeader
          title={title}
          description={subtitle}
          illustration={illustration}
          type={type}
          typeDisplayName={displayName}
          icon={icon}
          patterns
          navCards={heroHeaderNavCardsWithDispatch[type] as HeroHeaderNavCard[]}
          parallax
          siretModal={
            <SiretModal
              modalState={siretModalState}
              dispatch={siretModalDispatch}
            />
          }
          peConnectModal={
            <PeConnectModal
              modalState={peConnectModalState}
              dispatch={peConnectModalDispatch}
            />
          }
        />
        <SectionStats stats={sectionStatsDataForType} />
        <SectionTextEmbed iframeUrl="https://www.powtoon.com/embed/c8x7n7AR2XE/" />
        <SectionFaq articles={sectionFaqData} />
      </MainWrapper>
      {featureFlags.enableTemporaryOperation && (
        <FixedStamp
          image={
            <img
              src={logoLeMoisLesEntreprises}
              alt="Le mois - Les entreprises s'engagent"
            />
          }
          overtitle="Devenez"
          title="entreprise accueillante"
          subtitle="Ouvrez vos portes aux talents de demain"
          link={routes.landingEstablishment().link}
        />
      )}
    </HeaderFooterLayout>
  );
};
