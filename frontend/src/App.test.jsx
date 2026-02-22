import { describe, it, expect, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";

function renderApp() {
  return render(<App />);
}

function nav() {
  return screen.getByRole("navigation");
}

describe("App", () => {
  it("uses pathname to select initial screen", () => {
    window.history.replaceState({}, "", "/map");
    renderApp();
    expect(screen.getByText("Interaktive Karte")).toBeInTheDocument();
  });

  it("renders nav and home screen by default", () => {
    window.history.replaceState({}, "", "/");
    renderApp();
    const navEl = within(nav());
    expect(navEl.getByRole("button", { name: /Start/ })).toBeInTheDocument();
    expect(screen.getByText("Zirndorfer Garagen-Flohmarkt")).toBeInTheDocument();
    expect(screen.getByText(/Experimenteller Prototyp/i)).toBeInTheDocument();
    expect(screen.getByText(/keine offizielle Seite der Stadt Zirndorf/i)).toBeInTheDocument();
    expect(screen.getByText(/Veranstaltung „Zirndorfer Garagen-Flohmarkt“/i)).toBeInTheDocument();
  });

  it("shows offline mode and disables register nav when offline", () => {
    window.history.replaceState({}, "", "/");
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    renderApp();

    expect(screen.getByText(/Offline-Modus: Lesen verfügbar/i)).toBeInTheDocument();
    expect(within(nav()).getByRole("button", { name: /Anmelden/ })).toBeDisabled();
    expect(screen.getByText("Zirndorfer Garagen-Flohmarkt")).toBeInTheDocument();
  });

  it("updates pathname when switching screens", async () => {
    window.history.replaceState({}, "", "/");
    renderApp();
    await userEvent.click(within(nav()).getByRole("button", { name: /Info/ }));

    expect(window.location.pathname).toBe("/info");
    expect(screen.getByText("Brauche ich eine Genehmigung?")).toBeInTheDocument();
  });

  it("tracks SPA navigation via GoatCounter count", async () => {
    window.history.replaceState({}, "", "/");
    const count = vi.fn();
    window.goatcounter = { count };

    renderApp();
    await userEvent.click(within(nav()).getByRole("button", { name: /Info/ }));

    expect(count).toHaveBeenCalledTimes(1);
    expect(count).toHaveBeenCalledWith({ path: "/info" });

    delete window.goatcounter;
  });

  it("reacts to browser back navigation", async () => {
    window.history.replaceState({}, "", "/");
    renderApp();
    await userEvent.click(within(nav()).getByRole("button", { name: /Karte/ }));
    expect(window.location.pathname).toBe("/map");

    window.history.back();

    await waitFor(() => {
      expect(window.location.pathname).toBe("/");
    });
    expect(screen.getByText("Zirndorfer Garagen-Flohmarkt")).toBeInTheDocument();
  });
});
