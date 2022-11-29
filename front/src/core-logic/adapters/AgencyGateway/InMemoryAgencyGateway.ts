/* eslint-disable  @typescript-eslint/require-await */
import { values } from "ramda";
import { Observable, of } from "rxjs";
import {
  AdminToken,
  AgencyDto,
  AgencyDtoBuilder,
  AgencyId,
  AgencyOption,
  AgencyPublicDisplayDto,
  CreateAgencyDto,
  DepartmentCode,
  ListAgenciesRequestDto,
  propEq,
  propNotEq,
  toAgencyPublicDisplayDto,
  WithAgencyId,
} from "shared";
import { AgencyGateway } from "src/core-logic/ports/AgencyGateway";

const MISSION_LOCAL_AGENCY_ACTIVE = new AgencyDtoBuilder()
  .withId("test-agency-1-front")
  .withName("Test Agency 1 (front)")
  .withAddress({
    streetNumberAndAddress: "Agency 1",
    postcode: "75001",
    city: "Paris",
    departmentCode: "75",
  })
  .withQuestionnaireUrl("www.questionnaireMissionLocale.com")
  .withKind("mission-locale")
  .withStatus("active")
  .build();

const PE_AGENCY_ACTIVE = new AgencyDtoBuilder()
  .withId("PE-test-agency-2-front")
  .withName("Test Agency 2 PE (front)")
  .withAddress({
    streetNumberAndAddress: "Agency 2",
    postcode: "75001",
    city: "Paris",
    departmentCode: "75",
  })
  .withQuestionnaireUrl("www.PE.com")
  .withKind("pole-emploi")
  .withSignature("Mon agence PE")
  .withStatus("active")
  .build();

const AGENCY_3_NEEDING_REVIEW = new AgencyDtoBuilder()
  .withId("PE-test-agency-3-front")
  .withName("Test Agency 3 (front)")
  .withStatus("needsReview")
  .build();

const AGENCY_4_NEEDING_REVIEW = new AgencyDtoBuilder()
  .withId("PE-test-agency-4-front")
  .withName("Test Agency 4 (front)")
  .withStatus("needsReview")
  .build();

export class InMemoryAgencyGateway implements AgencyGateway {
  listCciAgencies(_departmentCode: DepartmentCode): Promise<AgencyOption[]> {
    throw new Error("Method not implemented.");
  }
  private _agencies: Record<string, AgencyDto> = {
    [MISSION_LOCAL_AGENCY_ACTIVE.id]: MISSION_LOCAL_AGENCY_ACTIVE,
    [PE_AGENCY_ACTIVE.id]: PE_AGENCY_ACTIVE,
    [AGENCY_3_NEEDING_REVIEW.id]: AGENCY_3_NEEDING_REVIEW,
    [AGENCY_4_NEEDING_REVIEW.id]: AGENCY_4_NEEDING_REVIEW,
  };

  updateAgency$(): Observable<void> {
    return of(undefined);
  }

  async addAgency(createAgencyDto: CreateAgencyDto) {
    this._agencies[createAgencyDto.id] = {
      ...createAgencyDto,
      status: "needsReview",
      adminEmails: [],
      questionnaireUrl: createAgencyDto.questionnaireUrl ?? "",
    };
  }

  async listAgenciesByDepartmentCode(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this._agencies);
  }

  async listPeAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this._agencies).filter(propEq("kind", "pole-emploi"));
  }

  async listNonPeAgencies(
    _departmentCode: DepartmentCode,
  ): Promise<AgencyOption[]> {
    return values(this._agencies).filter(propNotEq("kind", "pole-emploi"));
  }

  async listAgenciesNeedingReview(): Promise<AgencyDto[]> {
    return values(this._agencies).filter(propEq("status", "needsReview"));
  }

  async validateAgency(_: AdminToken, agencyId: AgencyId): Promise<void> {
    this._agencies[agencyId].status = "active";
  }

  async getAgencyPublicInfoById(
    withAgencyId: WithAgencyId,
  ): Promise<AgencyPublicDisplayDto> {
    const agency = this._agencies[withAgencyId.id];
    if (agency) return toAgencyPublicDisplayDto(agency);
    throw new Error(`Missing agency with id ${withAgencyId.id}.`);
  }

  getImmersionFacileAgencyId(): Observable<AgencyId> {
    return of("agency-id-with-immersion-facile-kind");
  }

  listAgenciesByFilter$(
    _filter: ListAgenciesRequestDto,
  ): Observable<AgencyOption[]> {
    return of([
      {
        id: "2",
        name: "Agence 2",
      },
      {
        id: "3",
        name: "Agence 3",
      },
    ]);
  }

  getImmersionFacileAgencyId$(): Observable<AgencyId> {
    return of("agency-id-with-immersion-facile-kind");
  }

  getAgencyAdminById$(
    _agencyId: AgencyId,
    _adminToken: AdminToken,
  ): Observable<AgencyDto> {
    return undefined as unknown as Observable<AgencyDto>;
  }
}
