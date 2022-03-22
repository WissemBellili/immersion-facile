import { FormEstablishmentGateway } from "src/core-logic/ports/FormEstablishmentGateway";
import { FormEstablishmentDto } from "src/shared/FormEstablishmentDto";
import { AppellationMatch } from "src/../../../../back/src/shared/romeAndAppelationDtos/rome";
import { SiretDto } from "src/shared/siret";
import { sleep } from "src/shared/utils";

const SIMULATED_LATENCY_MS = 1000;

export class InMemoryFormEstablishmentGateway
  implements FormEstablishmentGateway
{
  private _existingEstablishmentSirets: SiretDto[] = [];

  public constructor(existingEstablishmentSirets: SiretDto[] = []) {
    this._existingEstablishmentSirets = existingEstablishmentSirets;
  }
  public async addFormEstablishment(
    immersionOffer: FormEstablishmentDto,
  ): Promise<SiretDto> {
    console.log(immersionOffer);
    await sleep(2000);
    if (immersionOffer.businessName === "givemeanerrorplease")
      throw new Error("418 I'm a teapot");
    return immersionOffer.siret;
  }

  public async searchAppellation(
    searchText: string,
  ): Promise<AppellationMatch[]> {
    await sleep(700);
    if (searchText === "givemeanemptylistplease") return [];
    if (searchText === "givemeanerrorplease")
      throw new Error("418 I'm a teapot");
    return [
      {
        profession: {
          description:
            "Agent(e) chargé(e) protection, sauvegarde patrimoine naturel",
          romeCodeMetier: "A1204",
        },
        matchRanges: [{ startIndexInclusive: 9, endIndexExclusive: 13 }],
      },
      {
        profession: {
          description: "Boulanger",
          romeCodeMetier: "A1111",
        },
        matchRanges: [
          { startIndexInclusive: 0, endIndexExclusive: 3 },
          { startIndexInclusive: 5, endIndexExclusive: 8 },
        ],
      },
      {
        profession: {
          description: "Boucher",
          romeCodeMetier: "B2222",
        },
        matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 3 }],
      },
      {
        profession: {
          romeCodeMetier: "C3333",
          description: "Menuisier",
        },
        matchRanges: [],
      },
      {
        profession: {
          romeCodeMetier: "D4444",
          description: "Vendeur",
        },
        matchRanges: [{ startIndexInclusive: 0, endIndexExclusive: 7 }],
      },
    ];
  }
  public async getSiretAlreadyExists(siret: SiretDto): Promise<boolean> {
    return this._existingEstablishmentSirets.includes(siret);
  }

  public async requestEmailToEditForm(siret: SiretDto): Promise<void> {
    return;
  }
}
