// Run: npm run check:seed
import { CONCEPTS } from "../concepts.data";
import { assetChecklist, isServable } from "../assets";
import { difficulty } from "../difficulty";
import { knownConcepts } from "../learner";
import { lintAll } from "../lint";
import { ASSETS } from "./assets.seed";
import { SEED_QUESTIONS } from "./questions.seed";

const concepts = new Map(CONCEPTS.map((c) => [c.id, c]));
const { errors, warnings } = lintAll(SEED_QUESTIONS, concepts, ASSETS);

console.log(`errors (${errors.length})`);
errors.forEach((e) => console.log("  ✗ " + e));
console.log(`warnings (${warnings.length})`);
warnings.forEach((w) => console.log("  · " + w));

const known = knownConcepts({}, concepts);
const rows = SEED_QUESTIONS.map((q) => {
  const d = difficulty(q, concepts, known, 2026);
  const servable = q.presentations.filter((p) => isServable(p, ASSETS)).length;
  return { id: q.id, template: q.template, band: d.band, score: d.score, servable: `${servable}/${q.presentations.length}` };
});
console.table(rows);

const bands = rows.reduce<Record<string, number>>((m, r) => ((m[r.band] = (m[r.band] ?? 0) + 1), m), {});
console.log("bands:", bands);
console.log("\nASSET CHECKLIST\n" + assetChecklist(ASSETS));
if (errors.length) process.exit(1);
