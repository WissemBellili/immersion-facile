import { AgencyId } from "src/shared/agencies";
import {
  ApplicationStatus,
  ImmersionApplicationDto,
  ImmersionApplicationId,
  UpdateImmersionApplicationStatusRequestDto,
  WithImmersionApplicationId,
} from "src/shared/ImmersionApplication/ImmersionApplication.dto";
import { GetSiretResponseDto, SiretDto } from "src/shared/siret";
import { Role } from "src/shared/tokens/MagicLinkPayload";
import { ShareLinkByEmailDTO } from "src/shared/ShareLinkByEmailDTO";

export interface ImmersionApplicationGateway {
  add(immersionApplicationDto: ImmersionApplicationDto): Promise<string>;
  addUkraine(immersionApplicationDto: ImmersionApplicationDto): Promise<string>;

  // Get an immersion application through backoffice, password-protected route.
  backofficeGet(id: ImmersionApplicationId): Promise<ImmersionApplicationDto>;
  getMagicLink(jwt: string): Promise<ImmersionApplicationDto>;

  update(immersionApplicationDto: ImmersionApplicationDto): Promise<string>;
  updateMagicLink(
    immersionApplicationDto: ImmersionApplicationDto,
    jwt: string,
  ): Promise<string>;
  // Calls validate-demande on backend.
  validate(id: ImmersionApplicationId): Promise<string>;

  updateStatus(
    params: UpdateImmersionApplicationStatusRequestDto,
    jwt: string,
  ): Promise<WithImmersionApplicationId>;

  signApplication(jwt: string): Promise<WithImmersionApplicationId>;

  getSiretInfo(siret: SiretDto): Promise<GetSiretResponseDto>;
  getAll(
    agency?: AgencyId,
    status?: ApplicationStatus,
  ): Promise<Array<ImmersionApplicationDto>>;

  generateMagicLink(
    applicationId: ImmersionApplicationId,
    role: Role,
    expired: boolean,
  ): Promise<string>;

  renewMagicLink(expiredJwt: string, linkFormat: string): Promise<void>;

  // shareLinkByEmailDTO
  shareLinkByEmail(shareLinkByEmailDTO: ShareLinkByEmailDTO): Promise<boolean>;
}
