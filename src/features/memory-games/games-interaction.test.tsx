import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { DateDetectiveGame } from "./date-detective-game";
import { LostLittleGirlGame } from "./lost-little-girl-game";
import { MemoryCrosswordGame } from "./memory-crossword-game";

describe("critical memory game interactions", () => {
  beforeEach(() => window.localStorage.clear());

  it("locks a submitted Date Detective answer and reveals its memory", async () => {
    const user = userEvent.setup();
    render(<DateDetectiveGame />);
    await user.click(screen.getByRole("radio", { name: "9 July 2026" }));
    await user.click(screen.getByRole("button", { name: "Submit evidence" }));
    expect(screen.getByText("Memory recovered ✦")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "9 July 2026 — correct" })).toBeDisabled();
  });

  it("moves Princess with the accessible maze controls", async () => {
    const user = userEvent.setup();
    render(<LostLittleGirlGame />);
    await user.click(screen.getByRole("button", { name: "Move east" }));
    expect(screen.getByText("Moved east.")).toBeInTheDocument();
    expect(screen.getByRole("gridcell", { name: "Row 7, column 2: Princess, the player" })).toBeInTheDocument();
  });

  it("accepts physical keyboard letters in the crossword", () => {
    render(<MemoryCrosswordGame />);
    const grid = screen.getByRole("grid", { name: "Memory crossword. Use letter keys, backspace, or arrow keys." });
    fireEvent.keyDown(grid, { key: "H" });
    expect(screen.getByRole("gridcell", { name: "Row 7, column 1, letter H" })).toHaveTextContent("H");
  });
});
