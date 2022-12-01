import React, { useEffect } from "react";

import { ButtonHome, Link } from "react-design-system/immersionFacile";
import { useDispatch } from "react-redux";
import { Section } from "src/app/components/Section";
import { establishmentSlice } from "src/core-logic/domain/establishmentPath/establishment.slice";
import { EstablishmentSubTitle } from "./forms/establishment/EstablishmentSubTitle";
import { EstablishmentTitle } from "./forms/establishment/EstablishmentTitle";
import { routes } from "../routes/routes";
import { useEstablishmentSiret } from "src/app/hooks/siret.hooks";
import { SiretFetcherInput } from "src/app/components/SiretFetcherInput";

export const EstablishmentHomeMenu = () => {
  const shouldFetchEvenIfAlreadySaved = false;
  const { isReadyForRequestOrRedirection, clearSiret, modifyLinkWasSent } =
    useEstablishmentSiret({
      shouldFetchEvenIfAlreadySaved,
    });
  const dispatch = useDispatch();

  useEffect(clearSiret, []);
  const styleType = "establishment";

  return (
    <Section type={styleType} className="max-h-[300px]">
      <div className="flex flex-col">
        <EstablishmentTitle type={styleType} text="ENTREPRISE" />
        {!modifyLinkWasSent && (
          <EstablishmentSubTitle
            type={styleType}
            text="Vous souhaitez accueillir un candidat"
          />
        )}
      </div>
      <div className="flex flex-col w-full h-full items-center justify-center">
        {!isReadyForRequestOrRedirection ? (
          <ul className="fr-btns-group">
            <li>
              <ButtonHome
                onClick={() => {
                  dispatch(establishmentSlice.actions.gotReady());
                }}
              >
                Devenez entreprise accueillante
              </ButtonHome>
            </li>
            <li>
              <ButtonHome
                type="establishment-secondary"
                onClick={() => {
                  dispatch(establishmentSlice.actions.gotReady());
                }}
              >
                Modifier vos informations
              </ButtonHome>
            </li>
          </ul>
        ) : (
          <SiretFetcherInput
            shouldFetchEvenIfAlreadySaved={shouldFetchEvenIfAlreadySaved}
            placeholder={"SIRET de votre entreprise"}
          />
        )}
      </div>
      {!modifyLinkWasSent && (
        <div className="pb-4">
          <Link
            text="En savoir plus"
            url={routes.landingEstablishment().link}
          />
        </div>
      )}
    </Section>
  );
};
