import { AppellationDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import { SearchImmersionResultDto } from "shared/src/searchImmersion/SearchImmersionResult.dto";
import { SiretDto } from "shared/src/siret";
import { ContactEntityV2 } from "../entities/ContactEntity";
import {
  AnnotatedEstablishmentEntityV2,
  EstablishmentAggregate,
  EstablishmentEntityV2,
} from "../entities/EstablishmentEntity";
import { SearchMade } from "../entities/SearchMadeEntity";

export interface EstablishmentAggregateRepository {
  hasEstablishmentFromFormWithSiret: (siret: string) => Promise<boolean>;
  insertEstablishmentAggregates: (
    establishments: EstablishmentAggregate[],
  ) => Promise<void>;

  getSearchImmersionResultDtoFromSearchMade: (props: {
    searchMade: SearchMade;
    withContactDetails?: boolean;
    maxResults?: number;
  }) => Promise<SearchImmersionResultDto[]>;

  getActiveEstablishmentSiretsFromLaBonneBoiteNotUpdatedSince: (
    since: Date,
  ) => Promise<string[]>;

  getSiretOfEstablishmentsFromFormSource: () => Promise<string[]>;

  updateEstablishment: (
    siret: string,
    propertiesToUpdate: Partial<
      Pick<
        EstablishmentEntityV2,
        "address" | "position" | "nafDto" | "numberEmployeesRange" | "isActive"
      >
    > & { updatedAt: Date },
  ) => Promise<void>;

  removeEstablishmentAndOffersAndContactWithSiret: (
    siret: string,
  ) => Promise<void>;

  getEstablishmentForSiret: (
    siret: string,
  ) => Promise<AnnotatedEstablishmentEntityV2 | undefined>;
  getContactForEstablishmentSiret: (
    siret: string,
  ) => Promise<ContactEntityV2 | undefined>;
  getOffersAsAppelationDtoForFormEstablishment: (
    siret: string,
  ) => Promise<AppellationDto[]>;
  getSearchImmersionResultDtoBySiretAndRome: (
    siret: SiretDto,
    rome: string,
  ) => Promise<SearchImmersionResultDto | undefined>;
}
