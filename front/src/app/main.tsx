import "src/assets/css/index.css";
import "@gouvfr/dsfr/dist/dsfr/dsfr.css";
import "@gouvfr/dsfr/dist/utility/utility.css";

import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { App } from "src/app/App";
import { store } from "src/app/config/dependencies";

import { RouteProvider } from "./routing/routes";

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <RouteProvider>
        <App />
      </RouteProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root"),
);
