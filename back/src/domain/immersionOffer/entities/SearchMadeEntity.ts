import { Flavor } from "shared/src/typeFlavors";
import { ApiConsumerName } from "../../core/valueObjects/ApiConsumer";

export type SearchMadeId = Flavor<string, "SearchMadeId">;

export type SearchMade = {
  rome?: string;
  distance_km: number;
  lat: number;
  lon: number;
  voluntary_to_immersion?: boolean;
  sortedBy: "distance" | "date";
};

export type SearchMadeEntity = {
  id: SearchMadeId;
  needsToBeSearched: boolean;
  apiConsumerName?: ApiConsumerName;
} & SearchMade;
