import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { Agency } from "shared/src/agency/agency.dto";
import { NotifyNewApplicationNeedsReview } from "../../../domain/immersionApplication/useCases/notifications/NotifyNewApplicationNeedsReview";
import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { AgencyBuilder } from "../../../../../shared/src/agency/AgencyBuilder";
import { expectedEmailImmersionApplicationReviewMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import { ImmersionApplicationDtoBuilder } from "../../../../../shared/src/ImmersionApplication/ImmersionApplicationDtoBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../../_testBuilders/test.helpers";
import { frontRoutes } from "shared/src/routes";

const defaultImmersionApplication =
  new ImmersionApplicationDtoBuilder().build();
const defaultAgency = AgencyBuilder.create(
  defaultImmersionApplication.agencyId,
).build();

describe("NotifyImmersionApplicationNeedsReview", () => {
  let validImmersionApplication: ImmersionApplicationDto;
  let emailGw: InMemoryEmailGateway;
  let agency: Agency;

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    validImmersionApplication = defaultImmersionApplication;
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
      validImmersionApplication = new ImmersionApplicationDtoBuilder(
        defaultImmersionApplication,
      )
        .withStatus("IN_REVIEW")
        .build();
    });

    it("Nominal case: Sends notification email to councellor, with 2 existing councellors", async () => {
      const counsellorEmails = [
        "aCouncellor@unmail.com",
        "anotherCouncellor@unmail.com",
      ];
      agency = new AgencyBuilder(defaultAgency)
        .withCounsellorEmails(counsellorEmails)
        .build();
      await createUseCase().execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(2);

      for (let i = 0; i < 2; i++) {
        const email = counsellorEmails[i];
        expectedEmailImmersionApplicationReviewMatchingImmersionApplication(
          sentEmails[i],
          email,
          agency,
          validImmersionApplication,
          fakeGenerateMagicLinkUrlFn(
            validImmersionApplication.id,
            "counsellor",
            frontRoutes.immersionApplicationsToValidate,
            email,
          ),
          "en vérifier l'éligibilité",
        );
      }
    });

    it("No counsellors available: we fall back to validators: Sends notification email to those validators (using 2 of them)", async () => {
      const validatorEmails = [
        "aValidator@unmail.com",
        "anotherValidator@unmail.com",
      ];
      agency = new AgencyBuilder(defaultAgency)
        .withValidatorEmails(validatorEmails)
        .build();
      await createUseCase().execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(2);

      for (let i = 0; i < 2; i++) {
        const email = validatorEmails[i];
        expectedEmailImmersionApplicationReviewMatchingImmersionApplication(
          sentEmails[i],
          email,
          agency,
          validImmersionApplication,
          fakeGenerateMagicLinkUrlFn(
            validImmersionApplication.id,
            "validator",
            frontRoutes.immersionApplicationsToValidate,
            email,
          ),
          "en considérer la validation",
        );
      }
    });

    it("No counsellors available, neither validators => ensure no mail is sent", async () => {
      await createUseCase().execute(validImmersionApplication);
      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });

    it("No counsellors available, neither validators, still we got admins => ensure no mail is sent", async () => {
      const adminEmail = ["aValidator@unmail.com"];
      agency = new AgencyBuilder(defaultAgency)
        .withAdminEmails(adminEmail)
        .build();
      await createUseCase().execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });
  });

  describe("When application status is ACCEPTED_BY_COUNSELLOR", () => {
    beforeEach(() => {
      validImmersionApplication = new ImmersionApplicationDtoBuilder(
        defaultImmersionApplication,
      )
        .withStatus("ACCEPTED_BY_COUNSELLOR")
        .build();
    });

    it("Nominal case: Sends notification email to validators", async () => {
      const validatorEmails = [
        "aValidator@unmail.com",
        "anotherValidator@unmail.com",
      ];
      agency = new AgencyBuilder(defaultAgency)
        .withValidatorEmails(validatorEmails)
        .build();
      await createUseCase().execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(2);

      for (let i = 0; i < 2; i++) {
        const email = validatorEmails[i];
        expectedEmailImmersionApplicationReviewMatchingImmersionApplication(
          sentEmails[i],
          email,
          agency,
          validImmersionApplication,
          fakeGenerateMagicLinkUrlFn(
            validImmersionApplication.id,
            "validator",
            frontRoutes.immersionApplicationsToValidate,
            email,
          ),
          "en considérer la validation",
        );
      }
    });

    it("No validators available => ensure no mail is sent", async () => {
      await createUseCase().execute(validImmersionApplication);
      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });

    it("No validators available, still we got admins => ensure no mail is sent", async () => {
      const adminEmail = ["anAdmin@unmail.com"];
      agency = new AgencyBuilder(defaultAgency)
        .withAdminEmails(adminEmail)
        .build();
      await createUseCase().execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });
  });

  describe("When status is ACCEPTED_BY_VALIDATOR", () => {
    beforeEach(() => {
      validImmersionApplication = new ImmersionApplicationDtoBuilder()
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .build();
    });

    it("Nominal case: Sends notification email to admins", async () => {
      const adminEmail = "anAdmin@unmail.com";
      agency = new AgencyBuilder(defaultAgency)
        .withAdminEmails([adminEmail])
        .build();
      await createUseCase().execute(validImmersionApplication);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      expectedEmailImmersionApplicationReviewMatchingImmersionApplication(
        sentEmails[0],
        adminEmail,
        agency,
        validImmersionApplication,
        fakeGenerateMagicLinkUrlFn(
          validImmersionApplication.id,
          "admin",
          frontRoutes.immersionApplicationsToValidate,
          adminEmail,
        ),
        "en considérer la validation",
      );
    });

    it("No admin available => ensure no mail is sent", async () => {
      await createUseCase().execute(validImmersionApplication);
      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });
  });
});
