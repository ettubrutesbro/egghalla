import type { ReactNode } from 'react';
import type { Ref } from '../../../schema/types';
import { sectionOf, type Card } from '../../data/cards';
import CardGlyph from './CardGlyph';
import { ChevronRightIcon } from '../common/icons';
import styles from './CardChip.module.css';

/**
 * A tappable reference to a library card.
 * `detail` replaces the subtitle line (e.g. the fields an info row shows).
 */
export default function CardChip({ card, onOpen, showType = true, detail }: {
  card: Card;
  onOpen: (ref: Ref) => void;
  showType?: boolean;
  detail?: ReactNode;
}) {
  const section = sectionOf(card.kind);
  return (
    <button type="button" className={`${styles.chip} ${styles.row}`} onClick={() => onOpen(card.ref)}>
      <CardGlyph card={card} size={showType ? 'sm' : 'md'} />
      <span className={styles.text}>
        {showType && <span className={`${styles.type} ${styles[card.kind]}`}>{section.label}</span>}
        <span className={styles.name}>{card.title}</span>
        {detail !== undefined ? <span className={styles.sub}>{detail}</span> : !showType && <span className={styles.sub}>{card.subtitle}</span>}
      </span>
      <ChevronRightIcon className={styles.chev} />
    </button>
  );
}
