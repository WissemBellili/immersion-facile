import { addDays } from "date-fns";
import promClient from "prom-client";
import { prop, propEq } from "ramda";
import {
  SearchImmersionQueryParamsDto,
  searchImmersionQueryParamsSchema,
} from "shared";
import { createLogger } from "../../../utils/logger";
import { Clock } from "../../core/ports/Clock";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { LaBonneBoiteRequestEntity } from "../entities/LaBonneBoiteRequestEntity";
import { OfferWithSiret } from "../ports/EstablishmentAggregateRepository";
import {
  LaBonneBoiteAPI,
  LaBonneBoiteRequestParams,
} from "../ports/LaBonneBoiteAPI";
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

const LBB_DISTANCE_KM_REQUEST_PARAM = 50;
export class CallLaBonneBoiteAndUpdateRepositories extends TransactionalUseCase<
  SearchImmersionQueryParamsDto,
  void
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly laBonneBoiteAPI: LaBonneBoiteAPI,
    private readonly clock: Clock,
  ) {
    super(uowPerformer);
  }

  inputSchema = searchImmersionQueryParamsSchema;

  public async _execute(
    searchImmersionRequestDto: SearchImmersionQueryParamsDto,
    uow: UnitOfWork,
  ): Promise<void> {
    if (!searchImmersionRequestDto.rome) return;

    const requestParams: LaBonneBoiteRequestParams = {
      rome: searchImmersionRequestDto.rome,
      lon: searchImmersionRequestDto.longitude,
      lat: searchImmersionRequestDto.latitude,
      distance_km: searchImmersionRequestDto.distance_km,
    };

    const shouldCallLaBonneBoite: boolean =
      await this.laBonneBoiteHasNotBeenRequestedWithThisRomeAndThisAreaInTheLastMonth(
        uow,
        requestParams,
      );

    if (!shouldCallLaBonneBoite) {
      counterSearchImmersionLBBRequestsSkipped.inc();
      return;
    }

    const { lbbRequestEntity, relevantCompanies } =
      await this.requestLaBonneBoite({
        ...requestParams,
        distance_km: LBB_DISTANCE_KM_REQUEST_PARAM,
      });

    await uow.laBonneBoiteRequestRepository.insertLaBonneBoiteRequest(
      lbbRequestEntity,
    );

    if (!relevantCompanies || relevantCompanies.length === 0) return;

    const lbbSirets = relevantCompanies.map(prop("siret"));
    const siretGroupedByDataSource =
      await uow.establishmentAggregateRepository.groupEstablishmentSiretsByDataSource(
        lbbSirets,
      );

    const existingEstablishments = [
      ...(siretGroupedByDataSource.api_labonneboite ?? []),
      ...(siretGroupedByDataSource.form ?? []),
    ];
    const newRelevantCompanies = relevantCompanies.filter(
      (company) => !existingEstablishments.includes(company.siret),
    );

    await this.insertRelevantCompaniesInRepositories(uow, newRelevantCompanies);

    if (!siretGroupedByDataSource.api_labonneboite) return;

    const existingCompaniesWithSameRome =
      await uow.establishmentAggregateRepository.getSiretsOfEstablishmentsWithRomeCode(
        requestParams.rome,
      );
    const existingCompaniesSiretsFromLaBonneBoiteWithoutThisRome =
      siretGroupedByDataSource.api_labonneboite.filter(
        (siret) => !existingCompaniesWithSameRome.includes(siret),
      );

    const immersionOffersWithSiretsToAdd: OfferWithSiret[] =
      existingCompaniesSiretsFromLaBonneBoiteWithoutThisRome.map((siret) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we know it's siret is within relevantCompanies
        const company = relevantCompanies.find(propEq("siret", siret))!;
        return {
          siret: company.siret,
          createdAt: this.clock.now(),
          romeCode: company.props.matched_rome_code,
          score: company.props.stars,
        };
      });
    await uow.establishmentAggregateRepository.createImmersionOffersToEstablishments(
      immersionOffersWithSiretsToAdd,
    );
  }

  private async requestLaBonneBoite(
    requestParams: LaBonneBoiteRequestParams,
  ): Promise<{
    lbbRequestEntity: LaBonneBoiteRequestEntity;
    relevantCompanies?: LaBonneBoiteCompanyVO[];
  }> {
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
    uow: UnitOfWork,
    companies: LaBonneBoiteCompanyVO[],
  ) {
    const llbResultsConvertedToEstablishmentAggregates = companies.map(
      (company) => company.toEstablishmentAggregate(this.clock),
    );

    await uow.establishmentAggregateRepository.insertEstablishmentAggregates(
      llbResultsConvertedToEstablishmentAggregates,
    );
  }

  private async laBonneBoiteHasNotBeenRequestedWithThisRomeAndThisAreaInTheLastMonth(
    uow: UnitOfWork,
    requestParams: LaBonneBoiteRequestParams,
  ) {
    const closestRequestParamsWithSameRomeInTheMonth: {
      params: LaBonneBoiteRequestParams;
      distanceToPositionKm: number;
    } | null = !requestParams.rome
      ? null
      : await uow.laBonneBoiteRequestRepository.getClosestRequestParamsWithThisRomeSince(
          {
            rome: requestParams.rome,
            position: { lat: requestParams.lat, lon: requestParams.lon },
            since: addDays(this.clock.now(), -30),
          },
        );

    if (closestRequestParamsWithSameRomeInTheMonth === null) return true;

    return (
      closestRequestParamsWithSameRomeInTheMonth.distanceToPositionKm >
      requestParams.distance_km
    );
  }
}
