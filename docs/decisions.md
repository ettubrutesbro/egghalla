# Decisions

Settled choices for the question framework, with the reasoning behind each. Current as of 2026-10-07. When a decision changes, edit it in place rather than appending a contradiction. Open questions live in `open-items.md`.

## Purpose

- The app is for Mei Mei (Golden State Valkyries fan) to get comfortable talking about the WNBA: the sport, the business, the players, and what regular fans talk about. It is not bar-trivia recall.
- Questions mix fact memorization with conceptual "why is X an advantage" reasoning.
- Format: a stack of swipeable cards. Recall-style answers come first, with a multiple-choice fallback when she gives up.

## Question types

Nine templates. See `framework.md` for each one's shape.

| Template | Kept because |
|---|---|
| Reveal | Attributes → player. Clue ladder, points drop with each clue |
| Recall | Player → attribute. The mirror of reveal; together they practice a fact both ways |
| Define | One concept, `what` or `why` facet |
| Apply | A concept applied to a concrete case (four modes, below) |
| Set selection | One fact checked across N options, with polarity |
| Mismatch | Size × threat reasoning after switches |
| Connection | The node two entities share |
| Scenario | A decision under a fixed game state |
| Read | Interpret an artifact: stat line, shot chart |

Dropped or replaced:

- **Higher/lower, timeline order, lineage**: dropped.
- **Matchup → mismatch.** "Who guards whom" depends on scheme and switching, so it can't be scored. Whether a pairing is a mismatch mostly can.
- **Odd one out → set selection with `polarity`** (`oneIs`, `oneIsNot`, `allThatApply`). Same mechanic, different instruction. Different polarities test different facts, so they are separate questions, not variants.
- **Arithmetic apply questions** (compute FG%, sum points): dropped. Computing a stat isn't something fans do in conversation.

## Mismatch

- Size class comes from listed position plus height. A plain `F` at 6'3" or taller counts as a big.
- **Hunted** (the answer): guard ↔ big, height gap ≥ 5", the ball handler is a star (All-Star or ≥ 17 ppg), and the defender is not All-Defense.
- **Unthreatening** (the trap distractor): the same size gap, but the ball handler scores < 6 ppg. It's a mismatch on paper that no offense hunts.
- **Fair** (crossmatch distractor): same or adjacent size class, gap ≤ 3".
- **Ambiguous** (everything else, including mid-tier scorers and All-Defense defenders): never shown, as answer or distractor.
- The prompt asks what the offense would *hunt*, not which pairing is a mismatch, because an unthreatening size mismatch is technically a mismatch.
- Trap candidates get a looser minutes floor (8 mpg vs 15), since the best traps are bench players.
- A follow-up asks how the ball handler exploits it: post up or shoot over the top, or attack off the dribble.
- Wrong options carry a `misconception` tag so a wrong pick can route to the right single-fact follow-up.

## Apply

Four modes, no arithmetic:

- **Call it**: which rule or concept describes this case (triple-double, block vs charge).
- **What happens next**: what the rule produces (fouled on a made three; offensive-rebound reset).
- **Fit**: which of these players matches a role (stretch big, rim protector, floor general, ball hawk). Generated from stat signatures with absolute thresholds.
- **Evidence**: which stat backs a claim.
- **Fact-check** is a presentation style usable on any mode ("A fan says… right or wrong?"), with a correction follow-up.

## Read

- Stat-line toggles flag only obvious outliers that are bad for any player in any role: ≥ 6 turnovers, ≤ 25% FG on ≥ 12 attempts, ≤ 15% from three on ≥ 7 attempts, ≤ 50% FT on ≥ 6 attempts. Good outliers: ≥ 25 pts, ≥ 12 reb, ≥ 9 ast, ≥ 60% FG on ≥ 10 attempts. Everything in between never appears as an option.
- Toggle labels are "Fine" / "Not ideal", not good/bad. A rough shooting night can be part of a gritty win; that nuance goes in the explanation.
- League averages appear as info-mode context but never decide the answer key.
- Shot-chart prompts ask whether statements match the chart, not "how did they perform", because few threes is a style, not a verdict.

