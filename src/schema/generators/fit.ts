// Apply · fit: which of these players matches the role?
// Absolute thresholds; the middle is never used.

import type { Field, Question } from "../question";
import { playerFame } from "../difficulty";
import type { SeasonStats, SizeClass } from "../types";
import { playerRef, shuffle, sizeClass, type PS } from "./util";

export interface RoleSignature {
  conceptId: string;
  label: string;
  group: SizeClass[];
  fits: (s: SeasonStats) => boolean;
  clearlyNot: (s: SeasonStats) => boolean;
  evidence: Field[];
}

// Verify thresholds against the 2025 league leaders before seeding.
export const ROLES: RoleSignature[] = [
  {
    conceptId: "stretch-big",
    label: "stretch big",
    group: ["big"],
    fits: (s) => s.tpaPg >= 3 && s.threePct >= 0.33,
    clearlyNot: (s) => s.tpaPg < 0.5,
    evidence: ["tpaPg", "threePct"],
  },
  {
    conceptId: "rim-protector",
    label: "rim protector",
    group: ["big"],
    fits: (s) => s.bpg >= 2,
    clearlyNot: (s) => s.bpg < 0.6,
    evidence: ["bpg"],
  },
  {
    conceptId: "floor-general",
    label: "floor general",
    group: ["guard"],
    fits: (s) => s.apg >= 6,
    clearlyNot: (s) => s.apg < 2.5,
    evidence: ["apg"],
  },
  {
    conceptId: "ball-hawk",
    label: "ball hawk",
    group: ["guard", "wing"],
    fits: (s) => s.spg >= 1.8,
    clearlyNot: (s) => s.spg < 0.7,
    evidence: ["spg"],
  },
];

const FULL_LINE: Field[] = ["ppg", "rpg", "apg", "spg", "bpg", "tpaPg"];

export function generateFit(
  role: RoleSignature,
  players: PS[],
  opts: { minMpg?: number; fullLine?: boolean; favoriteTeamId?: string; rand?: () => number } = {}
): Question | null {
  const { minMpg = 20, fullLine = false, favoriteTeamId, rand = Math.random } = opts;
  const pool = players.filter(
    (p) =>
      p.season.stats.mpg >= minMpg &&
      role.group.includes(sizeClass(p.season.listedPosition, p.season.heightIn))
  );
  const yes = shuffle(pool.filter((p) => role.fits(p.season.stats)), rand);
  const no = shuffle(pool.filter((p) => role.clearlyNot(p.season.stats)), rand);
  if (!yes.length || !no.length) return null;

  const [answer, foil] = [yes[0], no[0]];
  const options = shuffle([answer, foil], rand);
  const season = answer.season.season;

  return {
    id: `apply:fit:${role.conceptId}:${answer.player.id}:${foil.player.id}:${fullLine ? "full" : "focused"}`,
    template: "apply",
    applyMode: "fit",
    tests: [role.conceptId],
    assumes: [],
    edges: [],
    testsFields: [],
    meta: {
      entityFame: options.map((p) => playerFame(p.player, p.season)),
      factTypes: ["position"],
      season,
      involvesFavoriteTeam: !!favoriteTeamId && options.some((p) => p.season.teamId === favoriteTeamId),
      comboOverride: fullLine ? 2 : 1, // finding the relevant column is the harder skill
    },
    presentations: [
      {
        id: "p1",
        variant: fullLine ? "fitFullLine" : "fitFocused",
        stimulus: [
          { type: "prompt", text: `Which of these players is the ${role.label}?` },
          {
            type: "comparison",
            subjects: options.map(playerRef),
            fields: ["position", "height", ...(fullLine ? FULL_LINE : role.evidence)],
            season,
            portrait: "preferred",
          },
        ],
        response: {
          primary: {
            kind: "choice",
            answer: answer.player.id,
            options: options.map((p) => ({ id: p.player.id, refs: [playerRef(p)] })),
          },
        },
        explain: [{ type: "concept", ref: { kind: "concept", id: role.conceptId }, facet: "definition" }],
      },
    ],
  };
}
