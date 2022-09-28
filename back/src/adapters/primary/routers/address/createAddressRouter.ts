import { Router } from "express";
import {
  departmentCodeFromPostcodeQuerySchema,
  lookupAddressQueryParam,
  postCodeQueryParam,
} from "shared";
import { lookupAddressSchema } from "shared";
import {
  departmentCodeFromPostcodeRoute,
  lookupStreetAddressRoute,
} from "shared";
import type { AppDependencies } from "../../config/createAppDependencies";
import { sendHttpResponse } from "../../helpers/sendHttpResponse";

export const createAddressRouter = (deps: AppDependencies) => {
  const addressRouter = Router();

  addressRouter
    .route(lookupStreetAddressRoute)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.lookupStreetAddress.execute(
          lookupAddressSchema.parse(req.query[lookupAddressQueryParam]),
        ),
      ),
    );

  addressRouter
    .route(departmentCodeFromPostcodeRoute)
    .get(async (req, res) =>
      sendHttpResponse(req, res, () =>
        deps.useCases.departmentCodeFromPostcode.execute(
          departmentCodeFromPostcodeQuerySchema.parse(
            req.query[postCodeQueryParam],
          ),
        ),
      ),
    );

  return addressRouter;
};
