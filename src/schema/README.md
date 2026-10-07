# egghalla schema

Question model for the WNBA trivia app. Strict TypeScript, no runtime dependencies.

## Files

| File | Purpose |
|---|---|
| `types.ts` | Knowledge graph: players (season-stamped), teams, orgs, people, concepts, storyline events, game artifacts |
| `question.ts` | Templates, presentation blocks, response kinds, `Question` |
| `concepts.data.ts` | Seed concept graph with one-sentence glosses |
| `events.data.ts` | Seed storylines (`verified: false` until sourced) |
| `learner.ts` | Grading, credit (info usage limits credit), mastery, downward credit |
| `difficulty.ts` | Heuristic: obscurity + combo + dated + unfamiliar − favorite team |
| `info.ts` | Info-mode rows: authored + definitions + league averages, leak-filtered |
| `assets.ts` | Asset manifest and request workflow (provide / diagram / drop) |
| `lint.ts` | Build-time checks for concepts, questions, assets |
| `scheduler.ts` | Level mix, presentation variety, level-up suggestion |
| `generators/` | Mismatch, apply·fit, read·stat line |

## UI contract

The UI renders a `Presentation`. Everything it needs to support:

**Stimulus blocks** (`Block["type"]`): `prompt` · `entity` · `comparison` · `clueSequence` · `list` · `statLine` · `shotChart` · `court` · `scoreboard` · `concept` · `event` · `media` · `benchmark`

**Response kinds** (`Response["kind"]`): `text` · `number` · `entityPick` · `choice` · `multi` · `perItemText` · `perItemToggle` · `match` · `selfGrade`

**Flow:** show `stimulus` → collect `response.primary` → on give-up, offer `response.fallback` if present → show `explain` → run `followUp` if present.

**Info toggle:** per question. Rows come from `buildInfo()`; hide the toggle when it returns `[]`. Report `usedInfo` in the `AnswerEvent`.

**Refs, not data:** blocks carry `Ref`s and `Field` lists; the UI resolves values and portraits from the graph. `portrait: "required"` means drop the block or clue step if the asset is missing; `"preferred"` means fall back (initials, silhouette).

**Semantics, not layout:** `highlight` and `focus` mark emphasis; the UI decides what emphasis looks like.

## Seeding loop

`npm run check:seed` (or `npx tsx src/schema/seed/check.ts`) runs the lints, prints difficulty bands, and prints the asset checklist.

1. Write questions → `lintAll()` must return no errors.
2. `assetChecklist()` → provide each image (and its focus cue), mark it `diagram`, or drop the question.
3. Flip `verified` on events and curated facts once sourced.
