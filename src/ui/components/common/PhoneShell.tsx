import type { ReactNode } from 'react';
import styles from './PhoneShell.module.css';

/** Full-bleed on phones; a 390×844 frame on wider screens or when `framed`. */
export default function PhoneShell({ children, tabBar, framed = false }: { children: ReactNode; tabBar?: ReactNode; framed?: boolean }) {
  return (
    <div className={framed ? styles.framed : styles.shell}>
      <div className={styles.screen}>
        <div className={styles.content}>{children}</div>
        {tabBar}
      </div>
    </div>
  );
}
