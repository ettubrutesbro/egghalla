import type { CardState } from '../../state/playSession';
import styles from './ProgressPips.module.css';

export default function ProgressPips({ cards, index }: { cards: CardState[]; index: number }) {
  return (
    <div className={styles.pips} aria-hidden="true">
      {cards.map((c, i) => (
        <span key={i} className={styles.pip} data-state={i === index ? 'current' : c.stage === 'answered' ? 'done' : 'todo'} />
      ))}
    </div>
  );
}
