import { useFormikContext } from "formik";
import React from "react";
import {
  BusinessContactDto,
  ContactMethod,
  FormEstablishmentDto,
  zEmail,
} from "shared";
import { RadioGroupForField } from "src/app/components/forms/commons/RadioGroup";
import { FillableList } from "src/app/components/forms/commons/FillableList";
import { TextInput } from "src/app/components/forms/commons/TextInput";

const preferredContactMethodOptions: Array<{
  label?: string;
  value: ContactMethod;
}> = [
  {
    value: "EMAIL",
    label:
      "Par mail (la demande passera par un formulaire afin de ne pas exposer l'adresse mail)",
  },
  {
    value: "PHONE",
    label:
      "Par téléphone (seuls les candidats identifiés auront accès au numéro de téléphone)",
  },
  {
    value: "IN_PERSON",
    label: "Se présenter en personne à votre établissement",
  },
];

export const BusinessContact = () => {
  const parentFieldName: keyof FormEstablishmentDto = "businessContact";
  const makeName = (name: keyof BusinessContactDto) =>
    `${parentFieldName}.${name}`;
  const { values, setFieldValue } = useFormikContext<FormEstablishmentDto>();
  return (
    <div className="fr-input-group">
      <div>
        <h5>Détails du correspondant immersion :</h5>
        <p>Le correspondant reçoit les demandes et les traite.</p>
      </div>
      <TextInput label="Nom du référent *" name={makeName("lastName")} />
      <TextInput label="Prénom du référent *" name={makeName("firstName")} />
      <TextInput label="Fonction du référent *" name={makeName("job")} />
      <TextInput
        label="Numéro de téléphone (ne sera pas communiqué directement) *"
        name={makeName("phone")}
      />
      <TextInput label="Email *" name={makeName("email")} />
      <FillableList
        name={makeName("copyEmails")}
        label="Autres destinataires"
        description={"Adresses mail à mettre en copie"}
        placeholder="cc1@mail.com, cc2@mail.com"
        valuesInList={values.businessContact.copyEmails}
        setValues={(newValues) => {
          setFieldValue(makeName("copyEmails"), newValues);
        }}
        validationSchema={zEmail}
      />
      <RadioGroupForField
        name={makeName("contactMethod")}
        label="Comment souhaitez-vous que les candidats vous contactent ? *"
        options={preferredContactMethodOptions}
      />
    </div>
  );
};
