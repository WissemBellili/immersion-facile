import {
  establishmentsExportByZoneColumnsOptions,
  addZonesDelimiters,
  aggregateProfessionsIfNeeded,
  EstablishmentExportConfig,
} from "../../../domain/establishment/useCases/ExportEstablishmentAsExcelArchive";
import {
  EstablishmentRawBeforeExportProps,
  EstablishmentRawProps,
} from "../../../domain/establishment/valueObjects/EstablishmentRawBeforeExportVO";
import { DepartmentAndRegion } from "../../../domain/generic/geo/ports/PostalCodeDepartmentRegionQueries";
import { StubEstablishmentExportQueries } from "../../../adapters/secondary/StubEstablishmentExportQueries";

describe("ExportEstablishmentByZoneAsExcelArchive", () => {
  describe("establishmentsExportByZoneColumnsOptions", () => {
    it("establishmentsExportByZoneColumnsOptions should not have department columns in group by department config", () => {
      expect(
        establishmentsExportByZoneColumnsOptions("department"),
      ).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: "department",
          }),
        ]),
      );
    });
  });

  describe("addZonesDelimiters", () => {
    it("returns invalid-postal-code-format if no postal was found in establishment address", () => {
      const wrongPostal = "Address with an incorrect postal code 94 800";

      const expected = {
        address: wrongPostal,
        region: "invalid-postal-code-format",
        department: "invalid-postal-code-format",
      } as EstablishmentRawBeforeExportProps;

      expect(
        addZonesDelimiters(
          { address: wrongPostal } as EstablishmentRawProps,
          {} as Record<string, DepartmentAndRegion>,
        ),
      ).toStrictEqual(expected);
    });

    it("returns postal-code-not-in-dataset if postal code was not found in postal code department region dataset", () => {
      const wrongPostal =
        "Address with a postal code that does not exist 99999";

      const postalCodeDepartmentRegionDataset: Record<
        string[5],
        DepartmentAndRegion
      > = {
        "11000": {
          department: "Aude",
          region: "Occitanie",
        },
      };

      const expected = {
        address: wrongPostal,
        region: "postal-code-not-in-dataset",
        department: "postal-code-not-in-dataset",
      } as EstablishmentRawBeforeExportProps;

      expect(
        addZonesDelimiters(
          { address: wrongPostal } as EstablishmentRawProps,
          postalCodeDepartmentRegionDataset,
        ),
      ).toStrictEqual(expected);
    });

    it("affects matching department and region names to postal code", () => {
      const establishmentInCarcassonne = {
        address: "51 rue Courtejaire 11000 Carcassonne",
      } as EstablishmentRawProps;

      const expected = {
        address: "51 rue Courtejaire 11000 Carcassonne",
        region: "Occitanie",
        department: "Aude",
      } as EstablishmentRawBeforeExportProps;

      expect(
        addZonesDelimiters(
          establishmentInCarcassonne,
          postalCodeDepartmentRegionDataset,
        ),
      ).toStrictEqual(expected);
    });
  });

  describe("aggregateProfessionsIfNeeded", () => {
    it("returns the data unchanged if no aggregation is needed", async () => {
      const config = {
        aggregateProfession: false,
      } as EstablishmentExportConfig;

      const rawEstablishments =
        await StubEstablishmentExportQueries.getAllEstablishmentsForExport();

      expect(
        aggregateProfessionsIfNeeded(config, rawEstablishments),
      ).toStrictEqual(rawEstablishments);
    });

    it("returns one entity per siret with concatenated professions strings", async () => {
      const config = {
        aggregateProfession: true,
      } as EstablishmentExportConfig;

      const rawEstablishments =
        await StubEstablishmentExportQueries.getAllEstablishmentsForExport();

      const expected: EstablishmentRawProps[] = [
        {
          address: "9 PL DE LA VENDEE 85000 LA ROCHE-SUR-YON",
          createdAt: "11/03/2022",
          customizedName: "Custom name",
          isCommited: true,
          nafCode: "7820Z",
          name: "ARTUS INTERIM LA ROCHE SUR YON",
          preferredContactMethods: "phone",
          professions:
            "M1502 - Chargé / Chargée de recrutement | A1205 - Ouvrier sylviculteur / Ouvrière sylvicutrice",
          siret: "79158476600012",
        },
        {
          address: "2 RUE JACQUARD 69120 VAULX-EN-VELIN",
          createdAt: "11/03/2022",
          customizedName: "Custom name",
          isCommited: false,
          nafCode: "9321Z",
          name: "MINI WORLD LYON",
          preferredContactMethods: "mail",
          professions:
            "I1304 - Technicien(ne) de maintenance industrielle polyvalente | G1205 - Agent / Agente d'exploitation des attractions",
          siret: "79341726200037",
        },
      ];

      expect(
        aggregateProfessionsIfNeeded(config, rawEstablishments),
      ).toStrictEqual(expected);
    });
  });
});

const postalCodeDepartmentRegionDataset: Record<
  string[5],
  DepartmentAndRegion
> = {
  "11000": {
    department: "Aude",
    region: "Occitanie",
  },
};
