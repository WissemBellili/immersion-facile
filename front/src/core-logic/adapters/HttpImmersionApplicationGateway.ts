import axios from "axios";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import { AgencyDto, listAgenciesResponseSchema } from "src/shared/agencies";
import {
  AddImmersionApplicationResponseDto,
  addImmersionApplicationResponseDtoSchema,
  ApplicationStatus,
  ImmersionApplicationDto,
  ImmersionApplicationId,
  immersionApplicationSchema,
  UpdateImmersionApplicationResponseDto,
  updateImmersionApplicationResponseDtoSchema,
  UpdateImmersionApplicationStatusRequestDto,
  UpdateImmersionApplicationStatusResponseDto,
  updateImmersionApplicationStatusResponseSchema,
} from "src/shared/ImmersionApplicationDto";
import {
  agenciesRoute,
  generateMagicLinkRoute,
  renewMagicLinkRoute,
  immersionApplicationsRoute,
  siretRoute,
  updateApplicationStatusRoute,
  validateDemandeRoute,
  signApplicationRoute,
  rejectSigningApplicationRoute,
} from "src/shared/routes";
import { LatLonDto } from "src/shared/SearchImmersionDto";
import { GetSiretResponseDto, SiretDto } from "src/shared/siret";
import { Role } from "src/shared/tokens/MagicLinkPayload";
import { AgencyId } from "./../../shared/agencies";

const prefix = "api";

export class HttpImmersionApplicationGateway extends ImmersionApplicationGateway {
  public async add(
    demandeImmersionDto: ImmersionApplicationDto,
  ): Promise<string> {
    immersionApplicationSchema.parse(demandeImmersionDto);
    const httpResponse = await axios.post(
      `/${prefix}/${immersionApplicationsRoute}`,
      demandeImmersionDto,
    );
    const addDemandeImmersionResponse: AddImmersionApplicationResponseDto =
      httpResponse.data;
    addImmersionApplicationResponseDtoSchema.parse(addDemandeImmersionResponse);
    return addDemandeImmersionResponse.id;
  }

  public async backofficeGet(id: string): Promise<ImmersionApplicationDto> {
    const response = await axios.get(
      `/${prefix}/${immersionApplicationsRoute}/${id}`,
    );
    console.log(response.data);
    return response.data;
  }

  public async getML(jwt: string): Promise<ImmersionApplicationDto> {
    const response = await axios.get(
      `/${prefix}/auth/${immersionApplicationsRoute}/${jwt}`,
    );
    console.log(response.data);
    return response.data;
  }

  public async getAll(
    agency?: AgencyId,
    status?: ApplicationStatus,
  ): Promise<Array<ImmersionApplicationDto>> {
    const response = await axios.get(
      `/${prefix}/${immersionApplicationsRoute}`,
      {
        params: {
          agency,
          status,
        },
      },
    );

    return response.data;
  }

  public async update(
    demandeImmersionDto: ImmersionApplicationDto,
  ): Promise<string> {
    immersionApplicationSchema.parse(demandeImmersionDto);
    const httpResponse = await axios.post(
      `/${prefix}/${immersionApplicationsRoute}/${demandeImmersionDto.id}`,
      demandeImmersionDto,
    );
    const updateDemandeImmersionResponse: UpdateImmersionApplicationResponseDto =
      httpResponse.data;
    updateImmersionApplicationResponseDtoSchema.parse(
      updateDemandeImmersionResponse,
    );
    return updateDemandeImmersionResponse.id;
  }

  public async updateML(
    demandeImmersionDto: ImmersionApplicationDto,
    jwt: string,
  ): Promise<string> {
    await immersionApplicationSchema.parse(demandeImmersionDto);
    const httpResponse = await axios.post(
      `/${prefix}/auth/${immersionApplicationsRoute}/${jwt}`,
      demandeImmersionDto,
    );
    const updateDemandeImmersionResponse: UpdateImmersionApplicationResponseDto =
      httpResponse.data;
    await updateImmersionApplicationResponseDtoSchema.parse(
      updateDemandeImmersionResponse,
    );
    return updateDemandeImmersionResponse.id;
  }

  public async updateStatus(
    params: UpdateImmersionApplicationStatusRequestDto,
    jwt: string,
  ): Promise<UpdateImmersionApplicationStatusResponseDto> {
    const httpResponse = await axios.post(
      `/${prefix}/auth/${updateApplicationStatusRoute}/${jwt}`,
      params,
    );

    const response = updateImmersionApplicationStatusResponseSchema.parse(
      httpResponse.data,
    );
    return response;
  }

  public async signApplication(
    jwt: string,
  ): Promise<UpdateImmersionApplicationStatusResponseDto> {
    const httpResponse = await axios.post(
      `/${prefix}/auth/${signApplicationRoute}/${jwt}`,
    );

    const response = updateImmersionApplicationStatusResponseSchema.parse(
      httpResponse.data,
    );
    return response;
  }

  public async validate(id: ImmersionApplicationId): Promise<string> {
    const { data } = await axios.get(
      `/${prefix}/${validateDemandeRoute}/${id}`,
    );
    return data.id;
  }

  public async getSiretInfo(siret: SiretDto): Promise<GetSiretResponseDto> {
    const httpResponse = await axios.get(`/${prefix}/${siretRoute}/${siret}`);
    return httpResponse.data;
  }

  public async generateMagicLink(
    applicationId: ImmersionApplicationId,
    role: Role,
    expired: boolean,
  ): Promise<string> {
    const httpResponse = await axios.get(
      `/${prefix}/admin/${generateMagicLinkRoute}?id=${applicationId}&role=${role}&expired=${expired}`,
    );
    return httpResponse.data.jwt;
  }

  public async renewMagicLink(
    expiredJwt: string,
    linkFormat: string,
  ): Promise<void> {
    await axios.get(
      `/${prefix}/${renewMagicLinkRoute}?expiredJwt=${expiredJwt}&linkFormat=${encodeURIComponent(
        linkFormat,
      )}`,
    );
  }

  public async listAgencies(position: LatLonDto): Promise<AgencyDto[]> {
    const httpResponse = await axios.get(`/${prefix}/${agenciesRoute}`, {
      params: position,
    });
    const response = listAgenciesResponseSchema.parse(httpResponse.data);
    console.log(response);
    return response;
  }
}
