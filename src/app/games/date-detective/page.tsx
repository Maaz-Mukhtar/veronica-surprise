import type { Metadata } from "next";
import { DateDetectiveGame } from "@/features/memory-games/date-detective-game";
import { GamePageShell } from "@/features/memory-games/game-shell";

export const metadata: Metadata = { title: "Date Detective — Kilig & Co." };

export default function DateDetectivePage() {
  return <GamePageShell><DateDetectiveGame /></GamePageShell>;
}
