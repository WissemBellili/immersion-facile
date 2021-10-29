import {
  ApplicationStatus,
  AddImmersionApplicationMLResponseDto,
  addImmersionApplicationMLResponseDtoSchema,
  AddImmersionApplicationResponseDto,
  addImmersionApplicationResponseDtoSchema,
  ImmersionApplicationDto,
  ImmersionApplicationId,
  immersionApplicationSchema,
  UpdateImmersionApplicationResponseDto,
  updateImmersionApplicationResponseDtoSchema,
  UpdateImmersionApplicationStatusRequestDto,
  UpdateImmersionApplicationStatusResponseDto,
  updateImmersionApplicationStatusResponseSchema,
} from "src/shared/ImmersionApplicationDto";
import axios from "axios";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import { AgencyCode } from "src/shared/agencies";
import {
  generateMagicLinkRoute,
  immersionApplicationsRoute,
  siretRoute,
  updateApplicationStatusRoute,
  validateDemandeRoute,
} from "src/shared/routes";
import { GetSiretResponseDto, SiretDto } from "src/shared/siret";
import { Role } from "src/shared/tokens/MagicLinkPayload";

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

  public async addML(
    demandeImmersionDto: ImmersionApplicationDto,
  ): Promise<AddImmersionApplicationMLResponseDto> {
    await immersionApplicationSchema.parse(demandeImmersionDto);
    const httpResponse = await axios.post(
      `/${prefix}/auth/${immersionApplicationsRoute}`,
      demandeImmersionDto,
    );
    const addDemandeImmersionResponse: AddImmersionApplicationMLResponseDto =
      httpResponse.data;

    await addImmersionApplicationMLResponseDtoSchema.parse(
      addDemandeImmersionResponse,
    );
    return addDemandeImmersionResponse;
  }

  public async get(id: string): Promise<ImmersionApplicationDto> {
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
    agency?: AgencyCode,
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
  ): Promise<string> {
    const httpResponse = await axios.get(
      `/${prefix}/admin/${generateMagicLinkRoute}?id=${applicationId}&role=${role}`,
    );
    return httpResponse.data.jwt;
  }
}
