# Kilig & Co. Memory Games — Implementation Plan

## Agent brief

Implement three relationship-memory games in the existing `vapp` Next.js application:

1. **Memory Crossword**
2. **Date Detective Quiz**
3. **Lost Little Girl Mini-Game**

These games should feel like chapters of one relationship story, not unrelated widgets. Preserve the existing Valentine question, celebration, letter, gifts, timeline, gallery, recipient themes, and tokenized recipient pages.

Work through the phases in this document in order. Complete the implementation, tests, responsive QA, and final verification; do not stop after scaffolding. Do not deploy, publish, or commit unless separately asked.

## Product outcome

After the recipient answers “Yes,” the existing reveal area should include a new section named **Our Memory Games**. It contains three game cards with completion state:

1. **Find the Lost Little Girl** — replay the first meeting.
2. **Date Detective** — reconstruct the relationship timeline.
3. **Memory Crossword** — solve the couple’s shared language.

Games are unlocked in that suggested order, but the recipient may open any game. Do not force completion of one game to access another. Completing all three unlocks a final “memory vault” celebration:

> Case solved. Puzzle complete. Lost girl found.  
> Welcome home, Wifey. 💕

The final reward may use the existing confetti dependency and should include buttons to revisit the timeline or reset/replay the games.

## Important privacy boundary

- Do **not** copy the WhatsApp ZIP, `_chat.txt`, complete chat messages, phone numbers, personal addresses, or raw chat data into the repository.
- Do **not** place relationship data in `public/` unless it is an intentional media asset.
- Only use the curated facts and short phrases listed in this document.
- Do not add analytics, trackers, network calls, or third-party game services.
- Local game progress may be stored in `localStorage`; it must not include private chat content.
- The existing `/r/[token]` URL is personalization, not strong authentication. Do not describe it as secure. Real server-side authentication is outside this feature unless separately requested.

## Existing project context

The project uses:

- Next.js App Router 16
- React 19 and TypeScript
- Tailwind 4 plus substantial global CSS
- Framer Motion
- `canvas-confetti`
- Static recipient routes from `src/lib/recipients.ts`

Relevant files:

- `src/content.ts` — shared content types and default content
- `src/lib/recipients.ts` — recipient profile type and hardcoded profiles
- `src/components/valentine-experience.tsx` — main client experience and reveal flow
- `src/app/globals.css` — existing themes and component styling
- `src/app/r/[token]/page.tsx` — recipient route

The production build currently succeeds. Baseline lint currently reports two `react-hooks/set-state-in-effect` errors in `valentine-experience.tsx`. Resolve those as a small prerequisite or in the integration phase so the finished implementation passes lint.

## Scope decisions

### In scope

- A reusable, data-driven memory-games feature.
- Optional enablement per recipient.
- A dedicated Veronica/Kilig & Co. content configuration.
- Responsive mouse, keyboard, and touch interaction.
- Hydration-safe local progress persistence.
- Accessible feedback and reduced-motion behavior.
- Unit/component tests for game rules and critical interactions.
- Integration into the existing post-“Yes” reveal.

### Out of scope

- Parsing WhatsApp at runtime.
- Uploading or editing memories.
- Accounts, a database, or cloud save.
- A real Abu Dhabi Mall floor plan or geolocation.
- Multiplayer or real-time synchronization.
- Publishing/deployment.

## Architecture

Create a self-contained feature folder:

```text
src/features/memory-games/
  index.ts
  types.ts
  relationship-game-content.ts
  memory-games-hub.tsx
  memory-games.module.css
  hooks/
    use-game-progress.ts
  progress/
    game-progress.ts
  shared/
    game-shell.tsx
    game-complete-card.tsx
  crossword/
    crossword-game.tsx
    crossword-grid.tsx
    crossword-utils.ts
  date-detective/
    date-detective-game.tsx
    date-detective-utils.ts
  lost-little-girl/
    lost-little-girl-game.tsx
    maze-board.tsx
    maze-utils.ts
```

Tests may live beside the relevant files as `*.test.ts` / `*.test.tsx`, or in a matching `__tests__` directory.

