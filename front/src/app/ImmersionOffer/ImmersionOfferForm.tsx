import { Form, Formik } from "formik";
import React, { useState } from "react";
import { BusinessContactList } from "src/app/ImmersionOffer/BusinessContactList";
import {
  fieldsToLabel,
  FieldsWithLabel,
} from "src/app/ImmersionOffer/fieldsToLabels";
import { ProfessionList } from "src/app/ImmersionOffer/ProfessionList";
import { RadioGroup } from "src/app/RadioGroup";
import { routes } from "src/app/routes";
import {
  useSiretFetcher,
  useSiretRelatedField,
} from "src/app/Siret/fetchCompanyInfoBySiret";
import { ErrorMessage } from "src/components/form/ErrorMessage";
import { SuccessMessage } from "src/components/form/SuccessMessage";
import { TextInput } from "src/components/form/TextInput";
import { MarianneHeader } from "src/components/MarianneHeader";
import { ENV } from "src/environmentVariables";
import {
  ContactMethod,
  ImmersionOfferDto,
  immersionOfferSchema,
} from "src/shared/ImmersionOfferDto";
import { NafDto } from "src/shared/naf";
import { ProfessionDto } from "src/shared/rome";
import { Route } from "type-route";
import { v4 as uuidV4 } from "uuid";
import { immersionOfferGateway } from "../main";

type ImmersionOfferFormProps = {
  route: Route<typeof routes.immersionOffer>;
};

const initialValues: ImmersionOfferDto = ENV.dev
  ? {
      id: uuidV4(),
      siret: "1234567890123",
      businessName: "My business name",
      businessAddress: "My businessAddress:",
      naf: undefined as unknown as Required<NafDto>, // ugly fix, but yup doesn't like optional for typings
      professions: [
        {
          romeCodeMetier: "A1000",
          description: "Boulanger",
        } as unknown as Required<ProfessionDto>, // ugly fix, but yup doesn't like optional for typings
        {
          romeCodeMetier: "B2000",
          description: "Boucher",
        } as unknown as Required<ProfessionDto>, // ugly fix, but yup doesn't like optional for typings
      ],
      businessContacts: [
        {
          firstName: "John",
          lastName: "Doe",
          job: "super job",
          phone: "0D2837",
          email: "joe@mail.com",
        },
      ],
      preferredContactMethods: ["EMAIL"],
    }
  : {
      id: uuidV4(),
      siret: "",
      businessName: "",
      businessAddress: "",
      naf: undefined as unknown as Required<NafDto>, // ugly fix, but yup doesn't like optional for typings
      professions: [],
      businessContacts: [
        {
          firstName: "",
          lastName: "",
          job: "",
          phone: "",
          email: "",
        },
      ],
      preferredContactMethods: [],
    };

const preferredContactMethodOptions: Array<{
  label?: string;
  value: ContactMethod[];
}> = [
  {
    value: ["EMAIL"],
    label:
      "Par mail (la demande passera par un formulaire afin de ne pas exposer l'adresse mail)",
  },
  {
    value: ["PHONE"],
    label:
      "Par téléphone (seuls les candidats identifiés auront accès au numéro de téléphone)",
  },
  {
    value: ["IN_PERSON"],
    label: "Se présenter en personne à votre établissement",
  },
];

const getLabelAndName = (field: FieldsWithLabel) => ({
  label: fieldsToLabel[field] + " *",
  name: field,
});

const SiretRelatedInputs = () => {
  const { companyInfo } = useSiretFetcher();
  useSiretRelatedField("businessName", companyInfo);
  useSiretRelatedField("businessAddress", companyInfo);
  useSiretRelatedField("naf", companyInfo);

  return (
    <>
      <TextInput
        {...getLabelAndName("siret")}
        placeholder="362 521 879 00034"
      />
      <TextInput {...getLabelAndName("businessName")} />
      <TextInput {...getLabelAndName("businessAddress")} />
    </>
  );
};

export const ImmersionOfferForm = ({ route }: ImmersionOfferFormProps) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);

  return (
    <>
      <MarianneHeader />
      <div
        className="fr-grid-row fr-grid-row--center fr-grid-row--gutters"
        style={{ marginTop: "25px" }}
      >
        <Formik
          enableReinitialize={true}
          initialValues={initialValues}
          validationSchema={immersionOfferSchema}
          onSubmit={async (data, { setSubmitting }) => {
            try {
              setIsSuccess(false);
              setSubmitError(null);

              await immersionOfferSchema.validate(data);
              await immersionOfferGateway.addImmersionOffer(data);

              setIsSuccess(true);
              setSubmitError(null);
            } catch (e: any) {
              console.log(e);
              setIsSuccess(false);
              setSubmitError(e);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, submitCount, errors }) => (
            <div style={{ margin: "5px", maxWidth: "600px" }}>
              <p>
                Bienvenue sur l'espace de référencement des entreprises
                volontaires pour l'accueil des immersions professionnelles. Ce
                formulaire vous permet d'indiquer les métiers de votre
                établissement ouverts aux immersions. Si votre entreprise
                comprend plusieurs établissements, il convient de renseigner un
                formulaire pour chaque établissement (Siret différent).
              </p>
              <Form>
                Votre établissement
                <SiretRelatedInputs />
                <ProfessionList
                  name="professions"
                  title={`${fieldsToLabel["professions"]} *`}
                />
                <BusinessContactList />
                <RadioGroup
                  {...getLabelAndName("preferredContactMethods")}
                  options={preferredContactMethodOptions}
                />
                {submitCount !== 0 && Object.values(errors).length > 0 && (
                  <div style={{ color: "red" }}>
                    {console.log(errors)}
                    Veuillez corriger les champs erronés :
                    <ul>
                      {(Object.keys(errors) as FieldsWithLabel[]).map(
                        (field) => {
                          const err = errors[field];
                          return typeof err === "string" ? (
                            <li key={field}>
                              {fieldsToLabel[field]}: {err}
                            </li>
                          ) : null;
                        },
                      )}
                    </ul>
                  </div>
                )}
                <br />
                {submitError && (
                  <>
                    <ErrorMessage title="Erreur de serveur">
                      {submitError.message}
                    </ErrorMessage>
                    <br />
                  </>
                )}
                {isSuccess && (
                  <SuccessMessage title="Succès de l'envoi">
                    Merci ! Nous avons bien enregistré vos informations. Vous
                    pourrez y accéder à tout moment pour les modifier ou les
                    supprimer en nous contactant à :&nbsp;
                    <a href="mailto:immersionfacile@beta.gouv.fr">
                      immersionfacile@beta.gouv.fr
                    </a>
                  </SuccessMessage>
                )}
                {!isSuccess && (
                  <button
                    className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    Enregistrer mes informations
                  </button>
                )}
              </Form>
              <br />
              <br />
            </div>
          )}
        </Formik>
      </div>
    </>
  );
};
