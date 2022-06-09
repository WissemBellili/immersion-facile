import { Form, Formik } from "formik";
import React, { useState } from "react";
import {
  ButtonHome,
  ErrorMessage,
  SuccessMessage,
} from "react-design-system/immersionFacile";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import { formEstablishmentSchema } from "shared/src/formEstablishment/FormEstablishment.schema";
import { SiretDto } from "shared/src/siret";
import { BoolCheckboxGroup } from "src/uiComponents/form/CheckboxGroup";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { AppellationList } from "./AppellationList";
import { BusinessContact } from "./BusinessContact";
import { fieldsToLabel, FieldsWithLabel } from "./fieldsToLabels";

type EstablishmentFormProps = {
  initialValues: FormEstablishmentDto;
  saveForm: (establishment: FormEstablishmentDto) => Promise<void>;
  isEditing?: boolean;
  children: React.ReactNode;
};

export const getMandatoryLabelAndName = (field: FieldsWithLabel) => ({
  label: fieldsToLabel[field] + " *",
  name: field,
});

export const getLabelAndName = (field: FieldsWithLabel) => ({
  label: fieldsToLabel[field],
  name: field,
});

export const EstablishmentFormikForm = ({
  initialValues,
  saveForm,
  children,
  isEditing,
}: EstablishmentFormProps) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);

  let errorMessage = submitError?.message;
  if (
    submitError &&
    "response" in submitError &&
    "data" in submitError["response"] &&
    "errors" in submitError["response"]["data"]
  ) {
    errorMessage = submitError["response"]["data"]["errors"];
  }

  return (
    <div
      className="fr-grid-row fr-grid-row--center fr-grid-row--gutters"
      style={{ marginTop: "25px" }}
    >
      <Formik
        enableReinitialize={true}
        initialValues={initialValues}
        validationSchema={toFormikValidationSchema(formEstablishmentSchema)}
        onSubmit={async (data, { setSubmitting }) => {
          try {
            setIsSuccess(false);
            setSubmitError(null);

            formEstablishmentSchema.parse(data);

            await saveForm(data);

            setIsSuccess(true);
            setSubmitError(null);
          } catch (e: any) {
            //eslint-disable-next-line no-console
            console.log("onSubmit", e);
            setIsSuccess(false);
            setSubmitError(e);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, submitCount, errors, values }) => (
          <div style={{ margin: "5px 12px", maxWidth: "600px" }}>
            <p>
              Bienvenue sur l'espace de référencement des entreprises
              volontaires pour l'accueil des immersions professionnelles.
            </p>

            <p className="mt-4">
              En référençant votre entreprise, vous rejoignez la communauté{" "}
              <a
                href={"https://lesentreprises-sengagent.gouv.fr/"}
                target={"_blank"}
              >
                « Les entreprises s'engagent »
              </a>
              .
            </p>

            <p className="mt-4">
              Ce formulaire vous permet d'indiquer les métiers de votre
              établissement ouverts aux immersions. Si votre entreprise comprend
              plusieurs établissements, il convient de renseigner un formulaire
              pour chaque établissement (Siret différent).
            </p>
            <Form>
              <span className="py-6 block text-lg font-semibold">
                Votre établissement
              </span>
              {children}
              <p className="mt-4" />
              <BoolCheckboxGroup
                {...getLabelAndName("isEngagedEnterprise")}
                description=""
                descriptionLink=""
                disabled={false}
              />
              <AppellationList
                name="appellations"
                title={`${fieldsToLabel["appellations"]} *`}
              />
              <BusinessContact />

              {isEditing && (
                <BoolCheckboxGroup
                  name="isSearchable"
                  label={`L'entreprise est-elle recherchable par les utilisateurs ? ${
                    values.isSearchable
                      ? "(décochez la case si vous ne  voulez pas être visible sur la recherche)"
                      : "(cochez la case si vous voulez être visible sur la recherche)"
                  }`}
                />
              )}

              {submitCount !== 0 && Object.values(errors).length > 0 && (
                <div style={{ color: "red" }}>
                  Veuillez corriger les champs erronés :
                  <ul>
                    {(Object.keys(errors) as FieldsWithLabel[]).map((field) => {
                      const err = errors[field];
                      return typeof err === "string" ? (
                        <li key={field}>
                          {fieldsToLabel[field] || field}: {err}
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}
              <br />
              {submitError && (
                <>
                  <ErrorMessage title="Veuillez nous excuser. Un problème est survenu qui a compromis l'enregistrement de vos informations. ">
                    {errorMessage}
                  </ErrorMessage>
                  <br />
                </>
              )}
              {isSuccess && (
                <SuccessMessage title="Succès de l'envoi">
                  Succès. Nous avons bien enregistré les informations concernant
                  votre entreprise.
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
            {isEditing === true && (
              <>
                <ButtonHome
                  onClick={(_) => {
                    window.open(mailtoHref(initialValues.siret));
                  }}
                  type="error"
                  width={null}
                >
                  Supprimer votre entreprise
                </ButtonHome>
                <p>
                  Si vous avez besoin d'aide, envoyez-nous un email: <br />
                  contact@immersion-facile.beta.gouv.fr
                </p>
              </>
            )}
          </div>
        )}
      </Formik>
    </div>
  );
};

const lineBreak = "%0D%0A";
const deleteEstablishmentSubject = "Demande de suppression d'entreprise";
const deleteEstablishmentBody = (siret: SiretDto) =>
  `Bonjour,${lineBreak}Je souhaite supprimer les données de mon entreprise dont le numéro de SIRET est ${siret}.${lineBreak}Cordialement.`;
const immersionFacileContactEmailAddress =
  "contact@immersion-facile.beta.gouv.fr";
const mailtoHref = (siret: SiretDto) =>
  `mailto:${immersionFacileContactEmailAddress}?subject=${deleteEstablishmentSubject}&body=${deleteEstablishmentBody(
    siret,
  )}`;
