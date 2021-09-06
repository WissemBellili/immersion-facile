import { EventBus } from "../../domain/core/eventBus/EventBus";
import type {
  DomainEvent,
  DomainTopic,
} from "../../domain/core/eventBus/events";
import { InMemoryEventBus } from "../../adapters/secondary/InMemoryEventBus";

const domainEvt: DomainEvent = {
  id: "anId",
  topic: "ImmersionApplicationSubmittedByBeneficiary",
  payload: { submittedByBeneficiary: "my Payload" },
  occuredAt: "a date",
};

const spyOnTopic = (eventBus: EventBus, topic: DomainTopic): DomainEvent[] => {
  const publishedEvents: DomainEvent[] = [];
  eventBus.subscribe(topic, (event) => publishedEvents.push(event));
  return publishedEvents;
};

describe("InMemoryEventBus", () => {
  let anEventBus: InMemoryEventBus;

  beforeEach(() => {
    anEventBus = new InMemoryEventBus();
  });

  describe("Publish to an existing topic", () => {
    test("Publishes to a new topic and check we have only one spyed", () => {
      const publishedEvents = spyOnTopic(
        anEventBus,
        "ImmersionApplicationSubmittedByBeneficiary"
      );
      anEventBus.publish(domainEvt);
      expect(publishedEvents).toHaveLength(1);
    });
  });

  test("Publish to the same topic and check that 2 subscribers get the message", () => {
    const eventsOnFirstHandler = spyOnTopic(
      anEventBus,
      "ImmersionApplicationSubmittedByBeneficiary"
    );

    const eventsOnSecondHandler = spyOnTopic(
      anEventBus,
      "ImmersionApplicationSubmittedByBeneficiary"
    );

    anEventBus.publish(domainEvt);

    expect(eventsOnFirstHandler).toHaveLength(1);
    expect(eventsOnFirstHandler[0]).toEqual(domainEvt);
    expect(eventsOnSecondHandler).toHaveLength(1);
    expect(eventsOnSecondHandler[0]).toEqual(domainEvt);
  });
});
