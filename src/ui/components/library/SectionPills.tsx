import { SECTIONS, type CardKind } from '../../data/cards';
import styles from './SectionPills.module.css';

export default function SectionPills({ active, onPick }: { active: CardKind; onPick: (kind: CardKind) => void }) {
  return (
    <div role="group" aria-label="Library sections" className={styles.pills}>
      {SECTIONS.map((s) => (
        <button key={s.kind} type="button" className={styles.pill} aria-pressed={s.kind === active} onClick={() => onPick(s.kind)}>
          {s.plural}
        </button>
      ))}
    </div>
  );
}
