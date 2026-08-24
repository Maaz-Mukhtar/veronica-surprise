import { describe, expect, it } from "vitest";
import { memoryGamesConfig } from "./game-data";
import {
  buildCrosswordGrid,
  cellKey,
  chooseRevealCell,
  detectiveRank,
  isOrderingCorrect,
  isOpen,
  movePosition,
  normalizeAnswer,
  shortestPath,
  validateMaze,
} from "./game-utils";

describe("memory crossword rules", () => {
  it("builds the real puzzle without conflicts", () => {
    const config = memoryGamesConfig.crossword;
    const grid = buildCrosswordGrid(config.entries, config.rows, config.cols);
    expect(grid.cells.size).toBeGreaterThan(60);
    expect(grid.clueNumbers.hunter).toBeTypeOf("number");
  });

  it("rejects a conflicting intersection", () => {
    expect(() => buildCrosswordGrid([
      { id: "one", answer: "CAT", clue: "", memoryHint: "", row: 0, col: 0, direction: "across" },
      { id: "two", answer: "DOG", clue: "", memoryHint: "", row: 0, col: 0, direction: "down" },
    ], 4, 4)).toThrow("Conflicting crossword letters");
  });

  it("normalizes punctuation and reveals only an unfinished cell", () => {
    const entry = { id: "kilig", answer: "Kilig & Co.", clue: "", memoryHint: "", row: 0, col: 0, direction: "across" as const };
    expect(normalizeAnswer(entry.answer)).toBe("KILIGCO");
    const reveal = chooseRevealCell(entry, { [cellKey(0, 0)]: "K" });
    expect(reveal).toBe(cellKey(0, 1));
  });

  it("numbers shared starting cells deterministically", () => {
    const config = memoryGamesConfig.crossword;
    const first = buildCrosswordGrid(config.entries, config.rows, config.cols);
    const second = buildCrosswordGrid([...config.entries].reverse(), config.rows, config.cols);
    expect(first.clueNumbers.kilig).toBe(second.clueNumbers.kilig);
    expect(first.clueNumbers.kiligandco).toBe(first.clueNumbers.kilig);
  });
});

describe("date detective rules", () => {
  it("has valid configured answers and ordering", () => {
    for (const question of memoryGamesConfig.dateDetective.questions) {
      if (question.type === "ordering") {
        expect(new Set(question.correctOrder)).toEqual(new Set(question.cards.map((card) => card.id)));
        expect(isOrderingCorrect(question, question.correctOrder)).toBe(true);
      } else {
        expect(question.options).toContain(question.answer);
      }
    }
  });

  it("returns affectionate ranks without blocking completion", () => {
    expect(detectiveRank(10, 10)).toBe("Keeper of Our Entire Lore");
    expect(detectiveRank(5, 10)).toBe("Certified Memory Keeper");
    expect(detectiveRank(1, 10)).toBe("New Recruit");
  });
});

describe("lost little girl maze rules", () => {
  const config = memoryGamesConfig.lostLittleGirl;

  it("keeps the player inside open corridors", () => {
    expect(movePosition(config, config.start, "west")).toEqual(config.start);
    expect(isOpen(config, { row: 6, col: 1 })).toBe(true);
    expect(movePosition(config, config.start, "east")).toEqual({ row: 6, col: 1 });
  });

  it("keeps the goal and all collectibles reachable", () => {
    expect(validateMaze(config)).toBe(true);
    expect(shortestPath(config, config.start, config.goal).at(-1)).toEqual(config.goal);
  });
});
