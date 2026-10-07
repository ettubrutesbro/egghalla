import type { InfoRow } from '../../../schema/question';
import type { Ref } from '../../../schema/types';
import InfoRowView from './InfoRowView';
import styles from './InfoPanel.module.css';

/** Info mode: heterogeneous rows from buildInfo(), one row per InfoRow. */
export default function InfoPanel({ rows, onOpen }: { rows: InfoRow[]; onOpen: (ref: Ref) => void }) {
  return (
    <section className={styles.panel} aria-label="Context">
      <h3 className="label">Context</h3>
      <ul className={styles.rows}>
        {rows.map((row, i) => (
          <li key={i}><InfoRowView row={row} onOpen={onOpen} /></li>
        ))}
      </ul>
    </section>
  );
}
