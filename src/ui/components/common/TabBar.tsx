import styles from './TabBar.module.css';
import { LibraryIcon, PlayIcon } from './icons';

const TABS = [
  { id: 'play', label: 'Play', href: '#/play', Icon: PlayIcon },
  { id: 'library', label: 'Library', href: '#/library', Icon: LibraryIcon },
] as const;

export default function TabBar({ active }: { active: 'play' | 'library' }) {
  return (
    <nav className={styles.bar} aria-label="Sections">
      {TABS.map(({ id, label, href, Icon }) => (
        <a key={id} href={href} className={styles.tab} aria-current={active === id ? 'page' : undefined}>
          <Icon />
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
