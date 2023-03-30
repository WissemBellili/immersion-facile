import promClient from "prom-client";
import {
  ApiConsumer,
  SearchImmersionQueryParamsDto,
  searchImmersionQueryParamsSchema,
  SearchImmersionResultDto,
} from "shared";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../core/UseCase";
import { SearchMade, SearchMadeEntity } from "../entities/SearchMadeEntity";

const histogramSearchImmersionStoredCount = new promClient.Histogram({
  name: "search_immersion_stored_result_count",
  help: "Histogram of the number of result returned from storage",
  buckets: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
});

export class SearchImmersion extends TransactionalUseCase<
  SearchImmersionQueryParamsDto,
  SearchImmersionResultDto[],
  ApiConsumer
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly uuidGenerator: UuidGenerator,
  ) {
    super(uowPerformer);
  }

  inputSchema = searchImmersionQueryParamsSchema;

  public async _execute(
    params: SearchImmersionQueryParamsDto,
    uow: UnitOfWork,
    apiConsumer: ApiConsumer,
  ): Promise<SearchImmersionResultDto[]> {
    const apiConsumerName = apiConsumer?.consumer;

    const searchMade: SearchMade = {
      rome: params.rome,
      lat: params.latitude,
      lon: params.longitude,
      distance_km: params.distance_km,
      sortedBy: params.sortedBy,
      voluntaryToImmersion: params.voluntaryToImmersion,
      place: params.place,
    };

    const searchMadeEntity: SearchMadeEntity = {
      ...searchMade,
      id: this.uuidGenerator.new(),
      needsToBeSearched: true,
      apiConsumerName,
    };

    await uow.searchMadeRepository.insertSearchMade(searchMadeEntity);

    const resultsFromStorage =
      await uow.establishmentAggregateRepository.getSearchImmersionResultDtoFromSearchMade(
        {
          searchMade,
          withContactDetails: false,
          maxResults: 100,
        },
      );

    histogramSearchImmersionStoredCount.observe(resultsFromStorage.length);

    return resultsFromStorage;
  }
}
