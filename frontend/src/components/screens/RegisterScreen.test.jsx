import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterScreen from "./RegisterScreen.jsx";

const layout = { isDesktop: false, isTablet: false, isMobile: true };

function renderScreen(overrides = {}) {
  return render(
    <RegisterScreen
      onRegistered={vi.fn()}
      editMode={null}
      createEditSecret={null}
      layout={layout}
      {...overrides}
    />
  );
}

describe("RegisterScreen", () => {
  it("starts at step 1 and enables next after address input", async () => {
    renderScreen();
    expect(screen.getByText("Schritt 1 von 3")).toBeInTheDocument();
    const next = screen.getByRole("button", { name: "Weiter" });
    expect(next).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText("z.B. Bahnhofstr. 12"), "Teststr. 5");
    expect(screen.getByRole("button", { name: "Weiter" })).toBeEnabled();
  });

  it("submits and shows success screen", async () => {
    const onRegistered = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "stand-1",
        address: "Teststr. 5",
        plz: "90513",
        district: "Kernstadt",
        categories: [],
        desc: "",
        time_from: "10:00",
        time_to: "16:00",
        editSecret: "secret-1",
      }),
    });

    renderScreen({ onRegistered });
    await userEvent.type(screen.getByPlaceholderText("z.B. Bahnhofstr. 12"), "Teststr. 5");
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    await userEvent.click(screen.getByRole("button", { name: "Weiter" }));
    await userEvent.click(screen.getByRole("button", { name: "Jetzt anmelden" }));

    await waitFor(() => {
      expect(screen.getByText("Anmeldung erfolgreich!")).toBeInTheDocument();
    });
    expect(onRegistered).toHaveBeenCalled();
  });
});