Prefer a CSS Module for this feature so the already-large `globals.css` does not become harder to maintain. Use existing CSS custom properties such as `--accent`, `--accent-strong`, `--soft`, `--surface`, and `--foreground` so all three recipient themes continue to work.

Do not add a large game framework. These games can be implemented with React state/reducers, CSS Grid, Framer Motion, and the existing dependencies.

## Types and recipient integration

Add data types in `src/features/memory-games/types.ts` and export them through `index.ts`.

Recommended top-level shape:

```ts
export type RelationshipGamesConfig = {
  id: string;
  version: number;
  title: string;
  intro: string;
  finalReward: {
    title: string;
    message: string;
  };
  lostLittleGirl: LostLittleGirlConfig;
  dateDetective: DateDetectiveConfig;
  crossword: CrosswordConfig;
};
```

Extend `RecipientProfile` in `src/lib/recipients.ts`:

```ts
memoryGames?: RelationshipGamesConfig;
showMemoryGames?: boolean;
```

Keep games disabled for all existing recipients unless their profile explicitly supplies `memoryGames` and `showMemoryGames: true`. Do not change the default homepage behavior.

Create and export a `veronicaMemoryGames` configuration from `relationship-game-content.ts`. Attach it only to the intended Veronica profile. If no Veronica profile exists when implementing, add one with clearly marked customizable letter/gallery fields and a non-sensitive development token. Document that the token must be replaced before deployment; do not imply that the token is authentication.

In `valentine-experience.tsx`, render `MemoryGamesHub` inside the existing `answer === "yes"` reveal, after the timeline/gallery and before the footer. Pass:

- `config`
- a stable profile/progress key
- the current recipient theme through inherited CSS variables
- a callback if needed for final confetti

Avoid putting game-specific state into `ValentineExperience`; keep it inside the feature.

## Shared game hub

`MemoryGamesHub` is the entry point.

### Required states

- Hub showing all three cards.
- One active game at a time.
- Per-game completion indicators.
- Overall completion count, for example `2 of 3 memories recovered`.
- Final reward when all games are complete.
- Back-to-hub action from every game.
- Reset-all action behind a confirmation step.

### Suggested card order

1. Find the Lost Little Girl
2. Date Detective
3. Memory Crossword

Each card should show:

- title
- one-sentence description
- status: `Not started`, `In progress`, or `Complete`
- a small visual icon made with CSS/emoji/inline SVG
- `Play`, `Continue`, or `Replay` action

All games remain available. Visual “recommended next” styling is acceptable, but do not hard-lock cards.

### Progress persistence

Use a versioned key such as:

```text
kilig-memory-games:<config.id>:v<config.version>
```

Persist only:

- completed game IDs
- crossword filled letters and used hints
- current Date Detective question and answered results
- Lost Little Girl completion/collectible state

Provide a hydration-safe storage hook. Do not introduce more synchronous `setState` calls inside effects that violate the current lint rule. A small `useSyncExternalStore`-based local-storage adapter with an in-tab custom event is preferred. The server snapshot should return a stable empty/default state.

Corrupt or outdated stored data must fall back to defaults without crashing. Incrementing the content `version` should naturally create a new progress namespace.

## Game 1: Memory Crossword

### Product behavior

Show the introduction:

> Every relationship creates its own language. How well do you remember ours?

Display a fixed, handcrafted crossword containing 8–12 entries. A fixed layout is preferable to a runtime crossword generator: it is deterministic, easier to test, and gives reliable mobile presentation.

### Initial answer set

Use 9–11 of these entries, depending on what creates the cleanest validated grid:

| Answer | Clue |
| --- | --- |
| `VERONICA` | The name M almost guessed correctly. |
| `VIVI` | The nickname that quickly replaced V. |
| `MAHAL` | A word that became part of almost every conversation. |
| `KILIG` | The feeling caused by hidden notes, flowers, and sweet messages. |
| `CORNICHE` | Where an ordinary walk became the most special date. |
| `MANGOES` | The fruit that arrived in three boxes and fed the office. |
| `TADHANA` | One suggested title was “Finding my ___.” |
| `HUNTERXHUNTER` | The anime connection that made M unusually excited. |
| `KILIGANDCO` | The name of the first private app prototype. |
| `FLOWERS` | A gift both people eventually said the other deserved. |
| `PRINCESS` | One of the earliest affectionate nicknames. |
| `BEACH` | Where dreams were shared and time disappeared. |

