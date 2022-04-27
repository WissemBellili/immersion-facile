import { ClientApplication } from "src/clientApplication/ClientApplication";
import { ClientGateways } from "src/core-logic/ports/ClientGateways";
import { ClientRepositories } from "src/core-logic/ports/ClientRepositories";
import { ApplicationPrimaryController } from "src/core-logic/ports/primaryController/ApplicationPrimaryController";
import { ReactEstablishmentUiGateway } from "src/infra/gateway/EstablishmentUiGateway.ts/ReactEstablishmentUiGateway";
import { InMemoryEventGateway } from "src/infra/gateway/EventGateway/InMemoryEventGateway";
import { establishmentGateway } from "./dependencies";

const primaryController = new ApplicationPrimaryController();
const gateways: ClientGateways = {
  establishments: establishmentGateway,
  establishmentsUi: new ReactEstablishmentUiGateway(),
  event: new InMemoryEventGateway(primaryController),
};
const repositories: ClientRepositories = {};

export const clientApplication = new ClientApplication({
  primaryController,
  gateways,
  repositories,
});
