import { z } from "zod";
import { Flavor } from "../typeFlavors";

// export const lookupAddressQueryParam = "lookup";
// export const postCodeQueryParam = "postcode";
// export const lookupLocationQueryParam = "query";

// export const lookupStreetAddressUrl = (lookup: LookupAddress): string =>
//   `${lookupStreetAddressRoute}?${lookupAddressQueryParam}=${lookup}`;

// export const lookupLocationUrl = (
//   lookupLocationInput: LookupLocationInput,
// ): string =>
//   `${lookupLocationRoute}?${lookupLocationQueryParam}=${lookupLocationInput}`;

// export const departmentCodeFromPostcodeUrl = (postcode: Postcode): string =>
//   `${departmentCodeFromPostcodeRoute}?${postCodeQueryParam}=${postcode}`;

export type DepartmentCodeFromPostcodeQuery = Flavor<
  string,
  "FindDepartmentCodeFromPostcodeQuery"
>;
export const departmentCodeFromPostcodeQuerySchema: z.Schema<DepartmentCodeFromPostcodeQuery> =
  z.string();
