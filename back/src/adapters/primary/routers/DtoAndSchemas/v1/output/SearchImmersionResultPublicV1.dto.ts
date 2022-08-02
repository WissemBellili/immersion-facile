import { addressDtoToString } from "shared/src/utils/address";
import { GeoPositionDto } from "shared/src/geoPosition/geoPosition.dto";
import { RomeCode } from "shared/src/rome";
import { SearchImmersionResultDto } from "shared/src/searchImmersion/SearchImmersionResult.dto";

import { SiretDto } from "shared/src/siret";
import { ContactMethod } from "../../../../../../domain/immersionOffer/entities/ContactEntity";

export type SearchContactDto = {
  id: string;
  lastName: string;
  firstName: string;
  email: string;
  job: string;
  phone: string;
};

export type SearchImmersionResultPublicV1 = {
  rome: RomeCode;
  romeLabel: string;
  appellationLabels: string[];
  naf: string;
  nafLabel: string;
  siret: SiretDto;
  name: string;
  voluntaryToImmersion: boolean;
  position: GeoPositionDto;
  address: string;
  city: string;
  contactMode?: ContactMethod;
  distance_m?: number;
  contactDetails?: SearchContactDto;
  numberOfEmployeeRange?: string;
  website?: string;
  additionalInformation?: string;
};

export const domainToSearchImmersionResultPublicV1 = (
  domain: SearchImmersionResultDto,
): SearchImmersionResultPublicV1 => ({
  ...domain,
  address: addressDtoToString(domain.address),
  city: domain.address.city,
});
