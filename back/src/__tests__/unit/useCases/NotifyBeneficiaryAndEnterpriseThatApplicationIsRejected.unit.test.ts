import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { EmailFilter } from "../../../domain/core/ports/EmailFilter";
import { Agency } from "shared/src/agency/agency.dto";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";
import { AgencyBuilder } from "../../../../../shared/src/agency/AgencyBuilder";
import { expectNotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../../_testBuilders/emailAssertions";
import { ImmersionApplicationDtoBuilder } from "../../../../../shared/src/ImmersionApplication/ImmersionApplicationDtoBuilder";
import {
  AllowListEmailFilter,
  AlwaysAllowEmailFilter,
} from "../../../adapters/secondary/core/EmailFilterImplementations";

const rejectedImmersionApplication = new ImmersionApplicationDtoBuilder()
  .withStatus("REJECTED")
  .withRejectionJustification("test-rejection-justification")
  .build();
const counsellorEmails = ["counsellor1@email.fr", "counsellor2@email.fr"];
const signature = "test-signature";

const defaultAgency = AgencyBuilder.create(
  rejectedImmersionApplication.agencyId,
)
  .withName("test-agency-name")
  .withCounsellorEmails(counsellorEmails)
  .withSignature(signature)
  .build();

describe("NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected", () => {
  let emailGw: InMemoryEmailGateway;
  let emailFilter: EmailFilter;
  let agency: Agency;

  beforeEach(() => {
    emailFilter = new AlwaysAllowEmailFilter();
    agency = defaultAgency;
    emailGw = new InMemoryEmailGateway();
  });

  const createUseCase = () =>
    new NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
      emailFilter,
      emailGw,
      new InMemoryAgencyRepository([agency]),
    );

  it("Sends rejection email to beneficiary, mentor, and counsellor", async () => {
    await createUseCase().execute(rejectedImmersionApplication);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectNotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
      sentEmails[0],
      [
        rejectedImmersionApplication.email,
        rejectedImmersionApplication.mentorEmail,
        ...counsellorEmails,
      ],
      rejectedImmersionApplication,
      agency,
    );
  });

  it("Sends no emails when allowList is enforced and empty", async () => {
    emailFilter = new AllowListEmailFilter([]);
    await createUseCase().execute(rejectedImmersionApplication);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(0);
  });

  it("Sends rejection email to beneficiary, mentor, and counsellor when on allowList", async () => {
    emailFilter = new AllowListEmailFilter([
      rejectedImmersionApplication.email,
      rejectedImmersionApplication.mentorEmail,
      ...counsellorEmails,
    ]);

    await createUseCase().execute(rejectedImmersionApplication);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectNotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
      sentEmails[0],
      [
        rejectedImmersionApplication.email,
        rejectedImmersionApplication.mentorEmail,
        ...counsellorEmails,
      ],
      rejectedImmersionApplication,
      agency,
    );
  });
});
