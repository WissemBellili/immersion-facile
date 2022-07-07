import supertest from "supertest";
import { buildTestApp, TestAppAndDeps } from "../../_testBuilders/buildTestApp";
import {
  ConventionDtoBuilder,
  VALID_EMAILS,
} from "shared/src/convention/ConventionDtoBuilder";
import {
  expectTypeToMatchAndEqual,
  expectJwtInMagicLinkAndGetIt,
} from "../../_testBuilders/test.helpers";
import { InMemoryOutboxRepository } from "../../adapters/secondary/core/InMemoryOutboxRepository";
import {
  InMemoryEmailGateway,
  TemplatedEmail,
} from "../../adapters/secondary/InMemoryEmailGateway";
import { DomainEvent } from "../../domain/core/eventBus/events";
import {
  ConventionDto,
  UpdateConventionStatusRequestDto,
} from "shared/src/convention/convention.dto";
import {
  conventionsRoute,
  signConventionRoute,
  updateConventionStatusRoute,
} from "shared/src/routes";

const adminEmail = "admin@email.fr";
const validatorEmail = "validator@mail.com";

describe("Add Convention Notifications, then checks the mails are sent (trigerred by events)", () => {
  it("saves valid app in repository with full express app", async () => {
    const validConvention = new ConventionDtoBuilder().build();
    const { externalId, ...validConventionParams } = validConvention;
    const { request, reposAndGateways, eventCrawler } = await buildTestApp();

    const res = await request
      .post(`/${conventionsRoute}`)
      .send(validConventionParams);

    expectResponseBody(res, { id: validConvention.id });
    expect(await reposAndGateways.conventionQueries.getLatestUpdated()).toEqual(
      [validConvention],
    );
    expectEventsInOutbox(reposAndGateways.outbox, [
      {
        topic: "ImmersionApplicationSubmittedByBeneficiary",
        payload: validConvention,
        publications: [],
      },
    ]);

    await eventCrawler.processNewEvents();

    expectSentEmails(reposAndGateways.email, [
      {
        type: "NEW_CONVENTION_BENEFICIARY_CONFIRMATION_REQUEST_SIGNATURE",
        recipients: [validConvention.email],
      },
      {
        type: "NEW_CONVENTION_MENTOR_CONFIRMATION_REQUEST_SIGNATURE",
        recipients: [validConvention.mentorEmail],
      },
      {
        type: "NEW_CONVENTION_ADMIN_NOTIFICATION",
        recipients: ["admin@email.fr"],
      },
    ]);
  });

  // eslint-disable-next-line jest/expect-expect
  it("Scenario: application submitted, then signed, then validated", async () => {
    const initialConvention = new ConventionDtoBuilder()
      .notSigned()
      .withStatus("READY_TO_SIGN")
      .withoutDateValidation()
      .build();

    const appAndDeps = await buildTestApp();
    const agency = await appAndDeps.reposAndGateways.agency.getById(
      initialConvention.agencyId,
    );

    if (!agency) throw new Error("Test agency not found with this id");

    appAndDeps.reposAndGateways.agency.setAgencies([
      { ...agency, validatorEmails: ["validator@mail.com"] },
    ]);

    const { beneficiarySignJwt, establishmentSignJwt } =
      await beneficiarySubmitsApplicationForTheFirstTime(
        appAndDeps,
        initialConvention,
      );

    await beneficiarySignsApplication(
      appAndDeps,
      beneficiarySignJwt,
      initialConvention,
    );

    const { validatorReviewJwt } = await establishmentSignsApplication(
      appAndDeps,
      establishmentSignJwt,
      initialConvention,
    );

    await validatorValidatesApplicationWhichTriggersConventionToBeSent(
      appAndDeps,
      validatorReviewJwt,
      initialConvention,
    );

    // REVIEW : RAJOUTER EXPECT A FAIRE !!!
  });

  const expectSentEmails = (
    emailGateway: InMemoryEmailGateway,
    emails: Partial<TemplatedEmail>[],
  ) => {
    expect(emailGateway.getSentEmails()).toMatchObject(emails);
  };

  const expectEventsInOutbox = (
    outbox: InMemoryOutboxRepository,
    events: Partial<DomainEvent>[],
  ) => {
    expect(outbox.events).toMatchObject(events);
  };

  const expectResponseBody = (
    res: supertest.Response,
    body: Record<string, unknown>,
  ) => {
    expect(res.body).toEqual(body);
    expect(res.status).toBe(200);
  };
});

