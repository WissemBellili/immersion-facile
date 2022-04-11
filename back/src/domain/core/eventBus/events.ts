import { ContactEstablishmentRequestDto } from "shared/src/contactEstablishment";
import { EstablishmentJwtPayload } from "shared/src/tokens/MagicLinkPayload";
import { Flavor } from "shared/src/typeFlavors";
import { AgencyConfig } from "../../immersionApplication/ports/AgencyRepository";
import {
  ImmersionApplicationRequiresModificationPayload,
  RenewMagicLinkPayload,
} from "../../immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import type { DateStr } from "../ports/Clock";
import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";

export type SubscriptionId = Flavor<string, "SubscriptionId">;

export type EventFailure = {
  subscriptionId: SubscriptionId;
  errorMessage: string;
};

export type EventPublication = {
  publishedAt: DateStr;
  failures: EventFailure[];
};

type GenericEvent<T extends string, P> = {
  id: string;
  occurredAt: DateStr;
  topic: T;
  payload: P;
  publications: EventPublication[];
  wasQuarantined: boolean;
};

export type DomainEvent =
  // IMMERSION APPLICATION RELATED
  // HAPPY PATH
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationSubmittedByBeneficiary", ImmersionApplicationDto>
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationPartiallySigned", ImmersionApplicationDto>
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationFullySigned", ImmersionApplicationDto>
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationAcceptedByCounsellor", ImmersionApplicationDto>
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationAcceptedByValidator", ImmersionApplicationDto>
  // prettier-ignore
  | GenericEvent<"FinalImmersionApplicationValidationByAdmin", ImmersionApplicationDto>

  // UNHAPPY PATHS
  | GenericEvent<"ImmersionApplicationRejected", ImmersionApplicationDto>
  // prettier-ignore
  | GenericEvent<"ImmersionApplicationRequiresModification", ImmersionApplicationRequiresModificationPayload>

  // MAGIC LINK RENEWAL
  | GenericEvent<"MagicLinkRenewalRequested", RenewMagicLinkPayload>

  // FORM ESTABLISHMENT RELATED
  | GenericEvent<"FormEstablishmentAdded", FormEstablishmentDto>
  | GenericEvent<"FormEstablishmentEdited", FormEstablishmentDto>
  // prettier-ignore
  | GenericEvent<"ContactRequestedByBeneficiary", ContactEstablishmentRequestDto>
  // prettier-ignore
  | GenericEvent<"FormEstablishmentEditLinkSent", EstablishmentJwtPayload>

  // AGENCY RELATED
  | GenericEvent<"NewAgencyAdded", AgencyConfig>;

export type DomainTopic = DomainEvent["topic"];

export const eventToDebugInfo = (event: DomainEvent) => {
  const publishCount = event.publications.length;
  const lastPublication = event.publications[publishCount - 1];

  return {
    eventId: event.id,
    topic: event.topic,
    wasQuarantined: event.wasQuarantined,
    lastPublishedAt: lastPublication?.publishedAt,
    failedSubscribers: lastPublication?.failures,
    publishCount,
  };
};
export const eventsToDebugInfo = (events: DomainEvent[]) =>
  events.map(eventToDebugInfo);
