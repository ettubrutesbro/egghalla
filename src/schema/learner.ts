// ─────────────────────────────────────────────────────────────
// Grading, credit, and mastery.
// Questions are served freely; correct answers credit downward
// through the concept graph. Info usage limits what's credited.
// ─────────────────────────────────────────────────────────────

import type { Accept, Presentation, Question, Response } from "./question";
import { RECALL_KINDS } from "./question";
import type { ConceptNode } from "./types";

// ─── Grading ───

export interface GradeResult {
  score: number; // 0–1
  perfect: boolean;
}

export type Submission =
  | { kind: "text"; value: string }
  | { kind: "number"; value: number }
  | { kind: "entityPick"; id: string }
  | { kind: "choice"; id: string }
  | { kind: "multi"; ids: string[] }
  | { kind: "perItemText"; values: Record<string, string> }
  | { kind: "perItemToggle"; values: Record<string, 0 | 1> }
  | { kind: "match"; pairs: Record<string, string> }
  | { kind: "selfGrade"; verdict: "got" | "close" | "missed" };

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents: Salaün → salaun
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matches(value: string, accept: Accept): boolean {
  const v = normalize(value);
  return [accept.canonical, ...(accept.also ?? [])].some((a) => normalize(a) === v);
}

function fraction(hits: number, total: number): GradeResult {
  const score = total ? hits / total : 0;
  return { score, perfect: hits === total };
}

export function grade(r: Response, s: Submission): GradeResult {
  if (r.kind !== s.kind) throw new Error(`Submission ${s.kind} does not match response ${r.kind}`);

  switch (r.kind) {
    case "text":
      return fraction(matches((s as { value: string }).value, r.answer) ? 1 : 0, 1);
    case "number": {
      const v = (s as { value: number }).value;
      return fraction(Math.abs(v - r.answer) <= (r.tolerance ?? 0) ? 1 : 0, 1);
    }
    case "entityPick":
      return fraction((s as { id: string }).id === r.answer ? 1 : 0, 1);
    case "choice":
      return fraction((s as { id: string }).id === r.answer ? 1 : 0, 1);
    case "multi": {
      // hits minus false alarms, floored at 0: checking everything earns nothing
      const selected = new Set((s as { ids: string[] }).ids);
      const correct = new Set(r.answer);
      let hits = 0;
      selected.forEach((id) => correct.has(id) && hits++);
      const falseAlarms = selected.size - hits;
      return {
        score: Math.max(0, (hits - falseAlarms) / correct.size),
        perfect: hits === correct.size && falseAlarms === 0,
      };
    }
    case "perItemText": {
      const values = (s as { values: Record<string, string> }).values;
      const ids = Object.keys(r.answers);
      return fraction(ids.filter((id) => matches(values[id] ?? "", r.answers[id])).length, ids.length);
    }
    case "perItemToggle": {
      const values = (s as { values: Record<string, 0 | 1> }).values;
      const ids = Object.keys(r.answers);
      return fraction(ids.filter((id) => values[id] === r.answers[id]).length, ids.length);
    }
    case "match": {
      const pairs = (s as { pairs: Record<string, string> }).pairs;
      const ids = Object.keys(r.pairs);
      return fraction(ids.filter((id) => pairs[id] === r.pairs[id]).length, ids.length);
    }
    case "selfGrade": {
      const v = (s as { verdict: "got" | "close" | "missed" }).verdict;
      return { score: v === "got" ? 1 : v === "close" ? 0.5 : 0, perfect: v === "got" };
    }
  }
}

// ─── Credit ───

export interface AnswerEvent {
  questionId: string;
  presentationId: string;
  usedInfo: boolean;
  usedFallback: boolean;
  grade: GradeResult;
  day: string; // yyyy-mm-dd
}

/**
 * Full weight for the strongest answer the presentation allows.
 * Falling back from recall to multiple choice halves it.
 */
export function answerWeight(p: Presentation, e: AnswerEvent): number {
  const recallNative = RECALL_KINDS.includes(p.response.primary.kind);
  return recallNative && e.usedFallback ? 0.5 : 1;
}

/**
 * Without info: credit tests, assumes (downward credit), and entity edges.
 * With info: only tests — she read the stats and definitions, so they prove nothing.
 */
export function creditFor(q: Question, p: Presentation, e: AnswerEvent): Map<string, number> {
  const out = new Map<string, number>();
  if (e.grade.score === 0) return out;

  const pts = answerWeight(p, e) * e.grade.score;
  q.tests.forEach((id) => out.set(id, pts));
  if (!e.usedInfo) {
    q.assumes.forEach((id) => out.set(id, Math.max(out.get(id) ?? 0, pts)));
    q.edges.forEach((id) => out.set(id, pts));
  }
  return out;
}

// ─── Mastery ───

/** JSON-serializable for persistence. Keyed by concept id or edge id. */
export interface MasteryRecord {
  score: number;
  days: string[]; // distinct days with a perfect answer
}

export type MasteryState = Record<string, MasteryRecord>;

export const MASTERY_SCORE = 2;
export const MASTERY_DAYS = 2;

export function isMastered(r?: MasteryRecord): boolean {
  return !!r && r.score >= MASTERY_SCORE && r.days.length >= MASTERY_DAYS;
}

/** Only perfect answers count toward the distinct-days requirement. */
export function applyCredit(state: MasteryState, q: Question, p: Presentation, e: AnswerEvent): MasteryState {
  const next: MasteryState = { ...state };
  for (const [id, pts] of creditFor(q, p, e)) {
    const prev = next[id] ?? { score: 0, days: [] };
    const days = e.grade.perfect && !prev.days.includes(e.day) ? [...prev.days, e.day] : prev.days;
    next[id] = { score: prev.score + pts, days };
  }
  return next;
}

function ancestors(id: string, concepts: Map<string, ConceptNode>, out = new Set<string>()): Set<string> {
  for (const req of concepts.get(id)?.requires ?? []) {
    if (!out.has(req)) {
      out.add(req);
      ancestors(req, concepts, out);
    }
  }
  return out;
}

/** Given concepts + mastered concepts + everything mastered concepts depend on. */
export function knownConcepts(state: MasteryState, concepts: Map<string, ConceptNode>): Set<string> {
  const known = new Set<string>();
  concepts.forEach((c) => c.given && known.add(c.id));
  for (const [id, r] of Object.entries(state)) {
    if (!concepts.has(id) || !isMastered(r)) continue;
    known.add(id);
    ancestors(id, concepts).forEach((a) => known.add(a));
  }
  return known;
}
