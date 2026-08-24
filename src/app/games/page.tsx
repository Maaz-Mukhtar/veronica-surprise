import type { Metadata } from "next";
import { GamePageShell } from "@/features/memory-games/game-shell";
import { MemoryGamesHub } from "@/features/memory-games/memory-games-hub";

export const metadata: Metadata = { title: "Our Memory Games — Kilig & Co." };

export default function GamesPage() {
  return <GamePageShell><MemoryGamesHub /></GamePageShell>;
}
