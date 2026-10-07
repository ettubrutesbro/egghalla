import type { Field } from '../../schema/question';
import type { Graph, Player, Ref, RefKind } from '../../schema/types';
import { seasonOf } from '../../schema/types';

// Library cards are a view over the graph: one per player, team, event, concept.
// Related links are derived from graph edges, never hand-listed.

export type CardKind = Extract<RefKind, 'player' | 'team' | 'event' | 'concept'>;

export interface Card {
  ref: Ref;
  kind: CardKind;
  title: string;
  subtitle: string;
  glyph: string;
  facts: { label: string; value: string }[];
  body: string[];
  related: Ref[];
}

export const SECTIONS: { kind: CardKind; label: string; plural: string; shape: 'round' | 'square' }[] = [
  { kind: 'player', label: 'Player', plural: 'Players', shape: 'round' },
  { kind: 'team', label: 'Team', plural: 'Teams', shape: 'square' },
  { kind: 'event', label: 'Storyline', plural: 'Storylines', shape: 'square' },
  { kind: 'concept', label: 'Glossary', plural: 'Glossary', shape: 'square' },
];

export const sectionOf = (kind: CardKind) => SECTIONS.find((s) => s.kind === kind)!;

export const isCardKind = (k: RefKind): k is CardKind => k === 'player' || k === 'team' || k === 'event' || k === 'concept';

export const sameRef = (a: Ref, b: Ref) => a.kind === b.kind && a.id === b.id;

const initials = (name: string) =>
  name.replace(/[[\]]/g, '').split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join('').toUpperCase();

const feetInches = (inches: number) => `${Math.floor(inches / 12)}′${inches % 12}″`;

const pct = (x: number) => `${Math.round(x * 1000) / 10}%`;

/** Display value for one schema `Field` on a player or team. */
export function fieldValue(g: Graph, ref: Ref, field: Field): string | null {
  if (ref.kind === 'team') {
    const t = g.teams.get(ref.id);
    if (!t) return null;
    if (field === 'name') return t.name;
    if (field === 'conference') return `${t.conference}ern Conference`;
    return null;
  }
  if (ref.kind !== 'player') return null;
  const p = g.players.get(ref.id);
  const s = p && seasonOf(p, g.currentSeason);
  if (!p || !s) return null;
  switch (field) {
    case 'name': return p.name;
    case 'team': return g.teams.get(s.teamId)?.name ?? s.teamId;
    case 'position': return s.listedPosition;
    case 'height': return feetInches(s.heightIn);
    case 'jersey': return s.jersey != null ? `#${s.jersey}` : null;
    case 'allStar': return s.allStar ? 'All-Star' : null;
    case 'ppg': case 'rpg': case 'apg': case 'spg': case 'bpg': case 'tovPg': case 'tpaPg':
      return String(s.stats[field]);
    case 'fgPct': case 'threePct': case 'ftPct':
      return pct(s.stats[field]);
    default: return null;
  }
}

function playerTeamRef(g: Graph, p: Player): Ref | null {
  const s = seasonOf(p, g.currentSeason);
  return s ? { kind: 'team', id: s.teamId } : null;
}

function relatedRefs(g: Graph, ref: Ref): Ref[] {
  const out: Ref[] = [];
  const inEvents = [...g.events.values()].filter((e) => e.participants.some((pt) => sameRef(pt.ref, ref)));
  switch (ref.kind) {
    case 'player': {
      const p = g.players.get(ref.id);
      const team = p && playerTeamRef(g, p);
      if (team) out.push(team);
      break;
    }
    case 'team':
      g.players.forEach((p) => {
        const team = playerTeamRef(g, p);
        if (team && team.id === ref.id) out.push({ kind: 'player', id: p.id });
      });
      break;
    case 'event':
      g.events.get(ref.id)?.participants.forEach((pt) => out.push(pt.ref));
      break;
    case 'concept': {
      const c = g.concepts.get(ref.id);
      c?.requires.forEach((id) => out.push({ kind: 'concept', id }));
      g.concepts.forEach((other) => other.requires.includes(ref.id) && out.push({ kind: 'concept', id: other.id }));
      break;
    }
  }
  inEvents.forEach((e) => out.push({ kind: 'event', id: e.id }));
  return out.filter((r) => isCardKind(r.kind));
}

export function toCard(g: Graph, ref: Ref): Card | null {
  if (!isCardKind(ref.kind)) return null;
  const related = relatedRefs(g, ref);
  switch (ref.kind) {
    case 'player': {
      const p = g.players.get(ref.id);
      if (!p) return null;
      const field = (f: Field) => fieldValue(g, ref, f) ?? '—';
      return {
        ref, kind: 'player', title: p.name, glyph: initials(p.name),
        subtitle: `${field('position')}, ${field('team')}`,
        facts: [{ label: 'Team', value: field('team') }, { label: 'Position', value: field('position') }, { label: 'Height', value: field('height') }],
        body: [], related,
      };
    }
    case 'team': {
      const t = g.teams.get(ref.id);
      if (!t) return null;
      return {
        ref, kind: 'team', title: t.name, glyph: initials(t.name),
        subtitle: `${t.city}, ${t.conference}`,
        facts: [{ label: 'City', value: t.city }, { label: 'Conference', value: t.conference }],
        body: [], related,
      };
    }
    case 'event': {
      const e = g.events.get(ref.id);
      if (!e) return null;
      return {
        ref, kind: 'event', title: e.title, glyph: '¶', subtitle: e.date,
        facts: [], body: (e.beats ?? []).map((b) => `${b.date}: ${b.text}`), related,
      };
    }
    case 'concept': {
      const c = g.concepts.get(ref.id);
      if (!c) return null;
      return { ref, kind: 'concept', title: c.label, glyph: 'Aa', subtitle: 'Rule or concept', facts: [], body: [c.gloss], related };
    }
  }
  return null;
}

export function listCards(g: Graph, kind: CardKind, query = ''): Card[] {
  const ids: string[] =
    kind === 'player' ? [...g.players.keys()]
    : kind === 'team' ? [...g.teams.keys()]
    : kind === 'event' ? [...g.events.keys()]
    : [...g.concepts.keys()];
  const q = query.trim().toLowerCase();
  return ids
    .map((id) => toCard(g, { kind, id }))
    .filter((c): c is Card => c !== null && (!q || `${c.title} ${c.subtitle}`.toLowerCase().includes(q)));
}
