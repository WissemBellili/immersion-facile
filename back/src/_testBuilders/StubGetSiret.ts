import {
  GetSiretRequestDto,
  GetSiretResponseDto,
  getSiretRequestSchema,
} from "shared";
import { UseCase } from "../domain/core/UseCase";

export const defaultSiretResponse: GetSiretResponseDto = {
  siret: "12345678901234",
  businessName: "TEST BUSINESS NAME",
  businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
  naf: { code: "78.3Z", nomenclature: "Ref2" },
  isOpen: true,
};

export class StubGetSiret extends UseCase<
  GetSiretRequestDto,
  GetSiretResponseDto
> {
  private error: Error | null = null;
  constructor(private response: GetSiretResponseDto = defaultSiretResponse) {
    super();
  }

  inputSchema = getSiretRequestSchema;

  public async _execute(): Promise<GetSiretResponseDto> {
    if (this.error) throw this.error;
    return this.response;
  }

  public setNextResponse(response: GetSiretResponseDto) {
    this.response = response;
  }

  public setErrorForNextCall(error: Error) {
    this.error = error;
  }
}
