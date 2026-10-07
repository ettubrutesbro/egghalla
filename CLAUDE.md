# egghalla

A mobile WNBA trivia app Jack is building for Mei Mei (a Golden State Valkyries fan), so she can get comfortable talking about the sport, the business, and the players. Swipeable question cards; recall-first answers with a multiple-choice fallback.

## Read first

- `docs/decisions.md`: settled choices and why. Don't relitigate these without asking.
- `docs/framework.md`: how questions are modeled, scored, and served.
- `docs/open-items.md`: what's unresolved. Check here before starting new work.
- `src/schema/README.md`: the contract the UI renders against.

## Layout

| Path | What |
|---|---|
| `scripts/pull-*.mjs`, `scripts/build-players.mjs` | One-time data pull (Wikidata + stats.wnba.com) |
| `public/data/` | Pulled data: `players.json`, raw envelopes, `REPORT.md` |
| `public/explorer.html` | Browser explorer for the pulled player data |
| `src/schema/` | Question schema, grading, difficulty, info mode, lints, scheduler |
| `src/schema/generators/` | Data-driven question generators (mismatch, fit, stat line) |
| `src/schema/seed/` | Hand-authored seed questions, asset requests, `check.ts` |
| `scripts/build-seed-explorer.ts` | Builds `public/seed-explorer.html` from the seed |
| `public/seed-explorer.html` | Playable seed cards next to their schema |

## Commands

```
npm install
npm run typecheck        # strict tsc over src/ and scripts/
npm run check:seed       # lints, difficulty bands, asset checklist
npm run build:explorer   # rebuild public/seed-explorer.html
npm run pull             # re-run the data pull
```

## Conventions

- The schema describes meaning, not layout. Don't add visual properties to blocks; the UI decides how emphasis, portraits, and info rows look.
- Every new question must pass `npm run check:seed`. Rebuild the explorer after changing the seed.
- Hand-curated facts and storylines stay `verified: false` until checked against a source.
- Answer keys only use clear cases. If a reasonable fan could argue an option, leave it out (the "excluded middle").
- When a question needs an image, add an `AssetEntry` with status `requested` and tell Jack the path and what it must show. Don't invent or fetch images.
- Thresholds in the generators are first guesses; check them against `public/data/players.json` before generating at scale.
- Seed ids don't yet match the data pull's ids. See `docs/open-items.md`.
