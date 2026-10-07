import type { InfoRow } from '../../../schema/question';
import type { Ref } from '../../../schema/types';
import { fieldValue, toCard } from '../../data/cards';
import { useGraph } from '../../data/GraphContext';
import CardChip from '../cards/CardChip';
import styles from './InfoRowView.module.css';

/**
 * One info row. Rows that point at a graph node render as a library card chip
 * (tap to open the card); everything else is a label + value line.
 */
export default function InfoRowView({ row, onOpen }: { row: InfoRow; onOpen: (ref: Ref) => void }) {
  const graph = useGraph();
  const b = row.block;

  if (b.type === 'entity' || b.type === 'concept' || b.type === 'event') {
    const card = toCard(graph, b.ref);
    if (card) {
      const detail =
        b.type === 'entity' ? b.show.map((f) => fieldValue(graph, b.ref, f)).filter(Boolean).join(' · ')
        : b.type === 'concept' ? card.body[0]
        : card.subtitle;
      return <CardChip card={card} onOpen={onOpen} detail={detail} />;
    }
  }

  const value = b.type === 'benchmark' ? '[League value]' : `${b.type} block`;
  return (
    <div className={styles.plain}>
      <span className={styles.label}>{row.label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}
