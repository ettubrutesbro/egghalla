import type { Dispatch } from 'react';
import { listCards, sectionOf, toCard, type Card } from '../../data/cards';
import { useGraph } from '../../data/GraphContext';
import type { LibraryAction, LibraryNav } from '../../state/libraryNav';
import type { Ref } from '../../../schema/types';
import SectionPills from './SectionPills';
import SearchField from './SearchField';
import CardChip from '../cards/CardChip';
import CardDetail from '../cards/CardDetail';
import styles from './LibraryScreen.module.css';

export default function LibraryScreen({ nav, dispatch }: { nav: LibraryNav; dispatch: Dispatch<LibraryAction> }) {
  const graph = useGraph();
  const open = (ref: Ref) => dispatch({ type: 'open', ref });
  const { stack, section, query } = nav;
  const plural = sectionOf(section).plural;

  const top = stack.length ? toCard(graph, stack[stack.length - 1]) : null;
  if (top) {
    const prev = stack.length > 1 ? toCard(graph, stack[stack.length - 2]) : null;
    return <CardDetail card={top} backLabel={prev ? prev.title : plural} onBack={() => dispatch({ type: 'back' })} onOpen={open} />;
  }

  const cards: Card[] = listCards(graph, section, query);
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className="display">Library</h1>
        <SearchField value={query} placeholder={`Search ${plural.toLowerCase()}`} onChange={(q) => dispatch({ type: 'query', query: q })} />
        <SectionPills active={section} onPick={(s) => dispatch({ type: 'section', section: s })} />
      </header>
      <div className={styles.list}>
        {cards.map((c) => <CardChip key={c.ref.id} card={c} onOpen={open} showType={false} />)}
        {cards.length === 0 && <p className={styles.empty}>No {plural.toLowerCase()} match &ldquo;{query}&rdquo;.</p>}
      </div>
    </div>
  );
}