const beneficiarySubmitsApplicationForTheFirstTime = async (
  { request, reposAndGateways, eventCrawler }: TestAppAndDeps,
  convention: ConventionDto,
) => {
  const { externalId, ...createConventionParams } = convention;
  const result = await request
    .post(`/${conventionsRoute}`)
    .send(createConventionParams);

  expect(result.status).toBe(200);

  expectOnlyOneImmersionThatIsEqual(
    await reposAndGateways.conventionQueries.getLatestUpdated(),
    convention,
  );

  await eventCrawler.processNewEvents();

  const sentEmails = reposAndGateways.email.getSentEmails();
  expect(sentEmails).toHaveLength(4);
  expect(sentEmails.map((e) => e.recipients)).toEqual([
    [VALID_EMAILS[0]],
    [VALID_EMAILS[1]],
    [adminEmail],
    ["validator@mail.com"],
  ]);

  const beneficiarySignEmail = sentEmails[0];
  const establishmentSignEmail = sentEmails[1];

  const beneficiarySignJwt = expectJwtInMagicLinkAndGetIt(
    beneficiarySignEmail.params.magicLink,
  );
  const establishmentSignJwt = expectJwtInMagicLinkAndGetIt(
    establishmentSignEmail.params.magicLink,
  );

  return {
    beneficiarySignJwt,
    establishmentSignJwt,
  };
};

const beneficiarySignsApplication = async (
  { request, reposAndGateways, eventCrawler }: TestAppAndDeps,
  beneficiarySignJwt: string,
  initialConvention: ConventionDto,
) => {
  const response = await request
    .post(`/auth/${signConventionRoute}/${initialConvention.id}`)
    .set("Authorization", beneficiarySignJwt);

  expect(response.status).toBe(200);

  expectOnlyOneImmersionThatIsEqual(
    await reposAndGateways.conventionQueries.getLatestUpdated(),
    {
      ...initialConvention,
      status: "PARTIALLY_SIGNED",
      beneficiaryAccepted: true,
      enterpriseAccepted: false,
    },
  );

  await eventCrawler.processNewEvents();

  const sentEmails = reposAndGateways.email.getSentEmails();
  expect(sentEmails).toHaveLength(5);
  const needsReviewEmail = sentEmails[sentEmails.length - 1];
  expect(needsReviewEmail.recipients).toEqual(["establishment@example.com"]);
  expectTypeToMatchAndEqual(
    needsReviewEmail.type,
    "BENEFICIARY_OR_MENTOR_ALREADY_SIGNED_NOTIFICATION",
  );
};

const establishmentSignsApplication = async (
  { request, reposAndGateways, eventCrawler }: TestAppAndDeps,
  establishmentSignJwt: string,
  initialConvention: ConventionDto,
) => {
  await request
    .post(`/auth/${signConventionRoute}/${initialConvention.id}`)
    .set("Authorization", establishmentSignJwt)
    .expect(200);

  expectOnlyOneImmersionThatIsEqual(
    await reposAndGateways.conventionQueries.getLatestUpdated(),
    {
      ...initialConvention,
      status: "IN_REVIEW",
      beneficiaryAccepted: true,
      enterpriseAccepted: true,
    },
  );

  await eventCrawler.processNewEvents();

  const sentEmails = reposAndGateways.email.getSentEmails();
  expect(sentEmails).toHaveLength(6);
  const needsReviewEmail = sentEmails[sentEmails.length - 1];
  expect(needsReviewEmail.recipients).toEqual([validatorEmail]);
  return {
    validatorReviewJwt: expectJwtInMagicLinkAndGetIt(
      needsReviewEmail.params.magicLink,
    ),
  };
};

const validatorValidatesApplicationWhichTriggersConventionToBeSent = async (
  { request, reposAndGateways, eventCrawler, clock }: TestAppAndDeps,
  validatorReviewJwt: string,
  initialConvention: ConventionDto,
) => {
  const params: UpdateConventionStatusRequestDto = {
    status: "ACCEPTED_BY_VALIDATOR",
  };

  const validationDate = new Date("2022-01-01T12:00:00.000");
  clock.now = () => validationDate;

  await request
    .post(`/auth/${updateConventionStatusRoute}/${initialConvention.id}`)
    .set("Authorization", validatorReviewJwt)
    .send(params)
    .expect(200);

  expectOnlyOneImmersionThatIsEqual(
    await reposAndGateways.conventionQueries.getLatestUpdated(),
    {
      ...initialConvention,
      status: "ACCEPTED_BY_VALIDATOR",
      dateValidation: validationDate.toISOString(),
      beneficiaryAccepted: true,
      enterpriseAccepted: true,
      rejectionJustification: undefined,
    },
  );

  await eventCrawler.processNewEvents();
  const sentEmails = reposAndGateways.email.getSentEmails();
  expect(sentEmails).toHaveLength(7);
  const needsToTriggerConventionSentEmail = sentEmails[sentEmails.length - 1];
  expectTypeToMatchAndEqual(
    needsToTriggerConventionSentEmail.type,
    "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
  );
  expect(needsToTriggerConventionSentEmail.recipients).toEqual([
    "beneficiary@email.fr",
    "establishment@example.com",
    validatorEmail,
  ]);
};

const expectOnlyOneImmersionThatIsEqual = (
  actualDtos: ConventionDto[],
  expectedDto: ConventionDto,
) => {
  expect(actualDtos).toHaveLength(1);
  expectTypeToMatchAndEqual(actualDtos[0], expectedDto);
};
