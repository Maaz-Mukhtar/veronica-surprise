export const GAME_IDS = ["lost-little-girl", "date-detective", "memory-crossword"] as const;

export type GameId = (typeof GAME_IDS)[number];
export type GameStatus = "not-started" | "in-progress" | "complete";

export type CrosswordEntry = {
  id: string;
  answer: string;
  clue: string;
  memoryHint: string;
  row: number;
  col: number;
  direction: "across" | "down";
};

export type CrosswordConfig = {
  title: string;
  intro: string;
  rows: number;
  cols: number;
  entries: CrosswordEntry[];
};

type QuestionBase = {
  id: string;
  prompt: string;
  explanation: string;
  evidence?: string;
};

export type ChoiceQuestion = QuestionBase & {
  type: "multiple-choice" | "speaker" | "mystery";
  options: string[];
  answer: string;
};

export type OrderingCard = { id: string; label: string; date: string };

export type OrderingQuestion = QuestionBase & {
  type: "ordering";
  cards: OrderingCard[];
  correctOrder: string[];
};

export type DateDetectiveQuestion = ChoiceQuestion | OrderingQuestion;

export type MazePosition = { row: number; col: number };

export type MazeCollectible = {
  id: "name-card" | "movie-ticket" | "phone";
  position: MazePosition;
  title: string;
  symbol: string;
  memory: string;
};

export type RelationshipGamesConfig = {
  id: string;
  version: number;
  title: string;
  intro: string;
  finalReward: { title: string; message: string };
  crossword: CrosswordConfig;
  dateDetective: {
    title: string;
    intro: string;
    questions: DateDetectiveQuestion[];
  };
  lostLittleGirl: {
    title: string;
    intro: string;
    rows: number;
    cols: number;
    walls: MazePosition[];
    start: MazePosition;
    goal: MazePosition;
    collectibles: MazeCollectible[];
  };
};

export type GameProgress = {
  completed: GameId[];
  crossword: {
    letters: Record<string, string>;
    hints: Record<string, number>;
  };
  dateDetective: {
    currentIndex: number;
    answers: Record<string, string>;
    submitted: string[];
    score: number;
    order: string[];
  };
  lostLittleGirl: {
    position: MazePosition;
    collectibles: string[];
    moves: number;
    visits: Record<string, number>;
  };
};
