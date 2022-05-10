import { Column } from "exceljs";
import { map, prop, groupBy, uniq, reduceBy, values } from "ramda";
import { pipeWithValue } from "shared/src/pipeWithValue";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { Archive } from "../../generic/archive/port/Archive";
import { Workbook } from "../../generic/excel/port/Workbook";
import { EstablishmentReadyForExportVO } from "../valueObjects/EstablishmentReadyForExportVO";
import {
  EstablishmentRawBeforeExportProps,
  EstablishmentRawBeforeExportVO,
  EstablishmentRawProps,
} from "../valueObjects/EstablishmentRawBeforeExportVO";
import { notifyDiscord } from "../../../utils/notifyDiscord";
import { DepartmentAndRegion } from "../../generic/geo/ports/PostalCodeDepartmentRegionQueries";
import { establishmentExportSchemaObj } from "shared/src/establishmentExport/establishmentExport.schema";
import {
  DepartmentOrRegion,
  EstablishmentExportConfigDto,
} from "shared/src/establishmentExport/establishmentExport.dto";
import { z } from "zod";
import {
  captureAddressGroups,
  CaptureAddressGroupsResult,
} from "shared/src/utils/address";
import { retrieveParentDirectory } from "../../../utils/filesystemUtils";

export type EstablishmentExportConfig = EstablishmentExportConfigDto & {
  archivePath: string;
};

export class ExportEstablishmentsAsExcelArchive extends TransactionalUseCase<EstablishmentExportConfig> {
  inputSchema = z.object({
    ...establishmentExportSchemaObj,
    archivePath: z.string(),
  });

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  protected async _execute(
    config: EstablishmentExportConfig,
    uow: UnitOfWork,
  ): Promise<void> {
    const [
      establishmentsWithoutGeoRawBeforeExport,
      postalCodeDepartmentRegion,
    ] = await Promise.all([
      getEstablishmentsForExport(config, uow),
      uow.postalCodeDepartmentRegionQueries.getAllRegionAndDepartmentByPostalCode(),
    ]);

    const establishmentExportByZone = pipeWithValue(
      aggregateProfessionsIfNeeded(
        config,
        establishmentsWithoutGeoRawBeforeExport,
      ),
      map((establishment) => {
        const establishmentWithGeoProps = addZonesDelimiters(
          establishment,
          postalCodeDepartmentRegion,
        );
        return new EstablishmentRawBeforeExportVO(
          establishmentWithGeoProps,
        ).toEstablishmentReadyForExportVO();
      }),
      groupBy(prop(config.groupKey)),
    );

    const workbooksTitles = Object.keys(establishmentExportByZone);

    notifyProblematicEstablishments(workbooksTitles, establishmentExportByZone);

    const workbookColumnsOptions = establishmentsExportByZoneColumnsOptions(
      config.groupKey,
    );

    const createdFilenames = await Promise.all(
      workbooksTitles.map((groupBy: string) =>
        toWorkbook(
          groupBy,
          establishmentExportByZone[groupBy],
          workbookColumnsOptions,
        ).toXlsx(retrieveParentDirectory(config.archivePath)),
      ),
    );

    const zipArchive = new Archive(config.archivePath);
    await zipArchive.addFiles(createdFilenames, { removeOriginal: true });
  }
}

export const aggregateProfessionsIfNeeded = (
  config: EstablishmentExportConfigDto,
  establishmentsWithoutGeoRawBeforeExport: EstablishmentRawProps[],
) =>
  config.aggregateProfession === "true"
    ? reduceByProfessions(establishmentsWithoutGeoRawBeforeExport)
    : establishmentsWithoutGeoRawBeforeExport;

export const getEstablishmentsForExport = (
  config: EstablishmentExportConfigDto & { archivePath: string },
  uow: UnitOfWork,
) =>
  config.sourceProvider === "all"
    ? uow.establishmentExportQueries.getAllEstablishmentsForExport()
    : uow.establishmentExportQueries.getEstablishmentsBySourceProviderForExport(
        config.sourceProvider,
      );

export const establishmentsExportByZoneColumnsOptions = (
  groupBy: DepartmentOrRegion,
): Partial<Column>[] => {
  const allColumns: Partial<Column>[] = [
    {
      header: "Siret",
      key: "siret",
      width: 25,
    },
    {
      header: "Raison Sociale",
      key: "name",
      width: 35,
    },
    {
      header: "Enseigne",
      key: "customizedName",
      width: 35,
    },
    {
      header: "Adresse",
      key: "address",
      width: 20,
    },
    {
      header: "Code Postal",
      key: "postalCode",
      width: 15,
    },
    {
      header: "Ville",
      key: "city",
      width: 15,
    },
    {
      header: "Département",
      key: "department",
      width: 30,
    },
    {
      header: "NAF",
      key: "nafCode",
      width: 15,
    },
    {
      header: "Nombre d'employés",
      key: "numberEmployeesRange",
      width: 15,
    },
    {
      header: "Mode de contact",
      key: "preferredContactMethods",
      width: 15,
    },
    {
      header: "Date de référencement",
      key: "createdAt",
      width: 15,
    },
    {
      header: "Appartenance Réseau « Les entreprises s'engagent »",
      key: "isCommited",
      width: 25,
    },
    {
      header: "Métiers",
      key: "professions",
      width: 400,
    },
  ];

  const excludeDepartment = (column: Partial<Column>) =>
    column.key != "department";

  return groupBy === "department"
    ? allColumns.filter(excludeDepartment)
    : allColumns;
};

