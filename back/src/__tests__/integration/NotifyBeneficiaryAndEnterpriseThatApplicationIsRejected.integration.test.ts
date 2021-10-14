import { InMemoryAgencyRepository } from "../../adapters/secondary/InMemoryAgencyRepository";
import { SendinblueEmailGateway } from "../../adapters/secondary/SendinblueEmailGateway";
import { NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected } from "../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected";
import { applicationStatusFromString } from "../../shared/ImmersionApplicationDto";
import { AgencyConfigBuilder } from "../../_testBuilders/AgencyConfigBuilder";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { AgencyRepository } from "./../../domain/immersionApplication/ports/AgencyRepository";

const validDemandeImmersion = new ImmersionApplicationDtoBuilder()
  .withEmail("jean-francois.macresy@beta.gouv.fr")
  .withMentorEmail("jean-francois.macresy+mentor@beta.gouv.fr")
  .build();
const counsellorEmail = "jean-francois.macresy@beta.gouv.fr";

describe("NotifyApplicationRejectedToBeneficiaryAndEnterprise", () => {
  let emailGw: SendinblueEmailGateway;
  let allowList: Set<string>;
  let agencyRepository: AgencyRepository;
  let notifyBeneficiaryAndEnterpriseThatApplicationIsRejected: NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected;
  const rejectionJustification = "Risque d'emploi de main d'oeuvre gratuite";

  beforeEach(() => {
    if (!process.env.SENDINBLUE_API_KEY) {
      throw new Error(
        "Test requires a valid SENDINBLUE_API_KEY environment variable.",
      );
    }
    emailGw = SendinblueEmailGateway.create(process.env.SENDINBLUE_API_KEY);
    agencyRepository = new InMemoryAgencyRepository({
      [validDemandeImmersion.agencyCode]: AgencyConfigBuilder.empty()
        .withCounsellorEmails([counsellorEmail])
        .build(),
    });
    allowList = new Set();
    notifyBeneficiaryAndEnterpriseThatApplicationIsRejected =
      new NotifyBeneficiaryAndEnterpriseThatApplicationIsRejected(
        emailGw,
        allowList,
        agencyRepository,
      );
    validDemandeImmersion.status = applicationStatusFromString("REJECTED");
    validDemandeImmersion.rejectionJustification = rejectionJustification;
  });

  test.skip("Sends rejection email", async () => {
    validDemandeImmersion.mentorEmail = "jeanfrancois.macresy@gmail.com";
    validDemandeImmersion.email = "jeanfrancois.macresy+beneficiary@gmail.com";

    allowList.add(validDemandeImmersion.mentorEmail);
    allowList.add(validDemandeImmersion.email);
    allowList.add(counsellorEmail);

    await notifyBeneficiaryAndEnterpriseThatApplicationIsRejected.execute(
      validDemandeImmersion,
    );
  });
});
