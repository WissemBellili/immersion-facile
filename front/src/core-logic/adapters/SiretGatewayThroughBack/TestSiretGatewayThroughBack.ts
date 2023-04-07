import { Observable, Subject } from "rxjs";
import { SiretGatewayThroughBack } from "src/core-logic/ports/SiretGatewayThroughBack";

import { GetSiretInfo } from "shared";

export class TestSiretGatewayThroughBack implements SiretGatewayThroughBack {
  isSiretAlreadyInSaved(): Observable<boolean> {
    return this.isSiretInDb$;
  }

  getSiretInfoIfNotAlreadySaved(): Observable<GetSiretInfo> {
    this.getSiretInfoIfNotAlreadySavedCallCount++;
    return this.siretInfo$;
  }

  getSiretInfo(): Observable<GetSiretInfo> {
    this.getSiretInfoCallCount++;
    return this.siretInfo$;
  }

  public isSiretInDb$ = new Subject<boolean>();
  public siretInfo$ = new Subject<GetSiretInfo>();
  public getSiretInfoCallCount = 0;
  public getSiretInfoIfNotAlreadySavedCallCount = 0;
}
