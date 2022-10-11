import {
  allConventionStatuses,
  allRoles,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionId,
  ConventionStatus,
  createConventionMagicLinkPayload,
  Role,
} from "shared";
import {
  expectPromiseToFailWithError,
  splitCasesBetweenPassingAndFailing,
} from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxQueries } from "../../../adapters/secondary/core/InMemoryOutboxQueries";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { ConventionRequiresModificationPayload } from "../../../domain/convention/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import { UpdateConventionStatus } from "../../../domain/convention/useCases/UpdateConventionStatus";
import {
  makeCreateNewEvent,
  NarrowEvent,
} from "../../../domain/core/eventBus/EventBus";
import { DomainTopic } from "../../../domain/core/eventBus/events";

type ExtractFromDomainTopics<T extends DomainTopic> = Extract<DomainTopic, T>;

type ConventionDomainTopic = ExtractFromDomainTopics<
  | "ImmersionApplicationSubmittedByBeneficiary"
  | "ImmersionApplicationPartiallySigned"
  | "ImmersionApplicationFullySigned"
  | "ImmersionApplicationAcceptedByCounsellor"
  | "ImmersionApplicationAcceptedByValidator"
  | "ImmersionApplicationRejected"
  | "ImmersionApplicationRequiresModification"
  | "ImmersionApplicationCancelled"
> | null; // null is used to indicate that no domain event should be sent

type SetupInitialStateParams = {
  initialStatus: ConventionStatus;
  alreadySigned?: boolean;
};

export const setupInitialState = async ({
  initialStatus,
  alreadySigned = true,
}: SetupInitialStateParams) => {
  const conventionBuilder = new ConventionDtoBuilder()
    .withStatus(initialStatus)
    .withoutDateValidation();
  const originalConvention = alreadySigned
    ? conventionBuilder.build()
    : conventionBuilder.notSigned().build();

  const uow = createInMemoryUow();
  const conventionRepository = uow.conventionRepository;
  const outboxRepository = uow.outboxRepository;
  const clock = new CustomClock();
  const createNewEvent = makeCreateNewEvent({
    clock,
    uuidGenerator: new TestUuidGenerator(),
  });

  const updateConventionStatus = new UpdateConventionStatus(
    new InMemoryUowPerformer(uow),
    createNewEvent,
    clock,
  );

  await conventionRepository.save(originalConvention);
  return {
    originalConvention,
    updateConventionStatus,
    conventionRepository,
    outboxRepository,
    clock,
  };
};

type ExecuteUseCaseParams = {
  conventionId: ConventionId;
  role: Role;
  email: string;
  targetStatus: ConventionStatus;
  justification?: string;
  updateConventionStatus: UpdateConventionStatus;
  conventionRepository: InMemoryConventionRepository;
};

export const executeUpdateConventionStatusUseCase = async ({
  conventionId,
  role,
  email,
  targetStatus,
  justification,
  updateConventionStatus,
  conventionRepository,
}: ExecuteUseCaseParams): Promise<ConventionDto> => {
  const response = await updateConventionStatus.execute(
    { status: targetStatus, justification },
    createConventionMagicLinkPayload(conventionId, role, email),
  );
  expect(response.id).toEqual(conventionId);
  const storedConvention = await conventionRepository.getById(conventionId);
  return storedConvention;
};

const expectNewEvent = async <T extends DomainTopic>(
  _topic: T,
  expectedEvent: Partial<NarrowEvent<T>>,
  outboxRepository: InMemoryOutboxRepository,
) => {
  const allEvents = await new InMemoryOutboxQueries(
    outboxRepository,
  ).getAllUnpublishedEvents();
  expect(allEvents).toHaveLength(1);
  expect(allEvents[0]).toMatchObject(expectedEvent);
};

type TestAcceptNewStatusParams = {
  role: Role;
  initialStatus: ConventionStatus;
};

export type UpdatedFields = Partial<
  ConventionDto & {
    establishmentRepresentativeSignedAt: string | undefined;
    beneficiarySignedAt: string | undefined;
  }
>;

type TestAcceptExpectation = {
  targetStatus: ConventionStatus;
  expectedDomainTopic: ConventionDomainTopic;
  updatedFields?: UpdatedFields;
  justification?: string;
  nextDate?: Date;
};

