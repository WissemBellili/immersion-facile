import { createTargets, CreateTargets, Target } from "http-client";

const lookupLocationUrl = "/address/lookup-location/";
const lookupStreetAddressUrl = "/address/lookupStreetAddress";
const departmentCodeFromPostcodeUrl = "/address/findDepartmentCodeFromPostCode";

export type AddressTargets = CreateTargets<{
  lookupLocation: Target<
    void,
    LookupLocationInputQueryParams,
    void,
    typeof lookupLocationUrl
  >;
  lookupStreetAddress: Target<
    void,
    LookupStreetAddressQueryParams,
    void,
    typeof lookupStreetAddressUrl
  >;
  departmentCodeFromPostcode: Target<
    void,
    DepartmentCodeFromPostcodeQueryParams,
    void,
    typeof departmentCodeFromPostcodeUrl
  >;
}>;

type LookupLocationInputQueryParams = {
  query: string;
};

type LookupStreetAddressQueryParams = {
  lookup: string;
};

type DepartmentCodeFromPostcodeQueryParams = {
  postcode: string;
};

export const addressTargets = createTargets<AddressTargets>({
  lookupLocation: { method: "GET", url: lookupLocationUrl },
  lookupStreetAddress: { method: "GET", url: lookupStreetAddressUrl },
  departmentCodeFromPostcode: {
    method: "GET",
    url: departmentCodeFromPostcodeUrl,
  },
});
