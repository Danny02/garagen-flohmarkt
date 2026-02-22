import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SuccessScreen from "./SuccessScreen.jsx";

const layout = { isDesktop: false, isTablet: false, isMobile: true };

describe("SuccessScreen", () => {
  it("renders edit link and copies it", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });

    const setCopied = vi.fn();
    render(
      <SuccessScreen
        result={{
          id: "stand-1",
          editSecret: "secret-1",
          address: "A",
          plz: "90513",
          time_from: "10:00",
          time_to: "16:00",
          categories: [],
        }}
        editLink="https://example.test/?edit=stand-1&secret=secret-1"
        copied={false}
        setCopied={setCopied}
        layout={layout}
      />
    );

    expect(screen.getByText(/edit=stand-1/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Link kopieren/i }));
    expect(setCopied).toHaveBeenCalledWith(true);
  });

  it("hides recovery block when disabled", () => {
    render(
      <SuccessScreen
        result={{
          id: "stand-1",
          editSecret: "secret-1",
          address: "A",
          plz: "90513",
          time_from: "10:00",
          time_to: "16:00",
          categories: [],
        }}
        editLink="https://example.test"
        showRecoveryOptions={false}
        copied={false}
        setCopied={vi.fn()}
        layout={layout}
      />
    );

    expect(screen.queryByText(/Bearbeitungs-Link sichern/i)).not.toBeInTheDocument();
  });
});
