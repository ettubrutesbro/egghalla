import type { Option } from '../../../schema/question';
import { toCard } from '../../data/cards';
import { useGraph } from '../../data/GraphContext';
import styles from './ChoiceList.module.css';

type Result = 'idle' | 'correct' | 'wrong' | 'dim';

const resultFor = (id: string, answer: string, picked: string | null): Result =>
  picked === null ? 'idle' : id === answer ? 'correct' : id === picked ? 'wrong' : 'dim';

const MARK: Partial<Record<Result, { glyph: string; label: string }>> = {
  correct: { glyph: '✓', label: 'Correct' },
  wrong: { glyph: '✕', label: 'Your answer, wrong' },
};

export default function ChoiceList({ options, answer, picked, onPick }: {
  options: Option[];
  answer: string;
  picked: string | null;
  onPick: (optionId: string) => void;
}) {
  const graph = useGraph();
  // Options can carry refs instead of a label (player pairs, portraits).
  // Portraits come later; for now refs render as names.
  const labelOf = (o: Option) =>
    o.label ?? (o.refs ?? []).map((r) => toCard(graph, r)?.title ?? r.id).join(' & ');

  return (
    <ol className={styles.list}>
      {options.map((o, k) => {
        const result = resultFor(o.id, answer, picked);
        const mark = MARK[result];
        return (
          <li key={o.id} style={{ ['--i' as string]: k }}>
            <button type="button" className={styles.choice} data-result={result} disabled={picked !== null} onClick={() => onPick(o.id)}>
              {labelOf(o)}
              {mark && <span className={styles.mark} aria-label={mark.label}>{mark.glyph}</span>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
