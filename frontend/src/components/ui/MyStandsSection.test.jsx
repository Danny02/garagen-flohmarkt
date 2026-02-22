import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyStandsSection from "./MyStandsSection.jsx";

describe("MyStandsSection", () => {
  it("shows recovery button when no stands are saved", () => {
    render(
      <MyStandsSection
        myStands={[]}
        onEdit={vi.fn()}
        onPasskeyLogin={vi.fn()}
        onPasskeyRecoveryLogin={vi.fn()}
        onDelete={vi.fn()}
        canWrite={true}
      />
    );

    expect(screen.getByRole("button", { name: "Mit Passkey anmelden" })).toBeInTheDocument();
  });

  it("calls edit and delete handlers for editable stand", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <MyStandsSection
        myStands={[{ id: "1", address: "Testweg 1", editSecret: "sec" }]}
        onEdit={onEdit}
        onPasskeyLogin={vi.fn()}
        onPasskeyRecoveryLogin={vi.fn()}
        onDelete={onDelete}
        canWrite={true}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Bearbeiten" }));
    await userEvent.click(screen.getByRole("button", { name: "Stand loeschen" }));

    expect(onEdit).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
  });

  it("shows edit button for passkey-authenticated stand with session token", async () => {
    const onEdit = vi.fn();
    render(
      <MyStandsSection
        myStands={[{ id: "1", address: "Testweg 1", credentialId: "cred-1", sessionToken: "sess-1" }]}
        onEdit={onEdit}
        onPasskeyLogin={vi.fn()}
        onPasskeyRecoveryLogin={vi.fn()}
        onDelete={vi.fn()}
        canWrite={true}
      />
    );

    expect(screen.queryByRole("button", { name: "Mit Passkey anmelden" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Bearbeiten" }));
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }), null, "sess-1");
  });
});
