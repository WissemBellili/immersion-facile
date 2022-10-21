import { PayloadAction } from "@reduxjs/toolkit";
import { filter, Observable } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { AgencyDto, AgencyIdAndName } from "shared";
import { catchEpicError } from "src/core-logic/storeConfig/catchEpicError";
import {
  ActionOfSlice,
  AppEpic,
} from "src/core-logic/storeConfig/redux.helpers";
import { agencyAdminSlice } from "./agencyAdmin.slice";

type AgencyAction = ActionOfSlice<typeof agencyAdminSlice>;

export const agencyAdminGetByNameEpic: AppEpic<AgencyAction> = (
  action$,
  _state$,
  dependencies,
) =>
  action$.pipe(
    filter(agencyAdminSlice.actions.setAgencySearchText.match),
    switchMap((action: PayloadAction<string>) =>
      dependencies.agencyGateway.listAgenciesByFilter$({
        name: action.payload,
      }),
    ),
    map(agencyAdminSlice.actions.setAgencyOptions),
  );

export const agencyAdminGetDetailsEpic: AppEpic<AgencyAction> = (
  action$,
  state$,
  dependencies,
) =>
  action$.pipe(
    filter(agencyAdminSlice.actions.setSelectedAgency.match),
    switchMap(
      (action: PayloadAction<AgencyIdAndName>): Observable<AgencyDto> =>
        dependencies.agencyGateway.getAgencyAdminById$(
          action.payload.id,
          state$.value.admin.adminAuth.adminToken ?? "",
        ),
    ),
    map(agencyAdminSlice.actions.setAgency),
  );

const agencyAdminEditEpic: AppEpic<AgencyAction> = (
  action$,
  state$,
  { agencyGateway },
) =>
  action$.pipe(
    filter(agencyAdminSlice.actions.editAgencyRequested.match),
    switchMap(({ payload }) =>
      agencyGateway.updateAgency$(
        payload,
        state$.value.admin.adminAuth.adminToken || "",
      ),
    ),
    map(agencyAdminSlice.actions.editAgencySucceeded),
    catchEpicError((error: Error) =>
      agencyAdminSlice.actions.editAgencyFailed(error.message),
    ),
  );

export const agenciesAdminEpics = [
  agencyAdminGetByNameEpic,
  agencyAdminGetDetailsEpic,
  agencyAdminEditEpic,
];
