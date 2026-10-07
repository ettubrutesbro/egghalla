import type { Block } from '../../../schema/question';
import qc from './QuestionCard.module.css';
import styles from './Stimulus.module.css';

/**
 * Renders a presentation's stimulus blocks in order.
 * Only `prompt` has a real treatment so far; the rest are labelled stubs
 * so unbuilt block types are visible rather than silently dropped.
 */
export default function Stimulus({ blocks }: { blocks: Block[] }) {
  return (
    <div className={qc.stimulus}>
      {blocks.map((b, i) =>
        b.type === 'prompt' ? (
          <h2 key={b.id ?? i} className="display">{b.text}</h2>
        ) : (
          <div key={b.id ?? i} className={styles.stub}>{b.type} block</div>
        ),
      )}
    </div>
  );
}
