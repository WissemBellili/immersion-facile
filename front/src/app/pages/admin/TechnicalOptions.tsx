import { keys } from "ramda";
import React from "react";
import { Switch } from "react-design-system/src/designSystemFrance/components/Switch";
import { useDispatch } from "react-redux";
import { FeatureFlag } from "shared";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";
import { featureFlagsSlice } from "src/core-logic/domain/featureFlags/featureFlags.slice";

const labelsByFeatureFlag: Record<FeatureFlag, string> = {
  enableAdminUi: "Ui Admin",
  enableInseeApi: "API insee (siret)",
  enableLogoUpload: "Upload de logos (pour agences)",
  enablePeConnectApi: "PE Connect",
  enablePeConventionBroadcast: "Diffusion des Conventions à Pole Emploi",
};

export const TechnicalOptions = () => {
  const { isLoading, ...featureFlags } = useFeatureFlags();
  const dispatch = useDispatch();

  return (
    <div className="fr-container">
      <h4>Les fonctionnalités optionnelles :</h4>
      <div className="fr-grid-row">
        <div className="fr-col-6">
          <div className="fr-form-group">
            <fieldset className="fr-fieldset">
              <div className="fr-fieldset__content">
                {keys(featureFlags).map((featureFlagName) => (
                  <div
                    className="fr-radio-group fr-radio-rich hover:opacity-60"
                    key={featureFlagName}
                  >
                    <Switch
                      label={labelsByFeatureFlag[featureFlagName]}
                      checked={featureFlags[featureFlagName]}
                      onChange={() => {
                        const isConfirmed = window.confirm(
                          "Vous aller changer ce réglage pour tous les utilisateurs, voulez-vous confirmer ?",
                        );

                        if (isConfirmed)
                          dispatch(
                            featureFlagsSlice.actions.setFeatureFlagRequested(
                              featureFlagName,
                            ),
                          );
                      }}
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    </div>
  );
};
