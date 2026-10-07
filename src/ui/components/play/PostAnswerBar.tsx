import { ArrowRightIcon, StarIcon, ThumbDownIcon } from '../common/icons';
import styles from './PostAnswerBar.module.css';

export default function PostAnswerBar({ star, down, nextLabel, onStar, onDown, onNext }: {
  star: boolean;
  down: boolean;
  nextLabel: string;
  onStar: () => void;
  onDown: () => void;
  onNext: () => void;
}) {
  return (
    <div className={styles.bar}>
      <button type="button" className={`${styles.icon} ${styles.down}`} aria-label="Thumbs down" aria-pressed={down} onClick={onDown}>
        <ThumbDownIcon />
      </button>
      <button type="button" className={`${styles.icon} ${styles.star}`} aria-label="Star" aria-pressed={star} onClick={onStar}>
        <StarIcon filled={star} />
      </button>
      <button type="button" className={styles.next} onClick={onNext}>
        <span>{nextLabel}</span>
        <ArrowRightIcon />
      </button>
    </div>
  );
}
