import type { Dispatch } from 'react';
import { toCard } from '../../data/cards';
import { useGraph } from '../../data/GraphContext';
import { isFinished, summarize, type PlayAction, type Session } from '../../state/playSession';
import ProgressPips from './ProgressPips';
import QuestionCard from './QuestionCard';
import EndOfSet from './EndOfSet';
import CardDetail from '../cards/CardDetail';
import styles from './PlayScreen.module.css';

export default function PlayScreen({ session, dispatch }: { session: Session; dispatch: Dispatch<PlayAction> }) {
  const graph = useGraph();
  const { overlay, index } = session;
  const top = overlay.length ? toCard(graph, overlay[overlay.length - 1]) : null;
  const prev = overlay.length > 1 ? toCard(graph, overlay[overlay.length - 2]) : null;

  return (
    <div className={styles.screen}>
      {/* Everything under the overlay goes inert so focus and screen readers stay on top. */}
      <div className={styles.base} inert={top ? true : undefined}>
        <ProgressPips cards={session.cards} index={index} />
        {isFinished(session) ? (
          <EndOfSet stats={summarize(session)} onRestart={() => dispatch({ type: 'restart' })} />
        ) : (
          <QuestionCard
            key={index}
            turn={session.turns[index]}
            card={session.cards[index]}
            isLast={index === session.turns.length - 1}
            dispatch={dispatch}
          />
        )}
      </div>

      {top && (
        <div className={styles.overlay} role="dialog" aria-label={top.title}>
          <CardDetail
            card={top}
            backLabel={prev ? prev.title : 'Back to question'}
            onBack={() => dispatch({ type: 'closeCard' })}
            onOpen={(ref) => dispatch({ type: 'openCard', ref })}
          />
        </div>
      )}
    </div>
  );
}
