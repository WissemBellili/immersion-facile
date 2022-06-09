import { LatLonDto } from "../latLon";
import { RomeCode } from "../rome";

export type SearchImmersionRequestDto = {
  rome?: RomeCode;
  siret?: string;
  location: LatLonDto;
  distance_km: number;
  sortedBy: "distance" | "date";
  voluntaryToImmersion?: boolean;
};
