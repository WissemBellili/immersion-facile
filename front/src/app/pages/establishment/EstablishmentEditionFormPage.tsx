import { useField } from "formik";
import React from "react";
import {
  addressDtoToString,
  EstablishmentJwtPayload,
  FormEstablishmentDto,
} from "shared";
import { MainWrapper, PageHeader } from "react-design-system";
import { decodeMagicLinkJwtWithoutSignatureCheck } from "shared";
import { establishmentGateway } from "src/config/dependencies";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { Route } from "type-route";
import { ApiDataContainer } from "../admin/ApiDataContainer";
import { EstablishmentFormikForm } from "src/app/components/forms/establishment/EstablishmentFormikForm";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { formEstablishmentFieldsLabels } from "src/app/contents/forms/establishment/formEstablishment";
import { metaContents } from "src/app/contents/meta/metaContents";

export const EstablishmentEditionFormPage = ({
  route,
}: {
  route: Route<typeof routes.editFormEstablishment>;
}) => {
  const onSaveForm =
    (
      route: Route<typeof routes.editFormEstablishment>,
    ): ((establishment: FormEstablishmentDto) => Promise<void>) =>
    (data) =>
      establishmentGateway.updateFormEstablishment(
        { ...data },
        route.params.jwt,
      );
  return (
    <HeaderFooterLayout>
      <MainWrapper
        layout="boxed"
        pageHeader={
          <PageHeader
            title="Éditer une entreprise référencée"
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
        <ApiDataContainer
          callApi={() =>
            establishmentGateway.getFormEstablishmentFromJwt(
              decodeMagicLinkJwtWithoutSignatureCheck<EstablishmentJwtPayload>(
                route.params.jwt,
              ).siret,
              route.params.jwt,
            )
          }
          jwt={route.params.jwt}
        >
          {(formEstablishment) =>
            !formEstablishment ? (
              <p>Données de formulaire d'établissement indisponibles</p>
            ) : !route.params.jwt ? (
              <p>Lien non valide</p>
            ) : (
              <EstablishmentFormikForm
                initialValues={formEstablishment}
                saveForm={onSaveForm(route)}
                isEditing
              >
                <EditionSiretRelatedInputs
                  businessAddress={formEstablishment.businessAddress}
                />
              </EstablishmentFormikForm>
            )
          }
        </ApiDataContainer>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};

const EditionSiretRelatedInputs = ({
  businessAddress,
}: {
  businessAddress: string;
}) => {
  const featureFlags = useFeatureFlags();
  const { getFormFields } = useFormContents(formEstablishmentFieldsLabels);
  const formContents = getFormFields();
  const [_, __, { setValue: setAddressValue }] = useField<string>(
    formContents.businessAddress.name,
  );

  return (
    <>
      <TextInput {...formContents.siret} disabled={true} />
      <TextInput
        {...formContents.businessName}
        readOnly={featureFlags.enableInseeApi}
      />
      <TextInput {...formContents.businessNameCustomized} />
      <AddressAutocomplete
        initialSearchTerm={businessAddress}
        {...formContents.businessAddress}
        setFormValue={({ address }) =>
          setAddressValue(addressDtoToString(address))
        }
      />
    </>
  );
};
