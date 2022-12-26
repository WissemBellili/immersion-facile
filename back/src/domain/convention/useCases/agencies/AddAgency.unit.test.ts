import {
  CreateAgencyDto,
  expectObjectsToMatch,
  expectTypeToMatchAndEqual,
} from "shared";

import { createInMemoryUow } from "../../../../adapters/primary/config/uowConfig";
import { InMemoryOutboxRepository } from "../../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryAgencyRepository } from "../../../../adapters/secondary/InMemoryAgencyRepository";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { AddAgency, defaultQuestionnaireUrl } from "./AddAgency";
import { makeCreateNewEvent } from "../../../core/eventBus/EventBus";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";

const defaultAdminEmail = "myAdmin@mail.com";

const parisMissionLocaleParams: CreateAgencyDto = {
  id: "some-id",
  address: {
    streetNumberAndAddress: "10 avenue des Champs Elysées",
    city: "Paris",
    departmentCode: "75",
    postcode: "75017",
  },
  counsellorEmails: ["counsellor@mail.com"],
  validatorEmails: ["validator@mail.com"],
  kind: "mission-locale",
  name: "Mission locale de Paris",
  position: { lat: 10, lon: 20 },
  questionnaireUrl: "www.myUrl.com",
  signature: "Super signature of the agency",
  logoUrl: "https://www.myUrl.com",
};

describe("AddAgency use case", () => {
  let outboxRepo: InMemoryOutboxRepository;
  let agencyRepo: InMemoryAgencyRepository;
  let uowPerformer: InMemoryUowPerformer;
  let addAgency: AddAgency;

  beforeEach(() => {
    const uow = createInMemoryUow();
    outboxRepo = uow.outboxRepository;
    agencyRepo = uow.agencyRepository;
    uowPerformer = new InMemoryUowPerformer(uow);
    const timeGateway = new CustomTimeGateway();
    const uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator,
    });

    addAgency = new AddAgency(uowPerformer, createNewEvent, defaultAdminEmail);
  });

  it("save the agency in repo, with the default admin mail and the status to be reviewed", async () => {
    agencyRepo.setAgencies([]);
    await addAgency.execute(parisMissionLocaleParams);
    expectTypeToMatchAndEqual(agencyRepo.agencies, [
      {
        ...parisMissionLocaleParams,
        questionnaireUrl: parisMissionLocaleParams.questionnaireUrl!,
        adminEmails: [defaultAdminEmail],
        status: "needsReview",
      },
    ]);
  });

  it("sets an events to be dispatched with the added agency", async () => {
    await addAgency.execute(parisMissionLocaleParams);
    expect(outboxRepo.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepo.events[0], {
      topic: "NewAgencyAdded",
      payload: {
        ...parisMissionLocaleParams,
        questionnaireUrl: parisMissionLocaleParams.questionnaireUrl!,
        adminEmails: [defaultAdminEmail],
        status: "needsReview",
      },
    });
  });

  it("uses default questionnaire url when none is provided", async () => {
    const poleEmploiParis: CreateAgencyDto = {
      ...parisMissionLocaleParams,
      questionnaireUrl: "",
    };

    agencyRepo.setAgencies([]);
    await addAgency.execute(poleEmploiParis);

    expectTypeToMatchAndEqual(agencyRepo.agencies, [
      {
        ...poleEmploiParis,
        adminEmails: [defaultAdminEmail],
        status: "needsReview",
        questionnaireUrl: defaultQuestionnaireUrl,
      },
    ]);
  });
});
