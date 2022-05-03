import {
  Action,
  combineReducers,
  configureStore,
  ThunkAction,
} from "@reduxjs/toolkit";
import { combineEpics, createEpicMiddleware, Epic } from "redux-observable";
import { catchError } from "rxjs";
import type { Dependencies } from "src/app/config/dependencies";
import {
  featureFlagsSlice,
  fetchFeatureFlagsEpic,
} from "src/core-logic/domain/featureFlags/featureFlags.slice";
import {
  romeAutocompleteEpic,
  romeAutocompleteSlice,
} from "src/core-logic/domain/romeAutocomplete/romeAutocomplete.slice";
import { searchSlice } from "src/core-logic/domain/search/search.slice";
import { searchEpics } from "src/core-logic/domain/search/search.epic";

const allEpics: any[] = [
  ...searchEpics,
  fetchFeatureFlagsEpic,
  romeAutocompleteEpic,
];

const rootEpic: Epic = (action$, store$, dependencies) =>
  combineEpics(...allEpics)(action$, store$, dependencies).pipe(
    catchError((error, source) => {
      //eslint-disable-next-line no-console
      console.error("combineEpic", error);
      return source;
    }),
  );

const rootReducer = combineReducers({
  [searchSlice.name]: searchSlice.reducer,
  [featureFlagsSlice.name]: featureFlagsSlice.reducer,
  [romeAutocompleteSlice.name]: romeAutocompleteSlice.reducer,
});

export type StoreProps = {
  dependencies: Dependencies;
  preloadedState?: Partial<RootState>;
};

export const createStore = ({ dependencies, preloadedState }: StoreProps) => {
  const epicMiddleware = createEpicMiddleware({ dependencies });
  const store = configureStore({
    preloadedState,
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => [
      ...getDefaultMiddleware({ thunk: false }),
      epicMiddleware,
    ],
  });
  epicMiddleware.run(rootEpic);
  return store;
};

export type RootState = ReturnType<typeof rootReducer>;

type Store = ReturnType<typeof createStore>;
// export type RootState2 = ReturnType<Store["getState"]>;
export type AppDispatch = Store["dispatch"];

export type AppThunk = ThunkAction<
  void,
  RootState,
  Dependencies,
  Action<string>
>;
