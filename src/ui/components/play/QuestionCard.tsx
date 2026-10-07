import type { Dispatch } from 'react';
import type { CardState, PlayAction, Turn } from '../../state/playSession';
import Stimulus from './Stimulus';
import InfoPanel from './InfoPanel';
import AskActions from './AskActions';
import ResponseArea from './ResponseArea';
import PostAnswerBar from './PostAnswerBar';
import styles from './QuestionCard.module.css';

/**
 * Stimulus pinned top, info scrolls in the middle,
 * stage-specific controls pinned to the bottom.
 */
export default function QuestionCard({ turn, card, isLast, dispatch }: {
  turn: Turn;
  card: CardState;
  isLast: boolean;
  dispatch: Dispatch<PlayAction>;
}) {
  const hasInfo = turn.info.length > 0;
  return (
    <article className={styles.card} aria-label="Question">
      <Stimulus blocks={turn.presentation.stimulus} />

      <div className={styles.middle}>
        {hasInfo && card.infoOpen && <InfoPanel rows={turn.info} onOpen={(ref) => dispatch({ type: 'openCard', ref })} />}
      </div>

      <div className={styles.controls}>
        {card.stage === 'ask' && (
          <AskActions
            hasInfo={hasInfo}
            infoOpen={card.infoOpen}
            onKnowIt={() => dispatch({ type: 'knowIt' })}
            onToggleInfo={() => dispatch({ type: 'toggleInfo' })}
          />
        )}
        {card.stage !== 'ask' && (
          <ResponseArea
            response={turn.presentation.response.primary}
            picked={card.picked}
            onPick={(optionId) => dispatch({ type: 'pick', optionId })}
          />
        )}
        {card.stage === 'answered' && (
          <PostAnswerBar
            star={card.star}
            down={card.down}
            nextLabel={isLast ? 'Finish' : 'Next'}
            onStar={() => dispatch({ type: 'toggleStar' })}
            onDown={() => dispatch({ type: 'toggleDown' })}
            onNext={() => dispatch({ type: 'next' })}
          />
        )}
      </div>
    </article>
  );
}
