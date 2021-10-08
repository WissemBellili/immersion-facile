import { ImmersionOfferEntity } from "../entities/ImmersionOfferEntity";
import { EstablishmentEntity } from "../entities/EstablishmentEntity";

import { v4 as uuidV4 } from "uuid";
import { LaBonneBoiteGateway } from "../../../adapters/secondary/searchImmersion/LaBonneBoiteGateway";
import { EstablishmentsGateway } from "../ports/EstablishmentsGateway";
import { UncompleteEstablishmentEntity } from "../entities/UncompleteEstablishmentEntity";
import type {
  ImmersionOfferRepository,
  SearchParams,
} from "../ports/ImmersionOfferRepository";

//A mettre dans ports

export class SearchImmersion {
  constructor(
    private laBonneBoiteGateway: EstablishmentsGateway,
    private immersionOfferRepository: ImmersionOfferRepository,
  ) {}

  public async execute(
    searchParams: SearchParams,
  ): Promise<ImmersionOfferEntity[]> {
    this.immersionOfferRepository.insertSearch(searchParams);
    return this.getImmersionLaBonneBoite(searchParams);
  }

  //TODO : en faire une classe à part
  async getImmersionLaBonneBoite(searchParams: SearchParams) {
    const laBonneBoiteEstablishments =
      await this.laBonneBoiteGateway.getEstablishments(searchParams);

    const immersionOffers = laBonneBoiteEstablishments.flatMap(
      (laBonneBoiteestablishment) =>
        this.extractImmersionsFromEstablishment(laBonneBoiteestablishment),
    );

    return immersionOffers;
  }
  /*
export type ImmersionOfferProps = {
  id: ImmersionOfferId;
  rome: string;
  naf?: string;
  siret: string;
  name: string;
  voluntary_to_immersion: boolean;
  data_source: string;
  contact_in_establishment_uuid?: ImmersionEstablishmentContact;
  score: number;
};
*/
  private extractImmersionsFromEstablishment(
    establishment: UncompleteEstablishmentEntity,
  ): ImmersionOfferEntity[] {
    const romeArray = establishment.getRomeCodesArray();
    return romeArray.map(
      (rome) =>
        new ImmersionOfferEntity({
          id: uuidV4(),
          rome: rome,
          naf: establishment.getNaf(),
          siret: establishment.getSiret(),
          name: establishment.getName(),
          voluntary_to_immersion: false,
          data_source: establishment.getDataSource(),
          contact_in_establishment: undefined,
          score: establishment.getScore(),
        }),
    );
  }
}
