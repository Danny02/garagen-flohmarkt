import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";
import { saveMyStand, LS_KEY } from "./utils.js";

// fetch is mocked in test-setup.js (returns [] by default)

// ── helpers ───────────────────────────────────────────────────────────────────

function renderApp() {
  return render(<App />);
}

// ── NavBar navigation ─────────────────────────────────────────────────────────

describe("NavBar", () => {
  it("renders all four nav items", () => {
    renderApp();
    expect(screen.getByText("Start")).toBeInTheDocument();
    expect(screen.getByText("Karte")).toBeInTheDocument();
    expect(screen.getByText("Anmelden")).toBeInTheDocument();
    expect(screen.getByText("Info")).toBeInTheDocument();
  });

  it("navigates to the map screen when 'Karte' is clicked", async () => {
    renderApp();
    await userEvent.click(screen.getByText("Karte"));
    expect(screen.getByText("Interaktive Karte")).toBeInTheDocument();
  });

  it("navigates to the info screen when 'Info' is clicked", async () => {
    renderApp();
    await userEvent.click(screen.getByText("Info"));
    expect(screen.getByText("Infos und FAQ")).toBeInTheDocument();
  });

  it("navigates to the register screen when 'Anmelden' is clicked", async () => {
    renderApp();
    await userEvent.click(screen.getByText("Anmelden"));
    expect(screen.getByText("Stand anmelden")).toBeInTheDocument();
  });
});

// ── HomeScreen ────────────────────────────────────────────────────────────────

