import { EditFormEstablishmentPayload } from "../../../shared/tokens/MagicLinkPayload";
import { DomainEvent } from "../eventBus/events";

export interface OutboxRepository {
  getLastPayloadOfFormEstablishmentEditLinkSentWithSiret: (
    siret: string,
  ) => Promise<EditFormEstablishmentPayload | undefined>;
  save: (event: DomainEvent) => Promise<void>;
  getAllUnpublishedEvents: () => Promise<DomainEvent[]>;
  markEventsAsPublished: (events: DomainEvent[]) => Promise<void>;
}
