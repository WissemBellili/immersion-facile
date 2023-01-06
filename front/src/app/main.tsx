import "src/assets/css/index.css";
import "src/assets/dsfr/dsfr.min.css";
import "src/assets/dsfr/utility/icons/icons.min.css";

import React from "react";
import { Provider } from "react-redux";
import { App } from "src/app/App";
import { store } from "src/config/dependencies";
import { MetaContent } from "./components/layout/MetaContent";

import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";

startReactDsfr({ defaultColorScheme: "light" });

import { RouteProvider } from "./routes/routes";
import { createRoot } from "react-dom/client";
const container = document.getElementById("root");
const root = createRoot(container as HTMLElement);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <RouteProvider>
        <MetaContent />
        <App />
      </RouteProvider>
    </Provider>
  </React.StrictMode>,
);