Normalize displayed answers by removing spaces and punctuation. Keep `HUNTERXHUNTER` visually readable in the clue even though the answer has no spaces.

### Crossword configuration

Use entry coordinates rather than a hardcoded matrix:

```ts
type CrosswordEntry = {
  id: string;
  answer: string;
  clue: string;
  row: number;
  col: number;
  direction: "across" | "down";
};
```

Create a pure grid builder that:

- expands entries into individual cells
- verifies all coordinates are in bounds
- rejects conflicting letters at intersections
- rejects duplicate IDs
- assigns clue numbers from top-left to bottom-right
- identifies cells shared by across/down answers

The content configuration must pass this validator. Add a test that builds the real puzzle and fails if its coordinates conflict.

### Interaction requirements

- Clicking/tapping a cell selects its word and displays the clue.
- Tapping an already-selected intersection toggles between across and down.
- Letter entry automatically advances to the next cell in the active word.
- Backspace clears the current cell or moves backward when the cell is empty.
- Arrow keys move between playable cells.
- Accept physical keyboards and an on-screen A–Z keyboard on touch devices.
- Ignore non-letter characters and normalize input to uppercase.
- Correct words receive a gentle success animation and become visually marked.
- Incorrect words should not flash harsh red; use a subtle “not quite yet” state.
- Provide `Check word` and `Check puzzle` actions rather than validating every partial keystroke.
- Include a progress label such as `6 of 10 memories solved`.

### Hints

Each entry supports three progressive hints:

1. Show the answer length.
2. Reveal a short memory hint or paraphrased context.
3. Reveal one unfilled letter.

Hints do not reduce a score. Track hint use only so repeated clicks reveal the next appropriate hint. Do not reveal a letter that is already filled.

Suggested memory hints:

- `CORNICHE`: “V suggested a walk here the morning after the movie.”
- `MANGOES`: “Three boxes became an office-wide memory.”
- `KILIGANDCO`: “The first APK carried this name.”
- `FLOWERS`: “The same sentence was returned one month later.”

### Completion

When all entries are correct:

- mark the game complete in shared progress
- animate the grid gently
- show `You solved the language of us.`
- show a short reveal referencing the first written mutual `Mahal Kita` on 13 July 2026
- provide `Back to games` and `Replay crossword` actions

Replay should clear only the crossword’s filled cells, not overall completion unless the user explicitly resets progress.

## Game 2: Date Detective

### Product behavior

Introduce it as a relationship case file:

> Case File: How Did We Fall This Fast?  
> Recover the dates, messages, and memories that created Kilig & Co.

The quiz should be data-driven and support several question types through a discriminated union.

Recommended types:

```ts
type DateDetectiveQuestion =
  | MultipleChoiceQuestion
  | SpeakerQuestion
  | FillBlankQuestion
  | OrderingQuestion
  | MysteryRevealQuestion;
```

Each question includes:

- stable `id`
- prompt
- answer/options
- explanation shown after answering
- optional date label
- optional short evidence paraphrase

### Required question set

Implement approximately 9 questions using this content:

1. **First chat/movie date**
   - Prompt: When did the first WhatsApp conversation and movie date happen?
   - Correct answer: `9 July 2026`
   - Explanation: The first message was sent at 18:45; the cinema meeting happened that night.

2. **Chosen relationship date**
   - Prompt: Which date did M and V later choose as “our date”? 
   - Correct answer: `10 July 2026`
   - Explanation: It was the Corniche/beach date V described as the most special.

3. **First documented mutual love exchange**
   - Prompt: When did the first written mutual “Mahal Kita” exchange happen?
   - Correct answer: `13 July 2026`

4. **Girlfriend question**
   - Prompt: When did M ask V to be his girlfriend?
   - Correct answer: `16 July 2026`

