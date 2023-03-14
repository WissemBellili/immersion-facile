import React from "react";
import { ImmersionConditionsCommonFields } from "./ImmersionConditionsCommonFields";

type ImmersionConditionFormSectionProperties = {
  isFrozen: boolean | undefined;
};

export const ImmersionConditionFormSection = ({
  isFrozen,
}: ImmersionConditionFormSectionProperties): JSX.Element => (
  <>
    <ImmersionConditionsCommonFields disabled={isFrozen} />
  </>
);
