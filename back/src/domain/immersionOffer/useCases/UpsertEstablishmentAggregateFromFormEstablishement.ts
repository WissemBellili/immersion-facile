import { FormEstablishmentDto } from "../../../shared/formEstablishment/FormEstablishment.dto";
import { formEstablishmentSchema } from "../../../shared/formEstablishment/FormEstablishment.schema";
import { LatLonDto } from "../../../shared/latLon";
import { NafDto } from "../../../shared/naf";
import { SiretDto } from "../../../shared/siret";
import { notifyAndThrowErrorDiscord } from "../../../utils/notifyDiscord";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { Clock } from "../../core/ports/Clock";
import { SequenceRunner } from "../../core/ports/SequenceRunner";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { UuidGenerator } from "../../core/ports/UuidGenerator";
import { TransactionalUseCase } from "../../core/UseCase";
import {
  SireneEstablishmentVO,
  SireneRepository,
  SireneRepositoryAnswer,
} from "../../sirene/ports/SireneRepository";
import { ContactEntityV2 } from "../entities/ContactEntity";
import {
  EstablishmentAggregate,
  EstablishmentEntityV2,
  TefenCode,
} from "../entities/EstablishmentEntity";
import { ImmersionOfferEntityV2 } from "../entities/ImmersionOfferEntity";
import { AdresseAPI } from "../ports/AdresseAPI";

const offerFromFormScore = 10; // 10/10 if voluntaryToImmersion=true (consider removing this field)

export type NewImmersionOfferFromFormCreatedPayload = {
  siret: SiretDto;
  position: LatLonDto;
  createdAt: Date;
};
export class UpsertEstablishmentAggregateFromForm extends TransactionalUseCase<
  FormEstablishmentDto,
  void
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly sireneRepository: SireneRepository,
    private readonly adresseAPI: AdresseAPI,
    private readonly sequenceRunner: SequenceRunner,
    private readonly uuidGenerator: UuidGenerator,
    private readonly clock: Clock,
  ) {
    super(uowPerformer);
  }

  inputSchema = formEstablishmentSchema;

  public async _execute(
    formEstablishment: FormEstablishmentDto,
    uow: UnitOfWork,
  ): Promise<void> {
    await uow.establishmentAggregateRepo.removeEstablishmentAndOffersAndContactWithSiret(
      formEstablishment.siret,
    );

    const establishmentAggregate =
      await this.formEstablishmentToEstablishmentAggregate(formEstablishment);

    if (!establishmentAggregate) return;

    await uow.establishmentAggregateRepo
      .insertEstablishmentAggregates([establishmentAggregate])
      .catch((err: any) => {
        notifyAndThrowErrorDiscord(
          new Error(
            `Error when adding establishment aggregate with siret ${formEstablishment.siret} due to ${err}`,
          ),
        );
      });
  }

  private async formEstablishmentToEstablishmentAggregate(
    formEstablishment: FormEstablishmentDto,
  ): Promise<EstablishmentAggregate | undefined> {
    const position = await this.adresseAPI.getPositionFromAddress(
      formEstablishment.businessAddress,
    );
    const sireneRepoAnswer = await this.sireneRepository.get(
      formEstablishment.siret,
    );
    if (!sireneRepoAnswer) {
      await notifyAndThrowErrorDiscord(
        new Error(
          `Could not get siret ${formEstablishment.siret} from siren gateway`,
        ),
      );
      return;
    }
    const nafDto = inferNafDtoFromSireneAnswer(sireneRepoAnswer);
    const numberEmployeesRange =
      inferNumberEmployeesRangeFromSireneAnswer(sireneRepoAnswer);

    if (!nafDto || !position || numberEmployeesRange === undefined) {
      notifyAndThrowErrorDiscord(
        new Error(
          `Some field from siren gateway are missing for establishment with siret ${formEstablishment.siret}`,
        ),
      );
      return;
    }

    const contact: ContactEntityV2 = {
      id: this.uuidGenerator.new(),
      ...formEstablishment.businessContact,
    };

    const immersionOffers: ImmersionOfferEntityV2[] = (
      await this.sequenceRunner.run(
        formEstablishment.appellations,
        async ({
          romeCode,
          appellationCode,
        }): Promise<ImmersionOfferEntityV2 | undefined> => ({
          id: this.uuidGenerator.new(),
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
      updatedAt: this.clock.now(),
      isSearchable: formEstablishment.isSearchable,
    };

    const establishmentAggregate: EstablishmentAggregate = {
      establishment,
      contact,
      immersionOffers,
    };
    return establishmentAggregate;
  }
}

// Those will probably be shared in a utils/helpers folder
const inferNafDtoFromSireneAnswer = (
  sireneRepoAnswer: SireneRepositoryAnswer,
): NafDto | undefined => {
  const establishmentProps = sireneRepoAnswer.etablissements[0];
  if (!establishmentProps) return;
  return new SireneEstablishmentVO(establishmentProps).nafAndNomenclature;
};

const inferNumberEmployeesRangeFromSireneAnswer = (
  sireneRepoAnswer: SireneRepositoryAnswer,
): TefenCode => {
  const tefenCode =
    sireneRepoAnswer.etablissements[0].uniteLegale.trancheEffectifsUniteLegale;

  if (tefenCode && tefenCode != "NN") return <TefenCode>+tefenCode;
  return -1;
};
