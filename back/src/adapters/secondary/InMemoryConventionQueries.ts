import { propEq } from "ramda";
import {
  validatedConventionStatuses,
  WithConventionId,
  ListConventionsRequestDto,
  ConventionAdminReadDto,
  ConventionId,
} from "shared/src/convention/convention.dto";
import { ConventionQueries } from "../../domain/convention/ports/ConventionQueries";
import { ConventionRawBeforeExport } from "../../domain/convention/useCases/ExportConventionsReport";
import { ImmersionAssessmentEmailParams } from "../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { createLogger } from "../../utils/logger";
import { InMemoryOutboxRepository } from "./core/InMemoryOutboxRepository";
import { InMemoryConventionRepository } from "./InMemoryConventionRepository";

export const TEST_AGENCY_NAME = "TEST_AGENCY_NAME";
const logger = createLogger(__filename);

export class InMemoryConventionQueries implements ConventionQueries {
  constructor(
    private readonly conventionRepository: InMemoryConventionRepository,
    private readonly outboxRepository?: InMemoryOutboxRepository,
  ) {}

  public async getLatestConventionAdminDtos({
    status,
    agencyId,
  }: ListConventionsRequestDto): Promise<ConventionAdminReadDto[]> {
    logger.info("getAll");
    return Object.values(this.conventionRepository._conventions)
      .filter((dto) => !status || dto.status === status)
      .filter((dto) => !agencyId || dto.agencyId === agencyId)
      .map((dto) => ({ ...dto, agencyName: TEST_AGENCY_NAME }));
  }

  public async getConventionAdminReadDtoById(
    id: ConventionId,
  ): Promise<ConventionAdminReadDto | undefined> {
    logger.info("getAll");
    const storedConvention = this.conventionRepository.conventions.find(
      propEq("id", id),
    );
    return (
      storedConvention && {
        ...storedConvention,
        agencyName: TEST_AGENCY_NAME,
      }
    );
  }

  public async getAllConventionsForExport(): Promise<
    ConventionRawBeforeExport[]
  > {
    return Object.values(this.conventionRepository._conventions).map((dto) => ({
      agencyName: `TEST_AGENCY_NAME_WITH_ID_${dto.agencyId}`,
      status: dto.status,
      postalCode: dto.postalCode,
      email: dto.email,
      phone: dto.phone,
      firstName: dto.firstName,
      lastName: dto.lastName,
      emergencyContact: dto.emergencyContact,
      emergencyContactPhone: dto.emergencyContactPhone,
      dateSubmission: new Date(dto.dateSubmission).toISOString(),
      dateStart: new Date(dto.dateStart).toISOString(),
      dateEnd: new Date(dto.dateEnd).toISOString(),
      dateValidation: dto.dateValidation
        ? new Date(dto.dateValidation).toISOString()
        : undefined,
      businessName: dto.businessName,
      mentor: dto.mentor,
      mentorPhone: dto.mentorPhone,
      mentorEmail: dto.mentorEmail,
      immersionObjective: dto.immersionObjective,
      immersionProfession: dto.immersionAppellation.appellationLabel,
      beneficiaryAccepted: dto.beneficiaryAccepted,
      enterpriseAccepted: dto.enterpriseAccepted,
      schedule: dto.schedule,
      siret: dto.siret,
      workConditions: dto.workConditions,
      federatedIdentity: dto.federatedIdentity,
    }));
  }

  public async getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink(
    dateEnd: Date,
  ): Promise<ImmersionAssessmentEmailParams[]> {
    const immersionIdsThatAlreadyGotAnEmail = this.outboxRepository
      ? Object.values(this.outboxRepository._events)
          .filter(propEq("topic", "EmailWithLinkToCreateAssessmentSent"))
          .map((event) => (event.payload as WithConventionId).id)
      : [];
    return Object.values(this.conventionRepository._conventions)
      .filter(
        (convention) =>
          new Date(convention.dateEnd).getDate() === dateEnd.getDate() &&
          validatedConventionStatuses.includes(convention.status) &&
          !immersionIdsThatAlreadyGotAnEmail.includes(convention.id),
      )
      .map((convention) => ({
        immersionId: convention.id,
        mentorName: convention.mentor,
        mentorEmail: convention.mentorEmail,
        beneficiaryFirstName: convention.firstName,
        beneficiaryLastName: convention.lastName,
      }));
  }
}
