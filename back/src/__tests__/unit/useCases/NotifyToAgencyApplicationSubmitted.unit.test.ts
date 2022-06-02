import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { AlwaysAllowEmailFilter } from "../../../adapters/secondary/core/EmailFilterImplementations";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { NewConventionAdminNotificationParams } from "../../../domain/convention/ports/EmailGateway";
import { frontRoutes } from "shared/src/routes";
import { OmitFromExistingKeys } from "shared/src/utils";
import { AgencyDtoBuilder } from "../../../../../shared/src/agency/AgencyDtoBuilder";
import { ConventionDtoBuilder } from "../../../../../shared/src/convention/ConventionDtoBuilder";
import {
  expectTypeToMatchAndEqual,
  fakeGenerateMagicLinkUrlFn,
} from "../../../_testBuilders/test.helpers";
import { NotifyToAgencyApplicationSubmitted } from "../../../domain/convention/useCases/notifications/NotifyToAgencyApplicationSubmitted";

const councellorEmail = "councellor@email.fr";
const councellorEmail2 = "councellor2@email.fr";
const validatorEmail = "validator@mail.com";

const agencyWithCounsellors = AgencyDtoBuilder.create("agency-with-councellors")
  .withCounsellorEmails([councellorEmail, councellorEmail2])
  .withName("test-agency-name")
  .build();

const agencyWithOnlyValidator = AgencyDtoBuilder.create(
  "agency-with-only-validator",
)
  .withValidatorEmails([validatorEmail])
  .withName("test-agency-name")
  .build();

describe("NotifyToAgencyApplicationSubmitted", () => {
  let emailGateway: InMemoryEmailGateway;
  let agencyRepository: InMemoryAgencyRepository;
  let notifyToAgencyApplicationSubmitted: NotifyToAgencyApplicationSubmitted;

  beforeEach(() => {
    emailGateway = new InMemoryEmailGateway();
    const emailFilter = new AlwaysAllowEmailFilter();
    agencyRepository = new InMemoryAgencyRepository();
    agencyRepository.setAgencies([
      agencyWithCounsellors,
      agencyWithOnlyValidator,
    ]);

    const uowPerformer = new InMemoryUowPerformer({
      ...createInMemoryUow(),
      agencyRepo: agencyRepository,
    });

    notifyToAgencyApplicationSubmitted = new NotifyToAgencyApplicationSubmitted(
      uowPerformer,
      emailFilter,
      emailGateway,
      fakeGenerateMagicLinkUrlFn,
    );
  });

  it("Sends notification email to agency counsellor when it is initially submitted", async () => {
    const validConvention = new ConventionDtoBuilder()
      .withAgencyId(agencyWithCounsellors.id)
      .build();
    await notifyToAgencyApplicationSubmitted.execute(validConvention);

    const sentEmails = emailGateway.getSentEmails();

    const expectedParams: OmitFromExistingKeys<
      NewConventionAdminNotificationParams,
      "magicLink"
    > = {
      agencyName: agencyWithCounsellors.name,
      businessName: validConvention.businessName,
      dateEnd: validConvention.dateEnd,
      dateStart: validConvention.dateStart,
      demandeId: validConvention.id,
      firstName: validConvention.firstName,
      lastName: validConvention.lastName,
    };

    expectTypeToMatchAndEqual(sentEmails, [
      {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients: [councellorEmail],
        cc: [],
        params: {
          ...expectedParams,
          magicLink: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "counsellor",
            targetRoute: frontRoutes.conventionToValidate,
            email: councellorEmail2,
          }),
        },
      },
      {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients: [councellorEmail2],
        cc: [],
        params: {
          ...expectedParams,
          magicLink: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "counsellor",
            targetRoute: frontRoutes.conventionToValidate,
            email: councellorEmail2,
          }),
        },
      },
    ]);
  });

  it("Sends notification email to agency validator when it is initially submitted, and agency has no counsellor", async () => {
    const validConvention = new ConventionDtoBuilder()
      .withAgencyId(agencyWithOnlyValidator.id)
      .build();

    await notifyToAgencyApplicationSubmitted.execute(validConvention);

    const sentEmails = emailGateway.getSentEmails();

    const expectedParams: OmitFromExistingKeys<
      NewConventionAdminNotificationParams,
      "magicLink"
    > = {
      agencyName: agencyWithCounsellors.name,
      businessName: validConvention.businessName,
      dateEnd: validConvention.dateEnd,
      dateStart: validConvention.dateStart,
      demandeId: validConvention.id,
      firstName: validConvention.firstName,
      lastName: validConvention.lastName,
    };

    expectTypeToMatchAndEqual(sentEmails, [
      {
        type: "NEW_CONVENTION_AGENCY_NOTIFICATION",
        recipients: [validatorEmail],
        cc: [],
        params: {
          ...expectedParams,
          magicLink: fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "validator",
            targetRoute: frontRoutes.conventionToValidate,
            email: validatorEmail,
          }),
        },
      },
    ]);
  });
});
