import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NavBar from "./NavBar.jsx";

describe("NavBar", () => {
  it("renders nav items", () => {
    render(
      <NavBar
        active="home"
        setScreen={vi.fn()}
        layout={{ isMobile: true, contentMaxWidth: 430 }}
        canWrite={true}
      />
    );

    expect(screen.getByRole("button", { name: /Start/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Karte/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Anmelden/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Info/ })).toBeInTheDocument();
  });

  it("navigates and disables register when canWrite=false", async () => {
    const setScreen = vi.fn();
    render(
      <NavBar
        active="home"
        setScreen={setScreen}
        layout={{ isMobile: true, contentMaxWidth: 430 }}
        canWrite={false}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /Karte/ }));
    expect(setScreen).toHaveBeenCalledWith("map");
    expect(screen.getByRole("button", { name: /Anmelden/ })).toBeDisabled();
  });
});
