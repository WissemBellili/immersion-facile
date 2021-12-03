import {
  LatLonDto,
  LocationSuggestionDto,
  SearchImmersionRequestDto,
  SearchImmersionResultDto,
  searchImmersionResponseSchema,
} from "./../../shared/SearchImmersionDto";
import { ImmersionSearchGateway } from "../ports/ImmersionSearchGateway";
import { sleep } from "src/shared/utils";

const SIMULATED_LATENCY_MS = 150;

export class InMemoryImmersionSearchGateway implements ImmersionSearchGateway {
  public async search(
    searchParams: SearchImmersionRequestDto,
  ): Promise<SearchImmersionResultDto[]> {
    console.log("search immersion: " + searchParams);
    await sleep(SIMULATED_LATENCY_MS);

    return [
      {
        id: "search_result_id",
        rome: searchParams.rome,
        naf: searchParams.nafDivision,
        siret: "12345678901234",
        name: "Super Corp",
        voluntaryToImmersion: true,
        location: { lat: 48.8666, lon: 2.3333 },
        address: "55 rue du Faubourg Saint-Honoré",
        contactId: "contact_id",
        contactMode: "EMAIL",
      },
      {
        id: "search_result_id2",
        rome: searchParams.rome,
        naf: searchParams.nafDivision,
        siret: "12345678901234",
        name: "Mega Corp",
        voluntaryToImmersion: true,
        location: { lat: 48.8666, lon: 2.3333 },
        address: "55 rue du Faubourg Saint-Honoré",
        contactId: "contact_id2",
        contactMode: "PHONE",
      },
      {
        id: "search_result_id3",
        rome: searchParams.rome,
        naf: searchParams.nafDivision,
        siret: "12345678901234",
        name: "Hyper Corp",
        voluntaryToImmersion: true,
        location: { lat: 48.8666, lon: 2.3333 },
        address: "55 rue du Faubourg Saint-Honoré",
        contactId: "contact_id3",
        contactMode: "IN_PERSON",
      },
    ];
  }

  public async addressLookup(
    query: string,
  ): Promise<Array<LocationSuggestionDto>> {
    console.log("address lookup: " + query);
    await sleep(SIMULATED_LATENCY_MS);

    return [{ coordinates: { lat: 1.234, lon: 5.678 }, label: "Paris" }];
  }
}
