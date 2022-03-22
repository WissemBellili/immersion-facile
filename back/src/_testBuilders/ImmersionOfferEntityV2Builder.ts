import { ImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";
import { CodeRome } from "../shared/romeAndAppelationDtos/romeAndAppellation.dto";
import { ImmersionOfferId } from "../shared/SearchImmersionDto";
import { Builder } from "./Builder";

const validImmersionOfferEntityV2: ImmersionOfferEntityV2 = {
  id: "13df03a5-a2a5-430a-b558-ed3e2f03512d",
  romeCode: "B1805",
  score: 4.5,
};

export class ImmersionOfferEntityV2Builder
  implements Builder<ImmersionOfferEntityV2>
{
  constructor(
    private readonly entity: ImmersionOfferEntityV2 = validImmersionOfferEntityV2,
  ) {}

  withId(id: ImmersionOfferId) {
    return new ImmersionOfferEntityV2Builder({ ...this.entity, id });
  }

  withRome(rome: CodeRome) {
    return new ImmersionOfferEntityV2Builder({
      ...this.entity,
      romeCode: rome,
    });
  }

  withRomeAppellation(romeAppellation: number) {
    return new ImmersionOfferEntityV2Builder({
      ...this.entity,
      romeAppellation,
    });
  }

  build() {
    return this.entity;
  }
}
