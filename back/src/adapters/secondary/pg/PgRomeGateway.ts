import { PoolClient } from "pg";
import {
  RomeAppellation,
  RomeGateway,
  RomeMetier
} from "../../../domain/rome/ports/RomeGateway";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class PgRomeGateway implements RomeGateway {
  constructor(private client: PoolClient) {}

  appellationToCodeMetier(
    romeCodeAppellation: string,
  ): Promise<string | undefined> {
    return this.client
      .query(
        `SELECT code_rome
        FROM appellations_public_data
        WHERE ogr_appellation=$1`,
        [romeCodeAppellation],
      )
      .then((res) => res.rows[0].code_rome)
      .catch((e) => {
        logger.error(e);
        return;
      });
  }

  public async searchMetier(query: string): Promise<RomeMetier[]> {
    return this.client
      .query(
        `SELECT code_rome, libelle_rome
        FROM romes_public_data
        WHERE
          libelle_rome_tsvector@@to_tsquery('french', $1)
          OR libelle_rome ILIKE $2`,
        [toTsQuery(query), `%${query}%`],
      )
      .then((res) =>
        res.rows.map(
          (row): RomeMetier => ({
            codeMetier: row.code_rome,
            libelle: row.libelle_rome,
          }),
        ),
      )
      .catch((e) => {
        logger.error(e);
        return [];
      });
  }

  public async searchAppellation(query: string): Promise<RomeAppellation[]> {
    return await this.client
      .query(
        `SELECT ogr_appellation, libelle_appellation_court, code_rome
        FROM appellations_public_data
        WHERE
          libelle_appellation_long_tsvector @@ to_tsquery('french',$1)
          OR libelle_appellation_long ILIKE $2`,
        [toTsQuery(query), `%${query}%`],
      )
      .then((res) =>
        res.rows.map(
          (row): RomeAppellation => ({
            codeAppellation: row.ogr_appellation,
            libelle: row.libelle_appellation_court,
            codeMetier: row.code_rome,
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
