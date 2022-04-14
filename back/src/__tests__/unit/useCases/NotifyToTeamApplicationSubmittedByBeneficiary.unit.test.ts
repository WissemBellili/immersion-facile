import { parseISO } from "date-fns";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryEmailGateway } from "../../../adapters/secondary/InMemoryEmailGateway";
import { NotifyToTeamApplicationSubmittedByBeneficiary } from "../../../domain/immersionApplication/useCases/notifications/NotifyToTeamApplicationSubmittedByBeneficiary";
import { frontRoutes } from "../../../shared/routes";
import { AgencyConfigBuilder } from "../../../_testBuilders/AgencyConfigBuilder";
import { expectEmailAdminNotificationMatchingImmersionApplication } from "../../../_testBuilders/emailAssertions";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { fakeGenerateMagicLinkUrlFn } from "../../../_testBuilders/test.helpers";
import { AgencyConfig } from "../../../shared/agency/agency.dto";

const adminEmail = "admin@email.fr";
const validImmersionApplication = new ImmersionApplicationDtoBuilder().build();

const defaultAgencyConfig = AgencyConfigBuilder.create(
  validImmersionApplication.agencyId,
)
  .withName("test-agency-name")
  .build();

describe("NotifyToTeamApplicationSubmittedByBeneficiary", () => {
  let emailGw: InMemoryEmailGateway;
  let agencyConfig: AgencyConfig;

  beforeEach(() => {
    agencyConfig = defaultAgencyConfig;
    emailGw = new InMemoryEmailGateway();
  });

  const createUseCase = () =>
    new NotifyToTeamApplicationSubmittedByBeneficiary(
      emailGw,
      new InMemoryAgencyRepository([agencyConfig]),
      fakeGenerateMagicLinkUrlFn,
    );

  it("Sends no mail when contact Email is not set", async () => {
    await createUseCase().execute(validImmersionApplication);
    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(0);
  });

  it("Sends admin notification email to immersion facile team when contact Email is set", async () => {
    agencyConfig = new AgencyConfigBuilder(defaultAgencyConfig)
      .withAdminEmails([adminEmail])
      .build();

    await createUseCase().execute(validImmersionApplication);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(1);

    expectEmailAdminNotificationMatchingImmersionApplication(sentEmails[0], {
      recipient: adminEmail,
      immersionApplication: {
        ...validImmersionApplication,
        dateStart: parseISO(
          validImmersionApplication.dateStart,
        ).toLocaleDateString("fr"),
        dateEnd: parseISO(validImmersionApplication.dateEnd).toLocaleDateString(
          "fr",
        ),
      },
      magicLink: fakeGenerateMagicLinkUrlFn(
        validImmersionApplication.id,
        "admin",
        frontRoutes.immersionApplicationsToValidate,
        "admin@if.fr",
      ),
      agencyConfig,
    });
  });
});
