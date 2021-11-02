import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { EmailFilter } from "../../../domain/core/ports/EmailFilter";
import { AgencyConfig } from "../../../domain/immersionApplication/ports/AgencyRepository";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";
import { AgencyConfigBuilder } from "../../../_testBuilders/AgencyConfigBuilder";
import { expectNotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../../_testBuilders/emailAssertions";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import {
  AllowListEmailFilter,
  AlwaysAllowEmailFilter,
} from "./../../../adapters/secondary/core/EmailFilterImplementations";

const rejectedDemandeImmersion = new ImmersionApplicationDtoBuilder()
  .withStatus("REJECTED")
  .withRejectionJustification("test-rejection-justification")
  .build();
const counsellorEmails = ["counsellor1@email.fr", "counsellor2@email.fr"];
const signature = "test-signature";

const defaultAgencyConfig = AgencyConfigBuilder.create(
  rejectedDemandeImmersion.agencyCode,
)
  .withName("test-agency-name")
  .withCounsellorEmails(counsellorEmails)
  .withSignature(signature)
  .build();

describe("NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected", () => {
  let emailGw: InMemoryEmailGateway;
  let emailFilter: EmailFilter;
  let agencyConfig: AgencyConfig;

  beforeEach(() => {
    emailFilter = new AlwaysAllowEmailFilter();
    agencyConfig = defaultAgencyConfig;
    emailGw = new InMemoryEmailGateway();
  });

  const createUseCase = () => {
    return new NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
      emailFilter,
      emailGw,
      new InMemoryAgencyRepository([agencyConfig]),
    );
  };

  test("Sends rejection email to beneficiary, mentor, and counsellor", async () => {
    await createUseCase().execute(rejectedDemandeImmersion);

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

  test("Sends no emails when allowList is enforced and empty", async () => {
    emailFilter = new AllowListEmailFilter([]);
    await createUseCase().execute(rejectedDemandeImmersion);

    const sentEmails = await emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(0);
  });

  test("Sends rejection email to beneficiary, mentor, and counsellor when on allowList", async () => {
    emailFilter = new AllowListEmailFilter([
      rejectedDemandeImmersion.email,
      rejectedDemandeImmersion.mentorEmail,
      ...counsellorEmails,
    ]);

    await createUseCase().execute(rejectedDemandeImmersion);

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
