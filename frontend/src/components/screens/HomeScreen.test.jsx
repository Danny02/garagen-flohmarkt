import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomeScreen from "./HomeScreen.jsx";

const layout = { isDesktop: false, isTablet: false, isMobile: true };

function renderScreen(overrides = {}) {
  return render(
    <HomeScreen
      setScreen={vi.fn()}
      totalStands={8}
      myStands={[]}
      onEditMyStand={vi.fn()}
      onPasskeyLogin={vi.fn()}
      onPasskeyRecoveryLogin={vi.fn()}
      onDeleteMyStand={vi.fn()}
      canWrite={true}
      layout={layout}
      {...overrides}
    />
  );
}

describe("HomeScreen", () => {
  it("renders title and action buttons", () => {
    renderScreen();
    expect(screen.getByText("Garagenflohmarkt Zirndorf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Staende auf der Karte entdecken/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Eigenen Stand anmelden/i })).toBeInTheDocument();
  });

  it("navigates to map and register", async () => {
    const setScreen = vi.fn();
    renderScreen({ setScreen });
    await userEvent.click(screen.getByRole("button", { name: /Staende auf der Karte entdecken/i }));
    await userEvent.click(screen.getByRole("button", { name: /Eigenen Stand anmelden/i }));
    expect(setScreen).toHaveBeenCalledWith("map");
    expect(setScreen).toHaveBeenCalledWith("register");
  });
});
