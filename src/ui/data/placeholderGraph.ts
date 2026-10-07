import type { ConceptNode, Graph, Player, StoryEvent, Team } from '../../schema/types';

// Placeholder knowledge graph shaped exactly like the schema's `Graph`.
// Bracketed strings are deliberate stand-ins. Numbers that the UI doesn't
// display yet are zeroed. Swap this for an adapter over public/data and
// src/schema/*.data.ts once seed ids are reconciled (docs/open-items.md).

const SEASON = 2026;

const zeroStats = { gp: 0, mpg: 0, ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0, tovPg: 0, fgPct: 0, threePct: 0, ftPct: 0, tpaPg: 0 };

const player = (id: string, name: string, teamId: string, listedPosition: Player['seasons'][number]['listedPosition'], heightIn: number): Player => ({
  id,
  name,
  seasons: [{ season: SEASON, teamId, listedPosition, heightIn, starter: true, allStar: false, allDefense: false, stats: zeroStats }],
});

const team = (id: string, name: string, conference: Team['conference']): Team => ({ id, name, city: '[City]', conference, firstSeason: 0 });

const players: Player[] = [
  player('p1', '[Player name A]', 't1', 'G', 69),
  player('p2', '[Player name B]', 't2', 'F-C', 76),
  player('p3', '[Player name C]', 't3', 'G-F', 72),
];

const teams: Team[] = [team('t1', '[Team name A]', 'West'), team('t2', '[Team name B]', 'East'), team('t3', '[Team name C]', 'West')];

const events: StoryEvent[] = [
  { id: 's1', date: '[yyyy]', title: '[Storyline A]', verified: false, tags: [],
    participants: [{ ref: { kind: 'player', id: 'p1' }, role: '[role]' }, { ref: { kind: 'team', id: 't1' }, role: '[role]' }],
    beats: [{ date: '[yyyy-mm]', text: '[Beat: what happened first.]' }, { date: '[yyyy-mm]', text: '[Beat: why people cared.]' }] },
  { id: 's2', date: '[yyyy]', title: '[Storyline B]', verified: false, tags: [],
    participants: [{ ref: { kind: 'player', id: 'p3' }, role: '[role]' }],
    beats: [{ date: '[yyyy-mm]', text: '[Beat]' }] },
  { id: 's3', date: '[yyyy]', title: '[Storyline C]', verified: false, tags: [],
    participants: [{ ref: { kind: 'team', id: 't3' }, role: '[role]' }] },
];

const concepts: ConceptNode[] = [
  { id: 'g1', label: '[Term A]', tier: 0, requires: [], gloss: '[Term A definition: one plain-language sentence.]' },
  { id: 'g2', label: '[Term B]', tier: 1, requires: ['g1'], gloss: '[Term B definition: builds on Term A.]' },
  { id: 'g3', label: '[Term C]', tier: 2, requires: ['g2'], gloss: '[Term C definition: builds on Term B.]' },
];

const byId = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x]));

export const placeholderGraph: Graph = {
  players: byId(players),
  teams: byId(teams),
  orgs: new Map(),
  people: new Map(),
  concepts: byId(concepts),
  events: byId(events),
  currentSeason: SEASON,
};
