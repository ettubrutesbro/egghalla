// ─────────────────────────────────────────────────────────────
// Core data types: the knowledge graph the questions draw on.
// Everything volatile is season-stamped.
// ─────────────────────────────────────────────────────────────

export type Season = number;
export type Tier = 0 | 1 | 2;

export type RefKind = "player" | "team" | "org" | "person" | "concept" | "event";
export interface Ref {
  kind: RefKind;
  id: string;
}

// ─── Players ───

export type ListedPosition = "G" | "G-F" | "F-G" | "F" | "F-C" | "C-F" | "C";
export type SizeClass = "guard" | "wing" | "big";

export interface SeasonStats {
  gp: number;
  mpg: number;
  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  bpg: number;
  tovPg: number;
  fgPct: number; // 0–1
  threePct: number; // 0–1
  ftPct: number; // 0–1
  tpaPg: number; // three-point attempts per game
}

export interface PlayerSeason {
  season: Season;
  teamId: string;
  listedPosition: ListedPosition;
  heightIn: number;
  jersey?: number;
  starter: boolean;
  allStar: boolean;
  allDefense: boolean;
  stats: SeasonStats;
}

export interface Player {
  id: string;
  name: string;
  collegeId?: string;
  draft?: { year: number; pick: number; teamId: string };
  household?: boolean; // hand-curated: names a casual fan would know
  hasDunked?: boolean; // hand-curated: has dunked in a WNBA game
  portraitAssetId?: string;
  seasons: PlayerSeason[];
}

// ─── Teams, orgs, non-player people ───

export interface Team {
  id: string;
  name: string;
  city: string;
  conference: "East" | "West";
  firstSeason: Season;
  arena?: string;
}

export interface Org {
  id: string;
  name: string;
  kind: "college" | "league" | "union" | "other";
}

export interface Person {
  id: string;
  name: string;
  playerId?: string; // links a coach/exec to their playing career
  roles: {
    kind: "coach" | "exec" | "media";
    orgId: string; // team or org id
    title: string;
    from: Season;
    to?: Season;
  }[];
  portraitAssetId?: string;
}

// ─── Single-game data for Read / Apply artifacts ───

export interface StatLine {
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl?: number;
  blk?: number;
  tov: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
}

export interface Shot {
  x: number; // feet from left sideline
  y: number; // feet from baseline
  made: boolean;
  three: boolean;
}

export interface GameState {
  score: { us: number; them: number };
  gameClockSec: number;
  shotClockSec: number | null; // null = shot clock off
  possession: "us" | "them";
  period: 1 | 2 | 3 | 4 | "OT";
  timeoutsLeft?: number;
}

// ─── Concepts ───

export interface ConceptNode {
  id: string;
  label: string;
  gloss: string; // one-sentence definition shown in info mode; required
  requires: string[]; // direct prerequisites only
  aliases?: string[]; // "pick" ↔ "screen"
  given?: boolean; // treated as known from the start
  tier: Tier; // obscurity of the concept itself
  assetId?: string; // optional illustration
}

// ─── Storylines ───

export interface StoryEvent {
  id: string;
  date: string; // yyyy or yyyy-mm
  title: string;
  participants: { ref: Ref; role: string }[];
  beats?: { date: string; text: string }[];
  tags: string[];
  source?: string;
  verified: boolean;
}

// ─── Graph bundle ───

export interface Graph {
  players: Map<string, Player>;
  teams: Map<string, Team>;
  orgs: Map<string, Org>;
  people: Map<string, Person>;
  concepts: Map<string, ConceptNode>;
  events: Map<string, StoryEvent>;
  currentSeason: Season;
}

export function seasonOf(p: Player, season: Season): PlayerSeason | undefined {
  return p.seasons.find((s) => s.season === season);
}
