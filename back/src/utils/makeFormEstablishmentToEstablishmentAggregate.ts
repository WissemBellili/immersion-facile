import { Clock } from "../domain/core/ports/Clock";
import { SequenceRunner } from "../domain/core/ports/SequenceRunner";
import { UuidGenerator } from "../domain/core/ports/UuidGenerator";
import { ContactEntityV2 } from "../domain/immersionOffer/entities/ContactEntity";
import {
  EstablishmentAggregate,
  EstablishmentEntityV2,
} from "../domain/immersionOffer/entities/EstablishmentEntity";
import { ImmersionOfferEntityV2 } from "../domain/immersionOffer/entities/ImmersionOfferEntity";
import { AdresseAPI } from "../domain/immersionOffer/ports/AdresseAPI";
import {
  SireneEstablishmentVO,
  SireneRepository,
} from "../domain/sirene/ports/SireneRepository";
import { FormEstablishmentDto } from "../shared/formEstablishment/FormEstablishment.dto";
import { notifyAndThrowErrorDiscord } from "./notifyDiscord";

const offerFromFormScore = 10; // 10/10 if voluntaryToImmersion=true (consider removing this field)

export const makeFormEstablishmentToEstablishmentAggregate = ({
  uuidGenerator,
  clock,
  adresseAPI,
  sireneRepository,
  sequenceRunner,
}: {
  uuidGenerator: UuidGenerator;
  clock: Clock;
  adresseAPI: AdresseAPI;
  sireneRepository: SireneRepository;
  sequenceRunner: SequenceRunner;
}) => {
  const formEstablishmentToEstablishmentAggregate = async (
    formEstablishment: FormEstablishmentDto,
  ): Promise<EstablishmentAggregate | undefined> => {
    const position = await adresseAPI.getPositionFromAddress(
      formEstablishment.businessAddress,
    );
    const sireneRepoAnswer = await sireneRepository.get(
      formEstablishment.siret,
    );
    if (!sireneRepoAnswer || !sireneRepoAnswer.etablissements[0]) {
      await notifyAndThrowErrorDiscord(
        new Error(
          `Could not get siret ${formEstablishment.siret} from siren gateway`,
        ),
      );
      return;
    }
    const sireneEstablishmentVo = new SireneEstablishmentVO(
      sireneRepoAnswer.etablissements[0],
    );

    const nafDto = sireneEstablishmentVo.nafAndNomenclature;
    const numberEmployeesRange = sireneEstablishmentVo.numberEmployeesRange;

    if (!nafDto || !position || numberEmployeesRange === undefined) {
      notifyAndThrowErrorDiscord(
        new Error(
          `Some field from siren gateway are missing for establishment with siret ${formEstablishment.siret} : nafDto=${nafDto}; position=${position}; numberEmployeesRange=${numberEmployeesRange}`,
        ),
      );
      return;
    }

    const contact: ContactEntityV2 = {
      id: uuidGenerator.new(),
      ...formEstablishment.businessContact,
    };

    const immersionOffers: ImmersionOfferEntityV2[] = (
      await sequenceRunner.run(
        formEstablishment.appellations,
        async ({
          romeCode,
          appellationCode,
        }): Promise<ImmersionOfferEntityV2 | undefined> => ({
          id: uuidGenerator.new(),
          romeCode,
          appellationCode: appellationCode ? appellationCode : undefined,
          score: offerFromFormScore,
        }),
      )
    ).filter((offer): offer is ImmersionOfferEntityV2 => !!offer);

    const establishment: EstablishmentEntityV2 = {
      siret: formEstablishment.siret,
      name: formEstablishment.businessName,
      customizedName: formEstablishment.businessNameCustomized,
      isCommited: formEstablishment.isEngagedEnterprise,
      address: formEstablishment.businessAddress,
      voluntaryToImmersion: true,
      dataSource: "form",
      sourceProvider: formEstablishment.source,
      nafDto,
      position,
      numberEmployeesRange,
      isActive: true,
      updatedAt: clock.now(),
      isSearchable: formEstablishment.isSearchable,
    };

    const establishmentAggregate: EstablishmentAggregate = {
      establishment,
      contact,
      immersionOffers,
    };
    return establishmentAggregate;
  };

  return formEstablishmentToEstablishmentAggregate;
};
