import { allConventionStatuses, ConventionDtoBuilder } from "shared";
import { StubGetSiret } from "../../../_testBuilders/StubGetSiret";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { InMemoryFeatureFlagRepository } from "../../../adapters/secondary/InMemoryFeatureFlagRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { AddConvention } from "../../../domain/convention/useCases/AddConvention";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../domain/core/eventBus/EventBus";
import { DomainEvent } from "../../../domain/core/eventBus/events";

describe("Add Convention", () => {
  let addConvention: AddConvention;
  let conventionRepository: InMemoryConventionRepository;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;
  let createNewEvent: CreateNewEvent;
  let outboxRepository: InMemoryOutboxRepository;
  const validConvention = new ConventionDtoBuilder().build();
  const { externalId, ...validConventionParams } = validConvention;

  let stubGetSiret: StubGetSiret;
  let uowPerformer: InMemoryUowPerformer;

  beforeEach(() => {
    const uow = createInMemoryUow();
    conventionRepository = uow.conventionRepository;
    outboxRepository = uow.outboxRepository;
    uow.featureFlagRepository = new InMemoryFeatureFlagRepository({
      enableAdminUi: false,
      enableInseeApi: true,
    });
    clock = new CustomClock();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });
    stubGetSiret = new StubGetSiret();
    uowPerformer = new InMemoryUowPerformer(uow);
    addConvention = new AddConvention(
      uowPerformer,
      createNewEvent,
      stubGetSiret,
    );
  });

  it("saves valid applications in the repository", async () => {
    const occurredAt = new Date("2021-10-15T15:00");
    const id = "eventId";
    clock.setNextDate(occurredAt);
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
      for (const status of allConventionStatuses) {
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
    describe("if feature flag to do siret validation is OFF", () => {
      it("accepts applications with SIRETs that don't correspond to active businesses", async () => {
        uowPerformer.setUow({
          featureFlagRepository: new InMemoryFeatureFlagRepository({
            enableAdminUi: false,
            enableInseeApi: false,
          }),
        });
        stubGetSiret.setNextResponse({
          siret: validConventionParams.siret,
          businessName: "INACTIVE BUSINESS",
          businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
          naf: { code: "78.3Z", nomenclature: "Ref2" },
          isOpen: false,
        });

        expect(await addConvention.execute(validConventionParams)).toEqual({
          id: validConventionParams.id,
        });
      });
    });

    it("rejects applications with SIRETs that don't correspond to active businesses", async () => {
      stubGetSiret.setNextResponse({
        siret: validConventionParams.siret,
        businessName: "INACTIVE BUSINESS",
        businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
        naf: { code: "78.3Z", nomenclature: "Ref2" },
        isOpen: false,
      });

      await expectPromiseToFailWithError(
        addConvention.execute(validConventionParams),
        new BadRequestError(
          `Ce SIRET (${validConventionParams.siret}) n'est pas attribué ou correspond à un établissement fermé. Veuillez le corriger.`,
        ),
      );
    });

    it("accepts applications with SIRETs that  correspond to active businesses", async () => {
      stubGetSiret.setNextResponse({
        siret: validConventionParams.siret,
        businessName: "ACTIVE BUSINESS",
        businessAddress: "20 AVENUE DE SEGUR 75007 PARIS 7",
        naf: { code: "78.3Z", nomenclature: "Ref2" },
        isOpen: true,
      });

      expect(await addConvention.execute(validConventionParams)).toEqual({
        id: validConventionParams.id,
      });
    });

    it("Throws errors when the SIRET endpoint throws erorrs", async () => {
      const error = new Error("test error");
      stubGetSiret.setErrorForNextCall(error);

      await expectPromiseToFailWithError(
        addConvention.execute(validConventionParams),
        error,
      );
    });
  });

  const expectDomainEventsToBeInOutbox = (expected: DomainEvent[]) => {
    expect(outboxRepository.events).toEqual(expected);
  };
});
