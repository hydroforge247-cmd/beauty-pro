import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./base.css";
import "./film.css";
import "./beauty-pro.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
