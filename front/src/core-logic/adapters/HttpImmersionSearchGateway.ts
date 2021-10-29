import { searchImmersionRoute } from "./../../shared/routes";
import {
  LocationSuggestionDto,
  SearchImmersionRequestDto,
  SearchImmersionResponseDto,
  searchImmersionResponseSchema,
} from "./../../shared/SearchImmersionDto";
import axios from "axios";
import { ImmersionSearchGateway } from "../ports/ImmersionSearchGateway";

const prefix = "api";

export class HttpImmersionSearchGateway extends ImmersionSearchGateway {
  public async search(
    searchParams: SearchImmersionRequestDto,
  ): Promise<SearchImmersionResponseDto> {
    const response = await axios.post(
      `/${prefix}/${searchImmersionRoute}`,
      searchParams,
    );
    console.log(response.data);

    const parsedResponse = await searchImmersionResponseSchema.parse(
      response.data,
    );

    return parsedResponse;
  }

  public async addressLookup(
    query: string,
  ): Promise<Array<LocationSuggestionDto>> {
    return axios
      .get("https://api-adresse.data.gouv.fr/search/", {
        params: {
          q: query,
        },
      })
      .then((response: any) => {
        const parsed = response.data.features;

        // Filter out any non-point-type results, as only points are supported in the below code, as it
        // seems like api-adresse doesn't currently returns regions/multipoints/etc.
        return parsed
          .filter(
            (feature: any) =>
              "properties" in feature &&
              "label" in feature.properties! &&
              feature.geometry.type === "Point",
          )
          .map((feature: any) => {
            return {
              coordinates: {
                lat: feature.geometry!.coordinates[1] ?? 0,
                lon: feature.geometry!.coordinates[0] ?? 0,
              },
              label: feature.properties!.label ?? "",
            };
          });
      })
      .catch(function (error: any) {
        return [
          {
            label: "Un erreur c'est produit: " + error,
            coordinates: { lat: 0, lon: 0 },
          },
        ];
      });
  }
}
