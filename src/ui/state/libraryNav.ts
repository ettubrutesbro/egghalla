import type { Ref } from '../../schema/types';
import type { CardKind } from '../data/cards';

export interface LibraryNav {
  section: CardKind;
  query: string;
  stack: Ref[]; // open cards, as a back stack
}

export type LibraryAction =
  | { type: 'section'; section: CardKind }
  | { type: 'query'; query: string }
  | { type: 'open'; ref: Ref }
  | { type: 'back' };

export const createLibraryNav = (section: CardKind = 'player'): LibraryNav => ({ section, query: '', stack: [] });

export function libraryReducer(s: LibraryNav, a: LibraryAction): LibraryNav {
  switch (a.type) {
    case 'section':
      return createLibraryNav(a.section);
    case 'query':
      return { ...s, query: a.query };
    case 'open':
      return { ...s, stack: [...s.stack, a.ref] };
    case 'back':
      return { ...s, stack: s.stack.slice(0, -1) };
  }
}

export type LibraryPreset = CardKind | 'detail';

export const libraryPreset = (p: LibraryPreset): LibraryNav =>
  p === 'detail' ? { ...createLibraryNav('player'), stack: [{ kind: 'player', id: 'p1' }] } : createLibraryNav(p);
