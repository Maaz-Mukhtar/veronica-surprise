import type { Metadata } from "next";
import { GamePageShell } from "@/features/memory-games/game-shell";
import { MemoryCrosswordGame } from "@/features/memory-games/memory-crossword-game";

export const metadata: Metadata = { title: "Memory Crossword — Kilig & Co." };

export default function MemoryCrosswordPage() {
  return <GamePageShell><MemoryCrosswordGame /></GamePageShell>;
}
