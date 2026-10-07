// Mismatch: which switch would the offense hunt?
// Size gap (guard ↔ big, ≥5") AND an offensive star with the ball.
// Ambiguous pairings (mid-tier scorers, borderline sizes, All-Defense
// defenders) are never shown, as answer or distractor.

import type { Option, Question } from "../question";
import { playerFame } from "../difficulty";
import { SIZE_RANK, playerRef, shuffle, sizeClass, type PS } from "./util";

export type PairKind = "hunted" | "unthreatening" | "fair" | "ambiguous";

export const THREAT = { starPpg: 17, lowPpg: 6 };

export function threatTier(p: PS): 1 | 2 | 3 {
  if (p.season.allStar || p.season.stats.ppg >= THREAT.starPpg) return 3;
  if (p.season.stats.ppg < THREAT.lowPpg) return 1;
  return 2;
}

interface Pairing {
  offense: PS;
  defense: PS;
  kind: PairKind;
  classGap: number;
}

function classify(offense: PS, defense: PS): Pairing {
  const so = sizeClass(offense.season.listedPosition, offense.season.heightIn);
  const sd = sizeClass(defense.season.listedPosition, defense.season.heightIn);
  const classGap = Math.abs(SIZE_RANK[so] - SIZE_RANK[sd]);
  const heightGap = Math.abs(offense.season.heightIn - defense.season.heightIn);
  const base = { offense, defense, classGap };

  if (classGap <= 1 && heightGap <= 3) return { ...base, kind: "fair" };
  if (classGap === 2 && heightGap >= 5) {
    const tier = threatTier(offense);
    if (tier === 3 && !defense.season.allDefense) return { ...base, kind: "hunted" };
    if (tier === 1) return { ...base, kind: "unthreatening" };
  }
  return { ...base, kind: "ambiguous" };
}

export function generateMismatch(
  rosterA: PS[],
  rosterB: PS[],
  opts: { optionCount?: number; minMpg?: number; trapMinMpg?: number; favoriteTeamId?: string; rand?: () => number } = {}
): Question | null {
  const { optionCount = 3, minMpg = 15, trapMinMpg = 8, favoriteTeamId, rand = Math.random } = opts;

  // Traps are often bench players, so they get a looser minutes floor.
  const pairs = (min: number) => {
    const A = rosterA.filter((p) => p.season.stats.mpg >= min);
    const B = rosterB.filter((p) => p.season.stats.mpg >= min);
    return A.flatMap((a) => B.flatMap((b) => [classify(a, b), classify(b, a)]));
  };
  const rotation = pairs(minMpg);
  const loose = pairs(trapMinMpg);

  const hunted = shuffle(rotation.filter((p) => p.kind === "hunted"), rand);
  if (!hunted.length) return null;
  const answer = hunted[0];

  const pool = [
    ...shuffle(loose.filter((p) => p.kind === "unthreatening"), rand).slice(0, 1),
    ...shuffle(rotation.filter((p) => p.kind === "fair"), rand).sort((x, y) => y.classGap - x.classGap),
  ];

  const used = new Set([answer.offense.player.id, answer.defense.player.id]);
  const distractors: Pairing[] = [];
  for (const p of pool) {
    if (used.has(p.offense.player.id) || used.has(p.defense.player.id)) continue;
    distractors.push(p);
    used.add(p.offense.player.id).add(p.defense.player.id);
    if (distractors.length === optionCount - 1) break;
  }
  if (distractors.length < optionCount - 1) return null;

  const all = shuffle([answer, ...distractors], rand);
  const optId = (p: Pairing) => `${p.offense.player.id}~${p.defense.player.id}`;
  const options: Option[] = all.map((p) => ({
    id: optId(p),
    refs: [playerRef(p.offense), playerRef(p.defense)],
    misconception: p.kind === "unthreatening" ? "hunt" : p.kind === "fair" ? "mismatch" : undefined,
  }));

  const season = answer.offense.season.season;
  const everyone = all.flatMap((p) => [p.offense, p.defense]);
  const offenseBigger = answer.offense.season.heightIn > answer.defense.season.heightIn;

  return {
    id: `mismatch:${optId(answer)}:${season}`,
    template: "mismatch",
    tests: ["mismatch"],
    assumes: ["switch", "position", "post-up"],
    edges: [answer.offense, answer.defense].map((p) => `${p.player.id}->team:${p.season.teamId}`),
    testsFields: [],
    meta: {
      entityFame: everyone.map((p) => playerFame(p.player, p.season)),
      factTypes: ["team", "position"],
      season,
      involvesFavoriteTeam: !!favoriteTeamId && everyone.some((p) => p.season.teamId === favoriteTeamId),
    },
    presentations: [
      {
        id: "p1",
        variant: "pairOptions",
        stimulus: [{ type: "prompt", text: "After switches, which matchup would the offense hunt? (Ball handler listed first.)" }],
        response: { primary: { kind: "choice", options, answer: optId(answer) } },
        info: [
          {
            label: "Players",
            block: {
              type: "comparison",
              subjects: everyone.map(playerRef),
              fields: ["position", "height", "ppg", "allStar"],
              season,
              portrait: "preferred",
            },
          },
        ],
        followUp: {
          id: "p1-exploit",
          variant: "exploit",
          stimulus: [
            { type: "prompt", text: "How does the ball handler exploit it?" },
            {
              type: "comparison",
              subjects: [playerRef(answer.offense), playerRef(answer.defense)],
              fields: ["height", "ppg"],
              season,
              highlight: ["height"],
              portrait: "preferred",
            },
          ],
          response: {
            primary: {
              kind: "choice",
              answer: offenseBigger ? "post" : "drive",
              options: [
                { id: "post", label: "Post up or shoot over the top" },
                { id: "drive", label: "Attack off the dribble" },
                { id: "none", label: "No real advantage" },
              ],
            },
          },
        },
      },
    ],
  };
}
