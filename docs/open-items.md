# Open items

Things the framework needs before it can run on real data. Remove an item when it's done.

## Reconcile the seed with the data pull

- **Player ids.** The seed uses kebab-case slugs (`aja-wilson`). `public/data/players.json` uses `wnba:<personId>` (A'ja Wilson is `wnba:1628932`). Either add a slug → id alias map, or rewrite the seed to the data's ids. A ref-resolution lint should fail on any ref that doesn't resolve.
- **Team ids.** The seed uses short names (`aces`, `valkyries`); the data uses team abbreviations (`LVA`, `GSV`) and numeric TEAM_IDs. Same decision.
- **Positions.** The data has full strings (`Forward-Guard`); the schema's `ListedPosition` uses abbreviations (`F-G`). Needs a mapper.
- **Height.** The data has raw `"6-4"` strings; the schema uses `heightIn`. Needs a parser.
- **Stats.** The data uses stats.wnba.com keys (`PTS`, `FG3A`, `FG_PCT`); the schema's `SeasonStats` uses `ppg`, `tpaPg`, `fgPct`. Needs a mapper. There's no All-Star or All-Defense flag in the pull yet; Wikidata awards are sparse (91% of players have none), so those flags likely need hand curation.
- **Season.** The data covers 2025 and 2026. The seed was authored against 2025. Decide whether the deck's "current season" is 2026 and re-check the seed's roster facts against it (several 2025 teams changed for 2026, e.g. Reese is on the Dream).

## Verify before setting `verified: true`

- Valkyries 2025 roster used in the seed: Burton, Hayes, Martin, Leite, Thornton, Salaün, Rupert.
- `hasDunked` for Leslie, Griner, Parker (hand-curated; not in any stats feed).
- The hand-written Aces–Fever mismatch: heights, ppg, and minutes for Wilson, Mitchell, Stokes, Colson, Young, Hull.
- Dawn Staley still coaching South Carolina.
- All 12 storyline events in `events.data.ts`.

## Thresholds to check against the pulled stats

- Mismatch threat: star ≥ 17 ppg, low < 6 ppg.
- Fit roles: stretch big (≥ 3 3PA, ≥ 33%), rim protector (≥ 2 bpg), floor general (≥ 6 apg), ball hawk (≥ 1.8 spg), and their clearly-not cutoffs.
- Shot chart: few threes and cold shooting, at the team level.

## Content

- **The easy deck is thin.** 7 easy questions are servable now (the box-out photo question is held). Batch 2 should lean easy: definitions of `post-up`, `switch`, `and-one`, `shot-clock`; more Valkyries reveal and recall.
- **`post-up` is untested.** It's assumed by the mismatch question and the hunt-the-switch scenario.
- **Photos requested:** `public/media/concepts/box-out.jpg`, `public/media/concepts/charge-call.jpg`. Details in `src/schema/seed/assets.seed.ts`.
- **Headshots.** The CDN returns a generic silhouette (ETag `dab8a90a…`) for unknown ids. Flag those before treating any portrait as `required`.

## Elsewhere

- UI: `docs/ui.md` covers the app in `src/ui/`, where it departs from `decisions.md`, and its open questions.
