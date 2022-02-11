import { addDays } from "date-fns";
import promClient from "prom-client";
import {
  SearchImmersionRequestDto,
  searchImmersionRequestSchema,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
import { ApiConsumer } from "../../../shared/tokens/ApiConsumer";
import { createLogger } from "../../../utils/logger";
import { Clock } from "../../core/ports/Clock";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { UseCase } from "../../core/UseCase";
import { LaBonneBoiteRequestEntity } from "../entities/LaBonneBoiteRequestEntity";
import { SearchMade, SearchMadeEntity } from "../entities/SearchMadeEntity";
import { ImmersionOfferRepository } from "../ports/ImmersionOfferRepository";
import {
  LaBonneBoiteAPI,
  LaBonneBoiteRequestParams,
} from "../ports/LaBonneBoiteAPI";
import { LaBonneBoiteRequestRepository } from "../ports/LaBonneBoiteRequestRepository";
import { SearchMadeRepository } from "../ports/SearchMadeRepository";
import { LaBonneBoiteCompanyVO } from "../valueObjects/LaBonneBoiteCompanyVO";

const logger = createLogger(__filename);

const counterSearchImmersionLBBRequestsTotal = new promClient.Counter({
  name: "search_immersion_lbb_requests_total",
  help: "The total count of LBB request made in the search immersions use case",
});

const counterSearchImmersionLBBRequestsError = new promClient.Counter({
  name: "search_immersion_lbb_requests_error",
  help: "The total count of failed LBB request made in the search immersions use case",
});

const counterSearchImmersionLBBRequestsSkipped = new promClient.Counter({
  name: "search_immersion_lbb_requests_skipped",
  help: "The total count of skipped LBB request made in the search immersions use case",
});

const histogramSearchImmersionStoredCount = new promClient.Histogram({
  name: "search_immersion_stored_result_count",
  help: "Histogram of the number of result returned from storage",
  buckets: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
});

const LBB_DISTANCE_KM_REQUEST_PARAM = 50;
export class SearchImmersion extends UseCase<
  SearchImmersionRequestDto,
  SearchImmersionResultDto[],
  ApiConsumer
> {
  constructor(
    private readonly searchesMadeRepository: SearchMadeRepository,
    private readonly immersionOfferRepository: ImmersionOfferRepository,
    private readonly laBonneBoiteRequestRepository: LaBonneBoiteRequestRepository,
    private readonly laBonneBoiteAPI: LaBonneBoiteAPI,
    private readonly uuidGenerator: UuidGenerator,
    private readonly clock: Clock,
  ) {
    super();
  }

  inputSchema = searchImmersionRequestSchema;

  public async _execute(
    params: SearchImmersionRequestDto,
    apiConsumer: ApiConsumer,
  ): Promise<SearchImmersionResultDto[]> {
    const searchMade: SearchMade = {
      rome: params.rome,
      lat: params.location.lat,
      lon: params.location.lon,
      distance_km: params.distance_km,
    };
    const searchMadeEntity: SearchMadeEntity = {
      ...searchMade,
      id: this.uuidGenerator.new(),
      needsToBeSearched: true,
    };
    await this.searchesMadeRepository.insertSearchMade(searchMadeEntity);
    const apiConsumerName = apiConsumer?.consumer;

    const resultsFromStorage =
      await this.immersionOfferRepository.getSearchImmersionResultDtoFromSearchMade(
        searchMade,
        /* withContactDetails= */ apiConsumerName !== undefined,
      );

    histogramSearchImmersionStoredCount.observe(resultsFromStorage.length);

    if (!searchMade.rome) {
      return resultsFromStorage;
    }

    const shouldCallLaBonneBoite: boolean =
      await this.laBonneBoiteHasNotBeenRequestedWithThisRomeAndThisAreaInTheLastMonth(
        searchMade,
      );

    if (!shouldCallLaBonneBoite) {
      counterSearchImmersionLBBRequestsSkipped.inc();
      return resultsFromStorage;
    }

    const { lbbRequestEntity, relevantCompanies } =
      await this.requestLaBonneBoite({
        ...searchMade,
        rome: searchMade.rome,
      });

    await this.laBonneBoiteRequestRepository.insertLaBonneBoiteRequest(
      lbbRequestEntity,
    );

    if (relevantCompanies)
      await this.insertRelevantCompaniesInRepositories(relevantCompanies);
    return this.immersionOfferRepository.getSearchImmersionResultDtoFromSearchMade(
      searchMade,
      /* withContactDetails= */ apiConsumerName !== undefined,
    );
  }

  private async requestLaBonneBoite(
    searchMade: SearchMade & { rome: string },
  ): Promise<{
    lbbRequestEntity: LaBonneBoiteRequestEntity;
    relevantCompanies?: LaBonneBoiteCompanyVO[];
  }> {
    const requestParams: LaBonneBoiteRequestParams = {
      lon: searchMade.lon,
      lat: searchMade.lat,
      distance_km: LBB_DISTANCE_KM_REQUEST_PARAM,
      rome: searchMade.rome,
    };

    try {
      counterSearchImmersionLBBRequestsTotal.inc();
      const laBonneBoiteCompanies = await this.laBonneBoiteAPI.searchCompanies(
        requestParams,
      );
      const laBonneBoiteRelevantCompanies = laBonneBoiteCompanies.filter(
        (company) => company.isCompanyRelevant(),
      );
      return {
        relevantCompanies: laBonneBoiteRelevantCompanies,
        lbbRequestEntity: {
          requestedAt: this.clock.now(),
          params: requestParams,
          result: {
            error: null,
            number0fEstablishments: laBonneBoiteCompanies.length,
            numberOfRelevantEstablishments:
              laBonneBoiteRelevantCompanies.length,
          },
        },
      };
    } catch (e: any) {
      logger.warn(e, "LBB fetch error");
      counterSearchImmersionLBBRequestsError.inc();
      return {
        lbbRequestEntity: {
          requestedAt: this.clock.now(),
          params: requestParams,
          result: {
            error: e?.message ?? "erorr without message",
            number0fEstablishments: null,
            numberOfRelevantEstablishments: null,
          },
        },
      };
    }
  }
  private async insertRelevantCompaniesInRepositories(
    companies: LaBonneBoiteCompanyVO[],
  ) {
    const updatedAt = undefined;
    const llbResultsConvertedToEstablishmentAggregates = companies.map(
      (company) =>
        company.toEstablishmentAggregate(this.uuidGenerator, updatedAt),
    );

    await this.immersionOfferRepository.insertEstablishmentAggregates(
      llbResultsConvertedToEstablishmentAggregates,
    );
  }

  private async laBonneBoiteHasNotBeenRequestedWithThisRomeAndThisAreaInTheLastMonth(
    searchMade: SearchMade,
  ) {
    const closestRequestParamsWithSameRomeInTheMonth: {
      params: LaBonneBoiteRequestParams;
      distanceToPositionKm: number;
    } | null = !searchMade.rome
      ? null
      : await this.laBonneBoiteRequestRepository.getClosestRequestParamsWithThisRomeSince(
          {
            rome: searchMade.rome,
            position: { lat: searchMade.lat, lon: searchMade.lon },
            since: addDays(this.clock.now(), -30),
          },
        );

    if (closestRequestParamsWithSameRomeInTheMonth === null) return true;

    return (
      closestRequestParamsWithSameRomeInTheMonth.distanceToPositionKm >
      searchMade.distance_km
    );
  }
}
