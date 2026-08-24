import { describe, expect, it } from "vitest";
import { PROGRESS_KEY, createDefaultProgress, parseProgress } from "./game-progress";

describe("memory game progress", () => {
  it("uses a versioned, relationship-specific key", () => {
    expect(PROGRESS_KEY).toBe("kilig-memory-games:veronica-kilig-and-co:v2");
  });

  it("falls back safely when storage is corrupt", () => {
    expect(parseProgress("not-json")).toEqual(createDefaultProgress());
  });

  it("keeps valid game completion and removes invalid IDs", () => {
    const parsed = parseProgress(JSON.stringify({
      completed: ["date-detective", "not-a-game"],
      crossword: { letters: { "1:1": "A" }, hints: {} },
    }));
    expect(parsed.completed).toEqual(["date-detective"]);
    expect(parsed.crossword.letters["1:1"]).toBe("A");
    expect(parsed.lostLittleGirl.position).toEqual(createDefaultProgress().lostLittleGirl.position);
  });
});