5. **First Kilig & Co. APK**
   - Prompt: When was the first `Kilig-and-Co-standalone.apk` shared?
   - Correct answer: `19 July 2026`

6. **Move-in day**
   - Prompt: When did “our place” become real?
   - Correct answer: `29 July 2026`

7. **Speaker question**
   - Prompt: Who said “Come save me” outside the cinema?
   - Correct answer: `V`

8. **Shared phrase question**
   - Prompt: Who said “You deserve flowers too”?
   - Correct answer: `Both, on different dates`
   - Explanation: M’s flowers were discussed on 14 July; V returned the gesture on 18 August.

9. **Love mystery reveal**
   - Prompt: Who said “I love you” first?
   - Options: `M`, `V`, `This needs an investigation`
   - Correct answer: `This needs an investigation`
   - Explanation: M said he whispered it while V slept the previous night; V remembered consciously saying it first the next morning; M sent the first documented written “Mahal Kita.”

Also include one ordering round with these cards:

1. First movie date — 9 July
2. Corniche/beach date — 10 July
3. First written mutual `Mahal Kita` — 13 July
4. Girlfriend question — 16 July
5. First Kilig & Co. APK — 19 July
6. Move-in day — 29 July

If including both the individual questions and ordering round would make the quiz feel too long, use six individual questions plus the ordering round and the love mystery as the finale.

### Interaction requirements

- Show one case at a time.
- Show visible progress, such as `Case 4 of 9`.
- Disable `Continue` until an answer is submitted.
- After submission, lock the answer and show the explanation.
- Wrong answers should reveal the correct memory without shame or point loss.
- Allow replay from the result screen.
- The ordering round must support pointer drag, but it also needs accessible `Move up` and `Move down` controls.
- Do not rely on color alone to communicate correct/incorrect state.

### Results

Track the number correct on the first attempt and display an affectionate rank:

- 0–3: `New Recruit`
- 4–6: `Certified Memory Keeper`
- 7–8: `Senior Kilig Detective`
- Perfect: `Keeper of Our Entire Lore`

The rank is decorative. Do not block completion or rewards for wrong answers.

At completion, display an evidence-board animation or a lightweight CSS timeline connecting:

```text
9 July → 10 July → 13 July → 16 July → 19 July → 29 July → Forever
```

Mark the game complete after the result screen is reached, regardless of score.

## Game 3: Lost Little Girl

### Product behavior

This is a short, affectionate top-down maze inspired by the first cinema meeting. It is not a real mall map and must not use exact location data.

Opening copy:

> Find the Lost Little Girl  
> The night M and V finally found each other.

Opening chat bubbles:

> V: “I got lost.”  
> V: “I’m going round in circles.”  
> V: “Come save me 😂”

Objective:

> Help V reach M before the movie starts.

### Maze model

Use a deterministic logical tile grid, around 12 columns by 8 rows. Configure it as data:

```ts
type MazePosition = { row: number; col: number };

type LostLittleGirlConfig = {
  rows: number;
  cols: number;
  walls: MazePosition[];
  start: MazePosition;
  goal: MazePosition;
  collectibles: Array<{
    id: "name-card" | "movie-ticket" | "phone";
    position: MazePosition;
    title: string;
    memory: string;
  }>;
};
```

Create pure utilities for:

- valid movement
- wall and boundary collision
- collectible pickup
- goal detection
- shortest path to the goal for the help feature
- repeated-position/loop detection

Validate that the configured maze has a path from start to goal and that every collectible is reachable.

### Collectibles

Use three optional memory items:

1. **Name card**
   - Memory: M tried several V names before learning Veronica.

2. **Movie ticket**
   - Memory: The first proper movie date was 9 July 2026.

3. **Phone icon**
   - Memory: “Call me—not WhatsApp.”

Collecting all three earns a `Perfect rescue` label, but collectibles must never be required to finish.

### Controls

Support:

- arrow keys and WASD
- large on-screen directional buttons
- swipe gestures on the maze board

Do not scroll the page when an arrow key is controlling the focused maze. Do not hijack keys when focus is outside the game.

The player character and goal must have text alternatives and not rely only on emoji. Provide a live region announcing events such as:

