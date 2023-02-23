import { fr } from "@codegouvfr/react-dsfr";
import { configureGenerateHtmlFromTemplate } from "html-templates";
import {
  cciCustomHtmlFooter,
  cciCustomHtmlHeader,
} from "html-templates/src/components/email";
import { keys } from "ramda";
import React, { useState } from "react";
import { DsfrTitle, ImmersionTextField, Select } from "react-design-system";
import {
  immersionFacileContactEmail,
  internshipKinds,
  templatesByName,
  ValueOf,
} from "shared";
import { useStyles } from "tss-react/dsfr";

const defaultEmailPreviewUrl =
  "https://upload.wikimedia.org/wikipedia/en/9/9a/Trollface_non-free.png";

type TemplateByName = typeof templatesByName;
type TemplateName = keyof TemplateByName;
type TemplateNameWithVariables = {
  name: TemplateName;
  variables: ValueOf<typeof defaultEmailValueByEmailKind>;
};

const defaultTemplateName: TemplateName =
  "VALIDATED_CONVENTION_FINAL_CONFIRMATION";

export const EmailPreviewTab = () => {
  const { cx } = useStyles();

  const [currentTemplate, setCurrentTemplate] =
    useState<TemplateNameWithVariables>({
      name: defaultTemplateName,
      variables: defaultEmailValueByEmailKind[defaultTemplateName],
    });

  const fakeContent = configureGenerateHtmlFromTemplate(
    templatesByName,
    { contactEmail: immersionFacileContactEmail },
    "internshipKind" in currentTemplate.variables &&
      currentTemplate.variables.internshipKind === "mini-stage-cci"
      ? {
          header: cciCustomHtmlHeader,
          footer: cciCustomHtmlFooter,
        }
      : { footer: undefined, header: undefined },
  )(currentTemplate.name, currentTemplate.variables, {
    skipHead: true,
  });

  return (
    <div className={cx("admin-tab__email-preview")}>
      <DsfrTitle level={5} text="Aperçu de template email" />
      <div>
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          <aside className={fr.cx("fr-col-12", "fr-col-lg-4")}>
            <div className={fr.cx("fr-select-group")}>
              <label className={fr.cx("fr-label")} htmlFor="selectTemplateName">
                Liste de templates email :
              </label>
              <select
                className={fr.cx("fr-select")}
                id="selectTemplateName"
                name="templateName"
                onChange={(event) => {
                  const templateName = event.currentTarget
                    .value as TemplateName;
                  return setCurrentTemplate({
                    name: templateName,
                    variables: defaultEmailValueByEmailKind[templateName],
                  });
                }}
              >
                {keys(templatesByName).map((templateName) => (
                  <option key={templateName} value={templateName}>
                    {templatesByName[templateName].niceName}
                  </option>
                ))}
              </select>
            </div>

            <h6>Métadonnées</h6>
            <ul className={fr.cx("fr-badge-group")}>
              <li>
                <span className={fr.cx("fr-badge", "fr-badge--green-menthe")}>
                  Sujet
                </span>
              </li>
              <li>{fakeContent.subject}</li>
            </ul>
            {fakeContent.tags && fakeContent.tags.length > -1 && (
              <ul className={fr.cx("fr-badge-group", "fr-mt-2w")}>
                <li>
                  <span className={fr.cx("fr-badge", "fr-badge--blue-ecume")}>
                    Tags
                  </span>
                </li>
                <li>{fakeContent.tags.join(", ")}</li>
              </ul>
            )}

            <h6 className={fr.cx("fr-mt-4w")}>Données de prévisualisation</h6>
            <ul>
              {Object.keys(currentTemplate.variables)
                .sort()
                .map((variableName) => (
                  <li key={variableName}>
                    <EmailVariableField
                      variableName={variableName}
                      variableValue={
                        currentTemplate.variables[
                          variableName as keyof typeof currentTemplate.variables
                        ]
                      }
                      onChange={(value) =>
                        setCurrentTemplate({
                          ...currentTemplate,
                          variables: {
                            ...currentTemplate.variables,
                            [variableName]: value,
                          },
                        })
                      }
                    />
                  </li>
                ))}
            </ul>
            <h6 className={fr.cx("fr-mt-4w")}>Pièces jointes</h6>
            {fakeContent.attachment ? (
              <ul>
                {fakeContent.attachment.map((att) => (
                  <li key={att.url}>
                    <a target={"_blank"} href={att.url}>
                      {att.url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Ce template de mail n'a pas de pièces jointes.</p>
            )}
          </aside>
          <section className={fr.cx("fr-col-12", "fr-col-lg-8")}>
            <div
              className={cx("admin-tab__email-preview-wrapper")}
              dangerouslySetInnerHTML={{ __html: fakeContent.htmlContent }}
            ></div>
          </section>
        </div>
      </div>
    </div>
  );
};

type EmailVariableFieldProps = {
  variableName: string;
  variableValue: any;
  onChange(value: any): void;
};
const EmailVariableField = ({
  variableName,
  variableValue,
  onChange,
}: EmailVariableFieldProps): JSX.Element => {
  if (variableName === "internshipKind")
    return (
      <Select
        id=""
        label={variableName}
        name={variableName}
        options={internshipKinds.map((internshipKind) => ({
          label: internshipKind,
          value: internshipKind,
        }))}
        className={fr.cx("fr-mb-2w")}
        onChange={(e) => onChange(e.target.value)}
        value={variableValue}
      />
    );
  if (["string", "number", "undefined"].includes(typeof variableValue))
    return (
      <ImmersionTextField
        label={variableName}
        name={variableName}
        value={variableValue ?? ""}
        className={fr.cx("fr-mb-2w")}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  return (
    <div className={fr.cx("fr-input-group", "fr-mb-2w")}>
      <label className={fr.cx("fr-label")}>{variableName}</label>
      <pre className={fr.cx("fr-text--xs", "fr-m-auto")}>
        <code>{JSON.stringify(variableValue, null, 2)}</code>
      </pre>
    </div>
  );
};

export const defaultEmailValueByEmailKind: {
  [K in TemplateName]: Parameters<TemplateByName[K]["createEmailVariables"]>[0];
} = {
  NEW_CONVENTION_BENEFICIARY_CONFIRMATION: {
    internshipKind: "immersion",
    demandeId: "DEMANDE_ID",
    firstName: "FIRST_NAME",
    lastName: "LAST_NAME",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  NEW_CONVENTION_ESTABLISHMENT_TUTOR_CONFIRMATION: {
    internshipKind: "immersion",
    demandeId: "DEMANDE_ID",
    establishmentTutorName: "ESTABLISHMENT_TUTOR_NAME",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  NEW_CONVENTION_AGENCY_NOTIFICATION: {
    internshipKind: "immersion",
    demandeId: "DEMANDE_ID",
    firstName: "FIRST_NAME",
    lastName: "LAST_NAME",
    dateStart: "DATE_START",
    dateEnd: "DATE_END",
    businessName: "BUSINESS_NAME",
    agencyName: "AGENCY_NAME",
    magicLink: "MAGIC_LINK",
    conventionStatusLink: "CONVENTION_STATUS_LINK",
    agencyLogoUrl: defaultEmailPreviewUrl,
    warning: "WARNING",
  },
  VALIDATED_CONVENTION_FINAL_CONFIRMATION: {
    internshipKind: "immersion",
    totalHours: 0,
    emergencyContactInfos: "EMERGENCY_CONTACT_INFOS",
    dateStart: "DATE_START",
    dateEnd: "DATE_END",
    establishmentTutorName: "ESTABLISHMENT_TUTOR_NAME",
    scheduleText: ["HOUR1", "HOUR2"],
    businessName: "BUSINESS_NAME",
    immersionAddress: "IMMERSION_ADDRESS",
    immersionAppellationLabel: "IMMERSION_APPELLATION_LABEL",
    immersionActivities: "IMMERSION_ACTIVITIES",
    immersionSkills: "IMMERSION_SKILLS",
    sanitaryPrevention: "SANITARY_PREVENTION",
    individualProtection: "INDIVIDUAL_PROTECTION",
    questionnaireUrl: "QUESTIONNAIRE_URL",
    signature: "SIGNATURE",
    workConditions: undefined,
    agencyName: "AGENCY_NAME",
    agencyLogoUrl: defaultEmailPreviewUrl,
    signatories: {
      beneficiary: {
        role: "beneficiary",
        email: "beneficiary@email.fr",
        phone: "+33012345678",
        firstName: "Esteban",
        lastName: "Ocon",
        signedAt: new Date("2021-01-04").toISOString(),
        emergencyContact: "Clariss Ocon",
        emergencyContactPhone: "0663567896",
        emergencyContactEmail: "clariss.ocon@emergencycontact.com",
        financiaryHelp: "Un stage rémunéré au SMIC?",
        birthdate: "2002-10-05T14:48:00.000Z",
      },
      establishmentRepresentative: {
        email: "establishment@example.com",
        firstName: "Billy",
        lastName: "Idol",
        phone: "0602010203",
        role: "establishment-representative",
        signedAt: new Date("2021-01-04").toISOString(),
      },
      beneficiaryRepresentative: {
        firstName: "Tom",
        lastName: "Cruise",
        phone: "0665454271",
        role: "beneficiary-representative",
        email: "beneficiary@representative.fr",
        signedAt: new Date("2021-01-04").toISOString(),
      },
      beneficiaryCurrentEmployer: {
        businessName: "boss",
        role: "beneficiary-current-employer",
        email: "current@employer.com",
        phone: "001223344",
        firstName: "Harry",
        lastName: "Potter",
        job: "Magician",
        businessSiret: "01234567891234",
        signedAt: new Date("2021-01-04").toISOString(),
      },
    },
    agencyValidationDate: new Date().toISOString(),
    agencyAddress: {
      streetNumberAndAddress: "20 rue des bouchers",
      postcode: "93430",
      departmentCode: "93",
      city: "Villetaneuse",
    },
    immersionObjective: "Confirmer un projet professionnel",
    establishmentSiret: "34493368400021",
  },
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED: {
    advisorFirstName: "ADVISOR_FIRST_NAME",
    advisorLastName: "ADVISOR_LAST_NAME",
    immersionAddress: "IMMERSION_ADDRESS",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    beneficiaryEmail: "BENEFICIARY_EMAIL",
    dateStart: "DATE_START",
    dateEnd: "DATE_END",
    businessName: "BUSINESS_NAME",
    magicLink: "MAGIC_LINK",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  POLE_EMPLOI_ADVISOR_ON_CONVENTION_ASSOCIATION: {
    advisorFirstName: "ADVISOR_FIRST_NAME",
    advisorLastName: "ADVISOR_LAST_NAME",
    immersionAddress: "IMMERSION_ADDRESS",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    beneficiaryEmail: "BENEFICIARY_EMAIL",
    dateStart: "DATE_START",
    dateEnd: "DATE_END",
    businessName: "BUSINESS_NAME",
    magicLink: "MAGIC_LINK",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  REJECTED_CONVENTION_NOTIFICATION: {
    internshipKind: "immersion",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    rejectionReason: "REJECTION_REASON",
    businessName: "BUSINESS_NAME",
    signature: "SIGNATURE",
    immersionProfession: "IMMERSION_PROFESSION",
    agency: "AGENCY",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  CONVENTION_MODIFICATION_REQUEST_NOTIFICATION: {
    internshipKind: "immersion",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    justification: "REASON",
    businessName: "BUSINESS_NAME",
    signature: "SIGNATURE",
    immersionAppellation: {
      appellationCode: "A1111",
      appellationLabel: "MON LABEL APPELATION",
      romeCode: "R1111",
      romeLabel: "MON LABEL ROME",
    },
    agency: "AGENCY",
    magicLink: "MAGIC_LINK",
    conventionStatusLink: "CONVENTION_STATUS_LINK",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  NEW_CONVENTION_REVIEW_FOR_ELIGIBILITY_OR_VALIDATION: {
    internshipKind: "immersion",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    businessName: "BUSINESS_NAME",
    magicLink: "MAGIC_LINK",
    conventionStatusLink: "CONVENTION_STATUS_LINK",
    possibleRoleAction: "POSSIBLE_ROLE_ACTION",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  MAGIC_LINK_RENEWAL: {
    internshipKind: "immersion",
    magicLink: "MAGIC_LINK",
    conventionStatusLink: "CONVENTION_STATUS_LINK",
  },
  BENEFICIARY_OR_ESTABLISHMENT_REPRESENTATIVE_ALREADY_SIGNED_NOTIFICATION: {
    internshipKind: "immersion",
    magicLink: "MAGIC_LINK",
    conventionStatusLink: "CONVENTION_STATUS_LINK",
    existingSignatureName: "EXISTING_SIGNATURE_NAME",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    immersionProfession: "IMMERSION_PROFESSION",
    businessName: "BUSINESS_NAME",
    establishmentRepresentativeName: "ESTABLISHMENT_REPRESENTATIVE_NAME",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  NEW_CONVENTION_CONFIRMATION_REQUEST_SIGNATURE: {
    internshipKind: "immersion",
    beneficiaryName: "BENEFICIARY_NAME",
    establishmentRepresentativeName: "ESTABLISHMENT_REPRESENTATIVE_NAME",
    establishmentTutorName: "ESTABLISHMENT_TUTOR_NAME",
    beneficiaryRepresentativeName: undefined,
    signatoryName: "SIGNATORY_NAME",
    magicLink: "MAGIC_LINK",
    conventionStatusLink: "CONVENTION_STATUS_LINK",
    businessName: "BUSINESS_NAME",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  CONTACT_BY_EMAIL_REQUEST: {
    businessName: "BUSINESS_NAME",
    contactFirstName: "CONTACT_FIRST_NAME",
    contactLastName: "CONTACT_LAST_NAME",
    jobLabel: "JOB_LABEL",
    potentialBeneficiaryFirstName: "POTENTIAL_BENEFICIARY_FIRST_NAME",
    potentialBeneficiaryLastName: "POTENTIAL_BENEFICIARY_LAST_NAME",
    potentialBeneficiaryEmail: "POTENTIAL_BENEFICIARY_EMAIL",
    message: "MESSAGE",
  },
  CONTACT_BY_PHONE_INSTRUCTIONS: {
    businessName: "BUSINESS_NAME",
    contactFirstName: "CONTACT_FIRST_NAME",
    contactLastName: "CONTACT_LAST_NAME",
    contactPhone: "CONTACT_PHONE",
    potentialBeneficiaryFirstName: "POTENTIAL_BENEFICIARY_FIRST_NAME",
    potentialBeneficiaryLastName: "POTENTIAL_BENEFICIARY_LAST_NAME",
  },
  CONTACT_IN_PERSON_INSTRUCTIONS: {
    businessName: "BUSINESS_NAME",
    contactFirstName: "CONTACT_FIRST_NAME",
    contactLastName: "CONTACT_LAST_NAME",
    businessAddress: "BUSINESS_ADDRESS",
    potentialBeneficiaryFirstName: "POTENTIAL_BENEFICIARY_FIRST_NAME",
    potentialBeneficiaryLastName: "POTENTIAL_BENEFICIARY_LAST_NAME",
  },
  SHARE_DRAFT_CONVENTION_BY_LINK: {
    internshipKind: "immersion",
    additionalDetails: "ADDITIONAL_DETAILS",
    conventionFormUrl: "CONVENTION_FORM_URL",
  },
  AGENCY_WAS_ACTIVATED: {
    agencyName: "AGENCY_NAME",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  SUGGEST_EDIT_FORM_ESTABLISHMENT: {
    editFrontUrl: "EDIT_FRONT_URL",
  },
  EDIT_FORM_ESTABLISHMENT_LINK: {
    editFrontUrl: "EDIT_FRONT_URL",
  },
  NEW_ESTABLISHMENT_CREATED_CONTACT_CONFIRMATION: {
    contactFirstName: "CONTACT_FIRST_NAME",
    contactLastName: "CONTACT_LAST_NAME",
    businessName: "BUSINESS_NAME",
  },
  CREATE_IMMERSION_ASSESSMENT: {
    internshipKind: "immersion",
    beneficiaryFirstName: "BENEFICIARY_FIRST_NAME",
    beneficiaryLastName: "BENEFICIARY_LAST_NAME",
    establishmentTutorName: "ESTABLISHMENT_TUTOR_NAME",
    immersionAssessmentCreationLink: "IMMERSION_ASSESSMENT_CREATION_LINK",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  FULL_PREVIEW_EMAIL: {
    internshipKind: "immersion",
    beneficiaryName: "BENEFICIARY_NAME",
    establishmentRepresentativeName: "ESTABLISHMENT_REPRESENTATIVE_NAME",
    beneficiaryRepresentativeName: undefined,
    signatoryName: "SIGNATORY_NAME",
    magicLink: "MAGIC_LINK",
    conventionStatusLink: "CONVENTION_STATUS_LINK",
    businessName: "BUSINESS_NAME",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
  SIGNEE_HAS_SIGNED_CONVENTION: {
    internshipKind: "immersion",
    signedAt: new Date().toISOString(),
    demandeId: "DEMANDE_ID",
    conventionStatusLink: "CONVENTION_STATUS_LINK",
    agencyLogoUrl: defaultEmailPreviewUrl,
  },
};
