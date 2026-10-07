import { sectionOf, type Card } from '../../data/cards';
import styles from './CardGlyph.module.css';

/** Type is shown by shape + label as well as color, never color alone. */
export default function CardGlyph({ card, size = 'md' }: { card: Card; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span aria-hidden="true" className={`${styles.glyph} ${styles[size]} ${styles[sectionOf(card.kind).shape]} ${styles[card.kind]}`}>
      {card.glyph}
    </span>
  );
}
