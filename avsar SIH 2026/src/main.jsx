import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import { C2CProvider } from "./app/store.jsx";
import { Shell } from "./app/shell.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <C2CProvider>
        <Shell />
      </C2CProvider>
    </BrowserRouter>
  </StrictMode>
);
