import { AxiosInstance } from "axios";
import { from, Observable } from "rxjs";
import {
  AssessmentAndJwt,
  ImmersionAssessmentGateway,
} from "src/core-logic/ports/ImmersionAssessmentGateway";

import { immersionAssessmentRoute } from "shared";

export class HttpImmersionAssessmentGateway
  implements ImmersionAssessmentGateway
{
  constructor(private readonly httpClient: AxiosInstance) {}

  createAssessment({ jwt, assessment }: AssessmentAndJwt): Observable<void> {
    return from(
      this.httpClient
        .post<void>(`/auth/${immersionAssessmentRoute}`, assessment, {
          headers: { Authorization: jwt },
        })
        .then(({ data }) => data),
    );
  }
}
