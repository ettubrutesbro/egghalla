// Builds public/seed-explorer.html: the seed questions rendered as playable
// cards next to their schema, with computed difficulty and info rows.
// Run: npm run build:explorer

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isServable } from "../src/schema/assets";
import { CONCEPTS } from "../src/schema/concepts.data";
import { difficulty } from "../src/schema/difficulty";
import { EVENTS } from "../src/schema/events.data";
import { buildInfo } from "../src/schema/info";
import { knownConcepts } from "../src/schema/learner";
import { ASSETS } from "../src/schema/seed/assets.seed";
import { SEED_QUESTIONS } from "../src/schema/seed/questions.seed";

const CURRENT_SEASON = 2026;
const INFO_SEASON = 2025; // season the seed's facts are authored against

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const concepts = new Map(CONCEPTS.map((c) => [c.id, c]));
const known = knownConcepts({}, concepts);

const data = {
  questions: SEED_QUESTIONS.map((q) => ({
    ...q,
    difficulty: difficulty(q, concepts, known, CURRENT_SEASON),
    presentations: q.presentations.map((p) => ({
      ...p,
      servable: isServable(p, ASSETS),
      builtInfo: buildInfo(q, p, concepts, known, INFO_SEASON),
    })),
  })),
  concepts: Object.fromEntries(
    CONCEPTS.map((c) => [c.id, { label: c.label, gloss: c.gloss, given: !!c.given, tier: c.tier }])
  ),
  events: Object.fromEntries(EVENTS.map((e) => [e.id, { title: e.title, date: e.date }])),
  assets: Object.fromEntries(ASSETS),
  known: [...known],
};

const template = readFileSync(resolve(root, "scripts/seed-explorer/template.html"), "utf8");
if (!template.includes("/*DATA*/null")) throw new Error("template is missing the /*DATA*/null placeholder");

// Escape "<" so no string in the data can close the <script> tag.
const json = JSON.stringify(data).replace(/</g, "\\u003c");
const out = resolve(root, "public/seed-explorer.html");
writeFileSync(out, template.replace("/*DATA*/null", json));
console.log(`wrote ${out} (${data.questions.length} questions)`);
