import {
  ConventionDto,
  ConventionDtoBuilder,
  expectPromiseToFailWithError,
  expectToEqual,
  frontRoutes,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../../adapters/primary/config/uowConfig";
import { InMemoryEmailGateway } from "../../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import {
  missingConventionMessage,
  noSignatoryMessage,
  NotifyLastSigneeThatConventionHasBeenSigned,
} from "./NotifyLastSigneeThatConventionHasBeenSigned";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { fakeGenerateMagicLinkUrlFn } from "../../../../_testBuilders/fakeGenerateMagicLinkUrlFn";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";

describe("NotifyLastSigneeThatConventionHasBeenSigned", () => {
  let conventionSignedByNoOne: ConventionDto;
  let emailGw: InMemoryEmailGateway;
  let usecase: NotifyLastSigneeThatConventionHasBeenSigned;
  let uow: InMemoryUnitOfWork;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    conventionSignedByNoOne = new ConventionDtoBuilder()
      .signedByBeneficiary(undefined)
      .signedByEstablishmentRepresentative(undefined)
      .build();
    emailGw = new InMemoryEmailGateway();
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    usecase = new NotifyLastSigneeThatConventionHasBeenSigned(
      new InMemoryUowPerformer(uow),
      emailGw,
      fakeGenerateMagicLinkUrlFn,
      timeGateway,
    );
  });

  it("Last signed by beneficiary, no more signees", async () => {
    const signedConvention = new ConventionDtoBuilder(conventionSignedByNoOne)
      .signedByBeneficiary(new Date().toISOString())
      .build();
    const now = new Date();
    timeGateway.setNextDate(now);

    uow.conventionRepository._conventions = {
      [signedConvention.id]: signedConvention,
    };

    await usecase.execute(signedConvention);
    const conventionStatusLink = fakeGenerateMagicLinkUrlFn({
      targetRoute: frontRoutes.conventionStatusDashboard,
      id: signedConvention.id,
      role: "beneficiary",
      email: signedConvention.signatories.beneficiary.email,
      now,
    });

    expectToEqual(emailGw.getSentEmails(), [
      {
        params: {
          internshipKind: signedConvention.internshipKind,
          demandeId: signedConvention.id,
          signedAt: signedConvention.signatories.beneficiary.signedAt!,
          conventionStatusLink,
        },
        recipients: [signedConvention.signatories.beneficiary.email],
        type: "SIGNEE_HAS_SIGNED_CONVENTION",
      },
    ]);
  });

  it("Last signed by establishment representative, beneficiary already signed", async () => {
    const signedConvention = new ConventionDtoBuilder(conventionSignedByNoOne)
      .signedByBeneficiary(new Date().toISOString())
      .signedByEstablishmentRepresentative(new Date().toISOString())
      .build();
    const now = new Date();
    timeGateway.setNextDate(now);
    uow.conventionRepository._conventions = {
      [signedConvention.id]: signedConvention,
    };

    await usecase.execute(signedConvention);

    expectToEqual(emailGw.getSentEmails(), [
      {
        params: {
          internshipKind: signedConvention.internshipKind,
          signedAt:
            signedConvention.signatories.establishmentRepresentative.signedAt!,
          demandeId: signedConvention.id,
          conventionStatusLink: fakeGenerateMagicLinkUrlFn({
            targetRoute: frontRoutes.conventionStatusDashboard,
            id: signedConvention.id,
            role: "establishment-representative",
            email:
              signedConvention.signatories.establishmentRepresentative.email,
            now,
          }),
        },
        recipients: [
          signedConvention.signatories.establishmentRepresentative.email,
        ],
        type: "SIGNEE_HAS_SIGNED_CONVENTION",
      },
    ]);
  });

  it("No one has signed the convention.", async () => {
    uow.conventionRepository._conventions = {
      [conventionSignedByNoOne.id]: conventionSignedByNoOne,
    };

    await expectPromiseToFailWithError(
      usecase.execute(conventionSignedByNoOne),
      new Error(noSignatoryMessage(conventionSignedByNoOne)),
    );

    expectToEqual(emailGw.getSentEmails(), []);
  });

  it("No convention on repository.", async () => {
    uow.conventionRepository._conventions = {};

    await expectPromiseToFailWithError(
      usecase.execute(conventionSignedByNoOne),
      new Error(missingConventionMessage(conventionSignedByNoOne)),
    );

    expectToEqual(emailGw.getSentEmails(), []);
  });
});
