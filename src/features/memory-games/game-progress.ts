"use client";

import { useCallback, useSyncExternalStore } from "react";
import { memoryGamesConfig } from "./game-data";
import { GAME_IDS, type GameId, type GameProgress, type GameStatus } from "./types";

export const PROGRESS_KEY = `kilig-memory-games:${memoryGamesConfig.id}:v${memoryGamesConfig.version}`;
const PROGRESS_EVENT = "kilig-memory-games-updated";

export function createDefaultProgress(): GameProgress {
  const ordering = memoryGamesConfig.dateDetective.questions.find(
    (question) => question.type === "ordering",
  );
  return {
    completed: [],
    crossword: { letters: {}, hints: {} },
    dateDetective: {
      currentIndex: 0,
      answers: {},
      submitted: [],
      score: 0,
      order: ordering?.cards.map((card) => card.id) ?? [],
    },
    lostLittleGirl: {
      position: memoryGamesConfig.lostLittleGirl.start,
      collectibles: [],
      moves: 0,
      visits: { [`${memoryGamesConfig.lostLittleGirl.start.row}:${memoryGamesConfig.lostLittleGirl.start.col}`]: 1 },
    },
  };
}

const SERVER_SNAPSHOT = createDefaultProgress();
let cachedRaw: string | null | undefined;
let cachedSnapshot = SERVER_SNAPSHOT;

function stringRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([, item]) => typeof item === "string"));
}

function numberRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => typeof item === "number" && Number.isFinite(item)),
  );
}

export function parseProgress(raw: string | null): GameProgress {
  const fallback = createDefaultProgress();
  if (!raw) return fallback;
  try {
    const value = JSON.parse(raw) as Partial<GameProgress>;
    const completed = Array.isArray(value.completed)
      ? value.completed.filter((id): id is GameId => GAME_IDS.includes(id as GameId))
      : [];
    const position = value.lostLittleGirl?.position;
    const safePosition =
      position &&
      Number.isInteger(position.row) &&
      Number.isInteger(position.col) &&
      position.row >= 0 &&
      position.col >= 0 &&
      position.row < memoryGamesConfig.lostLittleGirl.rows &&
      position.col < memoryGamesConfig.lostLittleGirl.cols
        ? position
        : fallback.lostLittleGirl.position;

    return {
      completed: [...new Set(completed)],
      crossword: {
        letters: stringRecord(value.crossword?.letters),
        hints: numberRecord(value.crossword?.hints),
      },
      dateDetective: {
        currentIndex:
          typeof value.dateDetective?.currentIndex === "number"
            ? Math.max(0, Math.min(value.dateDetective.currentIndex, memoryGamesConfig.dateDetective.questions.length))
            : 0,
        answers: stringRecord(value.dateDetective?.answers),
        submitted: Array.isArray(value.dateDetective?.submitted)
          ? value.dateDetective.submitted.filter((item): item is string => typeof item === "string")
          : [],
        score: typeof value.dateDetective?.score === "number" ? Math.max(0, value.dateDetective.score) : 0,
        order: Array.isArray(value.dateDetective?.order)
          ? value.dateDetective.order.filter((item): item is string => typeof item === "string")
          : fallback.dateDetective.order,
      },
      lostLittleGirl: {
        position: safePosition,
        collectibles: Array.isArray(value.lostLittleGirl?.collectibles)
          ? value.lostLittleGirl.collectibles.filter((item): item is string => typeof item === "string")
          : [],
        moves: typeof value.lostLittleGirl?.moves === "number" ? Math.max(0, value.lostLittleGirl.moves) : 0,
        visits: numberRecord(value.lostLittleGirl?.visits),
      },
    };
  } catch {
    return fallback;
  }
}

function getSnapshot() {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  const raw = window.localStorage.getItem(PROGRESS_KEY);
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = parseProgress(raw);
  return cachedSnapshot;
}

function subscribe(listener: () => void) {
  const notify = () => listener();
  window.addEventListener("storage", notify);
  window.addEventListener(PROGRESS_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(PROGRESS_EVENT, notify);
  };
}

function writeProgress(updater: (current: GameProgress) => GameProgress) {
  const next = updater(getSnapshot());
  const raw = JSON.stringify(next);
  window.localStorage.setItem(PROGRESS_KEY, raw);
  cachedRaw = raw;
  cachedSnapshot = next;
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

export function statusForGame(progress: GameProgress, gameId: GameId): GameStatus {
  if (progress.completed.includes(gameId)) return "complete";
  if (gameId === "memory-crossword" && Object.keys(progress.crossword.letters).length) return "in-progress";
  if (gameId === "date-detective" && progress.dateDetective.submitted.length) return "in-progress";
  if (gameId === "lost-little-girl" && progress.lostLittleGirl.moves) return "in-progress";
  return "not-started";
}

export function useGameProgress() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
  const update = useCallback((updater: (current: GameProgress) => GameProgress) => {
    writeProgress(updater);
  }, []);
  const completeGame = useCallback((gameId: GameId) => {
    writeProgress((current) =>
      current.completed.includes(gameId)
        ? current
        : { ...current, completed: [...current.completed, gameId] },
    );
  }, []);
  const resetAll = useCallback(() => {
    window.localStorage.removeItem(PROGRESS_KEY);
    cachedRaw = null;
    cachedSnapshot = createDefaultProgress();
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  }, []);
  return { progress, update, completeGame, resetAll };
}
