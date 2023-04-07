import { Observable, of } from "rxjs";
import { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";

import { AbsoluteUrl } from "shared";

export class SimulatedInclusionConnectedGateway
  implements InclusionConnectedGateway
{
  getMyAgencyDashboardUrl$(_token: string): Observable<AbsoluteUrl> {
    return of("https://placeholder.com/");
  }
}