const makeTestAcceptsStatusUpdate =
  ({
    targetStatus,
    expectedDomainTopic,
    updatedFields = {},
    justification,
    nextDate,
  }: TestAcceptExpectation) =>
  async ({ role, initialStatus }: TestAcceptNewStatusParams) => {
    const {
      originalConvention,
      updateConventionStatus,
      conventionRepository,
      outboxRepository,
      clock,
    } = await setupInitialState({
      initialStatus,
    });

    if (nextDate) clock.setNextDate(nextDate);

    const storedConvention = await executeUpdateConventionStatusUseCase({
      conventionId: originalConvention.id,
      role,
      email: "test@test.fr",
      targetStatus,
      justification,
      updateConventionStatus,
      conventionRepository,
    });

    const { beneficiary, establishmentRepresentative } =
      originalConvention.signatories;

    const {
      beneficiarySignedAt,
      establishmentRepresentativeSignedAt,
      ...restOfUpdatedFields
    } = updatedFields;

    const hasSignedProperty =
      Object.hasOwn(updatedFields, "beneficiarySignedAt") ||
      Object.hasOwn(updatedFields, "establishementRepresentativeSignedAt");

    const expectedConvention: ConventionDto = {
      ...originalConvention,
      status: targetStatus,
      ...restOfUpdatedFields,
      ...(hasSignedProperty
        ? {
            signatories: {
              beneficiary: {
                ...beneficiary,
                signedAt: beneficiarySignedAt,
              },
              establishmentRepresentative: {
                ...establishmentRepresentative,
                signedAt: establishmentRepresentativeSignedAt,
              },
            },
          }
        : {}),
    };
    expect(storedConvention).toEqual(expectedConvention);

    if (expectedDomainTopic === "ImmersionApplicationRequiresModification") {
      const payload: ConventionRequiresModificationPayload = {
        convention: expectedConvention,
        reason: justification ?? "was not provided",
        roles: ["beneficiary", "establishment"],
      };

      await expectNewEvent(
        expectedDomainTopic,
        {
          topic: "ImmersionApplicationRequiresModification",
          payload,
        },
        outboxRepository,
      );
    } else if (expectedDomainTopic) {
      await expectNewEvent(
        expectedDomainTopic,
        {
          topic: expectedDomainTopic,
          payload: expectedConvention,
        },
        outboxRepository,
      );
    }
  };

type TestRejectsNewStatusParams = {
  role: Role;
  initialStatus: ConventionStatus;
  expectedError: UnauthorizedError | BadRequestError;
};

type TestRejectsExpectation = {
  targetStatus: ConventionStatus;
};

const makeTestRejectsStatusUpdate =
  ({ targetStatus }: TestRejectsExpectation) =>
  async ({
    role,
    initialStatus,
    expectedError,
  }: TestRejectsNewStatusParams) => {
    const { originalConvention, updateConventionStatus, conventionRepository } =
      await setupInitialState({
        initialStatus,
      });
    await expectPromiseToFailWithError(
      executeUpdateConventionStatusUseCase({
        conventionId: originalConvention.id,
        role,
        targetStatus,
        email: "test@test.fr",
        updateConventionStatus,
        conventionRepository,
      }),
      expectedError,
    );
  };

interface TestAllCaseProps {
  targetStatus: ConventionStatus;
  expectedDomainTopic: ConventionDomainTopic;
  updatedFields?: UpdatedFields;
  justification?: string;
  allowedRoles: Role[];
  allowedInitialStatuses: ConventionStatus[];
  nextDate?: Date;
}

export const testForAllRolesAndInitialStatusCases = ({
  allowedRoles,
  expectedDomainTopic,

  updatedFields = {},
  justification,
  allowedInitialStatuses,
  targetStatus,
  nextDate,
}: TestAllCaseProps) => {
  const [allowToRejectRoles, notAllowedToRejectRoles] =
    splitCasesBetweenPassingAndFailing<Role>(allRoles, allowedRoles);

  const [authorizedInitialStatuses, forbiddenInitalStatuses] =
    splitCasesBetweenPassingAndFailing<ConventionStatus>(
      allConventionStatuses,
      allowedInitialStatuses,
    );

  const someValidInitialStatus = authorizedInitialStatuses[0];
  const someValidRole = allowToRejectRoles[0];

  const testAcceptsStatusUpdate = makeTestAcceptsStatusUpdate({
    targetStatus,
    expectedDomainTopic,
    updatedFields,
    justification,
    nextDate,
  });

  const testRejectsStatusUpdate = makeTestRejectsStatusUpdate({
    targetStatus,
  });

  it.each(allowedRoles.map((role) => ({ role })))(
    "Accepted from '$role'",
    ({ role }) =>
      testAcceptsStatusUpdate({
        role,
        initialStatus: someValidInitialStatus,
      }),
  );

  it.each(authorizedInitialStatuses.map((status) => ({ status })))(
    "Accepted from status $status",
    ({ status }) =>
      testAcceptsStatusUpdate({
        role: someValidRole,
        initialStatus: status,
      }),
  );

  if (notAllowedToRejectRoles.length) {
    it.each(notAllowedToRejectRoles.map((role) => ({ role })))(
      "Rejected from '$role'",
      ({ role }) =>
        testRejectsStatusUpdate({
          role,
          initialStatus: someValidInitialStatus,
          expectedError: new ForbiddenError(
            `${role} is not allowed to go to status ${targetStatus}`,
          ),
        }),
    );
  }

  it.each(forbiddenInitalStatuses.map((status) => ({ status })))(
    "Rejected from status $status",
    ({ status }) =>
      testRejectsStatusUpdate({
        role: someValidRole,
        initialStatus: status,
        expectedError: new BadRequestError(
          `Cannot go from status '${status}' to '${targetStatus}'`,
        ),
      }),
  );
};
