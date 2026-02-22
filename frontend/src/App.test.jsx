import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import App from "./App.jsx";

function renderApp() {
  return render(<App />);
}

function nav() {
  return screen.getByRole("navigation");
}

describe("App", () => {
  it("renders nav and home screen by default", () => {
    renderApp();
    const navEl = within(nav());
    expect(navEl.getByRole("button", { name: /Start/ })).toBeInTheDocument();
    expect(screen.getByText("Garagenflohmarkt Zirndorf")).toBeInTheDocument();
  });

  it("shows offline mode and disables register nav when offline", () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    renderApp();

    expect(screen.getByText(/Offline-Modus: Lesen verfuegbar/i)).toBeInTheDocument();
    expect(within(nav()).getByRole("button", { name: /Anmelden/ })).toBeDisabled();
    expect(screen.getByText("Garagenflohmarkt Zirndorf")).toBeInTheDocument();
  });
});
