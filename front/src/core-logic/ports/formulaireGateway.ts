import { FormulaireDto, AddFormulaireResponseDto } from "src/shared/FormulaireDto";

export interface FormulaireGateway {
  add: (todo: FormulaireDto) => Promise<AddFormulaireResponseDto>;
}
