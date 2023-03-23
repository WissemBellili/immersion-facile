import {
  conventionStatuses,
  ConventionDtoBuilder,
  expectPromiseToFailWithError,
} from "shared";
import { SirenApiRawEstablishmentBuilder } from "../../../_testBuilders/SirenApiRawEstablishmentBuilder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { InMemoryFeatureFlagRepository } from "../../../adapters/secondary/InMemoryFeatureFlagRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemorySirenGateway } from "../../../adapters/secondary/sirene/InMemorySirenGateway";
import { AddConvention } from "./AddConvention";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../core/eventBus/EventBus";
import { DomainEvent } from "../../core/eventBus/events";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";

describe("Add Convention", () => {
  let addConvention: AddConvention;
  let conventionRepository: InMemoryConventionRepository;
  let uuidGenerator: TestUuidGenerator;
  let createNewEvent: CreateNewEvent;
  let outboxRepository: InMemoryOutboxRepository;
  let timeGateway: CustomTimeGateway;
  const validConvention = new ConventionDtoBuilder().build();
  const { externalId, ...validConventionParams } = validConvention;

  let sirenGateway: InMemorySirenGateway;
  let uowPerformer: InMemoryUowPerformer;

  beforeEach(() => {
    const uow = createInMemoryUow();
    conventionRepository = uow.conventionRepository;
    outboxRepository = uow.outboxRepository;
    uow.featureFlagRepository = new InMemoryFeatureFlagRepository({
      enableInseeApi: true,
    });
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator,
    });
    sirenGateway = new InMemorySirenGateway();
    uowPerformer = new InMemoryUowPerformer(uow);
    addConvention = new AddConvention(
      uowPerformer,
      createNewEvent,
      sirenGateway,
    );
  });

  it("saves valid applications in the repository", async () => {
    const occurredAt = new Date("2021-10-15T15:00");
    const id = "eventId";
    timeGateway.setNextDate(occurredAt);
    uuidGenerator.setNextUuid(id);
    conventionRepository.setNextExternalId("00000000001");

    expect(await addConvention.execute(validConventionParams)).toEqual({
      id: validConventionParams.id,
    });

    const storedInRepo = conventionRepository.conventions;
    expect(storedInRepo[0]).toEqual(validConvention);
    expectDomainEventsToBeInOutbox([
      {
        id,
        occurredAt: occurredAt.toISOString(),
        topic: "ImmersionApplicationSubmittedByBeneficiary",
        payload: validConvention,
        publications: [],
        wasQuarantined: false,
      },
    ]);
  });

  it("rejects conventions where the ID is already in use", async () => {
    await conventionRepository.save(validConventionParams);

    await expectPromiseToFailWithError(
      addConvention.execute(validConventionParams),
      new ConflictError(validConventionParams.id),
    );
  });

  describe("Status validation", () => {
    // This might be nice for "backing up" entered data, but not implemented in front end as of Dec 16, 2021
    it("allows applications submitted as DRAFT", async () => {
      expect(await addConvention.execute(validConventionParams)).toEqual({
        id: validConventionParams.id,
      });
    });

    it("allows applications submitted as READY_TO_SIGN", async () => {
      expect(
        await addConvention.execute({
          ...validConventionParams,
          status: "READY_TO_SIGN",
        }),
      ).toEqual({
        id: validConventionParams.id,
      });
    });

    it("rejects applications if the status is not DRAFT or READY_TO_SIGN", async () => {
      for (const status of conventionStatuses) {
        // eslint-disable-next-line jest/no-if
        if (status === "DRAFT" || status === "READY_TO_SIGN") {
          continue;
        }
        await expectPromiseToFailWithError(
          addConvention.execute({
            ...validConventionParams,
            status,
          }),
          new ForbiddenError(),
        );
      }
    });
  });

  describe("SIRET validation", () => {
    const sireRawEstablishmentBuilder = new SirenApiRawEstablishmentBuilder()
      .withSiret(validConventionParams.siret)
      .withNafDto({ code: "78.3Z", nomenclature: "Ref2" });

    const sirenRawInactiveEstablishment = sireRawEstablishmentBuilder
      .withBusinessName("INACTIVE BUSINESS")
      .withIsActive(false)
      .build();

    const sirenRawActiveEstablishment = sireRawEstablishmentBuilder
      .withBusinessName("Active BUSINESS")
      .withIsActive(true)
      .build();

    describe("if feature flag to do siret validation is OFF", () => {
      it("accepts applications with SIRETs that don't correspond to active businesses", async () => {
        uowPerformer.setUow({
          featureFlagRepository: new InMemoryFeatureFlagRepository({
            enableInseeApi: false,
          }),
        });
        sirenGateway.setRawEstablishment(sirenRawInactiveEstablishment);

        expect(await addConvention.execute(validConventionParams)).toEqual({
          id: validConventionParams.id,
        });
      });
    });

    it("rejects applications with SIRETs that don't correspond to active businesses", async () => {
      sirenGateway.setRawEstablishment(sirenRawInactiveEstablishment);

      await expectPromiseToFailWithError(
        addConvention.execute(validConventionParams),
        new BadRequestError(
          `Ce SIRET (${validConventionParams.siret}) n'est pas attribué ou correspond à un établissement fermé. Veuillez le corriger.`,
        ),
      );
    });

    it("accepts applications with SIRETs that  correspond to active businesses", async () => {
      sirenGateway.setRawEstablishment(sirenRawActiveEstablishment);

      expect(await addConvention.execute(validConventionParams)).toEqual({
        id: validConventionParams.id,
      });
    });

    it("Throws errors when the SIRET endpoint throws erorrs", async () => {
      const error = new Error("test error");
      sirenGateway.setError(error);

      await expectPromiseToFailWithError(
        addConvention.execute(validConventionParams),
        new Error("Le service Sirene API n'est pas disponible"),
      );
    });
  });

  const expectDomainEventsToBeInOutbox = (expected: DomainEvent[]) => {
    expect(outboxRepository.events).toEqual(expected);
  };
});
