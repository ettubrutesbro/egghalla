# UI

What the app interface is, how it got here, how `src/ui/` is built, and what's still open. Current as of 2026-10-07. Product rules live in `decisions.md`; this file covers only the interface and where it departs from those rules.

## Where the design lives

- **Design canvas.** https://claude.ai/artifact/VWiEo5jKZE7ZNRzX1vFy71 has two rows of 390×844 frames, Play and Library; the first frame in each row is interactive. The info panel there is older than the one in `src/ui/` (see "Divergences").
- **First standalone prototype (superseded).** https://claude.ai/artifact/ChhdfGbCZp8NgSvUgxr6jq is the swipeable stack on an orange background. Reference only.
- **`src/ui/`.** The working app, typed against `src/schema/`. Open `#/states` to see every named state side by side.

All UI content is placeholder and in brackets (`[Player name A]`). The design conversation was kept free of real content on purpose.

## How the design got here

Some ideas below were parked, not rejected.

1. **Original concept.** A stack of cards, one on top at a time, mostly full-screen. Each card had a question, a "changing input", thumbs down, and star. Swiping up revealed a longer explanation; swiping left moved to the next card.
2. **The changing input**, built once:
   - she writes her own answer first, so multiple choice gives nothing away;
   - a timer bar runs out, then the choices appear;
   - after a second delay, an "I don't know" button highlights the answer;
   - typing paused the timer;
   - typed answers were self-graded ("I had it" / "I missed it").
3. **Scaled back to multiple choice only.** Timers, the write step, and "I don't know" were removed.
4. **Moved to a Claude Design canvas**, with one interactive frame and a static frame per state.
5. **Restructured the card:**
   - The default is now the prompt plus two big buttons: **🙋🏻 I know the answer**, which reveals the input, and **ⓘ Show me context**.
   - Thumbs down and star appear only after answering.
   - Removed: the card stack, the orange background, rounded card corners, swiping, and every swipe hint.
   - A **Next** button replaces swiping. Claude added it; Jack hasn't confirmed it.
6. **Added the Library.** Four sections (Players, Teams, Storylines, Glossary) of individual cards. Cards can be opened from a question's context.
7. **Built `src/ui/` against the schema**, with info rows replacing the canvas's freeform context paragraph.

## Current behavior

### Play

Each question moves through three stages, tracked per card in `state/playSession.ts`:

| Stage | Screen |
|---|---|
| `ask` | Stimulus blocks, then "I know the answer" and "Show me context". The context button toggles to "Hide context". It is hidden when `buildInfo()` returns `[]`, i.e. for reveal, recall, and setSelect. |
| `choosing` | `response.primary` replaces the two buttons. Only `choice` is built; other response kinds render a labelled stub. An open info panel stays open. |
| `answered` | Graded with `schema/learner.grade()`. Correct turns green with ✓, a wrong pick red with ✕, the rest dim. Then come thumbs down, star, and Next (Finish on the last question). |

- **Context (info mode).**
  - One row per `InfoRow` from `buildInfo()`, so it includes authored rows, auto definitions for unlearned assumed concepts, and benchmarks.
  - Rows for `entity`, `concept`, and `event` blocks render as library-card chips. An entity chip's detail line shows the block's `show` fields.
  - Other block types show as label + value. Benchmarks read `[League value]` because there's no data source yet.
  - Opening context sets `usedInfo`, which goes into the `AnswerEvent`.
- **Opening a card from context.**
  - The card opens as an overlay over the question, not in the Library tab.
  - Related cards push onto the overlay's own back stack. The back button names the previous card, or says "Back to question".
  - The question underneath is `inert` while the overlay is open.
- **Progress pips** show current, answered, and not yet answered. The end screen shows right / starred / thumbed-down counts and "Start over".
- **AnswerEvents** are pushed to `session.events` on every answer, ready for `applyCredit()` once progress is saved.

### Library

- Search, section pills, then a list of cards.
- A card's detail page has a glyph, type label, title, subtitle, a facts table, a body, and related cards.
- **Cards are a view over the `Graph`** (`data/cards.ts`):

| Section | Graph node | Facts / body | Related |
|---|---|---|---|
| Players | `Player` | team, position, height for `currentSeason` | their current team, events they're in |
| Teams | `Team` | city, conference | current roster, events |
| Storylines | `StoryEvent` | beats as the body | participants |
| Glossary | `ConceptNode` | gloss as the body | prerequisites and concepts that build on it |

- **Related links are derived from graph edges, never hand-listed.**
- **Type never relies on color alone.** Each type also has a glyph shape (players round, everything else square) and a label. Colors: player blue, team teal, storyline purple, glossary amber.
- People and orgs have no section yet.

### Visual language (placeholder)

