import { z } from "zod";
import { nafDivisionSchema } from "../naf";
import { siretSchema } from "../siret";
import { romeCodeSchema } from "../rome";
import { latLonSchema } from "../latLon";
import { SearchImmersionRequestDto } from "./SearchImmersionRequest.dto";

export const searchImmersionRequestSchema: z.Schema<SearchImmersionRequestDto> =
  z.object({
    rome: romeCodeSchema.optional(),
    nafDivision: nafDivisionSchema.optional(),
    siret: siretSchema.optional(),
    location: latLonSchema,
    distance_km: z.number().positive("'distance_km' doit être > 0"),
  });