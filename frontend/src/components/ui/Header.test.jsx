import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Header from "./Header.jsx";

describe("Header", () => {
  it("renders title and subtitle", () => {
    render(
      <Header
        title="Interaktive Karte"
        subtitle="8 Stände gefunden"
        layout={{ isDesktop: false }}
      />
    );

    expect(screen.getByRole("img", { name: /Zirndorfer Garagen-Flohmarkt Logo/i })).toBeInTheDocument();
    expect(screen.getByText("Interaktive Karte")).toBeInTheDocument();
    expect(screen.getByText("8 Stände gefunden")).toBeInTheDocument();
  });
});
