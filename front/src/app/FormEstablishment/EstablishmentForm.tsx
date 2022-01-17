import { Checkbox } from "@mui/material";
import { Form, Formik, useField } from "formik";
import React, { useState } from "react";
import { formEstablishmentGateway } from "src/app/dependencies";
import { BusinessContactList } from "src/app/FormEstablishment/BusinessContactList";
import {
  fieldsToLabel,
  FieldsWithLabel,
} from "src/app/FormEstablishment/fieldsToLabels";
import { ProfessionList } from "src/app/FormEstablishment/ProfessionList";
import { RadioGroup } from "src/app/RadioGroup";
import { routes } from "src/app/routes";
import {
  useSiretFetcher,
  useSiretRelatedField,
} from "src/app/Siret/fetchEstablishmentInfoBySiret";
import { AddressAutocomplete } from "src/components/AddressAutocomplete";
import { Footer } from "src/components/Footer";
import { BoolCheckboxGroup } from "src/components/form/CheckboxGroup";
import { ErrorMessage } from "src/components/form/ErrorMessage";
import { SuccessMessage } from "src/components/form/SuccessMessage";
import { TextInput } from "src/components/form/TextInput";
import { toFormikValidationSchema } from "src/components/form/zodValidate";
import { MarianneHeader } from "src/components/MarianneHeader";
import { ENV } from "src/environmentVariables";
import {
  ContactMethod,
  FormEstablishmentDto,
  formEstablishmentSchema,
} from "src/shared/FormEstablishmentDto";
import { Route } from "type-route";
import { v4 as uuidV4 } from "uuid";

type EstablishmentFormProps = {
  route: Route<typeof routes.formEstablishment>;
};

const initialValues: FormEstablishmentDto = ENV.dev
  ? {
      id: uuidV4(),
      siret: "1234567890123",
      businessName: "My business name, replaced by result from API",
      businessNameCustomized:
        "My Customized Business name, not replaced by API",
      businessAddress: "My business address, replaced by result from API",
      isEngagedEnterprise: true,
      professions: [
        {
          romeCodeAppellation: "11573",
          romeCodeMetier: "D1102",
          description: "Boulanger",
        },
        {
          description: "Boucher / Bouchère",
          romeCodeAppellation: "11564",
          romeCodeMetier: "D1101",
        },
      ],
      businessContacts: [
        {
          firstName: "John",
          lastName: "Doe",
          job: "super job",
          phone: "02837",
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
  const { establishmentInfo, isFetchingSiret } = useSiretFetcher();
  useSiretRelatedField("businessName", establishmentInfo);
  useSiretRelatedField("businessAddress", establishmentInfo);
  useSiretRelatedField("naf", establishmentInfo);

  const businessLabelAndName = getLabelAndName("businessAddress");
  const [_, __, { setValue }] = useField<string>(businessLabelAndName.name);

  return (
    <>
      <TextInput
        {...getLabelAndName("siret")}
        placeholder="362 521 879 00034"
        disabled={isFetchingSiret}
      />
      <TextInput {...getLabelAndName("businessName")} disabled={true} />
      <TextInput
        {...getLabelAndName("businessNameCustomized")}
        disabled={isFetchingSiret}
      />
      <AddressAutocomplete
        initialSearchTerm={establishmentInfo?.businessAddress}
        label={businessLabelAndName.label}
        setFormValue={(address) => setValue(address.label)}
        disabled={isFetchingSiret}
      />
    </>
  );
};

export const EstablishmentForm = ({ route }: EstablishmentFormProps) => {
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
    <>
      <MarianneHeader />
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
              await formEstablishmentGateway.addFormEstablishment(data);

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
          {({ isSubmitting, submitCount, errors, values }) => (
            <div style={{ margin: "5px 12px", maxWidth: "600px" }}>
              <p>
                Bienvenue sur l'espace de référencement des entreprises
                volontaires pour l'accueil des immersions professionnelles.
              </p>
              <p className="mt-4">
                Ce formulaire vous permet d'indiquer les métiers de votre
                établissement ouverts aux immersions. Si votre entreprise
                comprend plusieurs établissements, il convient de renseigner un
                formulaire pour chaque établissement (Siret différent).
              </p>
              <Form>
                <span className="py-6 block text-lg font-semibold">
                  Votre établissement
                </span>
                <SiretRelatedInputs />
                <p className="mt-4" />
                <BoolCheckboxGroup
                  {...getLabelAndName("isEngagedEnterprise")}
                  description=""
                  descriptionLink=""
                  disabled={false}
                />{" "}
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
                              {fieldsToLabel[field] || field}: {err}
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
                    <ErrorMessage title="Veuillez nous excuser. Un problème est survenu qui a compromis l'enregistrement de vos informations. ">
                      {errorMessage}
                    </ErrorMessage>
                    <br />
                  </>
                )}
                {isSuccess && (
                  <SuccessMessage title="Succès de l'envoi">
                    Succès. Nous avons bien enregistré les informations
                    concernant votre entreprise.
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
      <Footer />
    </>
  );
};
