import { fr } from "@codegouvfr/react-dsfr";
import { addMonths } from "date-fns";
import { useFormikContext } from "formik";
import React, { useState } from "react";
import { Notification } from "react-design-system";
import {
  addressDtoToString,
  ConventionDto,
  conventionObjectiveOptions,
  DateIntervalDto,
  isStringDate,
  reasonableSchedule,
  scheduleWithFirstDayActivity,
} from "shared";
import { AddressAutocomplete } from "src/app/components/forms/autocomplete/AddressAutocomplete";
import { DateInput } from "src/app/components/forms/commons/DateInput";
import {
  BoolRadioGroup,
  RadioGroupForField,
} from "src/app/components/forms/commons/RadioGroup";
import { SchedulePicker } from "src/app/components/forms/commons/SchedulePicker/SchedulePicker";
import { TextInput } from "src/app/components/forms/commons/TextInput";
import { ConventionFormProfession } from "src/app/components/forms/convention/ConventionFormProfession";
import { formConventionFieldsLabels } from "src/app/contents/forms/convention/formConvention";
import { useFormContents } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useSiretRelatedField } from "src/app/hooks/siret.hooks";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";

export const ImmersionConditionsCommonFields = ({
  disabled,
}: {
  disabled?: boolean;
}) => {
  const { setFieldValue, values } = useFormikContext<ConventionDto>();
  const establishmentInfos = useAppSelector(siretSelectors.establishmentInfos);
  const isFetchingSiret = useAppSelector(siretSelectors.isFetching);
  const isSiretFetcherDisabled = values.status !== "DRAFT";
  const defaultDateMax = isStringDate(values.dateStart)
    ? new Date(values.dateStart)
    : new Date();
  const [dateMax, setDateMax] = useState(
    addMonths(defaultDateMax, 1).toISOString(),
  );
  useSiretRelatedField("businessName", {
    disabled: isSiretFetcherDisabled,
  });
  useSiretRelatedField("businessAddress", {
    fieldToUpdate: "immersionAddress",
    disabled: isSiretFetcherDisabled,
  });
  const { getFormFields } = useFormContents(
    formConventionFieldsLabels(values.internshipKind),
  );
  const formContents = getFormFields();

  const resetSchedule = (interval: DateIntervalDto) => {
    setFieldValue(
      "schedule",
      values.schedule.isSimple
        ? reasonableSchedule(interval)
        : scheduleWithFirstDayActivity(interval),
    );
  };
  return (
    <>
      {values.internshipKind === "mini-stage-cci" && (
        <>
          <Notification title="" type="info" className={fr.cx("fr-mb-4w")}>
            La présente convention est signée pour la durée de la période
            d’observation en milieu professionnel, qui ne peut dépasser une
            semaine sur une période de vacances scolaires fixée annuellement par
            le Ministère de l’éducation nationale. La durée de la présence
            hebdomadaire des jeunes en milieu professionnel ne peut excéder 30
            heures pour les jeunes de moins de 15 ans et 35 heures pour les
            jeunes de 15 ans et plus répartis sur 5 jours.
          </Notification>
          <Notification
            title="Assurances"
            type="info"
            className={fr.cx("fr-mb-4w")}
          >
            Afin de préparer au mieux les conditions de réalisation du stage,
            les signataires de la conventions s’engagent à avoir une couverture
            d’assurance suffisante tant pour les dommages pouvant être
            occasionnés par le jeune que pour les risques auxquels il peut être
            exposé.
          </Notification>
        </>
      )}
      <DateInput
        {...formContents["dateStart"]}
        disabled={disabled}
        onDateChange={(dateStart) => {
          resetSchedule({
            start: new Date(dateStart),
            end: new Date(values.dateEnd),
          });
          setFieldValue("dateStart", dateStart);
          if (isStringDate(dateStart)) {
            setDateMax(addMonths(new Date(dateStart), 1).toISOString());
          }
        }}
      />
      <DateInput
        {...formContents["dateEnd"]}
        disabled={disabled}
        max={dateMax}
        onDateChange={(dateEnd) => {
          resetSchedule({
            start: new Date(values.dateStart),
            end: new Date(dateEnd),
          });
          setFieldValue("dateEnd", dateEnd);
        }}
      />
      <SchedulePicker
        disabled={disabled}
        interval={{
          start: new Date(values.dateStart),
          end: new Date(values.dateEnd),
        }}
      />
      <AddressAutocomplete
        {...formContents["immersionAddress"]}
        initialSearchTerm={
          values.immersionAddress ?? establishmentInfos?.businessAddress
        }
        setFormValue={({ address }) =>
          setFieldValue("immersionAddress", addressDtoToString(address))
        }
        disabled={disabled || isFetchingSiret}
      />
      <BoolRadioGroup
        {...formContents["individualProtection"]}
        disabled={disabled}
      />
      {values.internshipKind === "mini-stage-cci" && (
        <Notification title="" type="info" className={fr.cx("fr-mb-4w")}>
          En application des articles L 4153-8 et D 4153-15 et suivants du code
          du travail, relatif aux travaux interdits et règlementés, le jeune,
          s’il est mineur, ne peut accéder aux machines, appareils ou produits
          dont l’usage est proscrit aux mineurs. Il ne peut ni procéder à des
          manœuvres ou manipulations sur d’autres machines, produits ou
          appareils de production, ni effectuer les travaux légers autorisés aux
          mineurs par le même code.
        </Notification>
      )}
      <BoolRadioGroup
        {...formContents["sanitaryPrevention"]}
        disabled={disabled}
      />
      <TextInput
        {...formContents["sanitaryPreventionDescription"]}
        type="text"
        disabled={disabled}
      />
      {values.internshipKind === "mini-stage-cci" && (
        <Notification title="" type="info" className={fr.cx("fr-mb-4w")}>
          De même, les parties signataires de la convention s’engagent à mettre
          en œuvre et respecter les consignes publiées par les services de
          l’Etat, notamment pour exemple celles concernant les mesures de
          prévention des risques de contamination en matière sanitaire.
        </Notification>
      )}
      <RadioGroupForField
        {...formContents["immersionObjective"]}
        options={conventionObjectiveOptions
          .filter((value) =>
            values.internshipKind !== "mini-stage-cci"
              ? true
              : value !== "Initier une démarche de recrutement",
          )
          .map((value) => ({
            value,
          }))}
        disabled={disabled}
      />
      <ConventionFormProfession
        {...formContents["immersionAppellation"]}
        disabled={disabled}
        initialFieldValue={values.immersionAppellation}
      />
      <TextInput
        {...formContents["workConditions"]}
        disabled={disabled}
        multiline={true}
      />
      <TextInput
        {...formContents["businessAdvantages"]}
        disabled={disabled}
        multiline={true}
      />
      <TextInput
        {...formContents["immersionActivities"]}
        disabled={disabled}
        multiline={true}
      />
      {values.internshipKind === "mini-stage-cci" && (
        <Notification title="" type="info" className={fr.cx("fr-mb-4w")}>
          Durant la période d’observation, le jeune participe à des activités de
          l’entreprise, en liaison avec les objectifs précisés dans l’annexe
          pédagogique, sous le contrôle des personnels responsables de leur
          encadrement en milieu professionnel. Il est soumis aux règles
          générales en vigueur dans l’entreprise ou l’organisme d’accueil,
          notamment en matière de santé, sécurité, d’horaires et de discipline.
          Le jeune est tenu au respect du secret professionnel.
        </Notification>
      )}
      <TextInput
        {...formContents["immersionSkills"]}
        type="text"
        disabled={disabled}
      />
    </>
  );
};
