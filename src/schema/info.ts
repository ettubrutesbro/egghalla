// ─────────────────────────────────────────────────────────────
// Info mode: a per-question toggle. Rows are heterogeneous
// (players, definitions, benchmarks, media) so the UI can tabulate.
// Rule: show context, minus whatever the question tests.
// ─────────────────────────────────────────────────────────────

import type { BenchStat, Block, Field, InfoRow, Presentation, Question } from "./question";
import { TEMPLATE_SPEC } from "./question";
import type { ConceptNode, Season, StatLine } from "./types";

/**
 * Why a block would give away the answer, or null if it's safe.
 * Stimulus may intentionally show a tested concept (definition → term),
 * so concept and benchmark checks apply to info rows only.
 */
export function blockLeak(q: Question, b: Block, scope: "stimulus" | "info" = "info"): string | null {
  const fields: Field[] = b.type === "entity" ? b.show : b.type === "comparison" ? b.fields : [];
  const leaked = fields.find((f) => q.testsFields.includes(f));
  if (leaked) return `shows tested field "${leaked}"`;
  if (scope === "stimulus") return null;

  if (b.type === "concept" && b.facet !== "term" && q.tests.includes(b.ref.id))
    return `reveals tested concept "${b.ref.id}"`;

  if (b.type === "benchmark" && q.tests.includes("league-averages"))
    return "shows league averages the question tests";

  return null;
}

// ─── Auto rows ───

const BENCH_LABEL: Record<BenchStat, string> = {
  fgPct: "League avg FG%",
  threePct: "League avg 3P%",
  ftPct: "League avg FT%",
  tovPg: "League avg turnovers",
};

const FIELD_TO_BENCH: Partial<Record<Field, BenchStat>> = {
  fgPct: "fgPct",
  threePct: "threePct",
  ftPct: "ftPct",
  tovPg: "tovPg",
};

function statsInLine(l: StatLine): BenchStat[] {
  const out: BenchStat[] = ["tovPg"];
  if (l.fga) out.push("fgPct");
  if (l.tpa) out.push("threePct");
  if (l.fta) out.push("ftPct");
  return out;
}

/** League-average context for any stimulus showing percentages or turnovers. */
export function benchmarkRows(p: Presentation, season: Season): InfoRow[] {
  const stats = new Set<BenchStat>();
  for (const b of p.stimulus) {
    if (b.type === "statLine") statsInLine(b.line).forEach((s) => stats.add(s));
    if (b.type === "shotChart") {
      stats.add("fgPct");
      stats.add("threePct");
    }
    const fields = b.type === "comparison" ? b.fields : b.type === "entity" ? b.show : [];
    fields.forEach((f) => {
      const s = FIELD_TO_BENCH[f];
      if (s) stats.add(s);
    });
  }
  return [...stats].map((stat) => ({
    label: BENCH_LABEL[stat],
    block: { type: "benchmark", stat, season, scope: "league" },
  }));
}

/** Definitions for assumed concepts she hasn't learned yet. */
export function glossRows(q: Question, concepts: Map<string, ConceptNode>, known: Set<string>): InfoRow[] {
  return q.assumes
    .filter((id) => !known.has(id) && concepts.has(id))
    .map((id) => ({
      label: concepts.get(id)!.label,
      block: { type: "concept", ref: { kind: "concept", id }, facet: "definition" },
    }));
}

/**
 * Final info rows: authored + definitions + benchmarks, de-duplicated,
 * leak-filtered. Empty array means the toggle should be hidden.
 */
export function buildInfo(
  q: Question,
  p: Presentation,
  concepts: Map<string, ConceptNode>,
  known: Set<string>,
  season: Season
): InfoRow[] {
  if (TEMPLATE_SPEC[q.template].info === null) return [];

  const rows = [...(p.info ?? []), ...glossRows(q, concepts, known), ...benchmarkRows(p, season)];

  const seen = new Set<string>();
  return rows.filter((r) => {
    const key = JSON.stringify(r.block);
    if (seen.has(key) || blockLeak(q, r.block)) return false;
    seen.add(key);
    return true;
  });
}
