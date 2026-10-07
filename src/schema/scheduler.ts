// ─────────────────────────────────────────────────────────────
// Scheduling. She picks a level; each level serves a mix
// (mostly at-level, some one below). Variety comes from picking
// the presentation whose input kind and lead block were least recent.
// ─────────────────────────────────────────────────────────────

import type { AssetManifest } from "./assets";
import { isServable, resolveFocus } from "./assets";
import type { Band } from "./difficulty";
import { difficulty } from "./difficulty";
import { isMastered, knownConcepts, type MasteryState } from "./learner";
import type { BlockType, Presentation, Question, ResponseKind } from "./question";
import type { ConceptNode, Season } from "./types";

export const LEVEL_MIX: Record<Band, Partial<Record<Band, number>>> = {
  easy: { easy: 1 },
  medium: { medium: 0.7, easy: 0.3 },
  hard: { hard: 0.7, medium: 0.3 },
};

export interface RecentCard {
  questionId: string;
  responseKind: ResponseKind;
  leadBlock: BlockType;
}

export function leadBlock(p: Presentation): BlockType {
  return p.stimulus.find((b) => b.type !== "prompt")?.type ?? "prompt";
}

/** Lower is fresher. Recent cards weigh more. */
function staleness(p: Presentation, recent: RecentCard[]): number {
  return recent.reduce((s, r, i) => {
    const w = 1 / (i + 1);
    return s + (r.responseKind === p.response.primary.kind ? 2 * w : 0) + (r.leadBlock === leadBlock(p) ? w : 0);
  }, 0);
}

export function pickPresentation(q: Question, recent: RecentCard[], assets: AssetManifest): Presentation | null {
  const servable = q.presentations.filter((p) => isServable(p, assets));
  if (!servable.length) return null;
  const best = [...servable].sort((a, b) => staleness(a, recent) - staleness(b, recent))[0];
  return resolveFocus(best, assets);
}

function pickBand(level: Band, rand: () => number): Band {
  const mix = Object.entries(LEVEL_MIX[level]) as [Band, number][];
  let r = rand();
  for (const [band, w] of mix) {
    if ((r -= w) <= 0) return band;
  }
  return mix[0][0];
}

export interface NextCard {
  question: Question;
  presentation: Presentation;
  band: Band;
}

export function nextCard(args: {
  questions: Question[];
  level: Band;
  mastery: MasteryState;
  concepts: Map<string, ConceptNode>;
  assets: AssetManifest;
  recent: RecentCard[]; // most recent first
  currentSeason: Season;
  rand?: () => number;
}): NextCard | null {
  const { questions, level, mastery, concepts, assets, recent, currentSeason, rand = Math.random } = args;
  const known = knownConcepts(mastery, concepts);
  const recentIds = new Set(recent.slice(0, 20).map((r) => r.questionId));

  const scored = questions
    .filter((q) => !recentIds.has(q.id))
    .map((q) => ({ q, d: difficulty(q, concepts, known, currentSeason) }));

  const target = pickBand(level, rand);
  const allowed = new Set(Object.keys(LEVEL_MIX[level]) as Band[]);
  const pool = scored.filter((x) => x.d.band === target).length
    ? scored.filter((x) => x.d.band === target)
    : scored.filter((x) => allowed.has(x.d.band));

  // Prefer questions that still teach something.
  const unmastered = (q: Question) =>
    [...q.tests, ...q.edges].filter((id) => !isMastered(mastery[id])).length;
  const ranked = pool.sort((a, b) => unmastered(b.q) - unmastered(a.q) || rand() - 0.5);

  for (const { q, d } of ranked) {
    const p = pickPresentation(q, recent, assets);
    if (p) return { question: q, presentation: p, band: d.band };
  }
  return null;
}

/** Suggest, don't force: offer a level-up after a strong recent run. */
export function suggestLevelUp(
  level: Band,
  history: { band: Band; perfect: boolean; recallNative: boolean; usedFallback: boolean }[]
): boolean {
  if (level === "hard") return false;
  const atLevel = history.filter((h) => h.band === level).slice(0, 10);
  if (atLevel.length < 10) return false;
  const strong = atLevel.filter((h) => h.perfect && !(h.recallNative && h.usedFallback)).length;
  return strong >= 8;
}
