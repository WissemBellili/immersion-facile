import { NextFunction, Request, RequestHandler, Response } from "express";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import {
  ApiConsumerName,
  backOfficeJwtPayloadSchema,
  ConventionMagicLinkPayload,
  currentJwtVersions,
  EstablishmentJwtPayload,
  ExtractFromExisting,
  PayloadKey,
} from "shared";
import { JwtKind, makeVerifyJwtES256 } from "../../domain/auth/jwt";
import { GetApiConsumerById } from "../../domain/core/ports/GetApiConsumerById";
import { TimeGateway } from "../../domain/core/ports/TimeGateway";
import { apiKeyAuthMiddlewareRequestsTotal } from "../../utils/counters";
import { createLogger } from "../../utils/logger";
import { AppConfig } from "./config/appConfig";

const logger = createLogger(__filename);

const convertRouteToLog = (originalUrl: string) =>
  "/" + originalUrl.split("/")[1];

type TotalCountProps = {
  consumerName?: ApiConsumerName;
  authorisationStatus:
    | "authorised"
    | "unauthorisedId"
    | "incorrectJwt"
    | "expiredToken"
    | "consumerNotFound"
    | "unauthenticated";
};

const createIncTotalCountForRequest =
  (req: Request) =>
  ({ consumerName, authorisationStatus }: TotalCountProps) => {
    const route = convertRouteToLog(req.originalUrl);
    apiKeyAuthMiddlewareRequestsTotal.inc({
      route,
      method: req.method,
      consumerName,
      authorisationStatus,
    });
    logger.info(
      {
        route,
        method: req.method,
        consumerName,
        authorisationStatus,
      },
      "apiKeyAuthMiddlewareRequestsTotal",
    );
  };

// should be deleted when all consumer migrate to v1
export const createApiKeyAuthMiddlewareV0 = (
  getApiConsumerById: GetApiConsumerById,
  timeGateway: TimeGateway,
  config: AppConfig,
) => {
  const verifyJwt = makeVerifyJwtES256<"apiConsumer">(config.apiJwtPublicKey);

  return async (req: Request, _res: Response, next: NextFunction) => {
    const incTotalCountForRequest = createIncTotalCountForRequest(req);
    if (!req.headers.authorization) {
      incTotalCountForRequest({ authorisationStatus: "unauthenticated" });
      return next();
    }

    try {
      const { id } = verifyJwt(req.headers.authorization);
      const apiConsumer = await getApiConsumerById(id);
      if (!apiConsumer) {
        incTotalCountForRequest({
          authorisationStatus: "consumerNotFound",
        });
        return next();
      }

      // todo: consider notifying the caller that he cannot access privileged fields (due to possible compromised key)
      if (!apiConsumer.isAuthorized) {
        incTotalCountForRequest({
          authorisationStatus: "unauthorisedId",
          consumerName: apiConsumer.consumer,
        });
        return next();
      }

      if (apiConsumer.expirationDate < timeGateway.now()) {
        incTotalCountForRequest({
          authorisationStatus: "expiredToken",
          consumerName: apiConsumer.consumer,
        });
        return next();
      }

      // only if the OAuth is known, and the id authorized, and not expired we add apiConsumer payload to the request:
      incTotalCountForRequest({
        consumerName: apiConsumer.consumer,
        authorisationStatus: "authorised",
      });

      req.apiConsumer = apiConsumer;
      return next();
    } catch (_) {
      incTotalCountForRequest({
        authorisationStatus: "incorrectJwt",
      });
      return next();
    }
  };
};

const responseError = (res: Response, message: string, status = 403) =>
  res.status(status).json({ error: `forbidden: ${message}` });

