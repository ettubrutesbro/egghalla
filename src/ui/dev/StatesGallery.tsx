import { useReducer } from 'react';
import { playReducer, sessionPreset, type PlayPreset, type Session } from '../state/playSession';
import { libraryPreset, libraryReducer, type LibraryPreset } from '../state/libraryNav';
import PhoneShell from '../components/common/PhoneShell';
import TabBar from '../components/common/TabBar';
import PlayScreen from '../components/play/PlayScreen';
import LibraryScreen from '../components/library/LibraryScreen';
import styles from './StatesGallery.module.css';

// Every named state side by side, each one live and independent.
// Mirrors the frames on the design canvas. Open at #/states.

const PLAY: [PlayPreset, string][] = [
  ['fresh', 'Ask'],
  ['context', 'Context open'],
  ['libraryCard', 'Library card from context'],
  ['noContext', 'No context (info off)'],
  ['choosing', 'Answering'],
  ['right', 'Answered right'],
  ['wrong', 'Answered wrong'],
  ['end', 'End of set'],
];

const LIBRARY: [LibraryPreset, string][] = [
  ['player', 'Players'],
  ['concept', 'Glossary'],
  ['detail', 'Card detail'],
];

function PlayFrame({ base, preset }: { base: Session; preset: PlayPreset }) {
  const [s, dispatch] = useReducer(playReducer, undefined, () => sessionPreset(base, preset));
  return (
    <PhoneShell framed tabBar={<TabBar active="play" />}>
      <PlayScreen session={s} dispatch={dispatch} />
    </PhoneShell>
  );
}

function LibraryFrame({ preset }: { preset: LibraryPreset }) {
  const [s, dispatch] = useReducer(libraryReducer, undefined, () => libraryPreset(preset));
  return (
    <PhoneShell framed tabBar={<TabBar active="library" />}>
      <LibraryScreen nav={s} dispatch={dispatch} />
    </PhoneShell>
  );
}

export default function StatesGallery({ base }: { base: Session }) {
  return (
    <main className={styles.gallery}>
      <p className={styles.note}>
        Every frame is live. Tab-bar links leave this view; <a href="#/play">open the app</a>.
      </p>
      <section className={styles.row}>
        <h2 className={styles.rowTitle}>Play</h2>
        <div className={styles.frames}>
          {PLAY.map(([preset, label]) => (
            <figure key={preset} className={styles.frame}>
              <figcaption className={styles.caption}>{label}</figcaption>
              <PlayFrame base={base} preset={preset} />
            </figure>
          ))}
        </div>
      </section>
      <section className={styles.row}>
        <h2 className={styles.rowTitle}>Library</h2>
        <div className={styles.frames}>
          {LIBRARY.map(([preset, label]) => (
            <figure key={preset} className={styles.frame}>
              <figcaption className={styles.caption}>{label}</figcaption>
              <LibraryFrame preset={preset} />
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
