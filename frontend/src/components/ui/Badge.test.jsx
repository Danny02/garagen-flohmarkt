import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Badge from "./Badge.jsx";

describe("Badge", () => {
  it("renders and triggers onClick", async () => {
    const onClick = vi.fn();
    render(
      <Badge color="#0093FC" active={false} onClick={onClick}>
        Bücher
      </Badge>
    );

    await userEvent.click(screen.getByRole("button", { name: "Bücher" }));
    expect(onClick).toHaveBeenCalled();
  });
});
