import { Observable, Subject } from "rxjs";
import { AddressGateway } from "src/core-logic/ports/AddressGateway";

import { AddressAndPosition, LookupSearchResult } from "shared";

export class TestAddressGateway implements AddressGateway {
  lookupStreetAddress(): Promise<AddressAndPosition[]> {
    throw new Error("Method not implemented.");
  }
  lookupLocation$(): Observable<LookupSearchResult[]> {
    return this.lookupLocationResults$;
  }

  public lookupLocationResults$ = new Subject<LookupSearchResult[]>();
}
