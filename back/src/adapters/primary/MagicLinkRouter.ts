import { Router } from "express";
import {
  getImmersionApplicationRequestDtoSchema,
  updateImmersionApplicationRequestDtoSchema,
  updateImmersionApplicationStatusRequestSchema,
} from "../../shared/ImmersionApplicationDto";
import {
  immersionApplicationsRoute,
  updateApplicationStatusRoute,
} from "../../shared/routes";
import { LegacyAppDependencies } from "./config";
import { callUseCase } from "./helpers/callUseCase";
import { sendHttpResponse } from "./helpers/sendHttpResponse";

export const createMagicLinkRouter = (deps: LegacyAppDependencies) => {
  const authenticatedRouter = Router({ mergeParams: true });

  authenticatedRouter.use("/:jwt", deps.authMiddleware);

  authenticatedRouter
    .route(`/${immersionApplicationsRoute}/:jwt`)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        callUseCase({
          useCase: deps.useCases.getDemandeImmersion,
          validationSchema: getImmersionApplicationRequestDtoSchema,
          useCaseParams: { id: req.jwtPayload.applicationId },
        }),
      ),
    )
    .post(async (req, res) =>
      sendHttpResponse(req, res, () => {
        return callUseCase({
          useCase: deps.useCases.updateDemandeImmersion,
          validationSchema: updateImmersionApplicationRequestDtoSchema,
          useCaseParams: {
            id: req.jwtPayload.applicationId,
            demandeImmersion: req.body,
          },
        });
      }),
    );

  authenticatedRouter
    .route(`/${updateApplicationStatusRoute}/:jwt`)
    .post(async (req, res) => {
      sendHttpResponse(req, res, () =>
        callUseCase({
          useCase: deps.useCases.updateImmersionApplicationStatus,
          validationSchema: updateImmersionApplicationStatusRequestSchema,
          useCaseParams: req.body,
          jwtPayload: req.jwtPayload,
        }),
      );
    });

  return authenticatedRouter;
};