## Difficulty

- `score = obscurity + combo + dated + unfamiliar − favoriteTeam`; bands are 0–1 easy, 2 medium, 3+ hard.
- Obscurity is the max of player fame (household 0, All-Star or starter 1, others 2), fact type, and the tier of tested concepts. Assumed concepts only count through `unfamiliar`, not obscurity, so they aren't counted twice.
- `why` facet adds +1 combo (capped at 2). Questions about the Valkyries get −1.
- She starts on easy and chooses when to move up. The app suggests a level-up after 8 strong answers of her last 10 at the current level, where a recall-native answer that fell back to multiple choice doesn't count as strong.
- A level serves a mix: medium is 70% medium, 30% easy; hard is 70% hard, 30% medium.

## Learned concepts

- Concepts form a prerequisite DAG (`concepts.data.ts`). Each has a one-sentence gloss.
- **Questions are served freely.** No hard gating and no teach-in-place chains.
- **Downward credit**: mastering a concept credits everything it depends on.
- A question that assumes an unlearned concept gets +1 difficulty. Info mode shows that concept's definition.
- Mastery: score ≥ 2 and perfect answers on ≥ 2 distinct days.
- A few basics are `given` (field goal, three-pointer, free throw, foul, rebound).

## Info mode

- A per-question toggle that brings up context: stat cards for named players, definitions of assumed concepts she hasn't learned, league averages, media. The goal is to test reasoning, not memorization of every player.
- It renders as rows (label + block) so the UI can tabulate disparate things.
- It never shows what the question tests (`testsFields`, tested concepts). A lint enforces this.
- It's off for reveal, recall, and set selection, where any context would be the answer.
- If she uses info, only the tested concepts get credit, not the assumed concepts or entity edges.
- The UI design happens in a separate thread. The schema only says what the info rows contain.

## Presentation

- Blocks describe what is shown and what it means, never layout. `highlight` and `focus` mark emphasis; the UI decides what emphasis looks like.
- A question can have several presentations of the same content (term → meaning, meaning → term, photo → term). The scheduler picks the one whose input kind and lead block were used least recently.
- Per-item toggles replace multi-select wherever every option is clearly right or clearly wrong, so she has to decide each one.
- `entityPick` (type-ahead) needs `minChars ≥ 3`, or autocomplete turns recall into recognition.

## Grading

- Exact answers (reveal, recall, some apply): normalized string match against an accepted list.
- Connection: accepted list covering every valid shared link.
- Define and scenario open answers: self-grade (got it / close / missed).
- Multi-select: (hits − false alarms) / correct, floored at 0.
- Answer weight: full for the strongest answer the presentation allows; half if a recall-native answer fell back to multiple choice. Only perfect answers count toward mastery days.

## Assets

- Concept illustrations use photos, not diagrams.
- While seeding, a question that needs an image registers an asset request (path, what it must show, what to avoid). Jack provides the photo plus a focus cue ("the defender in white, #23"), asks for a diagram instead, or drops the question. Presentations with unresolved required assets are held out of the deck.
- Portraits are `required` (drop the block or clue step without one) or `preferred` (fall back to initials).
- Player photos are licensed; check before any public release.

## Storylines

- Modeled as event nodes with participants and beats, used by existing templates rather than a template of their own.
- Source: manual curation now, Wikipedia season pages for yearly refreshes. Every event is `verified: false` until checked against a source.
- Relationships are included only when publicly confirmed and part of a basketball story (Moore and Irons qualifies). No rumors, breakups, or speculation.

## Data

- One-time, verifiable pull, not live. Full detail for the current and last season, less further back.
- The pull is in `scripts/` and `public/data/` (see `public/data/REPORT.md`).
