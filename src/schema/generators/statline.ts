// Read · stat line: toggle each stat as fine or not ideal.
// Only obvious outliers — bad for any player in any role.

import type { ListItem, Question } from "../question";
import type { Ref, StatLine } from "../types";

type Verdict = 0 | 1; // 0 = fine, 1 = not ideal

const BAD: Record<string, (s: StatLine) => boolean> = {
  tov: (s) => s.tov >= 6,
  fg: (s) => s.fga >= 12 && s.fgm / s.fga <= 0.25,
  three: (s) => s.tpa >= 7 && s.tpm / s.tpa <= 0.15,
  ft: (s) => s.fta >= 6 && s.ftm / s.fta <= 0.5,
};

const GOOD: Record<string, (s: StatLine) => boolean> = {
  pts: (s) => s.pts >= 25,
  reb: (s) => s.reb >= 12,
  ast: (s) => s.ast >= 9,
  fgHot: (s) => s.fga >= 10 && s.fgm / s.fga >= 0.6,
};

function label(id: string, s: StatLine): string {
  switch (id) {
    case "tov": return `${s.tov} turnovers`;
    case "fg":
    case "fgHot": return `${s.fgm}-for-${s.fga} shooting`;
    case "three": return `${s.tpm}-for-${s.tpa} from three`;
    case "ft": return `${s.ftm}-for-${s.fta} at the line`;
    case "pts": return `${s.pts} points`;
    case "reb": return `${s.reb} rebounds`;
    case "ast": return `${s.ast} assists`;
    default: return id;
  }
}

export function statlineClaims(s: StatLine): { id: string; label: string; verdict: Verdict }[] {
  const bad = Object.entries(BAD).filter(([, t]) => t(s)).map(([id]) => ({ id, label: label(id, s), verdict: 1 as Verdict }));
  const good = Object.entries(GOOD).filter(([, t]) => t(s)).map(([id]) => ({ id, label: label(id, s), verdict: 0 as Verdict }));
  return bad.length && good.length ? [...bad, ...good] : [];
}

export function generateStatlineRead(args: {
  id: string;
  line: StatLine;
  ref?: Ref; // omit for a hypothetical line
  context?: string; // "W 78–74 vs. Liberty"
  season: number;
}): Question | null {
  const claims = statlineClaims(args.line);
  if (!claims.length) return null;

  const items: ListItem[] = claims.map((c) => ({ id: c.id, label: c.label }));
  const tests = [
    ...(claims.some((c) => c.id === "tov") ? ["turnover"] : []),
    ...(claims.some((c) => c.id === "fg" || c.id === "fgHot") ? ["fg-pct"] : []),
    ...(claims.some((c) => c.id === "three") ? ["three-pct"] : []),
    ...(claims.some((c) => c.id === "ft") ? ["ft-pct"] : []),
  ];

  return {
    id: `read:statline:${args.id}`,
    template: "read",
    tests,
    assumes: [],
    edges: [],
    testsFields: [],
    meta: { entityFame: [], factTypes: [], season: args.season },
    presentations: [
      {
        id: "p1",
        variant: "toggleEach",
        stimulus: [
          { type: "statLine", ref: args.ref, line: args.line, context: args.context },
          { type: "prompt", text: "Which of these are fine, and which are not ideal?" },
          { id: "stats", type: "list", items },
        ],
        response: {
          primary: {
            kind: "perItemToggle",
            listId: "stats",
            labels: ["Fine", "Not ideal"],
            answers: Object.fromEntries(claims.map((c) => [c.id, c.verdict])),
          },
        },
        // league-average rows are added automatically by buildInfo
      },
    ],
  };
}
