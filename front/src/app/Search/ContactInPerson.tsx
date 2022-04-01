import { Form, Formik } from "formik";
import React, { useState } from "react";
import { immersionSearchGateway } from "src/app/dependencies";
import { Button } from "src/components/Button";
import { TextInput } from "src/components/form/TextInput";
import { toFormikValidationSchema } from "src/components/form/zodValidate";
import {
  ContactEstablishmentInPersonDto,
  contactEstablishmentInPersonSchema,
} from "src/shared/contactEstablishment";
import { SiretDto } from "src/shared/siret";

type ContactInPersonProps = {
  siret: SiretDto;
  romeLabel: string;
  onSuccess: () => void;
};

const getName = (v: keyof ContactEstablishmentInPersonDto) => v;

export const ContactInPerson = ({
  siret,
  romeLabel,
  onSuccess,
}: ContactInPersonProps) => {
  const initialValues: ContactEstablishmentInPersonDto = {
    siret,
    romeLabel,
    contactMode: "IN_PERSON",
    potentialBeneficiaryFirstName: "",
    potentialBeneficiaryLastName: "",
    potentialBeneficiaryEmail: "",
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={toFormikValidationSchema(
        contactEstablishmentInPersonSchema,
      )}
      onSubmit={async (values) => {
        setIsSubmitting(true);
        await immersionSearchGateway.contactEstablishment(values);
        setIsSubmitting(false);
        onSuccess();
      }}
    >
      {({ errors, submitCount }) => (
        <Form>
          <p>
            Cette entreprise souhaite que vous vous présentiez directement pour
            candidater.
          </p>
          <br />
          <p>
            Merci de nous indiquer vos coordonnées. Vous recevrez par e-mail le
            nom de la personne à contacter ainsi que des conseils pour présenter
            votre demande d’immersion. Ces informations sont personnelles et
            confidentielles. Elles ne peuvent pas être communiquées à d’autres
            personnes.
          </p>
          <br />
          <p>Merci !</p>
          <br />
          <TextInput
            label="Votre email *"
            name={getName("potentialBeneficiaryEmail")}
          />
          <TextInput
            label="Votre prénom *"
            name={getName("potentialBeneficiaryFirstName")}
          />
          <TextInput
            label="Votre nom *"
            name={getName("potentialBeneficiaryLastName")}
          />
          {submitCount !== 0 &&
            Object.values(errors).length > 0 &&
            console.log({ errors })}
          <Button level="secondary" type="submit" disable={isSubmitting}>
            Envoyer
          </Button>
        </Form>
      )}
    </Formik>
  );
};
