import { routes } from "src/app/routes/routes";
import { NavigationGateway } from "src/core-logic/ports/NavigationGateway";

import { SiretDto } from "shared";

export class ReactNavigationGateway implements NavigationGateway {
  navigateToEstablishmentForm(siret: SiretDto): void {
    routes.formEstablishment({ siret }).push();
  }
}
