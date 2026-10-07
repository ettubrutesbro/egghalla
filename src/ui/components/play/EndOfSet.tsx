import type { summarize } from '../../state/playSession';
import styles from './EndOfSet.module.css';

export default function EndOfSet({ stats, onRestart }: { stats: ReturnType<typeof summarize>; onRestart: () => void }) {
  return (
    <div className={styles.end}>
      <h2 className="display">That&rsquo;s the set.</h2>
      <p className={styles.stats}>
        {stats.right} of {stats.total} right. {stats.starred} starred, {stats.flagged} thumbed down.
      </p>
      <button type="button" className={styles.again} onClick={onRestart}>Start over</button>
    </div>
  );
}
