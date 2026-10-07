import styles from './BackButton.module.css';
import { ChevronLeftIcon } from './icons';

export default function BackButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.back} onClick={onClick}>
      <ChevronLeftIcon />
      <span className={styles.text}>{label}</span>
    </button>
  );
}
