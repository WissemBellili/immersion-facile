import { Observable } from "rxjs";
import { GetSiretInfo, SiretDto } from "shared";

export interface SiretGatewayThroughBack {
  isSiretAlreadyInSaved(siret: SiretDto): Observable<boolean>;
  getSiretInfo(siret: SiretDto): Observable<GetSiretInfo>;
  getSiretInfoIfNotAlreadySaved(siret: SiretDto): Observable<GetSiretInfo>;
}
