import { from, Observable, Subject } from "rxjs";
import {
  AdminToken,
  AgencyIdAndName,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionId,
  ConventionMagicLinkPayload,
  ConventionReadDto,
  Role,
  ShareLinkByEmailDto,
  SignatoryRole,
  signConventionDtoWithRole,
  sleep,
  UpdateConventionStatusRequestDto,
  WithConventionId,
} from "shared";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import { ConventionGateway } from "src/core-logic/ports/ConventionGateway";

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
  private _agencies: { [id: string]: AgencyIdAndName } = {};

  public convention$ = new Subject<ConventionReadDto | undefined>();
  public conventionSignedResult$ = new Subject<void>();
  public conventionModificationResult$ = new Subject<void>();
  public addConventionResult$ = new Subject<void>();
  public updateConventionResult$ = new Subject<void>();

  public addConventionCallCount = 0;
  public updateConventionCallCount = 0;

  public constructor(private simulatedLatency?: number) {}

  retrieveFromToken$(jwt: string): Observable<ConventionReadDto | undefined> {
    return this.simulatedLatency
      ? from(this.getMagicLink(jwt))
      : this.convention$;
  }

  // not used anymore, kept for inspiration for a simulated gateway
  private async add(convention: ConventionDto): Promise<ConventionId> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    this._conventions[convention.id] = convention;
    return convention.id;
  }

  public add$(_convention: ConventionDto): Observable<void> {
    this.addConventionCallCount++;
    return this.addConventionResult$;
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

  // not used anymore, kept for inspiration for a simulated gateway
  private async updateMagicLink(
    convention: ConventionDto,
    jwt: string,
  ): Promise<string> {
    const payload = decodeJwt<ConventionMagicLinkPayload>(jwt);

    this.simulatedLatency && (await sleep(this.simulatedLatency));
    this._conventions[payload.applicationId] = convention;
    return convention.id;
  }

  public update$(
    _conventionDto: ConventionDto,
    _jwt: string,
  ): Observable<void> {
    this.updateConventionCallCount++;
    return this.updateConventionResult$;
  }

  private async updateStatus(
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

  public updateStatus$(
    _params: UpdateConventionStatusRequestDto,
    _jwt: string,
  ): Observable<void> {
    return this.conventionModificationResult$;
  }

  public signConvention$(_jwt: string): Observable<void> {
    return this.conventionSignedResult$;
  }

  public async signApplication(jwt: string): Promise<WithConventionId> {
    this.simulatedLatency && (await sleep(this.simulatedLatency));
    const payload = decodeJwt<ConventionMagicLinkPayload>(jwt);
    const convention = this._conventions[payload.applicationId];
    this._conventions[payload.applicationId] = signConventionDtoWithRole(
      convention,
      payload.role as SignatoryRole,
      new Date().toISOString(),
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
