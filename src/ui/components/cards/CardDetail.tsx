import type { Ref } from '../../../schema/types';
import { sectionOf, toCard, type Card } from '../../data/cards';
import { useGraph } from '../../data/GraphContext';
import CardGlyph from './CardGlyph';
import CardChip from './CardChip';
import BackButton from '../common/BackButton';
import styles from './CardDetail.module.css';

/**
 * One library card, full page. Rendered by the Library tab and by the Play
 * info overlay; the caller owns the back stack and passes labels + intents.
 */
export default function CardDetail({ card, backLabel, onBack, onOpen }: {
  card: Card;
  backLabel: string;
  onBack: () => void;
  onOpen: (ref: Ref) => void;
}) {
  const graph = useGraph();
  const related = card.related.map((r) => toCard(graph, r)).filter((c): c is Card => c !== null);
  return (
    <div className={styles.page}>
      <BackButton label={backLabel} onClick={onBack} />
      <div className={styles.scroll}>
        <header className={styles.header}>
          <CardGlyph card={card} size="lg" />
          <span className={`label ${styles.type} ${styles[card.kind]}`}>{sectionOf(card.kind).label}</span>
          <h2 className="display">{card.title}</h2>
          <p className={styles.sub}>{card.subtitle}</p>
        </header>

        {card.facts.length > 0 && (
          <dl className={styles.facts}>
            {card.facts.map((f) => (
              <div key={f.label} className={styles.fact}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {card.body.length > 0 && (
          <div className={styles.body}>
            {card.body.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        )}

        {related.length > 0 && (
          <section className={styles.related} aria-label="Related">
            <h3 className="label">Related</h3>
            {related.map((c) => <CardChip key={`${c.kind}:${c.ref.id}`} card={c} onOpen={onOpen} />)}
          </section>
        )}
      </div>
    </div>
  );
}
