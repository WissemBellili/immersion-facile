import { AppConfig } from "../../adapters/primary/config/appConfig";
import { HttpPoleEmploiGateway } from "../../adapters/secondary/immersionOffer/HttpPoleEmploiGateway";
import { PoleEmploiAccessTokenGateway } from "../../adapters/secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { noRateLimit } from "../../domain/core/ports/RateLimiter";
import { noRetries } from "../../domain/core/ports/RetryStrategy";
import { PoleEmploiConvention } from "../../domain/convention/ports/PoleEmploiGateway";

const config = AppConfig.createFromEnv();
const accessTokenGateway = new PoleEmploiAccessTokenGateway(
  config.poleEmploiAccessTokenConfig,
  noRateLimit,
  noRetries,
);

const getAPI = () =>
  new HttpPoleEmploiGateway(
    accessTokenGateway,
    config.poleEmploiClientId,
    noRateLimit,
    noRetries,
  );

const peConvention: PoleEmploiConvention = {
  activitesObservees: "Tenir une conversation client",
  originalId: "31bd445d-54fa-4b53-8875-0ada1673fe3c",
  adresseImmersion: "5 avenue du Général",
  codeAppellation: "123456",
  codeRome: "A1234",
  competencesObservees: "apprentisage du métier, ponctualité, rigueur",
  dateDebut: "2022-04-01T12:00:00",
  dateDemande: "2022-04-01T12:00:00",
  dateFin: "2022-06-01T12:00:00",
  descriptionPreventionSanitaire: "",
  descriptionProtectionIndividuelle: "",
  dureeImmersion: " 80,50",
  email: "jean.profite@erole.com",
  emailTuteur: "john.doe@disney.com",
  enseigne: "AgenceDeGlace",
  id: "12345678910",
  nom: "Profite",
  nomPrenomFonctionTuteur: "John Doe Directeur d'agence",
  objectifDeImmersion: 1,
  peConnectId: "d4de66c2-42c0-4359-bf5d-137fc428355b",
  prenom: "Jean",
  preventionSanitaire: true,
  protectionIndividuelle: false,
  raisonSociale: "Jardin Mediansou",
  signatureBeneficiaire: true,
  signatureEntreprise: true,
  siret: "49840645800012",
  status: "DEMANDE_VALIDÉE",
  telephone: "0611335577",
  telephoneTuteur: "0622446688",
};

describe("HttpPoleEmploiGateway", () => {
  it("Should succeed posting a well formated convention", async () => {
    const api = getAPI();
    expect(await api.notifyOnConventionUpdated(peConvention)).not.toThrow();
  });
});
