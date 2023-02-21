import React, { ReactNode } from "react";
import { MainWrapper, PageHeader } from "react-design-system";
import { metaContents } from "src/app/contents/meta/metaContents";
import { routes, useRoute } from "src/app/routes/routes";

type ConventionFormContainerLayoutProps = {
  children: ReactNode;
};

export const ConventionFormContainerLayout = ({
  children,
}: ConventionFormContainerLayoutProps) => {
  const route = useRoute();
  return (
    <>
      <MainWrapper
        layout={"boxed"}
        pageHeader={
          <PageHeader
            centered
            title={"Formulaire pour conventionner une période d'immersion"}
            theme="candidate"
            breadcrumbProps={{
              currentPageLabel: route.name
                ? metaContents[route.name]?.title
                : "Titre de page inconnu",
              homeLinkProps: routes.home().link,
            }}
          />
        }
      >
        {children}
      </MainWrapper>
    </>
  );
};
