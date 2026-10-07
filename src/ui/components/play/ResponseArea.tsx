import type { Response } from '../../../schema/question';
import ChoiceList from './ChoiceList';
import styles from './ResponseArea.module.css';

/**
 * Switches on the schema's response kind. Only `choice` is built
 * (multiple choice only, for now); other kinds render a labelled stub.
 */
export default function ResponseArea({ response, picked, onPick }: {
  response: Response;
  picked: string | null;
  onPick: (optionId: string) => void;
}) {
  if (response.kind === 'choice') {
    return <ChoiceList options={response.options} answer={response.answer} picked={picked} onPick={onPick} />;
  }
  return <div className={styles.stub}>{response.kind} input isn&rsquo;t built yet</div>;
}
