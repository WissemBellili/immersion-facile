import { ImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";
import { Builder } from "./Builder";

const validImmersionOfferEntityV2: ImmersionOfferEntityV2 = {
  id: "13df03a5-a2a5-430a-b558-ed3e2f03512d",
  rome: "M1907",
  score: 4.5,
};

export class ImmersionOfferEntityV2Builder
  implements Builder<ImmersionOfferEntityV2>
{
  constructor(
    private readonly entity: ImmersionOfferEntityV2 = validImmersionOfferEntityV2,
  ) {}

  build() {
    return this.entity;
  }
}
