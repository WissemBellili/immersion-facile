import { RomeCode, SearchImmersionQueryParamsDto } from "shared";

export type SearchImmersionRequestPublicV1 = {
  rome?: RomeCode;
  siret?: string;
  longitude: number;
  latitude: number;
  distance_km: number;
  sortedBy: "distance" | "date";
  voluntaryOnly?: boolean;
};

export const SearchImmersionRequestPublicV1ToDomain = (
  publicV1: SearchImmersionRequestPublicV1,
): SearchImmersionQueryParamsDto => publicV1;
