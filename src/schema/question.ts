// ─────────────────────────────────────────────────────────────
// Questions and how they're presented.
// Blocks describe WHAT is shown and its meaning, never layout.
// The UI resolves refs to data and assets.
// ─────────────────────────────────────────────────────────────

import type { GameState, Ref, RefKind, Season, Shot, StatLine, Tier } from "./types";

// ─── Templates ───

export type TemplateId =
  | "reveal" // attributes → player
  | "recall" // player/entity → attribute
  | "define" // concept, what or why
  | "apply" // concept applied to a concrete case
  | "setSelect" // one fact checked across N options
  | "mismatch" // size × threat reasoning after switches
  | "connection" // node two entities share
  | "scenario" // decision under a game state
  | "read"; // interpret an artifact (stat line, shot chart)

export type Facet = "what" | "why";
export type Polarity = "oneIs" | "oneIsNot" | "allThatApply";
export type ApplyMode = "callIt" | "whatNext" | "fit" | "evidence";

export type Field =
  | "name" | "team" | "position" | "height" | "jersey" | "college" | "draft"
  | "conference" | "allStar" | "accolades"
  | "ppg" | "rpg" | "apg" | "spg" | "bpg" | "tovPg"
  | "fgPct" | "threePct" | "ftPct" | "tpaPg";

export interface TemplateSpec {
  combo: Tier; // concepts joined beyond the first
  info: Field[] | null; // null = info mode off for this template
}

export const TEMPLATE_SPEC: Record<TemplateId, TemplateSpec> = {
  reveal: { combo: 0, info: null },
  recall: { combo: 0, info: null },
  define: { combo: 0, info: [] },
  apply: { combo: 1, info: [] },
  setSelect: { combo: 1, info: null },
  mismatch: { combo: 2, info: ["team", "position", "height", "ppg", "allStar"] },
  connection: { combo: 1, info: ["team", "position"] },
  scenario: { combo: 2, info: [] },
  read: { combo: 1, info: [] },
};

// ─── Stimulus blocks ───

export type AssetNeed = "required" | "preferred"; // required: drop block/step if asset missing

export interface Clue {
  id: string;
  field?: Field; // UI renders the subject's value for this field
  portrait?: true; // portrait step
  text?: string; // freeform clue
  points: number; // score if answered after this clue
}

export interface ListItem {
  id: string;
  label: string;
  ref?: Ref;
}

export interface CourtDiagram {
  players: {
    id: string;
    side: "offense" | "defense";
    x: number;
    y: number;
    ref?: Ref;
    label?: string;
  }[];
  ball?: string; // id of ball handler
  actions?: {
    from: string;
    to?: string;
    kind: "screen" | "cut" | "pass" | "drive" | "boxOut" | "shot";
  }[];
  focus?: string; // semantic emphasis; UI decides treatment
}

export type BenchStat = "fgPct" | "threePct" | "ftPct" | "tovPg";

interface BlockBase {
  id?: string; // lets responses bind to a block (per-item inputs)
}

export type Block = BlockBase &
  (
    | { type: "prompt"; text: string } // may contain {focus}
    | { type: "entity"; ref: Ref; show: Field[]; season?: Season; portrait?: AssetNeed }
    | {
        type: "comparison";
        subjects: Ref[];
        fields: Field[];
        season?: Season;
        highlight?: Field[];
        portrait?: AssetNeed;
      }
    | { type: "clueSequence"; subject: Ref; season?: Season; steps: Clue[] }
    | { type: "list"; items: ListItem[] }
    | { type: "statLine"; ref?: Ref; line: StatLine; context?: string } // no ref = hypothetical
    | { type: "shotChart"; teamRef?: Ref; shots: Shot[]; context?: string }
    | { type: "court"; diagram: CourtDiagram }
    | { type: "scoreboard"; state: GameState }
    | { type: "concept"; ref: Ref; facet: "term" | "definition" | "illustration" }
    | { type: "event"; ref: Ref; show: ("title" | "date" | "beats" | "participants")[] }
    | { type: "media"; assetId: string; alt: string; need: AssetNeed }
    | { type: "benchmark"; stat: BenchStat; season: Season; scope: "league" | "G" | "F" | "C" }
  );

export type BlockType = Block["type"];

// ─── Responses ───

export interface Accept {
  canonical: string;
  also?: string[];
}

export interface Option {
  id: string;
  label?: string;
  refs?: Ref[]; // UI renders entities (portraits, pairs) instead of text
  misconception?: string; // concept id this wrong answer signals confusion with
}

export type Response =
  | { kind: "text"; answer: Accept }
  | { kind: "number"; answer: number; unit?: "%" | "pts" | "sec" | "min"; tolerance?: number }
  | { kind: "entityPick"; pool: RefKind; answer: string; minChars: number }
  | { kind: "choice"; options: Option[]; answer: string }
  | { kind: "multi"; options: Option[]; answer: string[] }
  | { kind: "perItemText"; listId: string; answers: Record<string, Accept> }
  | { kind: "perItemToggle"; listId: string; labels: [string, string]; answers: Record<string, 0 | 1> }
  | { kind: "match"; left: Option[]; right: Option[]; pairs: Record<string, string> }
  | { kind: "selfGrade"; canonical: Block[] };

export type ResponseKind = Response["kind"];

/** Recall-style inputs; the rest are recognition-style. */
export const RECALL_KINDS: ResponseKind[] = ["text", "number", "entityPick", "perItemText", "selfGrade"];

export interface ResponseFlow {
  primary: Response;
  fallback?: Response; // write-first → multiple choice
}

// ─── Presentation ───

export interface InfoRow {
  label: string;
  block: Block;
}

export interface Presentation {
  id: string;
  variant: string; // "clueLadder", "pairOptions", "toggleEach", "fit"…
  stimulus: Block[];
  response: ResponseFlow;
  info?: InfoRow[]; // authored rows; auto rows are added by buildInfo
  explain?: Block[]; // shown after answering
  followUp?: Presentation;
}

// ─── Question ───

export type FactType =
  | "team" | "position" | "college" | "draft" | "jersey" | "conference"
  | "coachingStaff" | "exec" | "event" | "curated" | "nicheRule" | "strategy";

export interface DifficultyMeta {
  entityFame: Tier[]; // fame of every player the question touches
  factTypes: FactType[];
  season?: Season; // omit for evergreen facts
  involvesFavoriteTeam?: boolean;
  comboOverride?: Tier;
}

export interface Question {
  id: string;
  template: TemplateId;
  facet?: Facet; // define, scenario
  polarity?: Polarity; // setSelect only
  applyMode?: ApplyMode; // apply only
  tests: string[]; // concept ids a correct answer proves
  assumes: string[]; // concept ids needed to parse the question
  edges: string[]; // entity edges a correct answer proves ("reese->college:lsu")
  testsFields: Field[]; // entity fields the question tests; never shown in stimulus/info
  meta: DifficultyMeta;
  presentations: Presentation[]; // ≥1; scheduler picks
  source?: string;
  verified?: boolean;
}
