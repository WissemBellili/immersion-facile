import { useDispatch } from "react-redux";
import { immersionAssessmentSlice } from "src/core-logic/domain/immersionAssessment/immersionAssessment.slice";

import { ImmersionAssessmentDto } from "shared";

export const useImmersionAssessment = (jwt: string) => {
  const dispatch = useDispatch();
  return {
    createAssessment: (assessment: ImmersionAssessmentDto): void => {
      dispatch(
        immersionAssessmentSlice.actions.creationRequested({ assessment, jwt }),
      );
    },
  };
};
