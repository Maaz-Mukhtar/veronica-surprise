"use client";

import { useMemo, useRef, useState } from "react";
import { memoryGamesConfig } from "./game-data";
import { createDefaultProgress, useGameProgress } from "./game-progress";
import { detectiveRank, isQuestionCorrect } from "./game-utils";
import type { OrderingQuestion } from "./types";
import styles from "./memory-games.module.css";

function moveItem(order: string[], from: number, to: number) {
  if (to < 0 || to >= order.length || from === to) return order;
  const next = [...order];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function DateDetectiveGame() {
  const { progress, update, completeGame } = useGameProgress();
  const questions = memoryGamesConfig.dateDetective.questions;
  const detective = progress.dateDetective;
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const draggedId = useRef<string | null>(null);
  const finished = detective.currentIndex >= questions.length;
  const question = finished ? null : questions[detective.currentIndex];
  const submitted = question ? detective.submitted.includes(question.id) : false;
  const selected = question ? drafts[question.id] ?? detective.answers[question.id] ?? "" : "";
  const currentOrder = detective.order;
  const currentCorrect = useMemo(() => {
    if (!question || !submitted) return false;
    return question.type === "ordering"
      ? isQuestionCorrect(question, currentOrder)
      : isQuestionCorrect(question, detective.answers[question.id] ?? "");
  }, [currentOrder, detective.answers, question, submitted]);

  const setOrder = (order: string[]) => {
    update((current) => ({
      ...current,
      dateDetective: { ...current.dateDetective, order },
    }));
  };

  const submit = () => {
    if (!question || submitted) return;
    const answer = question.type === "ordering" ? currentOrder : selected;
    if (question.type !== "ordering" && !answer) return;
    const correct = isQuestionCorrect(question, answer);
    update((current) => ({
      ...current,
      dateDetective: {
        ...current.dateDetective,
        answers: {
          ...current.dateDetective.answers,
          [question.id]: question.type === "ordering" ? currentOrder.join("|") : selected,
        },
        submitted: [...current.dateDetective.submitted, question.id],
        score: current.dateDetective.score + (correct ? 1 : 0),
      },
    }));
  };

  const continueCase = () => {
    if (!question || !submitted) return;
    const nextIndex = detective.currentIndex + 1;
    update((current) => ({
      ...current,
      dateDetective: { ...current.dateDetective, currentIndex: nextIndex },
    }));
    if (nextIndex >= questions.length) completeGame("date-detective");
  };

  const replay = () => {
    const fresh = createDefaultProgress().dateDetective;
    setDrafts({});
    update((current) => ({ ...current, dateDetective: fresh }));
  };

  if (finished) {
    return (
      <section className={styles.gamePanel}>
        <p className={styles.eyebrow}>Case file complete</p>
        <h1>{detectiveRank(detective.score, questions.length)}</h1>
        <p className={styles.gameIntro}>
          You recovered {detective.score} of {questions.length} memories on the first try. Wrong answers never count against the love story.
        </p>
        <div className={styles.resultTimeline} aria-label="Relationship evidence timeline">
          {['9 July', '10 July', '13 July', '16 July', '29 July', '22 Aug', 'Forever'].map((date) => <span key={date}>{date}</span>)}
        </div>
        <div className={styles.vault}>
          <h2>Every clue led back to us. ♡</h2>
          <p>The case is closed, but our story is still being written.</p>
        </div>
        <div className={styles.buttonRow} style={{ justifyContent: "center", marginTop: "1rem" }}>
          <a href="/games" className={styles.primaryButton}>Back to games</a>
          <button type="button" className={styles.secondaryButton} onClick={replay}>Replay Date Detective</button>
        </div>
      </section>
    );
  }

  if (!question) return null;

  return (
    <section className={styles.gamePanel}>
      <p className={styles.eyebrow}>Relationship case file</p>
      <h1>{memoryGamesConfig.dateDetective.title}</h1>
      <p className={styles.gameIntro}>{memoryGamesConfig.dateDetective.intro}</p>
      <div className={styles.caseHeader}>
        <span>Case {detective.currentIndex + 1} of {questions.length}</span>
        <span>{detective.score} correct so far</span>
      </div>
      <div className={styles.progressBar} aria-hidden="true">
        <span style={{ width: `${((detective.currentIndex + (submitted ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>

      <article className={styles.questionCard}>
        {question.evidence && <span className={styles.evidenceTag}>{question.evidence}</span>}
        <h2>{question.prompt}</h2>

        {question.type === "ordering" ? (
          <OrderingRound
            question={question}
            order={currentOrder}
            submitted={submitted}
            draggedId={draggedId}
            onChange={setOrder}
          />
        ) : (
          <div className={styles.choices} role="radiogroup" aria-label="Answer choices">
            {question.options.map((option) => {
              const wasSelected = selected === option;
              const isCorrectOption = submitted && option === question.answer;
              const isWrongSelection = submitted && wasSelected && option !== question.answer;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={wasSelected}
                  className={`${styles.choice} ${wasSelected ? styles.choiceSelected : ""} ${isCorrectOption ? styles.choiceCorrect : ""} ${isWrongSelection ? styles.choiceIncorrect : ""}`}
                  onClick={() => setDrafts((current) => ({ ...current, [question.id]: option }))}
                  disabled={submitted}
                >
                  {option}{isCorrectOption ? " — correct" : isWrongSelection ? " — not this one" : ""}
                </button>
              );
            })}
          </div>
        )}

        {submitted && (
          <div className={styles.feedback} role="status">
            <strong>{currentCorrect ? "Memory recovered ✦" : "Not quite—but here is the memory ♡"}</strong>
            <div>{question.explanation}</div>
            {!currentCorrect && question.type !== "ordering" && <div>Correct answer: {question.answer}</div>}
          </div>
        )}

        <div className={styles.buttonRow} style={{ marginTop: "1rem" }}>
          {!submitted ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={submit}
              disabled={question.type !== "ordering" && !selected}
            >
              Submit evidence
            </button>
          ) : (
            <button type="button" className={styles.primaryButton} onClick={continueCase}>
              {detective.currentIndex === questions.length - 1 ? "Close the case" : "Continue to next case"}
            </button>
          )}
        </div>
      </article>
    </section>
  );
}

function OrderingRound({
  question,
  order,
  submitted,
  draggedId,
  onChange,
}: {
  question: OrderingQuestion;
  order: string[];
  submitted: boolean;
  draggedId: React.MutableRefObject<string | null>;
  onChange: (order: string[]) => void;
}) {
  const cardsById = Object.fromEntries(question.cards.map((card) => [card.id, card]));
  return (
    <div className={styles.orderingList} aria-label="Milestones to order">
      {order.map((id, index) => {
        const card = cardsById[id];
        if (!card) return null;
        return (
          <div
            key={id}
            className={styles.orderCard}
            draggable={!submitted}
            onDragStart={() => { draggedId.current = id; }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              const from = order.indexOf(draggedId.current ?? "");
              if (from >= 0) onChange(moveItem(order, from, index));
              draggedId.current = null;
            }}
          >
            <span className={styles.dragHandle} aria-hidden="true">⋮⋮</span>
            <span><strong>{card.label}</strong><small>{submitted ? card.date : "Date hidden until submitted"}</small></span>
            <span className={styles.orderControls}>
              <button type="button" aria-label={`Move ${card.label} up`} onClick={() => onChange(moveItem(order, index, index - 1))} disabled={submitted || index === 0}>↑</button>
              <button type="button" aria-label={`Move ${card.label} down`} onClick={() => onChange(moveItem(order, index, index + 1))} disabled={submitted || index === order.length - 1}>↓</button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
