import type { InfoRow, Option, Question } from '../../schema/question';

// Placeholder questions shaped like the schema's `Question`.
// Multiple choice only for now: every primary response is `choice`.

const opts = (...labels: string[]): Option[] => labels.map((label, i) => ({ id: 'abcd'[i], label }));

const meta = { entityFame: [0 as const], factTypes: ['strategy' as const] };

const row = (label: string, block: InfoRow['block']): InfoRow => ({ label, block });

export const placeholderQuestions: Question[] = [
  {
    id: 'q1', template: 'apply', applyMode: 'callIt', tests: [], assumes: ['g1'], edges: [], testsFields: [], meta,
    presentations: [{
      id: 'q1.a', variant: 'default',
      stimulus: [{ type: 'prompt', text: '[Question one, short]' }],
      response: { primary: { kind: 'choice', options: opts('[Choice A]', '[Longer choice B that wraps onto a second line]', '[Choice C]', '[Choice D]'), answer: 'b' } },
      info: [
        row('[Player name A]', { type: 'entity', ref: { kind: 'player', id: 'p1' }, show: ['team', 'position', 'height'] }),
        row('[Team name A]', { type: 'entity', ref: { kind: 'team', id: 't1' }, show: ['conference'] }),
        row('[Storyline A]', { type: 'event', ref: { kind: 'event', id: 's1' }, show: ['title', 'date'] }),
      ],
    }],
  },
  {
    id: 'q2', template: 'mismatch', tests: [], assumes: ['g2'], edges: [], testsFields: [], meta,
    presentations: [{
      id: 'q2.a', variant: 'pairOptions',
      stimulus: [{ type: 'prompt', text: '[Question two, a longer prompt that wraps across two or three lines on a narrow phone screen]' }],
      response: {
        primary: {
          kind: 'choice', answer: 'c',
          options: [
            { id: 'a', refs: [{ kind: 'player', id: 'p1' }, { kind: 'player', id: 'p2' }] },
            { id: 'b', refs: [{ kind: 'player', id: 'p2' }, { kind: 'player', id: 'p3' }] },
            { id: 'c', refs: [{ kind: 'player', id: 'p1' }, { kind: 'player', id: 'p3' }] },
          ],
        },
      },
      info: [
        row('[Player name B]', { type: 'entity', ref: { kind: 'player', id: 'p2' }, show: ['team', 'position', 'height'] }),
        row('[Player name C]', { type: 'entity', ref: { kind: 'player', id: 'p3' }, show: ['team', 'position', 'height'] }),
      ],
    }],
  },
  {
    // recall: info mode is off for this template, so the context button is hidden
    id: 'q3', template: 'recall', tests: [], assumes: [], edges: [], testsFields: ['team'], meta,
    presentations: [{
      id: 'q3.a', variant: 'default',
      stimulus: [{ type: 'prompt', text: '[Question three: recall, so no context]' }],
      response: { primary: { kind: 'choice', options: opts('[Choice A]', '[Choice B]', '[Choice C]', '[Choice D]'), answer: 'a' } },
    }],
  },
  {
    id: 'q4', template: 'define', facet: 'what', tests: ['g3'], assumes: ['g2'], edges: [], testsFields: [], meta,
    presentations: [{
      id: 'q4.a', variant: 'default',
      stimulus: [{ type: 'prompt', text: '[Question four]' }],
      response: { primary: { kind: 'choice', options: opts('[Choice A]', '[Choice B]', '[Choice C]', '[Choice D]'), answer: 'c' } },
    }],
  },
  {
    id: 'q5', template: 'apply', applyMode: 'whatNext', tests: [], assumes: [], edges: [], testsFields: [], meta,
    presentations: [{
      id: 'q5.a', variant: 'default',
      stimulus: [{ type: 'prompt', text: '[Question five, a little longer than the last]' }],
      response: { primary: { kind: 'choice', options: opts('[Choice A]', '[Choice B]', '[Choice C]', '[Choice D]'), answer: 'b' } },
      info: [row('[Storyline B]', { type: 'event', ref: { kind: 'event', id: 's2' }, show: ['title', 'beats'] })],
    }],
  },
  {
    id: 'q6', template: 'scenario', facet: 'what', tests: [], assumes: ['g1'], edges: [], testsFields: [], meta,
    presentations: [{
      id: 'q6.a', variant: 'default',
      stimulus: [{ type: 'prompt', text: '[Question six]' }],
      response: { primary: { kind: 'choice', options: opts('[Choice A]', '[Choice B]', '[Choice C]', '[Choice D]'), answer: 'd' } },
      info: [row('[Team name C]', { type: 'entity', ref: { kind: 'team', id: 't3' }, show: ['conference'] })],
    }],
  },
];
