import type {
  CrosswordEntry,
  DateDetectiveQuestion,
  OrderingQuestion,
  RelationshipGamesConfig,
  MazePosition,
} from "./types";

export type CrosswordCell = {
  row: number;
  col: number;
  answer: string;
  entryIds: string[];
  number?: number;
};

export type CrosswordGrid = {
  cells: Map<string, CrosswordCell>;
  clueNumbers: Record<string, number>;
  rows: number;
  cols: number;
};

export function cellKey(row: number, col: number) {
  return `${row}:${col}`;
}

export function normalizeAnswer(value: string) {
  return value.toUpperCase().replace(/[^A-Z]/g, "");
}

export function entryCellKeys(entry: CrosswordEntry) {
  const answer = normalizeAnswer(entry.answer);
  return Array.from({ length: answer.length }, (_, index) =>
    cellKey(
      entry.row + (entry.direction === "down" ? index : 0),
      entry.col + (entry.direction === "across" ? index : 0),
    ),
  );
}

export function buildCrosswordGrid(
  entries: CrosswordEntry[],
  rows: number,
  cols: number,
): CrosswordGrid {
  const byId = new Map<string, CrosswordEntry>();
  const cells = new Map<string, CrosswordCell>();

  for (const entry of entries) {
    if (byId.has(entry.id)) throw new Error(`Duplicate crossword entry: ${entry.id}`);
    byId.set(entry.id, entry);
    const answer = normalizeAnswer(entry.answer);
    if (!answer) throw new Error(`Crossword entry ${entry.id} has no letters`);

    for (let index = 0; index < answer.length; index += 1) {
      const row = entry.row + (entry.direction === "down" ? index : 0);
      const col = entry.col + (entry.direction === "across" ? index : 0);
      if (row < 0 || col < 0 || row >= rows || col >= cols) {
        throw new Error(`Crossword entry ${entry.id} is outside the configured grid`);
      }
      const key = cellKey(row, col);
      const existing = cells.get(key);
      if (existing?.entryIds.some((id) => byId.get(id)?.direction === entry.direction)) {
        throw new Error(`Overlapping ${entry.direction} answers at ${key}`);
      }
      if (existing && existing.answer !== answer[index]) {
        throw new Error(`Conflicting crossword letters at ${key}`);
      }
      cells.set(key, {
        row,
        col,
        answer: answer[index],
        entryIds: existing ? [...existing.entryIds, entry.id] : [entry.id],
      });
    }
  }

  const starts = entries
    .map((entry) => ({ entry, key: cellKey(entry.row, entry.col) }))
    .sort((a, b) => a.entry.row - b.entry.row || a.entry.col - b.entry.col);
  const numberByCell = new Map<string, number>();
  const clueNumbers: Record<string, number> = {};
  let nextNumber = 1;

  for (const { entry, key } of starts) {
    let number = numberByCell.get(key);
    if (!number) {
      number = nextNumber;
      nextNumber += 1;
      numberByCell.set(key, number);
      const cell = cells.get(key);
      if (cell) cells.set(key, { ...cell, number });
    }
    clueNumbers[entry.id] = number;
  }

  return { cells, clueNumbers, rows, cols };
}

export function entryLetter(entry: CrosswordEntry, key: string) {
  const index = entryCellKeys(entry).indexOf(key);
  return index >= 0 ? normalizeAnswer(entry.answer)[index] : undefined;
}

export function isEntryCorrect(entry: CrosswordEntry, letters: Record<string, string>) {
  return entryCellKeys(entry).every((key) => letters[key] === entryLetter(entry, key));
}

export function chooseRevealCell(entry: CrosswordEntry, letters: Record<string, string>) {
  return entryCellKeys(entry).find((key) => letters[key] !== entryLetter(entry, key));
}

export function isOrderingCorrect(question: OrderingQuestion, order: string[]) {
  return question.correctOrder.every((id, index) => order[index] === id);
}

export function isQuestionCorrect(question: DateDetectiveQuestion, answer: string | string[]) {
  if (question.type === "ordering") {
    return Array.isArray(answer) && isOrderingCorrect(question, answer);
  }
  return typeof answer === "string" && answer === question.answer;
}

export function detectiveRank(score: number, total: number) {
  if (score === total) return "Keeper of Our Entire Lore";
  const ratio = total ? score / total : 0;
  if (ratio >= 0.75) return "Senior Kilig Detective";
  if (ratio >= 0.4) return "Certified Memory Keeper";
  return "New Recruit";
}

export type MazeDirection = "north" | "south" | "east" | "west";

const DELTAS: Record<MazeDirection, MazePosition> = {
  north: { row: -1, col: 0 },
  south: { row: 1, col: 0 },
  east: { row: 0, col: 1 },
  west: { row: 0, col: -1 },
};

export function positionKey(position: MazePosition) {
  return `${position.row}:${position.col}`;
}

export function samePosition(a: MazePosition, b: MazePosition) {
  return a.row === b.row && a.col === b.col;
}

export function isOpen(config: RelationshipGamesConfig["lostLittleGirl"], position: MazePosition) {
  return (
    position.row >= 0 &&
    position.col >= 0 &&
    position.row < config.rows &&
    position.col < config.cols &&
    !config.walls.some((wall) => samePosition(wall, position))
  );
}

export function movePosition(
  config: RelationshipGamesConfig["lostLittleGirl"],
  position: MazePosition,
  direction: MazeDirection,
) {
  const delta = DELTAS[direction];
  const next = { row: position.row + delta.row, col: position.col + delta.col };
  return isOpen(config, next) ? next : position;
}

export function shortestPath(
  config: RelationshipGamesConfig["lostLittleGirl"],
  start: MazePosition,
  goal: MazePosition,
) {
  const queue: MazePosition[] = [start];
  const visited = new Set([positionKey(start)]);
  const previous = new Map<string, MazePosition>();

  while (queue.length) {
    const current = queue.shift()!;
    if (samePosition(current, goal)) {
      const path: MazePosition[] = [current];
      let cursor = previous.get(positionKey(current));
      while (cursor) {
        path.unshift(cursor);
        cursor = previous.get(positionKey(cursor));
      }
      return path;
    }
    for (const direction of Object.keys(DELTAS) as MazeDirection[]) {
      const next = movePosition(config, current, direction);
      const key = positionKey(next);
      if (samePosition(next, current) || visited.has(key)) continue;
      visited.add(key);
      previous.set(key, current);
      queue.push(next);
    }
  }
  return [];
}

export function validateMaze(config: RelationshipGamesConfig["lostLittleGirl"]) {
  return (
    shortestPath(config, config.start, config.goal).length > 0 &&
    config.collectibles.every((item) => shortestPath(config, config.start, item.position).length > 0)
  );
}
