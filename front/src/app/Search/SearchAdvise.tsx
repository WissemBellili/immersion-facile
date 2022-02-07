import { Accordion, AccordionItem } from "@dataesr/react-dsfr";
import React from "react";
import homeVideoImage from "src/assets/home_video_image.jpg";
import { ImmersionHowTo } from "src/components/ImmersionHowTo";
import { SubTitle, Title } from "src/components/Title";

export const SearchAdvise = () => {
  return (
    <div>
      <OurAdvises />
      <ImmersionHowTo
        videoUrl="https://www.powtoon.com/embed/c8x7n7AR2XE/"
        videoImage={homeVideoImage}
      />
    </div>
  );
};

const OurAdvises = () => (
  <div className="flex justify-center items-center flex-col">
    <Title>Nos conseils pour décrocher une immersion</Title>
    <Accordion keepOpen={true} className="w-full max-w-3xl ">
      <AccordionItem
        title={
          <SubTitle>
            Comment contacter un employeur pour faire une immersion ?
          </SubTitle>
        }
      >
        <ul className="p-1">
          <li>
            Pour une petite entreprise, un artisan, un commerce, rendez-vous sur
            place et demandez à rencontrer le responsable.
          </li>
          <li>
            Dans une entreprise de plus grosse taille (plus de 10 salariés),
            appelez l’entreprise par téléphone et demandez à parler au
            responsable des ressources humaines.
          </li>
          <li>
            Bon à savoir : nous vous indiquons, quand nous avons cette
            information, le nombre de salariés de l’entreprise
          </li>
        </ul>
      </AccordionItem>
      <AccordionItem
        title={
          <SubTitle>Comment expliquer l'immersion à un employeur ?</SubTitle>
        }
      >
        <ul className="p-1">
          <li>
            C’est un stage d’observation, strictement encadré d’un point de vue
            juridique. Vous conservez votre statut et êtes couvert par votre
            Pôle emploi, votre Mission Locale ou le Conseil départemental (en
            fonction de votre situation).
          </li>
          <li>
            Le rôle de celui qui vous accueillera est de vous présenter le
            métier et de vérifier avec vous que ce métier vous convient en vous
            faisant des retours les plus objectifs possibles.
          </li>
          <li>
            Pendant la durée de votre présence, vous allez vous essayer aux
            gestes techniques du métier. Vous pouvez aussi aider les salariés en
            donnant un coup de main mais vous n’êtes pas là pour remplacer un
            collègue absent.
          </li>
        </ul>
      </AccordionItem>
    </Accordion>
  </div>
);
