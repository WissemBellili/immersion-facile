import { AdminToken } from "shared/src/admin/admin.dto";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import { ConventionGateway } from "src/core-logic/ports/ConventionGateway";
import { AgencyId, AgencyWithPositionDto } from "shared/src/agency/agency.dto";
import { signConventionDtoWithRole } from "shared/src/convention/convention";
import {
  ConventionStatus,
  ConventionDto,
  ConventionId,
  UpdateConventionStatusRequestDto,
  WithConventionId,
  ConventionReadDto,
} from "shared/src/convention/convention.dto";
import { ShareLinkByEmailDto } from "shared/src/ShareLinkByEmailDto";
import {
  ConventionMagicLinkPayload,
  Role,
} from "shared/src/tokens/MagicLinkPayload";
import { sleep } from "shared/src/utils";
import { Observable, Subject, from } from "rxjs";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";

const CONVENTION_DRAFT_TEST = new ConventionDtoBuilder()
  .withStatus("DRAFT")
  .build();

const CONVENTION_VALIDATED_TEST = new ConventionDtoBuilder()
  .withStatus("ACCEPTED_BY_VALIDATOR")
  .build();

export class InMemoryConventionGateway implements ConventionGateway {
  private _conventions: { [id: string]: ConventionDto } = {
    [CONVENTION_DRAFT_TEST.id]: CONVENTION_DRAFT_TEST,
    [CONVENTION_VALIDATED_TEST.id]: CONVENTION_VALIDATED_TEST,
  };
  private _agencies: { [id: string]: AgencyWithPositionDto } = {};

  public convention$ = new Subject<ConventionReadDto | undefined>();

  public constructor(private simulatedLatency?: number) {}

  retrieveFromToken(jwt: string): Observable<ConventionReadDto | undefined> {
    return this.simulatedLatency
      ? from(this.getMagicLink(jwt))
      : this.convention$;
  }

  public async add(convention: ConventionDto): Promise<ConventionId> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    this._conventions[convention.id] = convention;
    return convention.id;
  }

  public async getById(id: ConventionId): Promise<ConventionReadDto> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    return this.inferConventionReadDto(this._conventions[id]);
  }

  // Same as GET above, but using a magic link
  public async getMagicLink(jwt: string): Promise<ConventionReadDto> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    const payload = decodeJwt<ConventionMagicLinkPayload>(jwt);
    return this.inferConventionReadDto(
      this._conventions[payload.applicationId],
    );
  }

  public async getAll(
    _adminToken: AdminToken,
    agency?: AgencyId,
    status?: ConventionStatus,
  ): Promise<Array<ConventionReadDto>> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));

    return Object.values(this._conventions)
      .filter((convention) => !agency || convention.agencyId === agency)
      .filter((convention) => !status || convention.status === status)
      .map((conventionDto) => ({
        ...conventionDto,
        dateValidation:
          conventionDto.status === "ACCEPTED_BY_VALIDATOR"
            ? conventionDto.dateSubmission
            : undefined,
        agencyName: `Agency name of ${conventionDto.agencyId}`,
      }));
  }

  public async update(convention: ConventionDto): Promise<ConventionId> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    this._conventions[convention.id] = convention;
    return convention.id;
  }

  public async updateMagicLink(
    convention: ConventionDto,
    jwt: string,
  ): Promise<string> {
    const payload = decodeJwt<ConventionMagicLinkPayload>(jwt);

    this.simulatedLatency && (await sleep(this.simulatedLatency));
    this._conventions[payload.applicationId] = convention;
    return convention.id;
  }

  public async updateStatus(
    { status, justification: _ }: UpdateConventionStatusRequestDto,
    jwt: string,
  ): Promise<WithConventionId> {
    const payload = decodeJwt<ConventionMagicLinkPayload>(jwt);
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    this._conventions[payload.applicationId] = {
      ...this._conventions[payload.applicationId],
      status,
    };
    return { id: payload.applicationId };
  }

  public async signApplication(jwt: string): Promise<WithConventionId> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    const payload = decodeJwt<ConventionMagicLinkPayload>(jwt);
    const application = this._conventions[payload.applicationId];
    this._conventions[payload.applicationId] = signConventionDtoWithRole(
      application,
      payload.role,
    );
    return { id: payload.applicationId };
  }

  public async generateMagicLink(
    _: AdminToken,
    _convention: ConventionId,
    role: Role,
  ): Promise<string> {
    return `magic/link/with/role/${role}`;
  }

  public async renewMagicLink(
    _expiredJwt: string,
    _linkFormat: string,
  ): Promise<void> {
    // This is supposed to ask the backend to send a new email to the owner of the expired magic link.
    // Since this operation makes no sense for local development, the implementation here is left empty.
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    throw new Error("500 Not Implemented In InMemory Gateway");
  }

  async shareLinkByEmail(
    _shareLinkByEmailDTO: ShareLinkByEmailDto,
  ): Promise<boolean> {
    return true;
  }

  private inferConventionReadDto(convention: ConventionDto): ConventionReadDto {
    return {
      ...convention,
      agencyName: this._agencies[convention.agencyId].name ?? "agency-name",
    };
  }
}
