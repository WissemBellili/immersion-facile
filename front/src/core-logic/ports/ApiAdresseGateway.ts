import { LatLonDto } from "src/shared/SearchImmersionDto";

export type AddressWithCoordinates = {
  label: string;
  coordinates: LatLonDto;
};

export interface ApiAdresseGateway {
  lookupStreetAddress(query: string): Promise<AddressWithCoordinates[]>;
  lookupPostCode(query: string): Promise<LatLonDto | null>;
}
