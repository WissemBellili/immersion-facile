import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useFetchFeatureFlags } from "src/app/utils/useFeatureFlags";
import { adminSlice } from "src/core-logic/domain/admin/admin.slice";
import { Router } from "./routing/Router";
import { CrispChat } from "react-design-system/immersionFacile";

const { VITE_CRISP_WEBSITE_ID } = import.meta.env;
const useCheckIfUserIsAdmin = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(adminSlice.actions.checkIfLoggedInRequested());
  }, []);
};

export const App = () => {
  useFetchFeatureFlags();
  useCheckIfUserIsAdmin();
  return (
    <>
      <Router />
      <CrispChat crispWebsiteId={VITE_CRISP_WEBSITE_ID} />
    </>
  );
};
