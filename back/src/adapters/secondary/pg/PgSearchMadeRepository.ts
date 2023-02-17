import { PoolClient } from "pg";
import {
  SearchMadeEntity,
  SearchMadeId,
} from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { SearchMadeRepository } from "../../../domain/immersionOffer/ports/SearchMadeRepository";
import { optional } from "./pgUtils";

export class PgSearchMadeRepository implements SearchMadeRepository {
  constructor(private client: PoolClient) {}

  async insertSearchMade(searchMade: SearchMadeEntity) {
    await this.client.query(
      `INSERT INTO searches_made (
         id, ROME, lat, lon, distance, needsToBeSearched, gps, voluntary_to_immersion, api_consumer_name, sorted_by, address, appellation_code
       ) VALUES ($1, $2, $3, $4, $5, $6, ST_GeographyFromText($7), $8, $9, $10, $11, $12)`,
      [
        searchMade.id,
        searchMade.rome,
        searchMade.lat,
        searchMade.lon,
        searchMade.distance_km,
        searchMade.needsToBeSearched,
        `POINT(${searchMade.lon} ${searchMade.lat})`,
        searchMade.voluntaryToImmersion,
        searchMade.apiConsumerName,
        searchMade.sortedBy,
        searchMade.place,
        searchMade.appellationCode,
      ],
    );
  }

  public async retrievePendingSearches(): Promise<SearchMadeEntity[]> {
    const requestResult = await this.client.query(
      "SELECT * from searches_made WHERE needstobesearched=true",
    );
    return requestResult.rows.map(
      (row): SearchMadeEntity => ({
        id: row.id,
        distance_km: row.distance,
        lat: row.lat,
        lon: row.lon,
        rome: optional(row.rome),
        needsToBeSearched: row.needstobesearched,
        sortedBy: row.sorted_by,
        place: row.address,
        appellationCode: optional(row.appellation_code),
        apiConsumerName: optional(row.api_consumer_name),
        voluntaryToImmersion: row.voluntary_to_immersion,
      }),
    );
  }
  public async markSearchAsProcessed(
    searchMadeId: SearchMadeId,
  ): Promise<void> {
    await this.client.query(
      "UPDATE searches_made SET needstobesearched=false WHERE id = $1 ; ",
      [searchMadeId],
    );
  }
}
