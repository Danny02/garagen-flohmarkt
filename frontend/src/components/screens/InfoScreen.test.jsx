import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InfoScreen from "./InfoScreen.jsx";

const layout = { isDesktop: false, isTablet: false, isMobile: true };

describe("InfoScreen", () => {
  it("renders FAQ and toggles answer visibility", async () => {
    render(<InfoScreen layout={layout} />);
    const question = screen.getByText("Brauche ich eine Genehmigung?");
    expect(question).toBeInTheDocument();

    await userEvent.click(question);
    expect(screen.getByText(/keine Genehmigung noetig/i)).toBeInTheDocument();

    await userEvent.click(question);
    expect(screen.queryByText(/keine Genehmigung noetig/i)).not.toBeInTheDocument();
  });
});
