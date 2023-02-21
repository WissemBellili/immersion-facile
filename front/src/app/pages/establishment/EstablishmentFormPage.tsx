import React from "react";
import { MainWrapper, PageHeader } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";
import { EstablishmentCreationForm } from "src/app/components/forms/establishment/EstablishmentCreationForm";
import { metaContents } from "src/app/contents/meta/metaContents";

export const EstablishmentFormPage = ({
  route,
}: {
  route: Route<typeof routes.formEstablishment>;
}) => (
  <HeaderFooterLayout>
    <MainWrapper
      layout="boxed"
      pageHeader={
        <PageHeader
          title="Référencer mon entreprise"
          centered
          theme="establishment"
          breadcrumbProps={{
            currentPageLabel:
              metaContents[route.name]?.title || "Titre de page inconnu",
            homeLinkProps: routes.home().link,
          }}
        />
      }
    >
      <EstablishmentCreationForm
        source="immersion-facile"
        siret={route.params.siret}
      />
    </MainWrapper>
  </HeaderFooterLayout>
);
