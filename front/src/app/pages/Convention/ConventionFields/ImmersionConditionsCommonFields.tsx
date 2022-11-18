import { addMonths } from "date-fns";
import { useFormikContext } from "formik";
import React, { useState } from "react";
import {
  addressDtoToString,
  ConventionDto,
  conventionObjectiveOptions,
  DateIntervalDto,
  getConventionFieldName,
  reasonableSchedule,
  scheduleWithFirstDayActivity,
} from "shared";
import {
  BoolRadioGroup,
  RadioGroupForField,
} from "src/app/components/RadioGroup";
import { ConventionFormProfession } from "src/app/pages/Convention/ConventionFormProfession";
import { useConventionTextsFromFormikContext } from "src/app/pages/Convention/texts/textSetup";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { siretSelectors } from "src/core-logic/domain/siret/siret.selectors";
import { useSiretRelatedField } from "src/hooks/siret.hooks";
import { AddressAutocomplete } from "src/uiComponents/autocomplete/AddressAutocomplete";
import { DateInput } from "src/uiComponents/form/DateInput";
import { SchedulePicker } from "src/uiComponents/form/SchedulePicker/SchedulePicker";
import { TextInput } from "src/uiComponents/form/TextInput";

export const ImmersionConditionsCommonFields = ({
  disabled,
}: {
  disabled?: boolean;
}) => {
  const t = useConventionTextsFromFormikContext();
  const { setFieldValue, values } = useFormikContext<ConventionDto>();
  const establishmentInfos = useAppSelector(siretSelectors.establishmentInfos);
  const isFetchingSiret = useAppSelector(siretSelectors.isFetching);
  const isSiretFetcherDisabled = values.status !== "DRAFT";
  const [dateMax, setDateMax] = useState(
    addMonths(new Date(values.dateStart), 1).toISOString(),
  );
  useSiretRelatedField("businessName", {
    disabled: isSiretFetcherDisabled,
  });
  useSiretRelatedField("businessAddress", {
    fieldToUpdate: "immersionAddress",
    disabled: isSiretFetcherDisabled,
  });

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
      <DateInput
        label={`${t.immersionConditionsCommonFields.dateStartLabel} *`}
        name={getConventionFieldName("dateStart")}
        disabled={disabled}
        onDateChange={(dateStart) => {
          resetSchedule({
            start: new Date(dateStart),
            end: new Date(values.dateEnd),
          });
          setFieldValue("dateStart", dateStart);
          setDateMax(addMonths(new Date(dateStart), 1).toISOString());
        }}
      />
      <DateInput
        label={`${t.immersionConditionsCommonFields.dateEndLabel} *`}
        name={getConventionFieldName("dateEnd")}
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
      <TextInput
        label={t.immersionConditionsCommonFields.workConditions.label}
        name={getConventionFieldName("workConditions")}
        description={
          t.immersionConditionsCommonFields.workConditions.description
        }
        disabled={disabled}
      />
      <AddressAutocomplete
        initialSearchTerm={
          values.immersionAddress ?? establishmentInfos?.businessAddress
        }
        label={`${t.immersionConditionsCommonFields.immersionAddressLabel} *`}
        setFormValue={({ address }) =>
          setFieldValue("immersionAddress", addressDtoToString(address))
        }
        disabled={disabled || isFetchingSiret}
      />
      <BoolRadioGroup
        name={getConventionFieldName("individualProtection")}
        label={`${t.immersionConditionsCommonFields.individualProtectionLabel} *`}
        disabled={disabled}
      />
      <BoolRadioGroup
        name={getConventionFieldName("sanitaryPrevention")}
        label={`${t.immersionConditionsCommonFields.sanitaryPreventionLabel} *`}
        disabled={disabled}
      />
      <TextInput
        label={
          t.immersionConditionsCommonFields.sanitaryPreventionDetails.label
        }
        name={getConventionFieldName("sanitaryPreventionDescription")}
        type="text"
        placeholder=""
        description={
          t.immersionConditionsCommonFields.sanitaryPreventionDetails
            .description
        }
        disabled={disabled}
      />
      <RadioGroupForField
        name={getConventionFieldName("immersionObjective")}
        label={`${t.immersionConditionsCommonFields.immersionObjectiveLabel} *`}
        options={conventionObjectiveOptions.map((value) => ({
          value,
        }))}
        disabled={disabled}
      />
      <ConventionFormProfession
        label={`${t.immersionConditionsCommonFields.profession.label} *`}
        description={t.immersionConditionsCommonFields.profession.description}
        disabled={disabled}
        initialFieldValue={values.immersionAppellation}
      />
      <TextInput
        label={`${t.immersionConditionsCommonFields.immersionActivities.label} *`}
        name={getConventionFieldName("immersionActivities")}
        type="text"
        placeholder=""
        description={
          t.immersionConditionsCommonFields.immersionActivities.description
        }
        disabled={disabled}
      />
      <TextInput
        label={`${t.immersionConditionsCommonFields.immersionSkills.label}`}
        name={getConventionFieldName("immersionSkills")}
        type="text"
        placeholder=""
        description={
          t.immersionConditionsCommonFields.immersionSkills.description
        }
        disabled={disabled}
      />
    </>
  );
};
