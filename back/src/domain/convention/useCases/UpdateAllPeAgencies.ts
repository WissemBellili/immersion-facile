import { AgencyDto } from "shared/src/agency/agency.dto";
import { LatLonDto } from "shared/src/latLon";
import { z } from "zod";
import { AppLogger } from "../../core/ports/AppLogger";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { UseCase } from "../../core/UseCase";
import { AgencyRepository } from "../ports/AgencyRepository";
import {
  PeAgenciesReferential,
  PeAgencyFromReferenciel,
} from "../../immersionOffer/ports/PeAgenciesReferential";
import { defaultQuestionnaireUrl } from "./AddAgency";

const counts = {
  added: 0,
  hasNoEmail: 0,
  matchedEmail: 0,
  matchedNearby: 0,
  toManyMatch: 0,
  total: 0,
  updated: 0,
};

// this use case is used only in one script (not in the back app)
export class UpdateAllPeAgencies extends UseCase<void, void> {
  constructor(
    private referencielAgencesPe: PeAgenciesReferential,
    private agencyRepository: AgencyRepository,
    private defaultAdminEmail: string,
    private uuid: UuidGenerator,
    private logger: AppLogger,
  ) {
    super();
  }

  protected inputSchema = z.void();

  async _execute(): Promise<void> {
    const start = new Date();
    const peReferentialAgencies =
      await this.referencielAgencesPe.getPeAgencies();

    this.logger.info(
      "Starting to process ",
      peReferentialAgencies.length,
      " agencies",
    );

    this.logger.info(
      "Total number of active agencies in DB before script : ",
      (await this.agencyRepository.getAllActive()).length,
    );

    for (const peReferentialAgency of peReferentialAgencies) {
      counts.total++;

      if (!peReferentialAgency.contact?.email) {
        this.logger.warn("No email for ", peReferentialAgency.libelleEtendu);
        counts.hasNoEmail++;
        continue;
      }

      const matchedEmailAgency = await this.getAgencyWhereEmailMatches(
        peReferentialAgency,
      );

      if (matchedEmailAgency) {
        counts.matchedEmail++;
        await this.updateAgency(matchedEmailAgency, peReferentialAgency);
        continue;
      }

      const matchedNearbyAgencies = await this.getNearestPeAgencies(
        peReferentialAgency,
      );

      switch (matchedNearbyAgencies.length) {
        case 0: {
          const newAgency = this.convertToAgency(peReferentialAgency);
          await this.agencyRepository.insert(newAgency);
          counts.added++;
          break;
        }

        case 1: {
          const matchedAgency = matchedNearbyAgencies[0];
          if (matchedAgency.status === "from-api-PE") break;
          await this.updateAgency(matchedAgency, peReferentialAgency);
          counts.matchedNearby++;
          break;
        }

        default: {
          this.logger.warn(
            `${peReferentialAgency.libelleEtendu} has ${matchedNearbyAgencies.length} agencies matching`,
          );
          this.logger.info({
            peReferentialAgency,
            matchedNearbyAgencies,
          });
          counts.toManyMatch++;
          break;
        }
      }
    }

    const finish = new Date();

    const totalDurationInSeconds = (finish.getTime() - start.getTime()) / 1000;
    this.logger.info(
      `Finished in ${totalDurationInSeconds} seconds : `,
      counts,
    );
  }

  private convertToAgency(
    peReferentialAgency: PeAgencyFromReferenciel,
  ): AgencyDto {
    return {
      id: this.uuid.new(),
      name: peReferentialAgency.libelleEtendu,
      counsellorEmails: [],
      validatorEmails: peReferentialAgency.contact?.email
        ? [peReferentialAgency.contact.email]
        : [],
      adminEmails: [this.defaultAdminEmail],
      ...normalizeAddressAndPosition(peReferentialAgency),
      signature: `L'équipe de l'${peReferentialAgency.libelleEtendu}`,
      questionnaireUrl: defaultQuestionnaireUrl,
      codeSafir: peReferentialAgency.codeSafir,
      agencySiret: peReferentialAgency.siret,
      kind: "pole-emploi",
      status: "from-api-PE",
    };
  }

  private async getNearestPeAgencies(
    peReferentialAgency: PeAgencyFromReferenciel,
  ): Promise<AgencyDto[]> {
    const agencies = await this.agencyRepository.getNearby(
      {
        lon: peReferentialAgency.adressePrincipale.gpsLon,
        lat: peReferentialAgency.adressePrincipale.gpsLat,
      },
      0.2,
    );
    return agencies.filter((agency) => agency.kind === "pole-emploi");
  }

  private async getAgencyWhereEmailMatches(
    peReferentialAgency: PeAgencyFromReferenciel,
  ): Promise<AgencyDto | undefined> {
    if (!peReferentialAgency.contact?.email) return;

    const result = await this.agencyRepository.getAgencyWhereEmailMatches(
      peReferentialAgency.contact.email,
    );

    return result;
  }

  private async updateAgency(
    existingAgency: AgencyDto,
    peReferentialAgency: PeAgencyFromReferenciel,
  ): Promise<void> {
    counts.updated++;
    const updatedAgency: AgencyDto = {
      ...existingAgency,
      ...normalizeAddressAndPosition(peReferentialAgency),
      ...updateEmails({
        validatorEmails: existingAgency.validatorEmails,
        counsellorEmails: existingAgency.counsellorEmails,
        newEmail: peReferentialAgency.contact?.email,
      }),
      agencySiret: peReferentialAgency.siret,
      codeSafir: peReferentialAgency.codeSafir,
    };
    await this.agencyRepository.update(updatedAgency);
  }
}

const updateEmails = ({
  counsellorEmails,
  validatorEmails,
  newEmail,
}: {
  counsellorEmails: string[];
  validatorEmails: string[];
  newEmail: string | undefined;
}): { validatorEmails: string[]; counsellorEmails: string[] } => {
  if (
    !newEmail ||
    validatorEmails.includes(newEmail) ||
    counsellorEmails.includes(newEmail)
  ) {
    return {
      validatorEmails,
      counsellorEmails,
    };
  }

  return { counsellorEmails, validatorEmails: [...validatorEmails, newEmail] };
};

const normalizeAddressAndPosition = ({
  adressePrincipale,
  adressePrincipale: { ligne4, ligne5, ligne6 },
}: PeAgencyFromReferenciel): { address: string; position: LatLonDto } => ({
  address: [ligne4, ligne5, ligne6].filter((v) => !!v).join(", "),
  position: {
    lat: adressePrincipale.gpsLat,
    lon: adressePrincipale.gpsLon,
  },
});
