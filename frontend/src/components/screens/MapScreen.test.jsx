import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MapScreen from "./MapScreen.jsx";

const layout = { isDesktop: false, isTablet: false, isMobile: true, contentMaxWidth: 430 };

describe("MapScreen", () => {
  it("renders header and stand list", () => {
    render(<MapScreen dynamicStands={[]} layout={layout} />);
    expect(screen.getByText("Interaktive Karte")).toBeInTheDocument();
    expect(screen.getByText(/Stände gefunden/i)).toBeInTheDocument();
    expect(screen.getByText("Familie Müller")).toBeInTheDocument();
  });

  it("shows filters and applies category filter", async () => {
    render(<MapScreen dynamicStands={[]} layout={layout} />);
    await userEvent.click(screen.getByRole("button", { name: /Filter anzeigen/i }));
    await userEvent.click(screen.getByRole("button", { name: "Bücher" }));
    expect(screen.queryByText("Familie Müller")).not.toBeInTheDocument();
  });
});
