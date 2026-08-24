"use client";

import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { memoryGamesConfig } from "./game-data";
import { createDefaultProgress, useGameProgress } from "./game-progress";
import {
  isOpen,
  movePosition,
  positionKey,
  samePosition,
  shortestPath,
  type MazeDirection,
} from "./game-utils";
import styles from "./memory-games.module.css";

const directionLabels: Record<MazeDirection, string> = {
  north: "north",
  south: "south",
  east: "east",
  west: "west",
};

export function LostLittleGirlGame() {
  const config = memoryGamesConfig.lostLittleGirl;
  const { progress, update, completeGame } = useGameProgress();
  const maze = progress.lostLittleGirl;
  const [announcement, setAnnouncement] = useState("Help Princess reach Mahal before the movie starts.");
  const [helpCells, setHelpCells] = useState<string[]>([]);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const finished = samePosition(maze.position, config.goal);
  const maxVisits = Math.max(0, ...Object.values(maze.visits));
  const helpAvailable = !finished && (maze.moves >= 12 || maxVisits >= 3);
  const foundItems = config.collectibles.filter((item) => maze.collectibles.includes(item.id));

  const cells = useMemo(
    () => Array.from({ length: config.rows * config.cols }, (_, index) => ({
      row: Math.floor(index / config.cols),
      col: index % config.cols,
    })),
    [config.cols, config.rows],
  );

  const move = (direction: MazeDirection) => {
    if (finished) return;
    const next = movePosition(config, maze.position, direction);
    if (samePosition(next, maze.position)) {
      setAnnouncement("That corridor is blocked.");
      return;
    }

    const collectible = config.collectibles.find((item) => samePosition(item.position, next));
    const isNewCollectible = collectible && !maze.collectibles.includes(collectible.id);
    const nextCollectibles = isNewCollectible
      ? [...maze.collectibles, collectible.id]
      : maze.collectibles;
    const key = positionKey(next);
    const visits = { ...maze.visits, [key]: (maze.visits[key] ?? 0) + 1 };
    const reachedGoal = samePosition(next, config.goal);

    update((current) => ({
      ...current,
      lostLittleGirl: {
        position: next,
        collectibles: nextCollectibles,
        moves: current.lostLittleGirl.moves + 1,
        visits,
      },
    }));
    setHelpCells([]);

    if (reachedGoal) {
      setAnnouncement("You found Mahal outside the cinema.");
      completeGame("lost-little-girl");
    } else if (isNewCollectible && collectible) {
      setAnnouncement(`Found the ${collectible.title}. ${collectible.memory}`);
    } else if ((visits[key] ?? 0) >= 3) {
      setAnnouncement("Mahal: Where are youuuu?");
    } else {
      setAnnouncement(`Moved ${directionLabels[direction]}.`);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, MazeDirection> = {
      ArrowUp: "north", w: "north", W: "north",
      ArrowDown: "south", s: "south", S: "south",
      ArrowLeft: "west", a: "west", A: "west",
      ArrowRight: "east", d: "east", D: "east",
    };
    const direction = keys[event.key];
    if (!direction) return;
    event.preventDefault();
    move(direction);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current) return;
    const dx = event.clientX - pointerStart.current.x;
    const dy = event.clientY - pointerStart.current.y;
    pointerStart.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "east" : "west");
    else move(dy > 0 ? "south" : "north");
  };

  const callForHelp = () => {
    const path = shortestPath(config, maze.position, config.goal).slice(1, 6);
    setHelpCells(path.map(positionKey));
    setAnnouncement("Mahal highlighted the next few steps toward the cinema.");
  };

  const replay = () => {
    update((current) => ({ ...current, lostLittleGirl: createDefaultProgress().lostLittleGirl }));
    setHelpCells([]);
    setAnnouncement("Princess is ready to find Mahal again.");
  };

  return (
    <section className={styles.gamePanel}>
      <p className={styles.eyebrow}>First meeting — 9 July 2026</p>
      <h1>{config.title}</h1>
      <p className={styles.gameIntro}>{config.intro}</p>

      {!finished && (
        <div className={styles.chatBubbles} aria-label="Opening chat messages">
          <p>Princess: “I got lost.”</p>
          <p>Princess: “I’m going round in circles.”</p>
          <p>Princess: “Come save me 😂”</p>
        </div>
      )}

      {finished && (
        <div className={styles.vault} aria-live="polite">
          <p className={styles.eyebrow}>Cinema entrance found</p>
          <h2>She found the person she had been searching for.</h2>
          <p>She thought she was only looking for the cinema. That night, Mahal and Princess finally found each other.</p>
          {foundItems.length === config.collectibles.length && <strong>Perfect rescue — all three memories recovered ✦</strong>}
        </div>
      )}

      <div className={styles.mazeScroller}>
        <div
          className={styles.mazeGrid}
          style={{ gridTemplateColumns: `repeat(${config.cols}, 48px)` }}
          role="grid"
          tabIndex={0}
          aria-label="Dreamy cinema maze. Use arrow keys, WASD, swipe, or the direction buttons."
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {cells.map((position) => {
            const key = positionKey(position);
            const wall = !isOpen(config, position);
            const goal = samePosition(position, config.goal);
            const player = samePosition(position, maze.position);
            const collectible = config.collectibles.find((item) => samePosition(item.position, position));
            const collectibleFound = collectible && maze.collectibles.includes(collectible.id);
            const label = wall
              ? "Closed shop block"
              : player
                ? "Princess, the player"
                : goal
                  ? "Mahal waiting at the cinema"
                  : collectible && !collectibleFound
                    ? collectible.title
                    : "Open corridor";
            return (
              <div
                key={key}
                role="gridcell"
                aria-label={`Row ${position.row + 1}, column ${position.col + 1}: ${label}`}
                className={`${styles.mazeCell} ${wall ? styles.mazeWall : ""} ${goal ? styles.mazeGoal : ""} ${helpCells.includes(key) ? styles.helpCell : ""}`}
              >
                {goal && !player && <span aria-hidden="true">CINEMA</span>}
                {collectible && !collectibleFound && !player && <span className={styles.mazeCollectible} aria-hidden="true">{collectible.symbol}</span>}
                {player && <span className={styles.mazePlayer} aria-hidden="true">P</span>}
              </div>
            );
          })}
        </div>
      </div>

      <p className={styles.liveMessage} aria-live="polite">{announcement}</p>

      {!finished && (
        <>
          <div className={styles.mazeControls} aria-label="Maze direction controls">
            <button type="button" className={`${styles.directionButton} ${styles.up}`} onClick={() => move("north")} aria-label="Move north">↑</button>
            <button type="button" className={`${styles.directionButton} ${styles.left}`} onClick={() => move("west")} aria-label="Move west">←</button>
            <button type="button" className={`${styles.directionButton} ${styles.down}`} onClick={() => move("south")} aria-label="Move south">↓</button>
            <button type="button" className={`${styles.directionButton} ${styles.right}`} onClick={() => move("east")} aria-label="Move east">→</button>
          </div>
          {helpAvailable && (
            <div className={styles.buttonRow} style={{ justifyContent: "center", marginTop: "1rem" }}>
              <button type="button" className={styles.primaryButton} onClick={callForHelp}>Call Mahal for help</button>
            </div>
          )}
        </>
      )}

      <div className={styles.collectibleList} aria-label="Optional memory collectibles">
        {config.collectibles.map((item) => {
          const found = maze.collectibles.includes(item.id);
          return (
            <div key={item.id} className={`${styles.collectibleItem} ${found ? styles.collectibleFound : ""}`}>
              <strong>{found ? `Found: ${item.title}` : `Missing: ${item.title}`}</strong>
              {found && <div>{item.memory}</div>}
            </div>
          );
        })}
      </div>

      <div className={styles.buttonRow} style={{ justifyContent: "center", marginTop: "1rem" }}>
        <a href="/games" className={styles.primaryButton}>Back to games</a>
        <button type="button" className={styles.secondaryButton} onClick={replay}>Play again</button>
      </div>
    </section>
  );
}
