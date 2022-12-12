import React from "react";
import { maxPermittedHoursPerWeek } from "shared";
import { formatHoursString } from "./TotaWeeklylHoursIndicator";

export const HourIndicator = ({
  hours,
}: HourIndicatorProperties): JSX.Element => {
  const normalColor = "#00854B";
  const badColor = "#E10600";
  return (
    <span
      style={{
        color: hours <= maxPermittedHoursPerWeek ? normalColor : badColor,
      }}
    >
      {formatHoursString(hours)}
    </span>
  );
};

type HourIndicatorProperties = {
  hours: number;
};
