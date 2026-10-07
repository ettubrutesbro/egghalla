// ─────────────────────────────────────────────────────────────
// Build-time checks. Run over the seed before shipping a deck.
// ─────────────────────────────────────────────────────────────

import type { AssetManifest } from "./assets";
import { blockLeak } from "./info";
import type { Block, Presentation, Question, Response } from "./question";
import { TEMPLATE_SPEC } from "./question";
import type { ConceptNode } from "./types";

export function lintConcepts(concepts: Map<string, ConceptNode>): string[] {
  const errs: string[] = [];
  const aliasOwner = new Map<string, string>();

  for (const c of concepts.values()) {
    c.requires.forEach((r) => !concepts.has(r) && errs.push(`concept ${c.id}: unknown prerequisite "${r}"`));
    if (!c.gloss.trim()) errs.push(`concept ${c.id}: empty gloss`);
    for (const a of c.aliases ?? []) {
      if (concepts.has(a)) errs.push(`concept ${c.id}: alias "${a}" collides with a concept id`);
      if (aliasOwner.has(a)) errs.push(`concept ${c.id}: alias "${a}" already used by ${aliasOwner.get(a)}`);
      aliasOwner.set(a, c.id);
    }
  }

  const visiting = new Set<string>();
  const done = new Set<string>();
  const visit = (id: string, path: string[]) => {
    if (done.has(id)) return;
    if (visiting.has(id)) {
      errs.push(`cycle: ${[...path, id].join(" → ")}`);
      return;
    }
    visiting.add(id);
    concepts.get(id)?.requires.forEach((r) => visit(r, [...path, id]));
    visiting.delete(id);
    done.add(id);
  };
  concepts.forEach((_, id) => visit(id, []));

  return errs;
}

function blockIds(p: Presentation): Set<string> {
  return new Set(p.stimulus.flatMap((b) => (b.id ? [b.id] : [])));
}

function listItemIds(p: Presentation, listId: string): string[] | null {
  const b = p.stimulus.find((x) => x.id === listId);
  return b && b.type === "list" ? b.items.map((i) => i.id) : null;
}

function lintResponse(where: string, p: Presentation, r: Response): string[] {
  const errs: string[] = [];
  switch (r.kind) {
    case "choice":
      if (!r.options.some((o) => o.id === r.answer)) errs.push(`${where}: answer "${r.answer}" not in options`);
      break;
    case "multi":
      r.answer
        .filter((a) => !r.options.some((o) => o.id === a))
        .forEach((a) => errs.push(`${where}: answer "${a}" not in options`));
      if (!r.answer.length) errs.push(`${where}: multi needs at least one correct option`);
      break;
    case "perItemText":
    case "perItemToggle": {
      const items = listItemIds(p, r.listId);
      if (!items) {
        errs.push(`${where}: list "${r.listId}" not found in stimulus`);
        break;
      }
      items
        .filter((id) => !(id in r.answers))
        .forEach((id) => errs.push(`${where}: no answer for list item "${id}"`));
      break;
    }
    case "match":
      Object.entries(r.pairs).forEach(([l, rt]) => {
        if (!r.left.some((o) => o.id === l)) errs.push(`${where}: match left "${l}" missing`);
        if (!r.right.some((o) => o.id === rt)) errs.push(`${where}: match right "${rt}" missing`);
      });
      break;
    case "entityPick":
      if (r.minChars < 3) errs.push(`${where}: minChars < 3 turns recall into recognition`);
      break;
  }
  return errs;
}

function mediaIds(blocks: Block[]): string[] {
  return blocks.flatMap((b) => (b.type === "media" ? [b.assetId] : []));
}

export function lintQuestion(
  q: Question,
  concepts: Map<string, ConceptNode>,
  assets: AssetManifest
): string[] {
  const errs: string[] = [];
  const at = (s: string) => `${q.id} ${s}`;

  // concept references
  [...q.tests, ...q.assumes]
    .filter((id) => !concepts.has(id))
    .forEach((id) => errs.push(at(`unknown concept "${id}"`)));

  // template-specific fields
  if (q.template === "setSelect" && !q.polarity) errs.push(at("setSelect needs polarity"));
  if (q.template === "apply" && !q.applyMode) errs.push(at("apply needs applyMode"));
  if (q.polarity && q.template !== "setSelect") errs.push(at("polarity only applies to setSelect"));
  if (!q.presentations.length) errs.push(at("no presentations"));

  for (const p of q.presentations) {
    const all = (pp: Presentation): Presentation[] => [pp, ...(pp.followUp ? all(pp.followUp) : [])];

    for (const pp of all(p)) {
      const w = `${q.id}/${pp.id}`;
      pp.stimulus.forEach((b) => {
        const leak = blockLeak(q, b, "stimulus");
        if (leak) errs.push(`${w} stimulus: ${leak}`);
      });
      pp.info?.forEach((r) => {
        const leak = blockLeak(q, r.block, "info");
        if (leak) errs.push(`${w} info "${r.label}": ${leak}`);
      });
      if (pp.info?.length && TEMPLATE_SPEC[q.template].info === null)
        errs.push(`${w}: authored info on a template with info mode off`);

      errs.push(...lintResponse(`${w} primary`, pp, pp.response.primary));
      if (pp.response.fallback) errs.push(...lintResponse(`${w} fallback`, pp, pp.response.fallback));

      [...mediaIds(pp.stimulus), ...mediaIds(pp.explain ?? [])]
        .filter((id) => !assets.has(id))
        .forEach((id) => errs.push(`${w}: media "${id}" not in asset manifest`));

      if (blockIds(pp).size !== pp.stimulus.filter((b) => b.id).length)
        errs.push(`${w}: duplicate block ids`);
    }
  }

  return errs;
}

/**
 * An assumed concept is covered if a question tests it, or tests something
 * that depends on it (downward credit reaches it). Otherwise it's gloss-only.
 */
export function coverageWarnings(questions: Question[], concepts: Map<string, ConceptNode>): string[] {
  const covered = new Set<string>();
  const addWithAncestors = (id: string) => {
    if (covered.has(id)) return;
    covered.add(id);
    concepts.get(id)?.requires.forEach(addWithAncestors);
  };
  questions.flatMap((q) => q.tests).forEach(addWithAncestors);

  const assumed = new Set(questions.flatMap((q) => q.assumes));
  return [...assumed]
    .filter((id) => !covered.has(id) && !concepts.get(id)?.given)
    .map((id) => `concept "${id}" is assumed but nothing tests it or anything built on it (info-mode gloss only)`);
}

export function lintAll(
  questions: Question[],
  concepts: Map<string, ConceptNode>,
  assets: AssetManifest
): { errors: string[]; warnings: string[] } {
  const ids = new Set<string>();
  const dupes = questions.filter((q) => (ids.has(q.id) ? true : (ids.add(q.id), false))).map((q) => `duplicate question id ${q.id}`);
  return {
    errors: [
      ...lintConcepts(concepts),
      ...dupes,
      ...questions.flatMap((q) => lintQuestion(q, concepts, assets)),
    ],
    warnings: coverageWarnings(questions, concepts),
  };
}