- `Moved north`
- `Found the movie ticket`
- `That corridor is blocked`
- `You found M`

### Loop/help mechanic

Include one intentional loop in the map. If the player revisits the loop checkpoint repeatedly, show:

> M: “Where are youuuu?”

After approximately 12 unsuccessful moves or two detected loops, reveal:

> Call M for help

Activating help should calculate and visually highlight the next few cells on the shortest path. It may remain visible for several seconds or until the next move. There is no score penalty.

### Ending

When V reaches M:

- disable movement
- mark the game complete
- animate the two characters meeting outside a warm cinema entrance
- show `First meeting — 9 July 2026`
- show:

> She thought she was only looking for the cinema.  
> She found the person she had been searching for.

- if all collectibles were found, show `Perfect rescue — all three memories recovered`
- provide `Back to games` and `Play again`

Replay resets maze position and collectibles but does not erase the hub completion badge.

### Visual implementation

- Use semantic DOM and CSS Grid, not canvas, so the map remains responsive and accessible.
- Use stylized generic corridors, shop blocks, arrows, and a glowing cinema destination.
- Do not claim the map matches Abu Dhabi Mall.
- Use Framer Motion sparingly for movement and ending animation.
- With `prefers-reduced-motion`, move immediately and replace animated paths/confetti with static highlights.

## Visual design system

All games should share:

- rounded scrapbook-like cards
- the current recipient theme variables
- warm paper/surface backgrounds
- small evidence tags and date stamps
- consistent primary and secondary buttons
- visible keyboard focus rings
- minimum 44×44 px interactive targets
- readable layouts at 320 px width

Suggested motifs:

- Crossword: notebook paper and letter tiles
- Date Detective: case file, pinned evidence, date stamps
- Lost Little Girl: dreamy illustrated mall and cinema glow

Avoid excessive emoji-only controls. Inline SVG icons must be decorative or have appropriate accessible labels.

## Responsive and accessibility requirements

### General

- Fully usable at 320, 375, 768, and 1024+ px widths.
- No horizontal page overflow.
- Touch targets at least 44 px.
- Visible focus states.
- Dialog-like game shells must manage focus when opened and return focus to the originating card when closed.
- `Escape` returns to the hub only after confirming if unsaved in-memory changes would be lost.
- Use an `aria-live="polite"` region for feedback.
- Never use color as the sole status indicator.
- Respect `prefers-reduced-motion`.

### Crossword

- Every cell needs an accessible label including clue number, direction, and coordinates or current letter.
- On-screen keyboard must not hide the active clue.
- The grid should scale without making cells smaller than practical; allow the game card itself to scroll horizontally only as a last resort.

### Date Detective

- Ordering must be usable without drag-and-drop.
- Announce selected answers and result feedback.

### Maze

- Provide directional buttons and keyboard controls; swipe cannot be the only method.
- Announce collectibles and blocked moves.
- Provide a non-animated help path in reduced-motion mode.

## Testing plan

Add a lightweight test setup if one does not exist. Vitest with React Testing Library and `jsdom` is appropriate. Add an `npm test` script and avoid unnecessary test dependencies beyond what is needed.

### Pure utility tests

Crossword:

- real puzzle configuration builds without conflicts
- conflicting intersection throws or returns a validation error
- correct normalization ignores case and spaces/punctuation
- clue numbering is deterministic
- reveal-letter hint chooses an unfilled cell

Date Detective:

- every question has a valid correct answer
- ordering comparison recognizes only the correct order
- first-attempt score does not change when revisiting a question
- mystery answer resolves to the intended nuanced explanation

Maze:

- player cannot move through walls or out of bounds
- collectibles are collected once
- goal completes the game
- shortest-path helper returns a valid route
- configured maze goal and collectibles are reachable
- repeated loop visits trigger help availability

Progress:

- corrupt storage falls back to defaults
- config version changes isolate old progress
- completing one game does not erase another game’s state
- reset clears only the intended configuration key

### Component interaction tests

