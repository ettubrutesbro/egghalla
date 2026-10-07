import { SearchIcon } from '../common/icons';
import styles from './SearchField.module.css';

export default function SearchField({ value, placeholder, onChange }: { value: string; placeholder: string; onChange: (q: string) => void }) {
  return (
    <label className={styles.field}>
      <SearchIcon />
      <input type="search" value={value} placeholder={placeholder} aria-label={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
