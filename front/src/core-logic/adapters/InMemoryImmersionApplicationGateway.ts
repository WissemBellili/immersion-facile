import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import { AgencyId, AgencyInListDto } from "shared/src/agency/agency.dto";
import {
  ApplicationStatus,
  ImmersionApplicationDto,
  ImmersionApplicationId,
  UpdateImmersionApplicationStatusRequestDto,
  WithImmersionApplicationId,
} from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { GetSiretResponseDto, SiretDto } from "shared/src/siret";
import { MagicLinkPayload, Role } from "shared/src/tokens/MagicLinkPayload";
import { sleep } from "shared/src/utils";
import { ShareLinkByEmailDTO } from "shared/src/ShareLinkByEmailDTO";
import { signApplicationDtoWithRole } from "shared/src/ImmersionApplication/immersionApplication";

const TEST_ESTABLISHMENTS: GetSiretResponseDto[] = [
  {
    siret: "12345678901234",
    businessName: "MA P'TITE BOITE",
    businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
    naf: {
      code: "78.3Z",
      nomenclature: "Ref2",
    },
    isOpen: true,
  },
  {
    siret: "11111111111111",
    businessName: "ALAIN PROST",
    businessAddress: "CHALET SECRET 73550 MERIBEL",
    isOpen: true,
  },
];

const SIMULATED_LATENCY_MS = 2000;
export class InMemoryImmersionApplicationGateway
  implements ImmersionApplicationGateway
{
  private _immersionApplications: { [id: string]: ImmersionApplicationDto } =
    {};
  private _agencies: { [id: string]: AgencyInListDto } = {};
  private _sireneEstablishments: { [siret: string]: GetSiretResponseDto } = {};

  public constructor() {
    TEST_ESTABLISHMENTS.forEach(
      (establishment) =>
        (this._sireneEstablishments[establishment.siret] = establishment),
    );
  }

  public async add(
    immersionApplication: ImmersionApplicationDto,
  ): Promise<ImmersionApplicationId> {
    console.log(
      "InMemoryImmersionApplicationGateway.add: ",
      immersionApplication,
    );
    await sleep(SIMULATED_LATENCY_MS);
    this._immersionApplications[immersionApplication.id] = immersionApplication;
    return immersionApplication.id;
  }

  public async backofficeGet(
    id: ImmersionApplicationId,
  ): Promise<ImmersionApplicationDto> {
    console.log("InMemoryImmersionApplicationGateway.get: ", id);
    await sleep(SIMULATED_LATENCY_MS);
    return this._immersionApplications[id];
  }

  // Same as GET above, but using a magic link
  public async getMagicLink(jwt: string): Promise<ImmersionApplicationDto> {
    await sleep(SIMULATED_LATENCY_MS);

    const payload = decodeJwt<MagicLinkPayload>(jwt);
    return this._immersionApplications[payload.applicationId];
  }

  public async getAll(
    agency?: AgencyId,
    status?: ApplicationStatus,
  ): Promise<Array<ImmersionApplicationDto>> {
    console.log("InMemoryImmersionApplicationGateway.getAll: ", agency, status);
    await sleep(SIMULATED_LATENCY_MS);

    return Object.values(this._immersionApplications)
      .filter((application) => !agency || application.agencyId === agency)
      .filter((application) => !status || application.status === status);
  }

  public async update(
    immersionApplication: ImmersionApplicationDto,
  ): Promise<ImmersionApplicationId> {
    console.log(
      "InMemoryImmersionApplicationGateway.update: ",
      immersionApplication,
    );
    await sleep(SIMULATED_LATENCY_MS);
    this._immersionApplications[immersionApplication.id] = immersionApplication;
    return immersionApplication.id;
  }

  public async updateMagicLink(
    immersionApplication: ImmersionApplicationDto,
    jwt: string,
  ): Promise<string> {
    console.log(
      "InMemoryImmersionApplicationGateway.updateML: ",
      immersionApplication,
    );
    const payload = decodeJwt<MagicLinkPayload>(jwt);

    await sleep(SIMULATED_LATENCY_MS);
    this._immersionApplications[payload.applicationId] = immersionApplication;
    return immersionApplication.id;
  }

  public async updateStatus(
    { status, justification }: UpdateImmersionApplicationStatusRequestDto,
    jwt: string,
  ): Promise<WithImmersionApplicationId> {
    const payload = decodeJwt<MagicLinkPayload>(jwt);
    await sleep(SIMULATED_LATENCY_MS);
    this._immersionApplications[payload.applicationId] = {
      ...this._immersionApplications[payload.applicationId],
      status,
    };
    return { id: payload.applicationId };
  }

  public async signApplication(
    jwt: string,
  ): Promise<WithImmersionApplicationId> {
    await sleep(SIMULATED_LATENCY_MS);
    const payload = decodeJwt<MagicLinkPayload>(jwt);
    const application = this._immersionApplications[payload.applicationId];
    this._immersionApplications[payload.applicationId] =
      signApplicationDtoWithRole(application, payload.role);
    return { id: payload.applicationId };
  }

  public async validate(id: ImmersionApplicationId): Promise<string> {
    console.log("InMemoryImmersionApplicationGateway.validate: ", id);
    await sleep(SIMULATED_LATENCY_MS);
    let form = { ...this._immersionApplications[id] };
    if (form.status === "IN_REVIEW") {
      form.status = "VALIDATED";
      this._immersionApplications[id] = form;
    } else {
      throw new Error("400 Bad Request");
    }
    return id;
  }

  public async generateMagicLink(
    applicationId: ImmersionApplicationId,
    role: Role,
  ): Promise<string> {
    // TODO: generate actual JWTs here
    throw new Error("500 Not Implemented In InMemory Gateway");
    return "";
  }

  public async renewMagicLink(
    expiredJwt: string,
    linkFormat: string,
  ): Promise<void> {
    // This is supposed to ask the backend to send a new email to the owner of the expired magic link.
    // Since this operation makes no sense for local development, the implementation here is left empty.
    await sleep(SIMULATED_LATENCY_MS);
    throw new Error("500 Not Implemented In InMemory Gateway");
  }

  public async getSiretInfo(siret: SiretDto): Promise<GetSiretResponseDto> {
    console.log(
      "InMemoryImmersionApplicationGateway.getSiretInfo for siret: " + siret,
    );
    await sleep(SIMULATED_LATENCY_MS);

    const establishment = this._sireneEstablishments[siret];
    console.log(
      "InMemoryImmersionApplicationGateway.getSiretInfo returned: ",
      establishment,
    );

    if (!establishment) {
      throw new Error("404 Not found");
    }

    return establishment;
  }

  async shareLinkByEmail(
    shareLinkByEmailDTO: ShareLinkByEmailDTO,
  ): Promise<boolean> {
    console.log(
      "InMemoryImmersionApplicationGateway.shareLinkByEmail",
      shareLinkByEmailDTO,
    );

    return true;
  }
}
