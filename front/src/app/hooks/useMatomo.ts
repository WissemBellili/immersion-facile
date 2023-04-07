import { useEffect } from "react";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";

import { InternshipKind } from "shared";

export const useMatomo = (internshipKind: InternshipKind) => {
  const submitFeedback = useAppSelector(conventionSelectors.feedback);
  useEffect(() => {
    if (submitFeedback.kind === "justSubmitted") {
      matomoPushConventionSubmitSuccessEvent(internshipKind);
    }
  }, [submitFeedback.kind]);
};

const matomoPushConventionSubmitSuccessEvent = (
  internshipKind: InternshipKind,
) => {
  window._mtm.push({ event: "conventionSubmitSuccess", internshipKind });
};
