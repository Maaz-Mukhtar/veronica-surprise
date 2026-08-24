import type { Metadata } from "next";
import { GamePageShell } from "@/features/memory-games/game-shell";
import { LostLittleGirlGame } from "@/features/memory-games/lost-little-girl-game";

export const metadata: Metadata = { title: "Find the Lost Little Girl — Kilig & Co." };

export default function LostLittleGirlPage() {
  return <GamePageShell><LostLittleGirlGame /></GamePageShell>;
}
