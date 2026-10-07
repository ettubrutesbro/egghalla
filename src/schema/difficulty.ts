// ─────────────────────────────────────────────────────────────
// Difficulty heuristic.
// score = obscurity + combo + dated + unfamiliar − favoriteTeam
// bands: 0–1 easy · 2 medium · 3+ hard
// ─────────────────────────────────────────────────────────────

import type { FactType, Question } from "./question";
import { TEMPLATE_SPEC } from "./question";
import type { ConceptNode, Player, PlayerSeason, Season, Tier } from "./types";

export type Band = "easy" | "medium" | "hard";

export const FACT_OBSCURITY: Record<FactType, Tier> = {
  team: 0,
  position: 0,
  college: 1,
  draft: 1,
  jersey: 1,
  conference: 1,
  coachingStaff: 1,
  exec: 1,
  event: 1,
  curated: 2,
  nicheRule: 2,
  strategy: 2,
};

/** household 0 · All-Star or starter 1 · everyone else 2 */
export function playerFame(p: Player, s?: PlayerSeason): Tier {
  if (p.household) return 0;
  return s && (s.allStar || s.starter) ? 1 : 2;
}

export interface Difficulty {
  score: number;
  band: Band;
  breakdown: {
    obscurity: Tier;
    combo: Tier;
    dated: 0 | 1;
    unfamiliar: 0 | 1;
    favorite: 0 | 1;
  };
}

export function difficulty(
  q: Question,
  concepts: Map<string, ConceptNode>,
  known: Set<string>,
  currentSeason: Season
): Difficulty {
  // Assumed concepts raise difficulty only via `unfamiliar`, not obscurity.
  const conceptTiers = q.tests.map((id) => concepts.get(id)?.tier ?? 0);
  const obscurity = Math.max(
    0,
    ...q.meta.entityFame,
    ...q.meta.factTypes.map((f) => FACT_OBSCURITY[f]),
    ...conceptTiers
  ) as Tier;

  const baseCombo = q.meta.comboOverride ?? TEMPLATE_SPEC[q.template].combo;
  const combo = Math.min(2, baseCombo + (q.facet === "why" ? 1 : 0)) as Tier;

  const dated = q.meta.season !== undefined && q.meta.season < currentSeason - 1 ? 1 : 0;
  const unfamiliar = q.assumes.some((id) => !known.has(id)) ? 1 : 0;
  const favorite = q.meta.involvesFavoriteTeam ? 1 : 0;

  const score = Math.max(0, obscurity + combo + dated + unfamiliar - favorite);
  const band: Band = score <= 1 ? "easy" : score === 2 ? "medium" : "hard";

  return { score, band, breakdown: { obscurity, combo, dated, unfamiliar, favorite } };
}
