import { Router } from "express";
import {
  exportEstablismentsExcelRoute,
  exportImmersionApplicationsExcelRoute,
} from "../../../shared/routes";
import { capitalize } from "../../../shared/utils/string";
import { temporaryStoragePath } from "../../../utils/filesystemUtils";
import { AppDependencies } from "../config";
import { sendZipResponse } from "../helpers/sendHttpResponse";

export const createExcelExportRouter = (deps: AppDependencies) => {
  const excelExportRouter = Router({ mergeParams: true });

  excelExportRouter
    .route(`/${exportImmersionApplicationsExcelRoute}`)
    .get(async (req, res) =>
      sendZipResponse(
        req,
        res,
        async () => {
          const archivePath = temporaryStoragePath("exportAgencies.zip");
          await deps.useCases.exportImmersionApplicationsAsExcelArchive.execute(
            archivePath,
          );
          return archivePath;
        },
        deps.authChecker,
      ),
    );

  excelExportRouter
    .route(`/${exportEstablismentsExcelRoute}`)
    .get(async (req, res) =>
      sendZipResponse(
        req,
        res,
        async () => {
          const groupKey =
            req.query.groupKey === "region" ? "region" : "department";
          const aggregateProfession = req.query.aggregateProfession === "true";
          const archivePath = temporaryStoragePath(
            `exportEstablishmentsBy${capitalize(groupKey)}${
              aggregateProfession ? "AggregatedProfessions" : ""
            }.zip`,
          );

          await deps.useCases.exportEstablishmentsAsExcelArchive.execute({
            archivePath,
            groupKey,
            aggregateProfession,
          });

          return archivePath;
        },
        deps.authChecker,
      ),
    );

  return excelExportRouter;
};
