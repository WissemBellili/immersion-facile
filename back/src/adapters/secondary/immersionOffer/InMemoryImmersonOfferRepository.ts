import { EstablishmentEntity } from "../../../domain/immersionOffer/entities/EstablishmentEntity";
import { ImmersionOfferEntity } from "../../../domain/immersionOffer/entities/ImmersionOfferEntity";
import {
  ImmersionOfferRepository,
  SearchParams,
} from "../../../domain/immersionOffer/ports/ImmersionOfferRepository";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class InMemoryImmersionOfferRepository
  implements ImmersionOfferRepository
{
  private _searches: SearchParams[] = [];
  private _immersionOffers: ImmersionOfferEntity[] = [];
  private _establishments: EstablishmentEntity[] = [];

  public async insertSearch(searchParams: SearchParams) {
    logger.info(searchParams, "insertSearch");
    this._searches.push(searchParams);
    return;
  }

  public async insertImmersions(immersions: ImmersionOfferEntity[]) {
    logger.info(immersions, "insertImmersions");
    this._immersionOffers.push(...immersions);
    return;
  }

  public async insertEstablishments(establishments: EstablishmentEntity[]) {
    logger.info(establishments, "insertEstablishments");
    this._establishments.push(...establishments);
    return;
  }

  public async markPendingResearchesAsProcessedAndRetrieveThem(): Promise<
    SearchParams[]
  > {
    logger.info("markPendingResearchesAsProcessedAndRetrieveThem");
    const searchesToReturn = this._searches;
    this._searches = [];
    return searchesToReturn;
  }

  public async getFromSearch(
    searchParams: SearchParams,
  ): Promise<ImmersionOfferEntity[]> {
    const response = this._immersionOffers.filter(
      (immersionOffer) => immersionOffer.getRome() === searchParams.ROME,
    );
    logger.info({ searchParams, response }, "getFromSearch");
    return response;
  }

  // for test purposes only :
  setSearches(searches: SearchParams[]) {
    this._searches = searches;
  }

  getSearches() {
    return this._searches;
  }

  getImmersionOffers(): ImmersionOfferEntity[] {
    return this._immersionOffers;
  }
}
