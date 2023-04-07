import { Observable, Subject } from "rxjs";
import { SentEmailGateway } from "src/core-logic/ports/SentEmailGateway";

import { BackOfficeJwt, EmailSentDto } from "shared";

export class TestSentEmailGateway implements SentEmailGateway {
  getLatest(_: BackOfficeJwt): Observable<EmailSentDto[]> {
    return this.sentEmails$;
  }

  public sentEmails$ = new Subject<EmailSentDto[]>();
}
