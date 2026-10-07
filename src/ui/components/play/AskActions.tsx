import { InfoIcon } from '../common/icons';
import styles from './AskActions.module.css';

export default function AskActions({ hasInfo, infoOpen, onKnowIt, onToggleInfo }: {
  hasInfo: boolean;
  infoOpen: boolean;
  onKnowIt: () => void;
  onToggleInfo: () => void;
}) {
  return (
    <div className={styles.stack}>
      <button type="button" className={`${styles.big} ${styles.primary}`} onClick={onKnowIt}>
        <span aria-hidden="true" className={styles.emoji}>🙋🏻</span>
        <span>I know the answer</span>
      </button>
      {/* Hidden, not disabled, when the template has info mode off (reveal, recall, setSelect). */}
      {hasInfo && (
        <button type="button" className={`${styles.big} ${styles.secondary}`} aria-expanded={infoOpen} onClick={onToggleInfo}>
          <InfoIcon size={30} />
          <span>{infoOpen ? 'Hide context' : 'Show me context'}</span>
        </button>
      )}
    </div>
  );
}