- White full-bleed screens.
- Bricolage Grotesque, 32 px bold for prompts and titles, 17 px body text.
- Ink `#1B1A26`, secondary `#5E5B6E`, lines `#E4E1EC`, fields `#F2F1F6`.
- Touch targets ≥ 44 px.
- Tokens are in `src/ui/styles/tokens.css`. No real visual pass has happened yet.

## Architecture

Vite + React 19 + CSS Modules, strict TSX. There is no router or state library: two reducers and hash routes (`#/play`, `#/library`, `#/states`).

```
src/ui/
  main.tsx, App.tsx        App owns both reducers, so tab switches keep her place
  useHashRoute.ts
  data/
    placeholderGraph.ts    a schema `Graph` of bracketed placeholders
    placeholderQuestions.ts schema `Question`s, choice-only for now
    GraphContext.tsx       useGraph(): blocks carry refs, components resolve them
    cards.ts               Graph → library Card view, fieldValue(), derived related links
  state/
    playSession.ts         Session/Turn/CardState, reducer, presets for the gallery
    libraryNav.ts          section / query / back-stack reducer, presets
  components/
    common/                PhoneShell, TabBar, BackButton, icons
    play/                  PlayScreen, ProgressPips, QuestionCard, Stimulus,
                           AskActions, InfoPanel, InfoRowView, ResponseArea,
                           ChoiceList, PostAnswerBar, EndOfSet
    library/               LibraryScreen, SectionPills, SearchField
    cards/                 CardGlyph, CardChip, CardDetail (shared by Play and Library)
  dev/StatesGallery.tsx    every preset, live, side by side
  styles/                  tokens.css, global.css
```

**Seams**

- **Swapping in real content touches only `data/`.**
  - Replace `placeholderGraph` with an adapter over `public/data/players.json` + `CONCEPTS` + `EVENTS`. It needs the id, position, height, and stat mappers listed in `open-items.md`.
  - Replace `placeholderQuestions` with the seed.
  - Nothing in `components/` reads fixtures directly.
- **`createSession()` is where the scheduler goes.**
  - Today it takes the first presentation of each question, in order, with nothing mastered.
  - Next: `scheduler.nextCard()`, `isServable()` for assets, and real `knownConcepts()`.
- **`Stimulus` and `ResponseArea` are the switches for unbuilt kinds.** Every block type except `prompt` is a dashed stub, and so is every response kind except `choice`.
- **`CardDetail` is shared**, and each caller owns its own back stack. Choice options that carry `refs` render as names until portraits exist.
- **Presets are real reducer state.** `sessionPreset()` and `libraryPreset()` drive the gallery, and could drive tests the same way.

**Tooling**

- `tsconfig.app.json` covers `src/ui` (DOM lib, JSX). The root `tsconfig.json` excludes `src/ui`.
- `npm run typecheck` runs both configs.

## Divergences to resolve

These are places where the UI no longer matches the docs or the canvas.

- **`decisions.md` says "a stack of swipeable cards; recall-style answers first, multiple-choice fallback."** The UI currently has no swiping and multiple choice only. Both were deliberate "for now" cuts in the design thread, not reversals. Restore them, or update `decisions.md`.
- **The canvas's context panel is a freeform paragraph plus a sideways rail of library cards.** The schema has no freeform context field; info mode is label + block rows. `src/ui` follows the schema. Either update the canvas, or add an authored `prompt`-style row to the schema if a freeform nudge is wanted.
- **"I know the answer" maps onto the schema's flow** (stimulus → primary → fallback → explain → followUp), but `explain` and `followUp` aren't rendered yet.

## Open questions

1. **Thumbs down.** Remove the question from rotation, or flag it for review? And star: a favorites list, or a resurfacing signal? Neither is in the schema or the learner yet.
2. **Next button vs. swiping.**
3. **Recall-first input.** The `text` and `entityPick` inputs and the give-up → fallback path. The write-first timing ideas (delayed choices, delayed "I don't know") are parked.
4. **Card from context: overlay vs. jumping to the Library tab.** The overlay keeps her place but gives two routes to the same page.
5. **Info row treatment.**
   - The `comparison` block (two players side by side) is the obvious case for a real table.
   - Benchmarks need values.
   - Definitions currently show the full gloss inline.
6. **Stimulus blocks beyond `prompt`.** `entity`, `comparison`, `clueSequence`, `statLine`, `shotChart`, `court`, `scoreboard`, `media`.
7. **Portraits.** Choice options with `refs`, the player glyph, and the `required` / `preferred` fallbacks.
8. **Difficulty / level-up UI** (`suggestLevelUp()`) and any mastery or progress display.
9. **Persistence** for progress, stars, flags, and AnswerEvents.
10. **A People/Orgs section** in the Library, or fold them into existing sections.
11. **Visual direction.**

## Running

```sh
npm install
npm run dev          # http://localhost:5173, also reachable from a phone on the same network
                     # open #/states for the state gallery
npm run typecheck
npm run build        # note: copies all of public/ (incl. data/raw, ~5.7 MB) into dist/
```
