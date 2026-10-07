# Question framework

How questions are modeled, scored, and served. The code is in `src/schema/`; `decisions.md` has the why behind each rule.

## Knowledge graph

Questions draw on a graph of four node kinds. Facts are the edges between them.

| Kind | Covers | Volatility |
|---|---|---|
| Person | Players, coaches, execs, media figures | Team, role, and stats change each season, so player data is season-stamped (`PlayerSeason`) |
| Org | WNBA teams, colleges, league bodies (WNBPA) | Mostly stable |
| Concept | Vocabulary, positions, rules, roles | Stable; arranged as a prerequisite DAG |
| Event | Storylines, drafts, trades, titles, CBA fights | Dated; links several nodes through participants |

A light question reads one edge (Wilson → Aces). A combinatory question joins several (player → team → roster → size → threat). Templates are query shapes over this graph.

## Question anatomy

```
Question
├─ template, facet?, polarity?, applyMode?
├─ tests        concepts a correct answer proves
├─ assumes      concepts needed to understand the question
├─ edges        entity facts a correct answer proves ("reese->college:lsu")
├─ testsFields  entity fields being tested; never shown in stimulus or info
├─ meta         difficulty inputs: entity fame, fact types, season, favorite team
└─ presentations[]
   ├─ stimulus  ordered semantic blocks
   ├─ response  primary input + optional fallback (write-first → multiple choice)
   ├─ info      authored rows; more are added automatically
   ├─ explain   shown after answering
   └─ followUp  a nested presentation (mismatch exploit, fact-check correction)
```

## Templates

| Template | Combo | Info mode | Typical response |
|---|---|---|---|
| reveal | 0 | off | entityPick (type-ahead) → choice of portraits |
| recall | 0 | off | entityPick or text → choice |
| define | 0 | definitions | selfGrade, text, perItemText, match, perItemToggle (why) |
| apply | 1 | definitions | choice, number, text |
| setSelect | 1 | off | choice or multi of player refs |
| mismatch | 2 | stat cards + definitions | choice of player pairs, exploit follow-up |
| connection | 1 | team/position only | text with accepted list → choice |
| scenario | 2 | definitions | perItemToggle (why), choice |
| read | 1 | league averages | perItemToggle |

## Stimulus blocks

`prompt` · `entity` · `comparison` · `clueSequence` · `list` · `statLine` · `shotChart` · `court` · `scoreboard` · `concept` · `event` · `media` · `benchmark`

Blocks carry refs and field lists; the UI resolves values and portraits from the data. A `prompt` may contain `{focus}`, which is filled from the media asset's focus cue.

## Response kinds

`text` · `number` · `entityPick` · `choice` · `multi` · `perItemText` · `perItemToggle` · `match` · `selfGrade`

`RECALL_KINDS` (text, number, entityPick, perItemText, selfGrade) are the recall-style ones; falling back from these halves the answer weight.

## Difficulty

```
score = obscurity + combo + dated + unfamiliar − favorite
        0–2         0–2     0–1     0–1          0–1
band:   0–1 easy · 2 medium · 3+ hard
```

- **obscurity**: max of entity fame, fact-type obscurity, and the tier of tested concepts.
- **combo**: template default, or `meta.comboOverride`; `why` adds 1, capped at 2.
- **dated**: the question's season is older than last season.
- **unfamiliar**: any assumed concept she doesn't know yet.
- **favorite**: the question involves the Valkyries.

## Concepts, credit, mastery

- Each concept has `requires` (direct prerequisites), a `gloss`, a `tier`, optional `aliases` (pick ↔ screen), and `given` for basics.
- `knownConcepts()` = given + mastered + everything mastered concepts depend on (downward credit).
- `creditFor()`: without info, credit tests, assumes, and edges. With info, only tests.
- `applyCredit()` accumulates score and the distinct days with a perfect answer. Mastered = score ≥ 2 on ≥ 2 days.

## Info mode

`buildInfo()` merges three row sources, de-duplicates, and leak-filters:

1. Authored rows on the presentation (stat cards, a roster for context).
2. Definitions for assumed concepts she hasn't learned.
3. League-average benchmarks for any stimulus showing a stat line, shot chart, or percentage field.

An empty result means the UI hides the toggle.

## Scheduling

- `nextCard()` scores eligible questions, picks a band from the level mix, prefers questions with unmastered tests or edges, skips the last 20 cards, and picks the freshest servable presentation.
- `suggestLevelUp()` returns true after 8 strong answers in her last 10 at the current level.

## Generators

Data-driven templates live in `src/schema/generators/`:

- `mismatch.ts`: classifies every pairing between two rosters (hunted / unthreatening / fair / ambiguous) and builds the question with one trap and crossmatch distractors.
- `fit.ts`: role signatures (stretch big, rim protector, floor general, ball hawk) with absolute fits / clearly-not thresholds. `fullLine: true` shows the whole stat line instead of just the evidence columns, which is harder.
- `statline.ts`: outlier claims for the read toggles.

Thresholds are first guesses. Check them against the pulled 2025 and 2026 stats before generating at scale.

## Assets

`AssetEntry` has a status: `requested` → `provided` | `diagram` | `dropped`. `isServable()` holds back any presentation with an unresolved required asset or an unfilled `{focus}`. `assetChecklist()` prints the to-do list.

## Lints

`lintAll()` errors on: unknown concepts or prerequisites, cycles, alias collisions, missing `polarity`/`applyMode`, leaks of tested fields or concepts, answers not in options, missing per-item answers, unknown media, `minChars < 3`, duplicate ids. It warns when an assumed concept isn't tested directly or through anything built on it.

## Seeding loop

1. Write or generate questions in `src/schema/seed/`.
2. `npm run check:seed`: lints must pass. Review the difficulty bands and asset checklist it prints.
3. Provide each requested photo with its focus cue, or switch it to a diagram, or drop the question.
4. Set `verified: true` on events and hand-curated facts once checked against a source.
5. `npm run build:explorer` and review the cards in `public/seed-explorer.html`.
