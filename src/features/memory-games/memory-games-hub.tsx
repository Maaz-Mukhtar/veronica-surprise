"use client";

import confetti from "canvas-confetti";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { memoryGamesConfig } from "./game-data";
import { statusForGame, useGameProgress } from "./game-progress";
import type { GameId } from "./types";
import styles from "./memory-games.module.css";

const cards: Array<{ id: GameId; href: string; icon: string; title: string; description: string }> = [
  { id: "lost-little-girl", href: "/games/lost-little-girl", icon: "⌖", title: "Find the Lost Little Girl", description: "Replay the cinema rescue and find Mahal before the movie starts." },
  { id: "date-detective", href: "/games/date-detective", icon: "✦", title: "Date Detective", description: "Put the dates, messages, and milestones of Kilig & Co. back together." },
  { id: "memory-crossword", href: "/games/memory-crossword", icon: "A♡", title: "Memory Crossword", description: "Solve the words and places that became part of our shared language." },
];

const statusLabels = { "not-started": "Not started", "in-progress": "In progress", complete: "Complete" };

function GameCards({ compact = false }: { compact?: boolean }) {
  const { progress } = useGameProgress();
  return (
    <div className={compact ? styles.teaserGrid : styles.hubGrid}>
      {cards.map((card) => {
        const status = statusForGame(progress, card.id);
        return (
          <Link key={card.id} href={card.href} className={styles.gameCard}>
            <span className={styles.gameIcon} aria-hidden="true">{card.icon}</span>
            <h4>{card.title}</h4>
            <p>{card.description}</p>
            <span className={styles.gameCardFooter}>
              <span className={`${styles.status} ${status === "complete" ? styles.statusComplete : ""}`}>
                {statusLabels[status]}
              </span>
              <span>{status === "not-started" ? "Play →" : status === "complete" ? "Replay →" : "Continue →"}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function MemoryGamesTeaser() {
  const { progress } = useGameProgress();
  return (
    <article className={styles.teaser}>
      <p className={styles.eyebrow}>A new chapter to play</p>
      <h3>{memoryGamesConfig.title}</h3>
      <p>{memoryGamesConfig.intro}</p>
      <div className={styles.progressBar} aria-hidden="true">
        <span style={{ width: `${(progress.completed.length / 3) * 100}%` }} />
      </div>
      <div className={styles.progressLabel}>{progress.completed.length} of 3 memories recovered</div>
      <GameCards compact />
    </article>
  );
}

export function MemoryGamesHub() {
  const { progress, resetAll } = useGameProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const celebrated = useRef(false);
  const allComplete = progress.completed.length === 3;

  useEffect(() => {
    if (!allComplete || celebrated.current) return;
    celebrated.current = true;
    confetti({ particleCount: 130, spread: 90, origin: { y: 0.62 }, colors: ["#e4a9c2", "#a984c1", "#9ecfbe", "#f1c978"] });
  }, [allComplete]);

  return (
    <>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Kilig &amp; Co. presents</p>
        <h1>{memoryGamesConfig.title}</h1>
        <p>{memoryGamesConfig.intro}</p>
        <div className={styles.progressBar} aria-hidden="true">
          <span style={{ width: `${(progress.completed.length / 3) * 100}%` }} />
        </div>
        <div className={styles.progressLabel}>{progress.completed.length} of 3 memories recovered</div>
      </section>

      <GameCards />

      {allComplete && (
        <section className={styles.vault} aria-live="polite">
          <p className={styles.eyebrow}>Memory vault unlocked</p>
          <h2>{memoryGamesConfig.finalReward.title}</h2>
          <p>{memoryGamesConfig.finalReward.message}</p>
          <div className={styles.buttonRow} style={{ justifyContent: "center" }}>
            <Link href="/#our-timeline" className={styles.primaryButton}>Revisit our story</Link>
          </div>
        </section>
      )}

      <section className={styles.panel}>
        <div className={styles.buttonRow}>
          {!confirmReset ? (
            <button type="button" className={styles.secondaryButton} onClick={() => setConfirmReset(true)}>Reset all game progress</button>
          ) : (
            <>
              <span>Reset all three games?</span>
              <button type="button" className={styles.primaryButton} onClick={() => { resetAll(); setConfirmReset(false); }}>Yes, reset</button>
              <button type="button" className={styles.secondaryButton} onClick={() => setConfirmReset(false)}>Keep progress</button>
            </>
          )}
        </div>
      </section>
    </>
  );
}
