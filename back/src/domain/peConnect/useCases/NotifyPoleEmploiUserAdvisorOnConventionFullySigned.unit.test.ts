import {
  ConventionDto,
  ConventionDtoBuilder,
  frontRoutes,
  expectTypeToMatchAndEqual,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { InMemoryEmailGateway } from "../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { PeUserAndAdvisor } from "../../../domain/peConnect/dto/PeConnect.dto";
import { NotifyPoleEmploiUserAdvisorOnConventionFullySigned } from "../../../domain/peConnect/useCases/NotifyPoleEmploiUserAdvisorOnConventionFullySigned";
import { fakeGenerateMagicLinkUrlFn } from "../../../_testBuilders/fakeGenerateMagicLinkUrlFn";
import { PeConnectImmersionAdvisorDto } from "../dto/PeConnectAdvisor.dto";

describe("NotifyPoleEmploiUserAdvisorOnConventionFullySigned", () => {
  let uow: InMemoryUnitOfWork;
  let emailGateway: InMemoryEmailGateway;
  let usecase: NotifyPoleEmploiUserAdvisorOnConventionFullySigned;

  beforeEach(() => {
    emailGateway = new InMemoryEmailGateway();
    uow = createInMemoryUow();
    usecase = new NotifyPoleEmploiUserAdvisorOnConventionFullySigned(
      new InMemoryUowPerformer(uow),
      emailGateway,
      fakeGenerateMagicLinkUrlFn,
    );
  });

  it("should resolve to undefined if the convention pole emploi OAuth advisor is not found", async () => {
    const conventionDtoFromEvent: ConventionDto = new ConventionDtoBuilder()
      .withId("some-invalid-id")
      .withFederatedIdentity("peConnect:blop")
      .build();

    expect(await usecase.execute(conventionDtoFromEvent)).toBeUndefined();
  });

  it("should send email with the correct params", async () => {
    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity(`peConnect:${userPeExternalId}`)
      .withBeneficiaryFirstName("John")
      .withBeneficiaryLastName("Doe")
      .withBeneficiaryEmail("john.doe@plop.fr")
      .withImmersionAddress("127 Avenue de la République 94800 Villejuif")
      .withDateStart("2022-07-06")
      .withDateEnd("2022-07-30")
      .withBusinessName("Boulangerie Les Echarts")
      .build();

    uow.conventionRepository.setConventions({
      [conventionDtoFromEvent.id]: conventionDtoFromEvent,
    });
    uow.conventionPoleEmploiAdvisorRepository.setConventionPoleEmploiUsersAdvisor(
      [
        {
          peExternalId: userAdvisorDto.user.peExternalId,
          advisor: userAdvisorDto.advisor,
          _entityName: "ConventionPoleEmploiAdvisor",
          conventionId,
        },
      ],
    );

    await usecase.execute(conventionDtoFromEvent);

    expectTypeToMatchAndEqual(emailGateway.getSentEmails(), [
      {
        type: "POLE_EMPLOI_ADVISOR_ON_CONVENTION_FULLY_SIGNED",
        recipients: [advisor.email],
        params: {
          advisorFirstName: advisor.firstName,
          advisorLastName: advisor.lastName,
          immersionAddress: conventionDtoFromEvent.immersionAddress!,
          beneficiaryFirstName:
            conventionDtoFromEvent.signatories.beneficiary.firstName,
          beneficiaryLastName:
            conventionDtoFromEvent.signatories.beneficiary.lastName,
          beneficiaryEmail:
            conventionDtoFromEvent.signatories.beneficiary.email,
          dateStart: conventionDtoFromEvent.dateStart,
          dateEnd: conventionDtoFromEvent.dateEnd,
          businessName: conventionDtoFromEvent.businessName,
          magicLink: fakeGenerateMagicLinkUrlFn({
            id: conventionDtoFromEvent.id,
            role: "validator",
            targetRoute: frontRoutes.conventionToValidate,
            email: advisor.email,
          }),
        },
      },
    ]);
  });
  it("peConnected without advisor", async () => {
    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity(`peConnect:${userPeExternalId}`)
      .withBeneficiaryFirstName("John")
      .withBeneficiaryLastName("Doe")
      .withBeneficiaryEmail("john.doe@plop.fr")
      .withImmersionAddress("127 Avenue de la République 94800 Villejuif")
      .withDateStart("2022-07-06")
      .withDateEnd("2022-07-30")
      .withBusinessName("Boulangerie Les Echarts")
      .build();

    uow.conventionRepository.setConventions({
      [conventionDtoFromEvent.id]: conventionDtoFromEvent,
    });
    uow.conventionPoleEmploiAdvisorRepository.setConventionPoleEmploiUsersAdvisor(
      [
        {
          advisor: undefined,
          peExternalId: userAdvisorDto.user.peExternalId,
          _entityName: "ConventionPoleEmploiAdvisor",
          conventionId,
        },
      ],
    );

    await usecase.execute(conventionDtoFromEvent);

    expectTypeToMatchAndEqual(emailGateway.getSentEmails(), []);
  });
});

const conventionId = "749dd14f-c82a-48b1-b1bb-fffc5467e4d4";
const userPeExternalId = "749dd14f-c82a-48b1-b1bb-fffc5467e4d4";
const advisor: PeConnectImmersionAdvisorDto = {
  email: "elsa.oldenburg@pole-emploi.net",
  firstName: "Elsa",
  lastName: "Oldenburg",
  type: "CAPEMPLOI",
};
const userAdvisorDto: PeUserAndAdvisor = {
  advisor,
  user: {
    peExternalId: userPeExternalId,
    email: "",
    firstName: "",
    isJobseeker: true,
    lastName: "",
  },
};
