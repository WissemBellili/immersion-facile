import { Observable, Subject } from "rxjs";
import { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";

import { AbsoluteUrl } from "shared";

export class TestInclusionConnectedGateway
  implements InclusionConnectedGateway
{
  getMyAgencyDashboardUrl$(_token: string): Observable<AbsoluteUrl> {
    return this.dashboardUrl$;
  }

  // for test purpose
  public dashboardUrl$ = new Subject<AbsoluteUrl>();
}
