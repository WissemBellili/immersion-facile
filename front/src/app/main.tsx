import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { Provider } from "react-redux";
import { HttpTodoGateway } from "src/core-logic/adapters/HttpTodoGateway";
import { InMemoryTodoGateway } from "src/core-logic/adapters/InMemoryTodoGateway";
import { configureReduxStore } from "src/core-logic/store/initilizeStore";
import { App } from "./App";
import { InMemoryFormulaireGateway } from "src/core-logic/adapters/InMemoryFormulaireGateway";
import { HttpFormulaireGateway } from "src/core-logic/adapters/HttpFormulaireGateway";
import { HTTPInseeGateway } from "src/core-logic/adapters/HTTPInseeGateway"

const gateway = import.meta.env.VITE_GATEWAY;

console.log("GATEWAY : ", gateway);

const todoGateway =
  gateway === "HTTP" ? new HttpTodoGateway() : new InMemoryTodoGateway();

// TODO: don't export the gateway, maybe?
export const formulaireGateway = gateway === "HTTP" ? new HttpFormulaireGateway() : new InMemoryFormulaireGateway();
export const inseeGateway = new HTTPInseeGateway();

const store = configureReduxStore({ todoGateway });

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
