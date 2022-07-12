import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { AgencyDto } from "shared/src/agency/agency.dto";
import { NotifyNewApplicationNeedsReview } from "../../../domain/convention/useCases/notifications/NotifyNewApplicationNeedsReview";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { AgencyDtoBuilder } from "../../../../../shared/src/agency/AgencyDtoBuilder";
import { expectedEmailConventionReviewMatchingConvention } from "../../../_testBuilders/emailAssertions";
import { ConventionDtoBuilder } from "../../../../../shared/src/convention/ConventionDtoBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../../_testBuilders/test.helpers";
import { frontRoutes } from "shared/src/routes";

const defaultConvention = new ConventionDtoBuilder().build();
const defaultAgency = AgencyDtoBuilder.create(
  defaultConvention.agencyId,
).build();

describe("NotifyImmersionApplicationNeedsReview", () => {
  let validConvention: ConventionDto;
  let emailGw: InMemoryEmailGateway;
  let agency: AgencyDto;

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    validConvention = defaultConvention;
    agency = defaultAgency;
  });

  const createUseCase = () => {
    const inMemoryAgencyRepository = new InMemoryAgencyRepository([agency]);
    return new NotifyNewApplicationNeedsReview(
      emailGw,
      inMemoryAgencyRepository,
      fakeGenerateMagicLinkUrlFn,
    );
  };

  describe("When application status is IN_REVIEW", () => {
    beforeEach(() => {
      validConvention = new ConventionDtoBuilder(defaultConvention)
        .withStatus("IN_REVIEW")
        .build();
    });

    it("Nominal case: Sends notification email to councellor, with 2 existing councellors", async () => {
      const counsellorEmails = [
        "aCouncellor@unmail.com",
        "anotherCouncellor@unmail.com",
      ];
      agency = new AgencyDtoBuilder(defaultAgency)
        .withCounsellorEmails(counsellorEmails)
        .build();
      await createUseCase().execute(validConvention);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(2);

      for (let i = 0; i < 2; i++) {
        const email = counsellorEmails[i];
        expectedEmailConventionReviewMatchingConvention(
          sentEmails[i],
          email,
          agency,
          validConvention,
          fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "counsellor",
            targetRoute: frontRoutes.conventionToValidate,
            email,
          }),
          "en vérifier l'éligibilité",
        );
      }
    });

    it("No counsellors available: we fall back to validators: Sends notification email to those validators (using 2 of them)", async () => {
      const validatorEmails = [
        "aValidator@unmail.com",
        "anotherValidator@unmail.com",
      ];
      agency = new AgencyDtoBuilder(defaultAgency)
        .withValidatorEmails(validatorEmails)
        .build();
      await createUseCase().execute(validConvention);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(2);

      for (let i = 0; i < 2; i++) {
        const email = validatorEmails[i];
        expectedEmailConventionReviewMatchingConvention(
          sentEmails[i],
          email,
          agency,
          validConvention,
          fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "validator",
            targetRoute: frontRoutes.conventionToValidate,
            email,
          }),
          "en considérer la validation",
        );
      }
    });

    it("No counsellors available, neither validators => ensure no mail is sent", async () => {
      await createUseCase().execute(validConvention);
      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });

    it("No counsellors available, neither validators, still we got admins => ensure no mail is sent", async () => {
      const adminEmail = ["aValidator@unmail.com"];
      agency = new AgencyDtoBuilder(defaultAgency)
        .withAdminEmails(adminEmail)
        .build();
      await createUseCase().execute(validConvention);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });
  });

  describe("When application status is ACCEPTED_BY_COUNSELLOR", () => {
    beforeEach(() => {
      validConvention = new ConventionDtoBuilder(defaultConvention)
        .withStatus("ACCEPTED_BY_COUNSELLOR")
        .build();
    });

    it("Nominal case: Sends notification email to validators", async () => {
      const validatorEmails = [
        "aValidator@unmail.com",
        "anotherValidator@unmail.com",
      ];
      agency = new AgencyDtoBuilder(defaultAgency)
        .withValidatorEmails(validatorEmails)
        .build();
      await createUseCase().execute(validConvention);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(2);

      for (let i = 0; i < 2; i++) {
        const email = validatorEmails[i];
        expectedEmailConventionReviewMatchingConvention(
          sentEmails[i],
          email,
          agency,
          validConvention,
          fakeGenerateMagicLinkUrlFn({
            id: validConvention.id,
            role: "validator",
            targetRoute: frontRoutes.conventionToValidate,
            email,
          }),
          "en considérer la validation",
        );
      }
    });

    it("No validators available => ensure no mail is sent", async () => {
      await createUseCase().execute(validConvention);
      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });

    it("No validators available, still we got admins => ensure no mail is sent", async () => {
      const adminEmail = ["anAdmin@unmail.com"];
      agency = new AgencyDtoBuilder(defaultAgency)
        .withAdminEmails(adminEmail)
        .build();
      await createUseCase().execute(validConvention);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });
  });

  describe("When status is ACCEPTED_BY_VALIDATOR", () => {
    beforeEach(() => {
      validConvention = new ConventionDtoBuilder()
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .build();
    });

    it("Nominal case: Sends notification email to admins", async () => {
      const adminEmail = "anAdmin@unmail.com";
      agency = new AgencyDtoBuilder(defaultAgency)
        .withAdminEmails([adminEmail])
        .build();
      await createUseCase().execute(validConvention);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      expectedEmailConventionReviewMatchingConvention(
        sentEmails[0],
        adminEmail,
        agency,
        validConvention,
        fakeGenerateMagicLinkUrlFn({
          id: validConvention.id,
          role: "admin",
          targetRoute: frontRoutes.conventionToValidate,
          email: adminEmail,
        }),
        "en considérer la validation",
      );
    });

    it("No admin available => ensure no mail is sent", async () => {
      await createUseCase().execute(validConvention);
      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });
  });
});