export const makeApiKeyAuthMiddlewareV1 = (
  getApiConsumerById: GetApiConsumerById,
  timeGateway: TimeGateway,
  config: AppConfig,
) => {
  const verifyJwt = makeVerifyJwtES256<"apiConsumer">(config.apiJwtPublicKey);

  return async (req: Request, res: Response, next: NextFunction) => {
    const incTotalCountForRequest = createIncTotalCountForRequest(req);
    if (!req.headers.authorization) {
      incTotalCountForRequest({ authorisationStatus: "unauthenticated" });
      return responseError(res, "unauthenticated", 401);
    }

    try {
      const { id } = verifyJwt(req.headers.authorization);

      const apiConsumer = await getApiConsumerById(id);

      if (!apiConsumer) {
        incTotalCountForRequest({
          authorisationStatus: "consumerNotFound",
        });
        return responseError(res, "consumer not found");
      }

      if (!apiConsumer.isAuthorized) {
        incTotalCountForRequest({
          authorisationStatus: "unauthorisedId",
          consumerName: apiConsumer.consumer,
        });
        return responseError(res, "unauthorised consumer Id");
      }

      if (apiConsumer.expirationDate < timeGateway.now()) {
        incTotalCountForRequest({
          authorisationStatus: "expiredToken",
          consumerName: apiConsumer.consumer,
        });
        return responseError(res, "expired token");
      }

      // only if the OAuth is known, and the id authorized, and not expired we add apiConsumer payload to the request:
      incTotalCountForRequest({
        consumerName: apiConsumer.consumer,
        authorisationStatus: "authorised",
      });

      req.apiConsumer = apiConsumer;
      return next();
    } catch (_) {
      incTotalCountForRequest({
        authorisationStatus: "incorrectJwt",
      });
      return responseError(res, "incorrect Jwt", 401);
    }
  };
};

export const makeMagicLinkAuthMiddleware = (
  config: AppConfig,
  payloadKey: ExtractFromExisting<PayloadKey, "convention" | "establishment">,
): RequestHandler => {
  const { verifyJwt, verifyDeprecatedJwt } = verifyJwtConfig<
    "convention" | "editEstablishment" | "backOffice"
  >(config);
  return (req, res, next) => {
    const maybeJwt = req.headers.authorization;
    if (!maybeJwt) {
      return responseError(res, "unauthenticated", 401);
    }
    try {
      const payload = verifyJwt(maybeJwt);
      // TODO : check that if exp > now, it throws 401
      const currentJwtVersion = currentJwtVersions[payloadKey];

      if (!payload.version || payload.version < currentJwtVersion) {
        return sendNeedsRenewedLinkError(
          res,
          new TokenExpiredError(
            "Token corresponds to an old version, please renew",
            new Date(currentJwtVersions[payloadKey]),
          ),
        );
      }

      switch (payloadKey) {
        case "convention":
          if ("role" in payload && payload.role === "backOffice")
            req.payloads = {
              backOffice: backOfficeJwtPayloadSchema.parse(payload),
            };
          else
            req.payloads = {
              convention: payload as ConventionMagicLinkPayload,
            };
          break;
        case "establishment":
          req.payloads = { establishment: payload as EstablishmentJwtPayload };
          break;
        default:
          // eslint-disable-next-line no-case-declarations
          const unhandledPayloadKey: never = payloadKey;
          throw new Error(
            "Should not happen. Expected payoaldKey, received : " +
              unhandledPayloadKey,
          );
      }

      next();
    } catch (err: any) {
      const unsafePayload = jwt.decode(maybeJwt) as ConventionMagicLinkPayload;
      if (err instanceof TokenExpiredError) {
        logger.warn(
          { token: maybeJwt, payload: unsafePayload },
          "token expired",
        );
        return unsafePayload
          ? sendNeedsRenewedLinkError(res, err)
          : sendAuthenticationError(res, err);
      }

      try {
        verifyDeprecatedJwt(maybeJwt);
        return sendNeedsRenewedLinkError(res, err);
      } catch (error: any) {
        return sendAuthenticationError(res, error);
      }
    }
  };
};

const sendAuthenticationError = (res: Response, err: Error) => {
  logger.error({ err }, "authentication failed");
  res.status(401);
  return res.json({
    error: "Provided token is invalid",
  });
};

const sendNeedsRenewedLinkError = (res: Response, err: Error) => {
  logger.info({ err }, "unsupported or expired magic link used");
  res.status(403);
  const message =
    err?.message === "jwt expired"
      ? "Le lien magique est périmé"
      : err?.message;

  return res.json({
    message,
    needsNewMagicLink: true,
  });
};

export const verifyJwtConfig = <K extends JwtKind>(config: AppConfig) => {
  const verifyJwt = makeVerifyJwtES256<K>(config.jwtPublicKey);

  const verifyDeprecatedJwt = config.previousJwtPublicKey
    ? makeVerifyJwtES256<K>(config.previousJwtPublicKey)
    : () => {
        throw new Error("No deprecated JWT private key provided");
      };

  return { verifyJwt, verifyDeprecatedJwt };
};
