import { PoolClient } from "pg";
import { RomeRepository } from "../../../domain/rome/ports/RomeRepository";
import {
  AppellationDto,
  RomeDto,
} from "../../../shared/romeAndAppellationDtos/romeAndAppellation.dto";
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
        } catch (_) {
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

  public async searchRome(query: string): Promise<RomeDto[]> {
    const queryWords = query.split(" ");
    const lastWord = queryWords[queryWords.length - 1];
    const queryBeginning =
      queryWords.length === 1
        ? queryWords.join(" ")
        : queryWords.slice(0, queryWords.length - 1).join(" ");

    return await this.client
      .query(
        `SELECT DISTINCT public_appelations_data.code_rome, libelle_rome
        FROM public_appelations_data 
        JOIN public_romes_data ON  public_appelations_data.code_rome = public_romes_data.code_rome
        WHERE
           (libelle_appellation_long_tsvector @@ to_tsquery('french',$1) AND libelle_appellation_long ILIKE $3)
           OR (libelle_appellation_long ILIKE $2 AND libelle_appellation_long ILIKE $3)
        LIMIT 80`,
        [toTsQuery(queryBeginning), `%${queryBeginning}%`, `%${lastWord}%`],
      )
      .then((res) =>
        res.rows.map(
          (row): RomeDto => ({
            romeCode: row.code_rome,
            romeLabel: row.libelle_rome,
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
        `SELECT ogr_appellation, libelle_appellation_court, public_appelations_data.code_rome, libelle_rome
        FROM public_appelations_data 
        JOIN public_romes_data ON  public_appelations_data.code_rome = public_romes_data.code_rome
        WHERE
           (libelle_appellation_long_tsvector @@ to_tsquery('french',$1) AND libelle_appellation_long ILIKE $3)
           OR (libelle_appellation_long ILIKE $2 AND libelle_appellation_long ILIKE $3)
        LIMIT 80`,
        [toTsQuery(queryBeginning), `%${queryBeginning}%`, `%${lastWord}%`],
      )
      .then((res) =>
        res.rows.map(
          (row): AppellationDto => ({
            appellationCode: row.ogr_appellation.toString(),
            romeCode: row.code_rome,
            appellationLabel: row.libelle_appellation_court,
            romeLabel: row.libelle_rome,
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
