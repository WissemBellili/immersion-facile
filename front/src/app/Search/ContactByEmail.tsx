import { Form, Formik } from "formik";
import React, { useState } from "react";
import { immersionSearchGateway } from "src/app/dependencies";
import { Button } from "src/components/Button";
import { TextInput } from "src/components/form/TextInput";
import { toFormikValidationSchema } from "src/components/form/zodValidate";
import {
  ContactEstablishmentRequestDto,
  contactEstablishmentRequestSchema,
} from "src/shared/contactEstablishment";

type ContactByEmailProps = {
  immersionOfferId: string;
  onSuccess: () => void;
};

export const ContactByEmail = ({
  immersionOfferId,
  onSuccess,
}: ContactByEmailProps) => {
  const initialValues: ContactEstablishmentRequestDto = {
    immersionOfferId,
    contactMode: "EMAIL",
    senderEmail: "",
    senderName: "",
    message: "",
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={toFormikValidationSchema(
        contactEstablishmentRequestSchema,
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
          <TextInput label="Votre email *" name="senderEmail" />
          <TextInput label="Votre nom" name="senderName" />
          <TextInput
            label="Votre message *"
            name="message"
            type="text"
            multiline
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
