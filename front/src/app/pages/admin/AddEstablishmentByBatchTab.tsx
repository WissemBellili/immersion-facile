import React, { useEffect, useRef, useState } from "react";
import { DsfrTitle } from "src/../../libs/react-design-system";
import { UploadCsv } from "src/app/components/UploadCsv";
import Papa from "papaparse";
import { ContactMethod, FormEstablishmentDto } from "src/../../shared/src";
import Button from "@codegouvfr/react-dsfr/Button";
import { keys, values } from "ramda";
import { fr } from "@codegouvfr/react-dsfr";

type CSVBoolean = "1" | "0" | "";
type CSVOptionalString = string | "";

type EstablishmentCSVRow = {
  siret: string;
  businessNameCustomized: CSVOptionalString;
  businessName: string;
  businessAddress: string;
  naf_code: string;
  appellations_code: string;
  isEngagedEnterprise: CSVBoolean;
  businessContact_job: string;
  businessContact_email: string;
  businessContact_phone: string;
  businessContact_lastName: string;
  businessContact_firstName: string;
  businessContact_contactMethod: ContactMethod;
  businessContact_copyEmails: string;
  isSearchable: CSVBoolean;
  website: CSVOptionalString;
  additionalInformation: CSVOptionalString;
  fitForDisabledWorkers: CSVBoolean;
};

const csvBooleanToBoolean = (value: string) => Boolean(parseInt(value));

export const AddEstablishmentByBatchTab = () => {
  const papaOptions: Papa.ParseRemoteConfig<EstablishmentCSVRow> = {
    header: true,
    complete: (papaParsedReturn: Papa.ParseResult<EstablishmentCSVRow>) =>
      setParsedReturn(papaParsedReturn),
    download: true,
  };

  const [parsedReturn, setParsedReturn] =
    useState<Papa.ParseResult<EstablishmentCSVRow> | null>(null);

  const [stagingEstablishments, setStagingEstablishments] = useState<
    FormEstablishmentDto[] | undefined
  >(undefined);

  const tableElement = useRef<HTMLTableElement | null>(null);

  useEffect(() => {
    const updatedStagingEstablishments = parsedReturn?.data.map(
      (establishmentRow: EstablishmentCSVRow): FormEstablishmentDto => ({
        businessAddress: establishmentRow.businessAddress,
        businessName: establishmentRow.businessName,
        siret: establishmentRow.siret,
        businessNameCustomized: establishmentRow.businessNameCustomized,
        additionalInformation: establishmentRow.additionalInformation,
        naf: {
          code: establishmentRow.naf_code,
          nomenclature: "NAFRev2",
        },
        website: establishmentRow.website,
        source: "immersion-facile",
        appellations: establishmentRow.appellations_code
          .split(",")
          .map((appellationCode) => ({
            appellationCode,
            appellationLabel: "",
            romeCode: "",
            romeLabel: "",
          })),
        businessContact: {
          contactMethod: establishmentRow.businessContact_contactMethod,
          copyEmails: establishmentRow.businessContact_copyEmails.split(","),
          email: establishmentRow.businessContact_email,
          firstName: establishmentRow.businessContact_firstName,
          job: establishmentRow.businessContact_job,
          lastName: establishmentRow.businessContact_lastName,
          phone: establishmentRow.businessContact_phone,
        },
        isSearchable: csvBooleanToBoolean(establishmentRow.isSearchable),
        fitForDisabledWorkers: csvBooleanToBoolean(
          establishmentRow.fitForDisabledWorkers,
        ),
        isEngagedEnterprise: csvBooleanToBoolean(
          establishmentRow.isEngagedEnterprise,
        ),
      }),
    );
    setStagingEstablishments(updatedStagingEstablishments);
  }, [parsedReturn]);
  const onFullscreenClick = async () => {
    await tableElement.current?.requestFullscreen();
  };
  return (
    <div className="admin-tab__import-batch-establishment">
      <DsfrTitle level={5} text="Import en masse d'entreprises" />
      <div className={fr.cx("fr-input-group")}>
        <label className={fr.cx("fr-label")} htmlFor="group-name-input">
          Renseignez un nom de groupe d'entreprises *
        </label>
        <input
          className={fr.cx("fr-input")}
          type="text"
          placeholder={"Le nom de votre groupement d'entreprise"}
          name="group-name"
          id="group-name-input"
        />
      </div>

      <UploadCsv
        label={"Uploader votre CSV *"}
        maxSize_Mo={10}
        onUpload={(file) => {
          const reader = new FileReader();
          reader.onload = function () {
            const rawCsvUrl = reader.result as string;
            Papa.parse(rawCsvUrl, papaOptions);
          };
          reader.readAsDataURL(file);
        }}
      />

      {stagingEstablishments && !!stagingEstablishments.length && (
        <div className={fr.cx("fr-mt-6w")}>
          <Button
            title="Importer ces succursales"
            onClick={() => alert("Todo import")}
          >
            Importer ces succursales
          </Button>
          <div
            className={fr.cx("fr-table", "fr-table--bordered", "fr-mt-4w")}
            ref={tableElement}
          >
            <table>
              <caption onClick={onFullscreenClick}>
                Résumé de l'import à effectuer (voir en plein écran)
              </caption>
              <thead>
                <tr>
                  {keys(stagingEstablishments[0]).map((key) => (
                    <th scope="col" key={key}>
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stagingEstablishments.map((establishment) => (
                  <tr key={establishment.siret}>
                    {values(establishment).map((value, index) => (
                      <td
                        key={`${establishment.siret}-value-${index}`}
                        className={fr.cx("fr-text--xs")}
                      >
                        {value ? JSON.stringify(value) : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
