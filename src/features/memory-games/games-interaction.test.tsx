import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CinemaMallGame } from "./cinema-mall-game";
import { DateDetectiveGame } from "./date-detective-game";
import { MemoryCrosswordGame } from "./memory-crossword-game";
import { PROGRESS_KEY } from "./game-progress";

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

  it("starts the cinema search and saves game progress", async () => {
    const user = userEvent.setup();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    render(<CinemaMallGame />);
    await user.click(screen.getByRole("button", { name: "Enter the mall" }));
    expect(screen.getByRole("heading", { name: "Find Mahal." })).toBeInTheDocument();
    const saved = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? "{}");
    expect(saved.lostLittleGirl.moves).toBe(1);
  });

  it("accepts physical keyboard letters in the crossword", () => {
    render(<MemoryCrosswordGame />);
    const grid = screen.getByRole("grid", { name: "Memory crossword. Use letter keys, backspace, or arrow keys." });
    fireEvent.keyDown(grid, { key: "H" });
    expect(screen.getByRole("gridcell", { name: "Row 7, column 1, letter H" })).toHaveTextContent("H");
  });
});
