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

// PWA: cache the shell for low-bandwidth wards. Production only — dev stays live.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
