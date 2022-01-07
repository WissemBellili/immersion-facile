import { ContactMethod } from "../../../shared/FormEstablishmentDto";
import { LatLonDto } from "../../../shared/SearchImmersionDto";
import { ContactEntityV2 } from "./ContactEntity";
import { ImmersionOfferEntityV2 } from "./ImmersionOfferEntity";

export type DataSource = "api_labonneboite" | "form" | "api_sirene";

// prettier-ignore
export type TefenCode = -1 | 0 | 1 | 2 | 3 | 11 | 12 | 21 | 22 | 31 | 32 | 41 | 42 | 51 | 52 | 53;

export type EstablishmentEntityV2 = {
  siret: string;
  name: string;
  address: string;
  voluntaryToImmersion: boolean;
  dataSource: DataSource;
  contactMethod?: ContactMethod;
  position: LatLonDto;
  naf: string;
  numberEmployeesRange: TefenCode;
};

export type AnnotatedEstablishmentEntityV2 = EstablishmentEntityV2 & {
  nafLabel: string;
};

export type EstablishmentAggregate = {
  establishment: EstablishmentEntityV2;
  immersionOffers: ImmersionOfferEntityV2[];
  contacts: ContactEntityV2[];
};
