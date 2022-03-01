import { ContactEstablishmentRequestDto } from "../../../shared/contactEstablishment";
import { FormEstablishmentDto } from "../../../shared/FormEstablishmentDto";
import type { ImmersionApplicationDto } from "../../../shared/ImmersionApplicationDto";
import { EditFormEstablishementPayload } from "../../../shared/tokens/MagicLinkPayload";
import {
  ImmersionApplicationRequiresModificationPayload,
  RenewMagicLinkPayload,
} from "../../immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import type { DateStr } from "../ports/Clock";

type GenericEvent<T extends string, P> = {
  id: string;
  occurredAt: DateStr;
  topic: T;
  payload: P;
  wasPublished?: boolean;
  wasQuarantined?: boolean;
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
  // prettier-ignore
  | GenericEvent<"ContactRequestedByBeneficiary", ContactEstablishmentRequestDto>
  // prettier-ignore
  | GenericEvent<"FormEstablishmentEditLinkSent", EditFormEstablishementPayload>;

export type DomainTopic = DomainEvent["topic"];

export const eventToDebugInfo = (event: DomainEvent) => ({
  event: event.id,
  topic: event.topic,
  wasPublished: event.wasPublished,
  wasQuarantined: event.wasQuarantined,
});
export const eventsToDebugInfo = (events: DomainEvent[]) =>
  events.map(eventToDebugInfo);
