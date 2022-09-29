import { AxiosInstance } from "axios";
import { from, map, Observable } from "rxjs";
import { EmailSentDto } from "shared";
import { emailsSentSchema } from "shared";
import { AdminToken } from "shared";
import { emailRoute } from "shared";
import { SentEmailGateway } from "src/core-logic/ports/SentEmailGateway";

export class HttpSentEmailGateway implements SentEmailGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

  // TODO Mieux identifier l'admin
  public getLatest(adminToken: AdminToken): Observable<EmailSentDto[]> {
    return from(
      this.httpClient.get<unknown>(`/admin/${emailRoute}`, {
        //this.httpClient.get<EmailSentDto[]>(`/admin/${emailRoute}`, {
        headers: {
          authorization: adminToken,
        },
      }),
    ).pipe(
      map(({ data }) => {
        // TODO emailsSentSchema doit avoir le schema DTO mais avec le rework email ça ne passe pas
        const emailsSentDto: EmailSentDto[] = emailsSentSchema.parse(data);
        return emailsSentDto;
      }),

      //map(({ data }) => data),
    );
  }
}
