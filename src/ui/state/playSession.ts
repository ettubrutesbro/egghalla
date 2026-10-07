import type { AnswerEvent, GradeResult } from '../../schema/learner';
import { grade } from '../../schema/learner';
import type { InfoRow, Presentation, Question } from '../../schema/question';
import { buildInfo } from '../../schema/info';
import type { Graph, Ref } from '../../schema/types';

/**
 * Per-question stage:
 *   ask       "I know the answer" / "Show me context"
 *   choosing  response input visible
 *   answered  graded; thumbs down / star / next
 */
export type Stage = 'ask' | 'choosing' | 'answered';

export interface CardState {
  stage: Stage;
  infoOpen: boolean;
  usedInfo: boolean; // ever opened; limits credit (schema/learner.ts creditFor)
  picked: string | null; // option id
  result: GradeResult | null;
  star: boolean;
  down: boolean;
}

/** A question resolved for this session: which presentation, and its info rows. */
export interface Turn {
  question: Question;
  presentation: Presentation;
  info: InfoRow[]; // empty → hide the context toggle
}

export interface Session {
  turns: Turn[];
  index: number;
  cards: CardState[];
  overlay: Ref[]; // library cards opened from the info panel, as a back stack
  events: AnswerEvent[]; // ready to feed applyCredit() once persistence exists
}

const freshCard = (): CardState => ({
  stage: 'ask', infoOpen: false, usedInfo: false, picked: null, result: null, star: false, down: false,
});

const today = () => new Date().toISOString().slice(0, 10);

/**
 * TODO: replace with scheduler.nextCard() and real mastery state.
 * For now: first presentation of each question, in order, nothing mastered.
 */
export function createSession(questions: Question[], graph: Graph): Session {
  const known = new Set([...graph.concepts.values()].filter((c) => c.given).map((c) => c.id));
  const turns = questions.map((question) => {
    const presentation = question.presentations[0];
    return { question, presentation, info: buildInfo(question, presentation, graph.concepts, known, graph.currentSeason) };
  });
  return { turns, index: 0, cards: turns.map(freshCard), overlay: [], events: [] };
}

export type PlayAction =
  | { type: 'knowIt' }
  | { type: 'toggleInfo' }
  | { type: 'pick'; optionId: string }
  | { type: 'toggleStar' }
  | { type: 'toggleDown' }
  | { type: 'next' }
  | { type: 'openCard'; ref: Ref }
  | { type: 'closeCard' }
  | { type: 'restart' };

const patchCard = (s: Session, patch: Partial<CardState>): Session => ({
  ...s,
  cards: s.cards.map((c, i) => (i === s.index ? { ...c, ...patch } : c)),
});

export function playReducer(s: Session, a: PlayAction): Session {
  const card = s.cards[s.index];
  const turn = s.turns[s.index];
  switch (a.type) {
    case 'knowIt':
      return patchCard(s, { stage: 'choosing' });
    case 'toggleInfo':
      return patchCard(s, { infoOpen: !card.infoOpen, usedInfo: true });
    case 'pick': {
      if (card.stage !== 'choosing') return s;
      const result = grade(turn.presentation.response.primary, { kind: 'choice', id: a.optionId });
      const event: AnswerEvent = {
        questionId: turn.question.id,
        presentationId: turn.presentation.id,
        usedInfo: card.usedInfo,
        usedFallback: false,
        grade: result,
        day: today(),
      };
      return { ...patchCard(s, { stage: 'answered', picked: a.optionId, result }), events: [...s.events, event] };
    }
    case 'toggleStar':
      return patchCard(s, { star: !card.star });
    case 'toggleDown':
      return patchCard(s, { down: !card.down });
    case 'next':
      return { ...s, index: s.index + 1, overlay: [] };
    case 'openCard':
      return { ...s, overlay: [...s.overlay, a.ref] };
    case 'closeCard':
      return { ...s, overlay: s.overlay.slice(0, -1) };
    case 'restart':
      return { ...s, index: 0, cards: s.turns.map(freshCard), overlay: [], events: [] };
  }
}

export const isFinished = (s: Session) => s.index >= s.turns.length;

export function summarize(s: Session) {
  return {
    total: s.turns.length,
    right: s.cards.filter((c) => c.result?.perfect).length,
    starred: s.cards.filter((c) => c.star).length,
    flagged: s.cards.filter((c) => c.down).length,
  };
}

// ─── Named snapshots for the states gallery (mirror the design canvas) ───

export type PlayPreset = 'fresh' | 'context' | 'libraryCard' | 'noContext' | 'choosing' | 'right' | 'wrong' | 'end';

const answerOf = (t: Turn) => {
  const r = t.presentation.response.primary;
  return r.kind === 'choice' ? { answer: r.answer, wrong: r.options.find((o) => o.id !== r.answer)!.id } : null;
};

export function sessionPreset(base: Session, preset: PlayPreset): Session {
  let s: Session = { ...base, cards: base.turns.map(freshCard) };
  const pickAt = (i: number, right: boolean) => {
    const ans = answerOf(s.turns[i]);
    if (!ans) return;
    s = { ...s, index: i };
    s = playReducer(s, { type: 'knowIt' });
    s = playReducer(s, { type: 'pick', optionId: right ? ans.answer : ans.wrong });
  };
  switch (preset) {
    case 'context':
      return playReducer(s, { type: 'toggleInfo' });
    case 'libraryCard':
      s = playReducer(s, { type: 'toggleInfo' });
      return playReducer(s, { type: 'openCard', ref: { kind: 'player', id: 'p1' } });
    case 'noContext':
      return { ...s, index: s.turns.findIndex((t) => t.info.length === 0) };
    case 'choosing':
      return playReducer(s, { type: 'knowIt' });
    case 'right':
      pickAt(0, true);
      return playReducer(s, { type: 'toggleStar' });
    case 'wrong':
      pickAt(0, false);
      return s;
    case 'end':
      s.turns.forEach((_, i) => pickAt(i, i % 3 !== 0));
      s = { ...s, cards: s.cards.map((c, i) => ({ ...c, star: i === 1 || i === 4, down: i === 3 })) };
      return { ...s, index: s.turns.length };
    default:
      return s;
  }
}