const notifyProblematicEstablishments = (
  workbookTitles: string[],
  establishmentExportByZone: Record<string, EstablishmentReadyForExportVO[]>,
) => {
  if (workbookTitles.includes("postal-code-not-in-dataset"))
    notifyProblematicPostalCode(
      "(Establishment excel export) Postal code not found in dataset",
      establishmentExportByZone["postal-code-not-in-dataset"],
    );

  if (workbookTitles.includes("invalid-postal-code-format"))
    notifyProblematicPostalCode(
      "(Establishment excel export) Invalid postal code format for establishments",
      establishmentExportByZone["invalid-postal-code-format"],
    );
};

const bySiret = (establishment: EstablishmentRawProps) => establishment.siret;

type EstablishmentRawPropsWithProfessionArray = Omit<
  EstablishmentRawProps,
  "professions"
> & { professions: string[] };

const reduceProfessions = (
  accumulator: EstablishmentRawPropsWithProfessionArray,
  establishment: EstablishmentRawProps,
): EstablishmentRawPropsWithProfessionArray => {
  if (!accumulator.professions) {
    accumulator = {
      ...establishment,
      professions: [establishment.professions],
    };
    return accumulator;
  }

  return {
    ...accumulator,
    professions: uniq<string>(
      accumulator.professions.concat(establishment.professions).sort(),
    ),
  };
};

const concatProfessions = (
  establishment: EstablishmentRawPropsWithProfessionArray,
): EstablishmentRawProps => ({
  ...establishment,
  professions: establishment.professions.join(" | "),
});

const reduceByProfessions = (
  establishments: EstablishmentRawProps[],
): EstablishmentRawProps[] =>
  pipeWithValue(
    establishments,
    reduceBy(
      reduceProfessions,
      {} as EstablishmentRawPropsWithProfessionArray,
      bySiret,
    ),
    values,
    map(concatProfessions),
  );

export const addZonesDelimiters = (
  establishment: EstablishmentRawProps,
  postalCodeDepartmentRegion: Record<string, DepartmentAndRegion>,
): EstablishmentRawBeforeExportProps => {
  const capture: CaptureAddressGroupsResult = captureAddressGroups(
    establishment.address,
  );

  if (!capture.validAddress) {
    return {
      ...establishment,
      postalCode: "invalid-address-format",
      city: "invalid-address-format",
      region: "invalid-address-format",
      department: "invalid-address-format",
    };
  }

  return {
    ...establishment,
    address: capture.address,
    postalCode: capture.postalCode,
    city: capture.city,
    region:
      postalCodeDepartmentRegion[capture.postalCode]?.region ??
      "postal-code-not-in-dataset",
    department:
      postalCodeDepartmentRegion[capture.postalCode]?.department ??
      "postal-code-not-in-dataset",
  };
};

const notifyProblematicPostalCode = (
  message: string,
  problematicEstablishments: EstablishmentReadyForExportVO[],
) => {
  const serializedProblematicEstablishments = problematicEstablishments
    .map((establishment) => `${establishment.siret} | ${establishment.address}`)
    .join("\n");

  notifyDiscord(`${message}: ${serializedProblematicEstablishments}`);
};

const toWorkbook = (
  workbookTitle: string,
  establishments: EstablishmentReadyForExportVO[],
  excelColumFormatConfig: Partial<Column>[],
): Workbook<EstablishmentReadyForExportVO> =>
  new Workbook()
    .withTitle(workbookTitle)
    .withSheet()
    .withConditionalFormatting("main", {
      ref: `H2:I${establishments.length}`,
      rules: [
        {
          priority: 0,
          type: "containsText",
          operator: "containsText",
          text: "Oui",
          style: {
            fill: {
              type: "pattern",
              pattern: "solid",
              bgColor: { argb: "FF24C157" },
            },
          },
        },
        {
          priority: 1,
          type: "containsText",
          operator: "containsText",
          text: "Non déclaré",
          style: {
            fill: {
              type: "pattern",
              pattern: "solid",
              bgColor: { argb: "FFEA2020" },
            },
          },
        },
      ],
    })
    .withCustomFieldsHeaders(excelColumFormatConfig)
    .withPayload(establishments);
