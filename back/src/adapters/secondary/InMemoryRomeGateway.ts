import { RomeGateway, RomeMetier } from "../../domain/rome/ports/RomeGateway";
import { createLogger } from "../../utils/logger";
import { normalize } from "../../utils/textSearch";

const logger = createLogger(__filename);

const metiers: RomeMetier[] = [
  { code: "A1203", libelle: "Aménagement et entretien des espaces verts" },
  { code: "A1409", libelle: "Élevage de lapins et volailles" },
  { code: "D1102", libelle: "Boulangerie - viennoiserie" },
  { code: "D1103", libelle: "Charcuterie - traiteur" },
  { code: "D1106", libelle: "Vente en alimentation" },
  {
    code: "D1201",
    libelle: "Achat vente d'objets d'art, anciens ou d'occasion",
  },
  { code: "D1202", libelle: "Coiffure" },
  { code: "D1505", libelle: "Personnel de caisse" },
  { code: "D1507", libelle: "Mise en rayon libre-service" },
  { code: "N4301", libelle: "Conduite sur rails" },
];

export class InMemoryRomeGateway implements RomeGateway {
  public async searchMetier(query: string): Promise<RomeMetier[]> {
    logger.info({ query }, "searchMetier");
    const normalizedQuery = normalize(query);
    return metiers.filter(
      (metier) => normalize(metier.libelle).indexOf(normalizedQuery) >= 0,
    );
  }
}
