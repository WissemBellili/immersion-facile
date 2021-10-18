import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { AgencyConfig } from "../../../domain/immersionApplication/ports/AgencyRepository";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";
import { AgencyConfigBuilder } from "../../../_testBuilders/AgencyConfigBuilder";
import { expectNotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../../_testBuilders/emailAssertions";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";

const rejectedDemandeImmersion = new ImmersionApplicationDtoBuilder()
  .withStatus("REJECTED")
  .withRejectionJustification("test-rejection-justification")
  .build();
const counsellorEmails = ["counsellor1@email.fr", "counsellor2@email.fr"];
const signature = "test-signature";

const defaultAgencyConfig = AgencyConfigBuilder.empty()
  .withId(rejectedDemandeImmersion.agencyCode)
  .withName("test-agency-name")
  .withCounsellorEmails(counsellorEmails)
  .withSignature(signature)
  .build();

describe("NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected", () => {
  let emailGw: InMemoryEmailGateway;
  let allowList: string[];
  let agencyConfig: AgencyConfig;

  beforeEach(() => {
    agencyConfig = defaultAgencyConfig;
    emailGw = new InMemoryEmailGateway();
  });

  const createUseCase = () => {
    return new NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
      emailGw,
      new Set(allowList),
      new InMemoryAgencyRepository({ [agencyConfig.id]: agencyConfig }),
    );
  };

  describe("When email allowList is not enforced (i.e. allowUnrestrictedEmailSending is true)", () => {
    beforeEach(() => {
      allowList = [];
      agencyConfig = new AgencyConfigBuilder(defaultAgencyConfig)
        .allowUnrestrictedEmailSending()
        .build();
    });

    test("Sends rejection email to beneficiary, mentor, and counsellor", async () => {
      createUseCase().execute(rejectedDemandeImmersion);

      const sentEmails = await emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      expectNotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
        sentEmails[0],
        [
          rejectedDemandeImmersion.email,
          rejectedDemandeImmersion.mentorEmail,
          ...counsellorEmails,
        ],
        rejectedDemandeImmersion,
        agencyConfig,
      );
    });
  });

  describe("When email allowList is enforced", () => {
    beforeEach(() => {
      agencyConfig = new AgencyConfigBuilder(defaultAgencyConfig)
        .allowUnrestrictedEmailSending(false)
        .build();
    });

    test("Sends no emails when allowList is empty", async () => {
      createUseCase().execute(rejectedDemandeImmersion);

      const sentEmails = await emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(0);
    });

    test("Sends rejection email to beneficiary, mentor, and counsellor when on allowList", async () => {
      allowList = [
        rejectedDemandeImmersion.email,
        rejectedDemandeImmersion.mentorEmail,
        ...counsellorEmails,
      ];

      createUseCase().execute(rejectedDemandeImmersion);

      const sentEmails = await emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      expectNotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
        sentEmails[0],
        [
          rejectedDemandeImmersion.email,
          rejectedDemandeImmersion.mentorEmail,
          ...counsellorEmails,
        ],
        rejectedDemandeImmersion,
        agencyConfig,
      );
    });
  });
});
