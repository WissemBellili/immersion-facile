import { AxiosInstance } from "axios";
import { from, map, Observable } from "rxjs";
import { EmailSentDto } from "shared/email";
import { AdminToken } from "shared/src/admin/admin.dto";
import { emailRoute } from "shared/src/routes";
import { SentEmailGateway } from "src/core-logic/ports/SentEmailGateway";
import { emailsSentSchema } from "shared/email.schema";

export class HttpSentEmailGateway implements SentEmailGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

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
        const emailsSentDto = emailsSentSchema.parse(data) as EmailSentDto[];
        return emailsSentDto;
      }),

      //map(({ data }) => data),
    );
  }
}
