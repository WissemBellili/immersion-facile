import { formatDistance } from "date-fns";
import { fr } from "date-fns/locale";
import React from "react";
import type {
  ApplicationStatus,
  ImmersionApplicationDto,
} from "src/shared/ImmersionApplication/ImmersionApplication.dto";
import { FormDetails } from "./FormDetails";

const beforeAfterString = (date: string) => {
  const eventDate = new Date(date);
  const currentDate = new Date();

  return formatDistance(eventDate, currentDate, {
    addSuffix: true,
    locale: fr,
  });
};

export interface FormAccordionProps {
  immersionApplication: ImmersionApplicationDto;
}

const getPrefix = (status: ApplicationStatus) => {
  switch (status) {
    case "DRAFT":
      return "[📕 BROUILLON]";
    case "READY_TO_SIGN":
      return "[📄 Prête à etre signée]";
    case "PARTIALLY_SIGNED":
      return "[✍️ Partiellement signée]";
    case "REJECTED":
      return "[❌ DEMANDE REJETÉE]";
    case "IN_REVIEW":
      return "[📙 DEMANDE À ETUDIER]";
    case "ACCEPTED_BY_COUNSELLOR":
      return "[📗 DEMANDE ÉLIGIBLE]";
    case "ACCEPTED_BY_VALIDATOR":
      return "[✅ DEMANDE VALIDÉE]";
    case "VALIDATED":
      return "[👩‍💼 ENVOI DE CONVENTION VALIDÉE PAR ADMIN]";
  }

  return "[⁉️ STATUS DE LA DEMANDE INDÉFINI]";
};

export const FormAccordion = ({ immersionApplication }: FormAccordionProps) => {
  const {
    status,
    lastName,
    firstName,
    businessName,
    dateStart,
    dateEnd: _,
  } = immersionApplication;

  const title =
    `${getPrefix(status)} ` +
    `${lastName.toUpperCase()} ${firstName} chez ${businessName} ` +
    `${beforeAfterString(dateStart)}`;

  return (
    <div style={{ padding: "0.5rem" }}>
      <h5 style={{ margin: "2rem 4rem" }}>{title}</h5>
      <FormDetails immersionApplication={immersionApplication} />
    </div>
  );
};
