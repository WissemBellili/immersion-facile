//import { AxiosInstance } from "axios";
import {
  AddressAndPosition,
  addressAndPositionListSchema,
  AddressTargets,
  DepartmentCode,
  findDepartmentCodeFromPostcodeResponseSchema,
  LookupLocationInput,
  LookupSearchResult,
  lookupSearchResultsSchema,
} from "shared";
import { AddressGateway } from "src/core-logic/ports/AddressGateway";
import { HttpClient } from "http-client";

export class HttpAddressGateway implements AddressGateway {
  constructor(
    //private readonly httpClientLegacy: AxiosInstance,
    private readonly httpClient: HttpClient<AddressTargets>,
  ) {}

  public async lookupLocation(
    query: LookupLocationInput,
  ): Promise<LookupSearchResult[]> {
    // const { data } = await this.httpClientLegacy.get<unknown>(
    //   "/api" + lookupLocationRoute,
    //   {
    //     params: {
    //       [lookupLocationQueryParam]: query,
    //     },
    //   },
    // );
    // return lookupSearchResultsSchema.parse(data);
    const response = await this.httpClient.lookupLocation({
      queryParams: {
        query,
      },
    });
    return lookupSearchResultsSchema.parse(response.responseBody);
  }

  public async lookupStreetAddress(
    lookup: string,
  ): Promise<AddressAndPosition[]> {
    // const { data } = await this.httpClientLegacy.get<unknown>(
    //   "/api" + lookupStreetAddressRoute,
    //   {
    //     params: { [lookupAddressQueryParam]: lookup },
    //   },
    // );
    // return addressAndPositionListSchema.parse(data);
    const response = await this.httpClient.lookupStreetAddress({
      queryParams: {
        lookup,
      },
    });
    return addressAndPositionListSchema.parse(response.responseBody);
  }

  public async findDepartmentCodeFromPostCode(
    postcode: string,
  ): Promise<DepartmentCode | null> {
    //TODO Remove catch to differentiate between http & domain errors
    try {
      // const { data } = await this.httpClientLegacy.get<unknown>(
      //   "/api" + departmentCodeFromPostcodeRoute,
      //   {
      //     params: { [postCodeQueryParam]: query },
      //   },
      // );
      // return findDepartmentCodeFromPostcodeResponseSchema.parse(data).departmentCode;
      const response = await this.httpClient.departmentCodeFromPostcode({
        queryParams: {
          postcode,
        },
      });
      return findDepartmentCodeFromPostcodeResponseSchema.parse(
        response.responseBody,
      ).departmentCode;
    } catch (e) {
      //eslint-disable-next-line no-console
      console.error("Api Adresse Search Error", e);
      return null;
    }
  }
}
