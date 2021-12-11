import { fakeEstablishmentsLaBonneBoite } from "../adapters/secondary/immersionOffer/fakeEstablishmentsLaBonneBoite";
import { fakeEstablishmentsLaPlateFormeDeLInclusion } from "../adapters/secondary/immersionOffer/fakeEstablishmentsLaPlateFormeDeLInclusion";
import {
  EstablishmentFromLaBonneBoite,
  HttpCallsToLaBonneBoite,
  LaBonneBoiteGateway,
} from "../adapters/secondary/immersionOffer/LaBonneBoiteGateway";
import {
  HttpCallsToLaPlateFormeDeLInclusion,
  LaPlateFormeDeLInclusionGateway,
} from "../adapters/secondary/immersionOffer/LaPlateFormeDeLInclusionGateway";
import {
  AccessTokenGateway,
  GetAccessTokenResponse,
} from "../domain/core/ports/AccessTokenGateway";
import { ExtraEstablishmentInfos } from "../domain/immersionOffer/domainService/inferExtraEstabishmentInfosFromSirenResponse";
import {
  GetExtraEstablishmentInfos,
  GetPosition,
} from "../domain/immersionOffer/entities/UncompleteEstablishmentEntity";
import { Position } from "../domain/immersionOffer/ports/GetPosition";
import { SearchParams } from "../domain/immersionOffer/ports/ImmersionOfferRepository";
import { GetEstablishmentsResponse } from "./../adapters/secondary/immersionOffer/LaPlateFormeDeLInclusionGateway";

export const fakeHttpCallToLaBonneBoite: HttpCallsToLaBonneBoite = {
  getEstablishments: async (
    searchParams: SearchParams,
    accessToken: string,
  ) => {
    const returnedEstablishments: EstablishmentFromLaBonneBoite[] =
      fakeEstablishmentsLaBonneBoite;
    return returnedEstablishments;
  },
};

export const fakeAccessTokenGateway: AccessTokenGateway = {
  getAccessToken: async (scope: string) => {
    const response: GetAccessTokenResponse = {
      access_token: "",
      expires_in: -1,
    };
    return response;
  },
};

export const fakeLaBonneBoiteGateway = new LaBonneBoiteGateway(
  fakeAccessTokenGateway,
  "poleEmploiClientId",
  fakeHttpCallToLaBonneBoite,
);

export const fakeHttpCallToLaPlateFormeDeLInclusion: HttpCallsToLaPlateFormeDeLInclusion =
  {
    getEstablishments: async (
      _searchParams: SearchParams,
    ): Promise<GetEstablishmentsResponse> => ({
      results: fakeEstablishmentsLaPlateFormeDeLInclusion,
      nextPageUrl: "",
    }),
    getNextEstablishments: async (
      _url: string,
    ): Promise<GetEstablishmentsResponse> => ({ results: [] }),
  };

export const fakeLaPlateFormeDeLInclusionGateway =
  new LaPlateFormeDeLInclusionGateway(fakeHttpCallToLaPlateFormeDeLInclusion);

export const fakeGetPosition: GetPosition = async (address: string) => {
  const returnedPosition: Position = { lat: 49.119146, lon: 6.17602 };
  return returnedPosition;
};

export const fakeGetExtraEstablishmentInfos: GetExtraEstablishmentInfos =
  async (siret: string) => {
    const returnedExtraEstablishmentInfos: ExtraEstablishmentInfos = {
      naf: "8559A",
      numberEmployeesRange: 1,
    };
    return returnedExtraEstablishmentInfos;
  };
