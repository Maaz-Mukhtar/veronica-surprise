import type { Metadata } from "next";
import { CinemaMallGame } from "@/features/memory-games/cinema-mall-game";

export const metadata: Metadata = {
  title: "Mall After Dark — Find Mahal",
  description: "Search four floors and find Mahal waiting outside the cinema.",
};

export default function LostLittleGirlPage() {
  return <CinemaMallGame />;
}