- Hub opens each game and returns focus after closing.
- Crossword accepts keyboard letters, backspace, and completes with correct entries.
- Date Detective locks submitted answers and advances correctly.
- Ordering round supports move-up/move-down buttons.
- Maze supports arrow keys and on-screen controls.
- Completing all three games reveals the final vault.

### Manual browser QA

Verify:

- base homepage still works
- existing recipient pages still build and render
- games appear only on the configured Veronica profile
- Yes flow scrolls to the existing reveal as before
- all games work with mouse, keyboard, and touch emulation
- refresh restores progress without hydration warnings
- reset/replay behavior is correct
- mobile keyboard does not obscure the active crossword clue
- reduced-motion mode remains fully usable
- no raw chat data or ZIP files are included in the built output

## Implementation phases

### Phase 0 — Baseline and lint cleanup

1. Run `npm run lint` and `npm run build` before changes.
2. Record the two existing effect/state lint failures.
3. Fix them without changing visible behavior. Prefer derived state or a hydration-safe external-store approach over disabling ESLint rules.
4. Confirm lint and build pass before adding the games, or at minimum before final verification.

### Phase 1 — Types, content, and progress

1. Add feature folder and shared types.
2. Add curated Veronica content configuration.
3. Extend `RecipientProfile` with optional game configuration.
4. Implement versioned, hydration-safe local progress.
5. Add utility tests for progress behavior.

### Phase 2 — Hub and shared shell

1. Build `MemoryGamesHub` and reusable game shell.
2. Add status cards, navigation, focus handling, and reset confirmation.
3. Integrate the hub into the existing Yes/reveal flow.
4. Confirm no games appear on other profiles.

### Phase 3 — Date Detective

Implement this first because it has the simplest interaction model and establishes the shared game shell, result cards, and progress completion flow.

1. Add typed question configuration.
2. Implement multiple choice, speaker, ordering, fill-blank if retained, and mystery reveal.
3. Add result rank and evidence timeline.
4. Add utility and component tests.

### Phase 4 — Memory Crossword

1. Create and validate the fixed crossword layout.
2. Implement cell selection, keyboard input, touch keyboard, navigation, checking, hints, and completion.
3. Persist filled cells and hint progress.
4. Add utility and component tests.

### Phase 5 — Lost Little Girl

1. Create and validate a deterministic maze.
2. Implement keyboard, buttons, and swipe movement.
3. Add collectibles, loop detection, call-for-help path, and ending scene.
4. Add reduced-motion behavior and live announcements.
5. Add utility and component tests.

### Phase 6 — Final reward and polish

1. Connect all three completion states to the final memory vault.
2. Add restrained confetti using the existing dependency.
3. Polish responsive layouts and focus behavior.
4. Ensure every game supports replay without accidentally wiping completion.

### Phase 7 — Verification

Run:

```bash
npm test
npm run lint
npm run build
```

Then perform the manual QA list above. Inspect `git diff` and ensure changes are limited to the feature, recipient integration, necessary lint cleanup, test setup, and documentation.

## Acceptance criteria

The work is complete only when all of the following are true:

- The existing Valentine experience and recipient routes still work.
- Memory games are optional per recipient and enabled only for the intended profile.
- All three games are fully playable on desktop and mobile.
- Mouse, keyboard, and touch controls are supported where applicable.
- The crossword has a valid intersecting grid, hints, checking, persistence, and completion.
- Date Detective includes the required milestone questions, ordering round, nuanced love mystery, explanations, and result screen.
- Lost Little Girl has a solvable maze, three optional collectibles, help-path mechanic, accessible controls, and the cinema ending.
- Progress survives refresh and can be reset safely.
- Completing all three games unlocks the final memory vault.
- Reduced-motion and accessibility behavior meet the requirements above.
- No raw WhatsApp export or sensitive location data is committed or exposed.
- Tests pass.
- ESLint passes without disabling relevant rules.
- The production build succeeds without hydration warnings.

## Recommended final handoff

When finished, report:

1. Files added and changed.
2. How the three games work.
3. Which profile/route has the games enabled.
4. Test, lint, and build results.
5. Any content placeholders still requiring real photos or copy.
6. A concise privacy note confirming that the raw chat export was not added to the application.
