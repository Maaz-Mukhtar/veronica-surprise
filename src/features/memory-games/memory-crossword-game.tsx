"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { memoryGamesConfig } from "./game-data";
import { useGameProgress } from "./game-progress";
import {
  buildCrosswordGrid,
  cellKey,
  chooseRevealCell,
  entryCellKeys,
  entryLetter,
  isEntryCorrect,
  normalizeAnswer,
} from "./game-utils";
import styles from "./memory-games.module.css";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function MemoryCrosswordGame() {
  const config = memoryGamesConfig.crossword;
  const grid = useMemo(() => buildCrosswordGrid(config.entries, config.rows, config.cols), [config]);
  const { progress, update, completeGame } = useGameProgress();
  const letters = progress.crossword.letters;
  const [selectedEntryId, setSelectedEntryId] = useState(config.entries[0].id);
  const [selectedKey, setSelectedKey] = useState(entryCellKeys(config.entries[0])[0]);
  const [feedback, setFeedback] = useState("Select a square and start typing.");
  const gridRef = useRef<HTMLDivElement | null>(null);
  const selectedEntry = config.entries.find((entry) => entry.id === selectedEntryId) ?? config.entries[0];
  const selectedKeys = entryCellKeys(selectedEntry);
  const correctEntries = config.entries.filter((entry) => isEntryCorrect(entry, letters));
  const allCorrect = correctEntries.length === config.entries.length;
  const hintLevel = progress.crossword.hints[selectedEntry.id] ?? 0;

  const persistLetters = (nextLetters: Record<string, string>) => {
    update((current) => ({
      ...current,
      crossword: { ...current.crossword, letters: nextLetters },
    }));
  };

  const selectCell = (key: string) => {
    const cell = grid.cells.get(key);
    if (!cell) return;
    if (cell.entryIds.length > 1 && key === selectedKey && cell.entryIds.includes(selectedEntryId)) {
      const nextId = cell.entryIds.find((id) => id !== selectedEntryId);
      if (nextId) setSelectedEntryId(nextId);
    } else if (!cell.entryIds.includes(selectedEntryId)) {
      setSelectedEntryId(cell.entryIds[0]);
    }
    setSelectedKey(key);
    gridRef.current?.focus();
  };

  const enterLetter = (letter: string) => {
    const normalized = normalizeAnswer(letter).slice(0, 1);
    if (!normalized) return;
    const index = selectedKeys.indexOf(selectedKey);
    const activeKey = index >= 0 ? selectedKey : selectedKeys[0];
    persistLetters({ ...letters, [activeKey]: normalized });
    const activeIndex = selectedKeys.indexOf(activeKey);
    const nextKey = selectedKeys[Math.min(activeIndex + 1, selectedKeys.length - 1)];
    setSelectedKey(nextKey);
  };

  const backspace = () => {
    const index = Math.max(0, selectedKeys.indexOf(selectedKey));
    const targetIndex = letters[selectedKey] ? index : Math.max(0, index - 1);
    const targetKey = selectedKeys[targetIndex];
    const next = { ...letters };
    delete next[targetKey];
    persistLetters(next);
    setSelectedKey(targetKey);
  };

  const moveSelection = (rowDelta: number, colDelta: number) => {
    const current = grid.cells.get(selectedKey);
    if (!current) return;
    let row = current.row + rowDelta;
    let col = current.col + colDelta;
    while (row >= 0 && col >= 0 && row < config.rows && col < config.cols) {
      const key = cellKey(row, col);
      if (grid.cells.has(key)) {
        selectCell(key);
        return;
      }
      row += rowDelta;
      col += colDelta;
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (/^[a-zA-Z]$/.test(event.key)) {
      event.preventDefault();
      enterLetter(event.key);
      return;
    }
    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      backspace();
      return;
    }
    const arrows: Record<string, [number, number]> = {
      ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
    };
    if (arrows[event.key]) {
      event.preventDefault();
      moveSelection(...arrows[event.key]);
    }
  };

  const checkWord = () => {
    if (isEntryCorrect(selectedEntry, letters)) {
      setFeedback(`Correct—${normalizeAnswer(selectedEntry.answer)} is part of our language. ♡`);
      if (config.entries.every((entry) => isEntryCorrect(entry, letters))) completeGame("memory-crossword");
    } else {
      setFeedback("Not quite yet. Keep the memory close and try another letter.");
    }
  };

  const checkPuzzle = () => {
    if (allCorrect) {
      setFeedback("You solved the language of us. ✦");
      completeGame("memory-crossword");
      return;
    }
    setFeedback(`${correctEntries.length} of ${config.entries.length} memories are solved. The rest are waiting for you.`);
  };

  const useHint = () => {
    const nextLevel = Math.min(3, hintLevel + 1);
    update((current) => {
      let nextLetters = current.crossword.letters;
      if (nextLevel === 3) {
        const revealKey = chooseRevealCell(selectedEntry, current.crossword.letters);
        if (revealKey) {
          const letter = entryLetter(selectedEntry, revealKey);
          if (letter) nextLetters = { ...nextLetters, [revealKey]: letter };
        }
      }
      return {
        ...current,
        crossword: {
          letters: nextLetters,
          hints: { ...current.crossword.hints, [selectedEntry.id]: nextLevel },
        },
      };
    });
    setFeedback(nextLevel === 3 ? "One letter has been revealed for you." : "A new hint is waiting beside the clue.");
  };

  const replay = () => {
    update((current) => ({ ...current, crossword: { letters: {}, hints: {} } }));
    setSelectedEntryId(config.entries[0].id);
    setSelectedKey(entryCellKeys(config.entries[0])[0]);
    setFeedback("The crossword is ready for another round.");
  };

  return (
    <section className={styles.gamePanel}>
      <p className={styles.eyebrow}>The language of us</p>
      <h1>{config.title}</h1>
      <p className={styles.gameIntro}>{config.intro}</p>
      <div className={styles.progressBar} aria-hidden="true">
        <span style={{ width: `${(correctEntries.length / config.entries.length) * 100}%` }} />
      </div>
      <div className={styles.progressLabel}>{correctEntries.length} of {config.entries.length} memories solved</div>

      {allCorrect && progress.completed.includes("memory-crossword") && (
        <div className={styles.vault} aria-live="polite">
          <h2>You solved the language of us.</h2>
          <p>From the first written mutual “Mahal Kita” on 13 July 2026, every word kept leading us home.</p>
        </div>
      )}

      <div className={styles.crosswordLayout}>
        <div>
          <div className={styles.crosswordScroller}>
            <div
              ref={gridRef}
              className={styles.crosswordGrid}
              style={{ gridTemplateColumns: `repeat(${config.cols}, 36px)`, gridTemplateRows: `repeat(${config.rows}, 36px)` }}
              role="grid"
              tabIndex={0}
              aria-label="Memory crossword. Use letter keys, backspace, or arrow keys."
              onKeyDown={onKeyDown}
            >
              {[...grid.cells.entries()].map(([key, cell]) => {
                const isActive = selectedKeys.includes(key);
                const entryCorrect = cell.entryIds.some((id) => {
                  const entry = config.entries.find((item) => item.id === id);
                  return entry ? isEntryCorrect(entry, letters) : false;
                });
                return (
                  <button
                    key={key}
                    type="button"
                    role="gridcell"
                    tabIndex={-1}
                    aria-label={`Row ${cell.row + 1}, column ${cell.col + 1}${letters[key] ? `, letter ${letters[key]}` : ", empty"}`}
                    className={`${styles.crosswordCell} ${isActive ? styles.crosswordCellActive : ""} ${selectedKey === key ? styles.crosswordCellSelected : ""} ${entryCorrect ? styles.crosswordCellCorrect : ""}`}
                    style={{ gridRow: cell.row + 1, gridColumn: cell.col + 1 }}
                    onClick={() => selectCell(key)}
                  >
                    {cell.number && <span className={styles.crosswordNumber}>{cell.number}</span>}
                    {letters[key] ?? ""}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.keyboard} aria-label="On-screen letter keyboard">
            {alphabet.map((letter) => <button key={letter} type="button" onClick={() => enterLetter(letter)}>{letter}</button>)}
            <button type="button" onClick={backspace} aria-label="Delete letter">⌫</button>
          </div>
        </div>

        <aside className={styles.cluePanel} aria-live="polite">
          <span className={styles.evidenceTag}>{grid.clueNumbers[selectedEntry.id]} {selectedEntry.direction}</span>
          <h2>{selectedEntry.clue}</h2>
          {hintLevel >= 1 && <p className={styles.hintText}>Length: {normalizeAnswer(selectedEntry.answer).length} letters</p>}
          {hintLevel >= 2 && <p className={styles.hintText}>Memory hint: {selectedEntry.memoryHint}</p>}
          <div className={styles.buttonRow}>
            <button type="button" className={styles.smallButton} onClick={useHint} disabled={hintLevel >= 3}>{hintLevel >= 3 ? "All hints used" : `Hint ${hintLevel + 1}`}</button>
            <button type="button" className={styles.smallButton} onClick={checkWord}>Check word</button>
          </div>
          <p className={styles.feedback}>{feedback}</p>
          <div className={styles.buttonRow}>
            <button type="button" className={styles.primaryButton} onClick={checkPuzzle}>Check puzzle</button>
            <button type="button" className={styles.secondaryButton} onClick={replay}>Replay</button>
          </div>
        </aside>
      </div>

      <div className={styles.clueLists}>
        {(["across", "down"] as const).map((direction) => (
          <section key={direction}>
            <h3>{direction === "across" ? "Across" : "Down"}</h3>
            {config.entries.filter((entry) => entry.direction === direction).map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-current={entry.id === selectedEntry.id}
                onClick={() => {
                  setSelectedEntryId(entry.id);
                  setSelectedKey(entryCellKeys(entry)[0]);
                  gridRef.current?.focus();
                }}
              >
                <strong>{grid.clueNumbers[entry.id]}.</strong> {entry.clue} {isEntryCorrect(entry, letters) ? "✓" : ""}
              </button>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}
