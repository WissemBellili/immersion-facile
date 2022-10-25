import { Router } from "express";
import {
  adminLogin,
  agenciesRoute,
  AgencyDto,
  AgencyId,
  conventionsRoute,
  dashboardAgency,
  emailRoute,
  ExportDataDto,
  exportRoute,
  featureFlagsRoute,
  generateMagicLinkRoute,
} from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";
import { sendZipResponse } from "../../helpers/sendZipResponse";

export const createAdminRouter = (deps: AppDependencies) => {
  const adminRouter = Router({ mergeParams: true });

  adminRouter
    .route(`/${adminLogin}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.adminLogin.execute(req.body),
      ),
    );

  adminRouter.use(deps.adminAuthMiddleware);

  adminRouter.route(`/${generateMagicLinkRoute}`).get(async (req, res) =>
    sendHttpResponse(req, res, () =>
      deps.useCases.generateMagicLink.execute({
        applicationId: req.query.id,
        role: req.query.role,
        expired: req.query.expired === "true",
      } as any),
    ),
  );

  adminRouter
    .route(`/${conventionsRoute}/:id`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.getConvention.execute(req.params),
      ),
    );

  // GET,
  // PATCH Update on status to activate
  // PUT Full update following admin edit
  // admin/agencies/:id
  adminRouter
    .route(`/${agenciesRoute}/:agencyId`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, async () =>
        deps.useCases.getAgencyById.execute(req.params.agencyId),
      ),
    )
    .patch(async (req, res) =>
      sendHttpResponse(req, res, () => {
        const useCaseParams: Partial<Pick<AgencyDto, "status">> & {
          id: AgencyId;
        } = { id: req.params.agencyId, ...req.body };
        // TODO Est ce que l'on peut renommer ce UseCase sans conséquences ?
        return deps.useCases.updateAgency.execute(useCaseParams);
      }),
    );

  // GET admin/agencies?status=needsReview
  adminRouter
    .route(`/${agenciesRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.privateListAgencies.execute(req.query),
      ),
    );

  adminRouter
    .route(`/${conventionsRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, deps.useCases.dashboardConvention.execute),
    );

  // GET admin/emails
  adminRouter
    .route(`/${emailRoute}`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, deps.useCases.getSentEmails.execute),
    );

  adminRouter.route(`/${exportRoute}`).post(async (req, res) =>
    sendZipResponse(req, res, async () => {
      const exportDataParams: ExportDataDto = req.body;
      const archivePath = await deps.useCases.exportData.execute(
        exportDataParams,
      );
      return archivePath;
    }),
  );

  // GET admin/metabase
  adminRouter.route(`/${dashboardAgency}`).get(async (req, res) =>
    sendHttpResponse(
      req,
      res,
      () =>
        deps.useCases.dashboardAgency.execute(
          "046ce2ed-cc09-47c1-a446-1d1a0d7a6b4a",
        ), //TODO On identifira l'agence via son token inclusion connect
    ),
  );

  // POST admin/feature-flags
  adminRouter
    .route(`/${featureFlagsRoute}`)
    .post(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.setFeatureFlag.execute(req.body),
      ),
    );

  return adminRouter;
};
