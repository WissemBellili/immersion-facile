import React, { Fragment } from "react";
import type { RomeSearchMatchDto } from "src/shared/rome";

type SliceOfString = {
  startIndexInclusive: number;
  endIndexExclusive: number;
  bolded: boolean;
};

export const StringWithHighlights = ({
  description,
  matchRanges,
}: RomeSearchMatchDto) => {
  const slices: SliceOfString[] =
    matchRanges.length === 0
      ? [
          {
            startIndexInclusive: 0,
            endIndexExclusive: description.length,
            bolded: false,
          },
        ]
      : matchRanges.reduce(
          (acc, { startIndexInclusive, endIndexExclusive }, index) => {
            const isFirstMatch = acc.length === 0;
            const unboldedRange = {
              startIndexInclusive: isFirstMatch
                ? 0
                : acc[acc.length - 1].endIndexExclusive,
              endIndexExclusive: startIndexInclusive,
              bolded: false,
            };

            const boldedRange = {
              startIndexInclusive,
              endIndexExclusive,
              bolded: true,
            };

            const isLastMatch = index === matchRanges.length - 1;
            const addEndOfDescriptionIfLastMatch = isLastMatch
              ? [
                  {
                    startIndexInclusive: endIndexExclusive,
                    endIndexExclusive: description.length,
                    bolded: false,
                  },
                ]
              : [];

            return [
              ...acc,
              unboldedRange,
              boldedRange,
              ...addEndOfDescriptionIfLastMatch,
            ];
          },
          [] as SliceOfString[],
        );

  return (
    <>
      {slices.map(
        ({ startIndexInclusive, endIndexExclusive, bolded }, index) => {
          const text = description.slice(
            startIndexInclusive,
            endIndexExclusive,
          );
          if (bolded) return <strong key={index}>{text}</strong>;
          return <Fragment key={index}>{text}</Fragment>;
        },
      )}
    </>
  );
};
