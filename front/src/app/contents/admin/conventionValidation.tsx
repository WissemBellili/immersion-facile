import React from "react";

import { ScheduleDto, toDisplayedDate, prettyPrintSchedule } from "shared";
import { ColField, FieldsAndTitle } from "./types";

export const signToBooleanDisplay = (value: string | undefined) =>
  value ? `✅ (${toDisplayedDate(new Date(value))})` : "❌";

const booleanToCheck = (value: boolean) => (value ? "✅" : "❌");

const renderSchedule = (schedule: ScheduleDto) => (
  <div style={{ whiteSpace: "pre" }}>
    {prettyPrintSchedule(schedule, false)}
  </div>
);

const renderSiret = (siret: string) => (
  <a
    href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${siret}`}
    title={"Voir sur l'annuaire des entreprises"}
    target="_blank"
  >
    {siret}
  </a>
);

const renderEmail = (email: string) => (
  <a href={`mailto:${email}`} title={email}>
    {email}
  </a>
);

const beneficiaryFields: ColField[] = [
  {
    key: "signatories.beneficiary.signedAt",
    colLabel: "Signé",
    value: (convention) =>
      signToBooleanDisplay(convention.signatories.beneficiary.signedAt),
  },
  {
    key: "signatories.beneficiary.email",
    colLabel: "Mail de demandeur",
    value: (convention) =>
      renderEmail(convention.signatories.beneficiary.email),
  },
  {
    key: "signatories.beneficiary.phone",
    colLabel: "Numéro de téléphone",
  },
  {
    key: "signatories.beneficiary.firstName",
    colLabel: "Prénom",
  },
  {
    key: "signatories.beneficiary.lastName",
    colLabel: "Nom",
  },
  null,
  null,
  {
    key: "signatories.beneficiary.birthdate",
    colLabel: "Date de naissance",
    value: (convention) =>
      toDisplayedDate(new Date(convention.signatories.beneficiary.birthdate)),
  },
  {
    key: "signatories.beneficiary.emergencyContact",
    colLabel: "Contact d'urgence",
    value: (convention) =>
      `${convention.signatories.beneficiary.emergencyContact} (${convention.signatories.beneficiary.emergencyContactPhone} - ${convention.signatories.beneficiary.emergencyContactEmail})`,
  },
];

const beneficiaryRepresentativeFields: ColField[] = [
  {
    key: "signatories.beneficiaryRepresentative.signedAt",
    colLabel: "Signé",
    value: (convention) =>
      signToBooleanDisplay(
        convention.signatories.beneficiaryRepresentative?.signedAt,
      ),
  },
  {
    key: "signatories.beneficiaryRepresentative.email",
    colLabel: "Mail du représentant",
    value: (convention) =>
      convention.signatories.beneficiaryRepresentative
        ? renderEmail(convention.signatories.beneficiaryRepresentative.email)
        : "",
  },
  {
    key: "signatories.beneficiaryRepresentative.phone",
    colLabel: "Numéro de téléphone",
  },
  {
    key: "signatories.beneficiaryRepresentative.firstName",
    colLabel: "Prénom",
  },
  {
    key: "signatories.beneficiaryRepresentative.lastName",
    colLabel: "Nom",
  },
  null,
  null,
  null,
  null,
];

const beneficiaryCurrentEmployerFields: ColField[] = [
  {
    key: "signatories.beneficiaryCurrentEmployer.signedAt",
    colLabel: "Signé",
    value: (convention) =>
      signToBooleanDisplay(
        convention.signatories.beneficiaryRepresentative?.signedAt,
      ),
  },
  {
    key: "signatories.beneficiaryCurrentEmployer.email",
    colLabel: "Mail du représentant",
    value: (convention) =>
      convention.signatories.beneficiaryCurrentEmployer
        ? renderEmail(convention.signatories.beneficiaryCurrentEmployer.email)
        : "",
  },
  {
    key: "signatories.beneficiaryCurrentEmployer.phone",
    colLabel: "Numéro de téléphone",
  },
  {
    key: "signatories.beneficiaryCurrentEmployer.firstName",
    colLabel: "Prénom",
  },
  {
    key: "signatories.beneficiaryCurrentEmployer.lastName",
    colLabel: "Nom",
  },
  {
    key: "signatories.beneficiaryCurrentEmployer.businessSiret",
    colLabel: "Siret",
    value: (convention) =>
      convention.signatories.beneficiaryCurrentEmployer
        ? renderSiret(
            convention.signatories.beneficiaryCurrentEmployer.businessSiret,
          )
        : "",
  },
  {
    key: "signatories.beneficiaryCurrentEmployer.job",
    colLabel: "Poste",
  },
  null,
  null,
];

const establishmentRepresentativeFields: ColField[] = [
  {
    key: "signatories.establishmentRepresentative.signedAt",
    colLabel: "Signé",
    value: (convention) =>
      signToBooleanDisplay(
        convention.signatories.beneficiaryRepresentative?.signedAt,
      ),
  },
  {
    key: "signatories.establishmentRepresentative.email",
    colLabel: "Mail du représentant",
    value: (convention) =>
      convention.signatories.beneficiaryRepresentative
        ? renderEmail(convention.signatories.beneficiaryRepresentative.email)
        : "",
  },
  {
    key: "signatories.establishmentRepresentative.phone",
    colLabel: "Numéro de téléphone",
  },
  {
    key: "signatories.establishmentRepresentative.firstName",
    colLabel: "Prénom",
  },
  {
    key: "signatories.establishmentRepresentative.lastName",
    colLabel: "Nom",
  },
  {
    key: "siret",
    colLabel: "Siret",
    value: (convention) => renderSiret(convention.siret),
  },
  null,
  null,
  null,
];

const enterpriseFields: ColField[] = [
  {
    key: "businessName",
    colLabel: "Entreprise",
  },
  {
    key: "siret",
    colLabel: "Siret",
    value: (convention) => renderSiret(convention.siret),
  },
];
const establishmentTutorFields: ColField[] = [
  {
    key: "establishmentTutor.email",
    colLabel: "Mail du tuteur",
    value: (convention) =>
      convention.establishmentTutor
        ? renderEmail(convention.establishmentTutor.email)
        : "",
  },
  {
    key: "establishmentTutor.phone",
    colLabel: "Numéro de téléphone du tuteur",
  },
  {
    key: "establishmentTutor.firstName",
    colLabel: "Prénom",
  },
  {
    key: "establishmentTutor.lastName",
    colLabel: "Prénom",
  },
  {
    key: "establishmentTutor.job",
    colLabel: "Poste",
  },
];

const agencyFields: ColField[] = [
  {
    key: "agencyName",
    colLabel: "Nom de la structure",
  },
  {
    key: "dateValidation",
    colLabel: "Date de validation",
    value: (convention) =>
      convention.dateValidation
        ? toDisplayedDate(new Date(convention.dateValidation))
        : "",
  },
];

const immersionPlaceDateFields: ColField[] = [
  {
    key: "dateSubmission",
    colLabel: "Date de soumission",
    value: (convention) => toDisplayedDate(new Date(convention.dateSubmission)),
  },
  {
    key: "dateStart",
    colLabel: "Début",
    value: (convention) => toDisplayedDate(new Date(convention.dateStart)),
  },
  {
    key: "dateEnd",
    colLabel: "Fin",
    value: (convention) => toDisplayedDate(new Date(convention.dateEnd)),
  },
  {
    key: "immersionAddress",
    colLabel: "Adresse d'immersion",
  },
  {
    key: "schedule",
    colLabel: "Horaires",
    value: (convention) => renderSchedule(convention.schedule),
  },
];

const immersionJobFields: ColField[] = [
  {
    key: "immersionAppellation",
    colLabel: "Métier observé",
    value: (convention) => convention.immersionAppellation.appellationLabel,
  },
  {
    key: "immersionActivities",
    colLabel: "Activités",
  },
  {
    key: "immersionSkills",
    colLabel: "Compétences évaluées",
  },
  {
    key: "immersionAddress",
    colLabel: "Adresse d'immersion",
  },
  {
    key: "immersionObjective",
    colLabel: "Objectif",
  },
  {
    key: "individualProtection",
    colLabel: "Protection individuelle",
    value: (convention) => booleanToCheck(convention.individualProtection),
  },
  {
    key: "sanitaryPrevention",
    colLabel: "Mesures de prévention sanitaire",
    value: (convention) => booleanToCheck(convention.sanitaryPrevention),
  },
  {
    key: "workConditions",
    colLabel: "Conditions de travail particulières",
  },
];

export const sections: FieldsAndTitle[] = [
  {
    listTitle: "Signataires",
    cols: [
      "",
      "Convention signée ?",
      "Email",
      "Téléphone",
      "Prénom",
      "Nom",
      "Siret",
      "Poste",
      "Date de naissance",
      "Contact d'urgence",
    ],
    rowFields: [
      {
        title: "Bénéficiaire",
        fields: beneficiaryFields,
      },
      {
        title: "Rep. légal bénéficiaire",
        fields: beneficiaryRepresentativeFields,
      },
      {
        title: "Employeur actuel bénéficiaire",
        fields: beneficiaryCurrentEmployerFields,
      },
      {
        title: "Rep. légal de l'entreprise",
        fields: establishmentRepresentativeFields,
      },
    ],
    additionalClasses: "fr-table--green-emeraude",
  },
  {
    listTitle: "Entreprise",
    cols: [
      "Entreprise",
      "Siret",
      "Email tuteur",
      "Téléphone tuteur",
      "Prénom",
      "Nom",
      "Poste",
    ],
    rowFields: [
      {
        fields: [...enterpriseFields, ...establishmentTutorFields],
      },
    ],
    additionalClasses: " fr-table--blue-cumulus",
  },
  {
    listTitle: "Structure",
    rowFields: [
      {
        fields: agencyFields,
      },
    ],
    additionalClasses: "fr-table--layout-fixed fr-table--blue-ecume",
  },
  {
    listTitle: "Infos sur l'immersion - date et lieu",
    rowFields: [
      {
        fields: immersionPlaceDateFields,
      },
    ],
    additionalClasses: "fr-table--green-archipel",
  },
  {
    listTitle: "Infos sur l'immersion - métier",
    rowFields: [
      {
        fields: immersionJobFields,
      },
    ],
    additionalClasses: "fr-table--green-archipel",
  },
];
