import { makeGenerateJwt, makeVerifyJwt } from "../../../domain/auth/jwt";
import { AppConfig } from "../../../adapters/primary/config/appConfig";
import {
  BadRequestError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryAgencyRepository } from "../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import { GenerateMagicLinkJwt } from "../../../domain/auth/jwt";
import { Agency } from "shared/src/agency/agency.dto";
import { createConventionMagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import { AgencyBuilder } from "../../../../../shared/src/agency/AgencyBuilder";
import { ImmersionApplicationEntityBuilder } from "../../../_testBuilders/ImmersionApplicationEntityBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../domain/core/eventBus/EventBus";
import { RenewMagicLink } from "../../../domain/immersionApplication/useCases/RenewMagicLink";
import { AppConfigBuilder } from "../../../_testBuilders/AppConfigBuilder";
import { RenewMagicLinkPayload } from "../../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import {
  ImmersionApplicationDto,
  RenewMagicLinkRequestDto,
} from "shared/src/ImmersionApplication/ImmersionApplication.dto";

const validImmersionApplication: ImmersionApplicationDto =
  new ImmersionApplicationEntityBuilder().build().toDto();

const defaultAgency = AgencyBuilder.create(
  validImmersionApplication.agencyId,
).build();

describe("RenewMagicLink use case", () => {
  let agency: Agency;
  let applicationRepository: InMemoryImmersionApplicationRepository;
  let outboxRepository: InMemoryOutboxRepository;
  let clock: CustomClock;
  let uuidGenerator: TestUuidGenerator;
  let createNewEvent: CreateNewEvent;
  let agencyRepository: InMemoryAgencyRepository;
  let config: AppConfig;

  let generateJwtFn: GenerateMagicLinkJwt;

  beforeEach(() => {
    agency = defaultAgency;
    applicationRepository = new InMemoryImmersionApplicationRepository();
    outboxRepository = new InMemoryOutboxRepository();
    clock = new CustomClock();
    clock.setNextDate(new Date());
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });
    agencyRepository = new InMemoryAgencyRepository([agency]);

    const entity = new ImmersionApplicationEntityBuilder().build();
    applicationRepository.setImmersionApplications({ [entity.id]: entity });
    config = new AppConfigBuilder().withTestPresetPreviousKeys().build();

    generateJwtFn = makeGenerateJwt(config.magicLinkJwtPrivateKey);
  });

  const createUseCase = () =>
    new RenewMagicLink(
      applicationRepository,
      createNewEvent,
      outboxRepository,
      agencyRepository,
      generateJwtFn,
      config,
      clock,
    );

  it("requires a valid application id", async () => {
    const payload = createConventionMagicLinkPayload(
      "not-a-valid-id",
      "counsellor",
      "some email",
    );

    const request: RenewMagicLinkRequestDto = {
      linkFormat: "immersionfacile.com/%jwt%",
      expiredJwt: generateJwtFn(payload),
    };

    await expectPromiseToFailWithError(
      createUseCase().execute(request),
      new NotFoundError("not-a-valid-id"),
    );
  });

  it("requires a known agency id", async () => {
    const storedUnknownId = "some unknown agency id";
    const entity = new ImmersionApplicationEntityBuilder()
      .withAgencyId(storedUnknownId)
      .build();
    applicationRepository.setImmersionApplications({ [entity.id]: entity });

    const payload = createConventionMagicLinkPayload(
      validImmersionApplication.id,
      "counsellor",
      "some email",
    );

    const request: RenewMagicLinkRequestDto = {
      linkFormat: "immersionfacile.com/%jwt%",
      expiredJwt: generateJwtFn(payload),
    };

    await expectPromiseToFailWithError(
      createUseCase().execute(request),
      new BadRequestError(storedUnknownId),
    );
  });

  // Admins use non-magic-link based authentication, so no need to renew these.
  it("Refuses to generate admin magic links", async () => {
    const payload = createConventionMagicLinkPayload(
      validImmersionApplication.id,
      "admin",
      "some email",
    );

    const request: RenewMagicLinkRequestDto = {
      linkFormat: "immersionfacile.com/%jwt%",
      expiredJwt: generateJwtFn(payload),
    };

    await expectPromiseToFailWithError(
      createUseCase().execute(request),
      new BadRequestError("L'admin n'a pas de liens magiques."),
    );
  });

  it("requires a link format that includes %jwt% string", async () => {
    const payload = createConventionMagicLinkPayload(
      validImmersionApplication.id,
      "counsellor",
      "some email",
    );

    const request: RenewMagicLinkRequestDto = {
      linkFormat: "immersionfacile.com/",
      expiredJwt: generateJwtFn(payload),
    };

    await expectPromiseToFailWithError(
      createUseCase().execute(request),
      new BadRequestError(request.linkFormat),
    );
  });

  it("Posts an event to deliver a correct JWT for correct responses", async () => {
    const expiredPayload = createConventionMagicLinkPayload(
      validImmersionApplication.id,
      "beneficiary",
      validImmersionApplication.email,
    );

    const request: RenewMagicLinkRequestDto = {
      linkFormat: "immersionfacile.fr/%jwt%",
      expiredJwt: generateJwtFn(expiredPayload),
    };

    await createUseCase().execute(request);

    expect(outboxRepository.events).toHaveLength(1);
    const renewalEvent = outboxRepository.events[0];
    expect(renewalEvent.topic).toBe("MagicLinkRenewalRequested");
    const dispatchedPayload = renewalEvent.payload as RenewMagicLinkPayload;
    expect(dispatchedPayload["emails"]).toEqual([
      validImmersionApplication.email,
    ]);
    const ml = dispatchedPayload.magicLink;
    expect(ml.startsWith("immersionfacile.fr/")).toBeTruthy();
    const jwt = ml.replace("immersionfacile.fr/", "");

    const verifyJwt = makeVerifyJwt(config.magicLinkJwtPublicKey);
    expect(verifyJwt(jwt)).toBeDefined();
  });
});