describe("HomeScreen", () => {
  it("renders the main headline", () => {
    renderApp();
    expect(screen.getByText("Garagenflohmarkt Zirndorf")).toBeInTheDocument();
  });

  it("renders discover and register buttons", () => {
    renderApp();
    expect(screen.getByText("Staende auf der Karte entdecken")).toBeInTheDocument();
    expect(screen.getByText("Eigenen Stand anmelden")).toBeInTheDocument();
  });

  it("shows total stand count in the stats card", () => {
    renderApp();
    // There are 8 seed STANDS; dynamic stands from API default to []
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("does NOT render MyStandsSection when localStorage is empty", () => {
    renderApp();
    expect(screen.queryByText(/Mein angemeldeter Stand/i)).not.toBeInTheDocument();
  });

  it("renders MyStandsSection when a stand is saved in localStorage", () => {
    saveMyStand({ id: "test-1", address: "Musterweg 5", editSecret: "sec123" });
    renderApp();
    expect(screen.getByText(/Mein angemeldeter Stand/i)).toBeInTheDocument();
    expect(screen.getByText(/Musterweg 5/)).toBeInTheDocument();
  });

  it("shows 'Bearbeiten' button when editSecret is available", () => {
    saveMyStand({ id: "test-1", address: "Musterweg 5", editSecret: "sec123" });
    renderApp();
    expect(screen.getByRole("button", { name: "Bearbeiten" })).toBeInTheDocument();
  });

  it("shows passkey button when credentialId is set and no editSecret", () => {
    saveMyStand({ id: "test-2", address: "Rosenstr. 3", credentialId: "cred-abc" });
    renderApp();
    expect(screen.getByRole("button", { name: "Mit Passkey anmelden" })).toBeInTheDocument();
  });

  it("shows reminder text when neither editSecret nor credentialId present", () => {
    saveMyStand({ id: "test-3", address: "Birkenweg 7" });
    renderApp();
    expect(screen.getByText(/Bearbeitungs-Link oeffnen/i)).toBeInTheDocument();
  });

  it("discover button navigates to map screen", async () => {
    renderApp();
    await userEvent.click(screen.getByText("Staende auf der Karte entdecken"));
    expect(screen.getByText("Interaktive Karte")).toBeInTheDocument();
  });

  it("register button navigates to register screen", async () => {
    renderApp();
    await userEvent.click(screen.getByText("Eigenen Stand anmelden"));
    expect(screen.getByText("Stand anmelden")).toBeInTheDocument();
  });
});

// ── MapScreen ─────────────────────────────────────────────────────────────────

describe("MapScreen", () => {
  async function openMap() {
    renderApp();
    await userEvent.click(screen.getByText("Karte"));
  }

  it("shows stand count in subtitle", async () => {
    await openMap();
    // 8 seed stands + 0 dynamic = 8
    expect(screen.getByText(/8 Staende gefunden/)).toBeInTheDocument();
  });

  it("renders the filter toggle button", async () => {
    await openMap();
    expect(screen.getByRole("button", { name: /Filter/ })).toBeInTheDocument();
  });

  it("shows category filters after toggling", async () => {
    await openMap();
    await userEvent.click(screen.getByRole("button", { name: /Filter anzeigen/ }));
    expect(screen.getByText("Kategorie")).toBeInTheDocument();
    expect(screen.getByText("Stadtteil")).toBeInTheDocument();
  });

  it("shows all-stands list", async () => {
    await openMap();
    // Seed stand names should appear in the list
    expect(screen.getByText("Familie Mueller")).toBeInTheDocument();
    expect(screen.getByText("Buecherwurm Zirndorf")).toBeInTheDocument();
  });

  it("selecting a stand shows its details", async () => {
    await openMap();
    await userEvent.click(screen.getByText("Familie Mueller"));
    expect(screen.getByText(/Kinderkleidung/)).toBeInTheDocument();
  });

  it("filtering by category reduces visible stands", async () => {
    await openMap();
    await userEvent.click(screen.getByRole("button", { name: /Filter anzeigen/ }));
    // Click "Buecher" category badge
    await userEvent.click(screen.getByRole("button", { name: "Buecher" }));
    // Only Buecherwurm Zirndorf and Flohmarkt Weinzierlein have Buecher/Medien/Vintage
    expect(screen.queryByText(/Staende gefunden/)).toBeInTheDocument();
    expect(screen.queryByText("Familie Mueller")).not.toBeInTheDocument();
  });
});

// ── InfoScreen ────────────────────────────────────────────────────────────────

describe("InfoScreen", () => {
  async function openInfo() {
    renderApp();
    await userEvent.click(screen.getByText("Info"));
  }

  it("renders the event date", async () => {
    await openInfo();
    expect(screen.getAllByText(/13\. Juni 2026/).length).toBeGreaterThan(0);
  });

  it("renders FAQ items", async () => {
    await openInfo();
    expect(screen.getByText("Brauche ich eine Genehmigung?")).toBeInTheDocument();
    expect(screen.getByText("Kostet die Teilnahme etwas?")).toBeInTheDocument();
  });

  it("expands a FAQ item on click", async () => {
    await openInfo();
    await userEvent.click(screen.getByText("Brauche ich eine Genehmigung?"));
    expect(screen.getByText(/keine Genehmigung noetig/)).toBeInTheDocument();
  });

  it("collapses an open FAQ item on second click", async () => {
    await openInfo();
    const q = screen.getByText("Brauche ich eine Genehmigung?");
    await userEvent.click(q);
    await userEvent.click(q);
    expect(screen.queryByText(/keine Genehmigung noetig/)).not.toBeInTheDocument();
  });
});

// ── RegisterScreen – 3-step form ─────────────────────────────────────────────

describe("RegisterScreen", () => {
  async function openRegister() {
    renderApp();
    await userEvent.click(screen.getByText("Anmelden"));
  }

  it("starts on step 1 (Standort)", async () => {
    await openRegister();
    expect(screen.getByText("Schritt 1 von 3")).toBeInTheDocument();
    expect(screen.getByText("Standort")).toBeInTheDocument();
  });

  it("'Weiter' button is disabled when address is empty", async () => {
    await openRegister();
    const next = screen.getByRole("button", { name: "Weiter" });
    expect(next).toBeDisabled();
  });

  it("'Weiter' button enables after typing an address", async () => {
    await openRegister();
    await userEvent.type(screen.getByPlaceholderText("z.B. Bahnhofstr. 12"), "Teststr. 5");
    expect(screen.getByRole("button", { name: "Weiter" })).toBeEnabled();
  });

  it("advances to step 2 when 'Weiter' is clicked with address", async () => {
    await openRegister();
    await userEvent.type(screen.getByPlaceholderText("z.B. Bahnhofstr. 12"), "Teststr. 5");
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(screen.getByText("Schritt 2 von 3")).toBeInTheDocument();
    expect(screen.getByText("Was bietest du an?")).toBeInTheDocument();
  });

  it("can go back from step 2 to step 1", async () => {
    await openRegister();
    await userEvent.type(screen.getByPlaceholderText("z.B. Bahnhofstr. 12"), "Teststr. 5");
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    await userEvent.click(screen.getByRole("button", { name: "Zurueck" }));
    expect(screen.getByText("Schritt 1 von 3")).toBeInTheDocument();
  });

  it("advances to step 3 (Zeit)", async () => {
    await openRegister();
    await userEvent.type(screen.getByPlaceholderText("z.B. Bahnhofstr. 12"), "Teststr. 5");
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    expect(screen.getByText("Schritt 3 von 3")).toBeInTheDocument();
    expect(screen.getByText("Wann bist du dabei?")).toBeInTheDocument();
  });

  it("toggles category badges on step 2", async () => {
    await openRegister();
    await userEvent.type(screen.getByPlaceholderText("z.B. Bahnhofstr. 12"), "Teststr. 5");
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    // "Buecher" badge should be a button
    const buecher = screen.getByRole("button", { name: "Buecher" });
    expect(buecher).toBeInTheDocument();
    await userEvent.click(buecher); // select
    await userEvent.click(buecher); // deselect – no crash
  });

  it("shows success screen after successful POST", async () => {
    const fakeStand = {
      id: "stand-uuid",
      address: "Teststr. 5",
      plz: "90513",
      district: "Kernstadt",
      label: "",
      categories: [],
      desc: "",
      time_from: "10:00",
      time_to: "16:00",
      editSecret: "secret-uuid",
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fakeStand,
    });

    await openRegister();
    await userEvent.type(screen.getByPlaceholderText("z.B. Bahnhofstr. 12"), "Teststr. 5");
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    await userEvent.click(screen.getByRole("button", { name: "Jetzt anmelden" }));

    await waitFor(() => {
      expect(screen.getByText("Anmeldung erfolgreich!")).toBeInTheDocument();
    });
  });

  it("saves editSecret to localStorage after successful POST", async () => {
    const fakeStand = {
      id: "stand-ls-test",
      address: "Spargelweg 1",
      plz: "90513",
      district: "Kernstadt",
      label: "",
      categories: [],
      desc: "",
      time_from: "10:00",
      time_to: "16:00",
      editSecret: "my-secret",
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fakeStand,
    });

    await openRegister();
    await userEvent.type(screen.getByPlaceholderText("z.B. Bahnhofstr. 12"), "Spargelweg 1");
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    await userEvent.click(screen.getByRole("button", { name: "Jetzt anmelden" }));

    await waitFor(() => screen.getByText("Anmeldung erfolgreich!"));

    const stored = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    expect(stored.some((s) => s.id === "stand-ls-test" && s.editSecret === "my-secret")).toBe(true);
  });

  it("shows edit link on success screen", async () => {
    const fakeStand = {
      id: "stand-link-test",
      address: "Amselweg 2",
      plz: "90513",
      district: "Kernstadt",
      label: "",
      categories: [],
      desc: "",
      time_from: "10:00",
      time_to: "16:00",
      editSecret: "link-secret",
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fakeStand,
    });

    await openRegister();
    await userEvent.type(screen.getByPlaceholderText("z.B. Bahnhofstr. 12"), "Amselweg 2");
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    await userEvent.click(screen.getByRole("button", { name: "Jetzt anmelden" }));

    await waitFor(() => screen.getByText("Anmeldung erfolgreich!"));
    expect(screen.getByText(/edit=stand-link-test/)).toBeInTheDocument();
    expect(screen.getByText(/secret=link-secret/)).toBeInTheDocument();
  });

  it("shows error screen on failed POST", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "server error" }),
    });

    await openRegister();
    await userEvent.type(screen.getByPlaceholderText("z.B. Bahnhofstr. 12"), "Fehlerstr. 1");
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    await userEvent.click(screen.getByRole("button", { name: "Jetzt anmelden" }));

    await waitFor(() => {
      expect(screen.getByText(/schiefgelaufen/i)).toBeInTheDocument();
    });
  });
});

// ── Passkey error banner ──────────────────────────────────────────────────────

describe("Passkey error banner", () => {
  it("shows error banner on passkey auth failure then dismisses", async () => {
    // window.PublicKeyCredential is undefined (no passkeys) per test-setup.js
    // Save a stand with only credentialId (no editSecret) to trigger passkey button
    saveMyStand({ id: "pk-stand", address: "Passkey-Str. 1", credentialId: "cred-abc" });

    renderApp();
    const btn = screen.getByRole("button", { name: "Mit Passkey anmelden" });
    await userEvent.click(btn);

    // Should show error because PublicKeyCredential is undefined
    await waitFor(() => {
      expect(screen.getByText(/WebAuthn not supported|fehlgeschlagen/i)).toBeInTheDocument();
    });

    // Dismiss the banner
    await userEvent.click(screen.getByRole("button", { name: "×" }));
    expect(screen.queryByText(/WebAuthn not supported|fehlgeschlagen/i)).not.toBeInTheDocument();
  });
});
