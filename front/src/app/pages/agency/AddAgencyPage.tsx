import React from "react";
import { AddAgencyForm } from "src/app/components/forms/agency/AddAgencyForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";

import { MainWrapper, PageHeader } from "react-design-system";

export const AddAgencyPage = () => (
  <HeaderFooterLayout>
    <MainWrapper
      layout="boxed"
      pageHeader={
        <PageHeader
          title="Ajout d'organisme encadrant les PMSMP"
          centered
          theme="agency"
        />
      }
    >
      <AddAgencyForm />
    </MainWrapper>
  </HeaderFooterLayout>
);
