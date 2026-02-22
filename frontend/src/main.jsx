import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";

registerSW({ immediate: true });

const goatCounterEndpointRaw = import.meta.env.VITE_GOATCOUNTER_ENDPOINT?.trim();
let goatCounterEndpoint = "";

if (goatCounterEndpointRaw) {
  try {
    const parsedEndpoint = new URL(goatCounterEndpointRaw);
    goatCounterEndpoint = parsedEndpoint.toString();
  } catch {
    goatCounterEndpoint = "";
  }
}

if (goatCounterEndpoint && typeof document !== "undefined") {
  const existingScript = document.querySelector("script[data-goatcounter]");

  if (!existingScript) {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://gc.zgo.at/count.js";
    script.dataset.goatcounter = goatCounterEndpoint;
    document.head.appendChild(script);
  }
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
