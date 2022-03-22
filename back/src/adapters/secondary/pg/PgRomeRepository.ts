import { PoolClient } from "pg";
import type { RomeRepository } from "../../../domain/rome/ports/RomeRepository";
import type {
  AppellationDto,
  RomeDto,
} from "../../../shared/romeAndAppelationDtos/romeAndAppellation.dto";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class PgRomeRepository implements RomeRepository {
  constructor(private client: PoolClient) {}

  appellationToCodeMetier(
    romeCodeAppellation: string,
  ): Promise<string | undefined> {
    return this.client
      .query(
        `SELECT code_rome
        FROM public_appelations_data
        WHERE ogr_appellation=$1`,
        [romeCodeAppellation],
      )
      .then((res) => {
        try {
          return res.rows[0].code_rome;
        } catch (e) {
          logger.error(
            { romeCodeAppellation, resultFromQuery: res },
            "could not fetch rome code with given appellation",
          );

          return;
        }
      })
      .catch((e) => {
        logger.error(e);
        return;
      });
  }

  public async searchMetier(query: string): Promise<RomeDto[]> {
    return this.client
      .query(
        `SELECT code_rome, libelle_rome
        FROM public_romes_data
        WHERE
          libelle_rome_tsvector@@to_tsquery('french', $1)
          OR libelle_rome ILIKE $2`,
        [toTsQuery(query), `%${query}%`],
      )
      .then((res) =>
        res.rows.map(
          (row): RomeDto => ({
            codeRome: row.code_rome,
            libelleRome: row.libelle_rome,
          }),
        ),
      )
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }

  public async searchAppellation(query: string): Promise<AppellationDto[]> {
    const queryWords = query.split(" ");
    const lastWord = queryWords[queryWords.length - 1];
    const queryBeginning =
      queryWords.length === 1
        ? queryWords.join(" ")
        : queryWords.slice(0, queryWords.length - 1).join(" ");

    return await this.client
      .query(
        `SELECT ogr_appellation, libelle_appellation_court, code_rome, libelle_rome
        FROM public_appelations_data
        JOIN public_romes_data ON public_appelations_data.code_rome = public_romes_data.code_rome 
        WHERE
           (libelle_appellation_long_tsvector @@ to_tsquery('french',$1) AND libelle_appellation_long ILIKE $3)
           OR (libelle_appellation_long ILIKE $2 AND libelle_appellation_long ILIKE $3)
        LIMIT 80`,
        [toTsQuery(queryBeginning), `%${queryBeginning}%`, `%${lastWord}%`],
      )
      .then((res) =>
        res.rows.map(
          (row): AppellationDto => ({
            codeAppellation: row.ogr_appellation,
            libelleAppellation: row.libelle_rome,
            libelleRome: row.libelle_appellation_court,
            codeRome: row.code_rome,
          }),
        ),
      )
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }
}

const toTsQuery = (query: string): string => query.split(/\s+/).join(" & ");
