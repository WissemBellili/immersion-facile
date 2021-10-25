import { Request, Response } from "express";
import { AuthChecker } from "../../../domain/auth/AuthChecker";

export abstract class HttpError extends Error {
  abstract httpCode: number;

  constructor(message?: any) {
    super(message);
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export class UnauthorizedError extends HttpError {
  httpCode = 401;

  constructor() {
    super("Veuillez authentifier");
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
export class ForbiddenError extends HttpError {
  httpCode = 403;

  constructor() {
    super("Accès refusé");
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class FeatureDisabledError extends HttpError {
  httpCode = 404;

  constructor(msg?: string) {
    super(msg);
    Object.setPrototypeOf(this, FeatureDisabledError.prototype);
  }
}

export class NotFoundError extends HttpError {
  httpCode = 404;

  constructor(msg?: any) {
    super(msg);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
export class BadRequestError extends HttpError {
  httpCode = 400;

  constructor(msg?: any) {
    super(msg);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}
export class ConflictError extends HttpError {
  httpCode = 409;
  constructor(msg: any) {
    super(msg);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export const sendHttpResponse = async (
  req: Request,
  res: Response,
  callback: () => Promise<unknown>,
  authChecker?: AuthChecker,
) => {
  try {
    if (authChecker) {
      authChecker.checkAuth(req);
    }
    const response = await callback();
    res.status(200);
    return res.json(response || { success: true });
  } catch (error: any) {
    if (error instanceof HttpError) {
      if (error instanceof UnauthorizedError) {
        res.setHeader("WWW-Authenticate", "Basic");
      }
      res.status(error.httpCode);
    } else {
      res.status(500);
    }

    return res.json({ errors: error.errors || [error.message] });
  }
};
