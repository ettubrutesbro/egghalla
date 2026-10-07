// ─────────────────────────────────────────────────────────────
// Assets. When seeding needs an image, register a request;
// Jack provides it, asks for a diagram, or drops the question.
// Presentations with unresolved required assets are never served.
// ─────────────────────────────────────────────────────────────

import type { Block, Presentation } from "./question";

export type AssetStatus = "requested" | "provided" | "diagram" | "dropped";

export interface AssetEntry {
  id: string; // "concept/box-out"
  path: string; // "public/media/concepts/box-out.jpg"
  kind: "photo" | "diagram" | "portrait";
  status: AssetStatus;
  request: {
    depicts: string; // what the image must show
    avoid?: string[]; // anything that would leak the answer
  };
  focusCue?: string; // filled when provided: "the defender in white, #23"
  credit?: string; // photographer/source, if known
}

export type AssetManifest = Map<string, AssetEntry>;

function blockAssetIds(b: Block): string[] {
  return b.type === "media" ? [b.assetId] : [];
}

export function requiredAssets(p: Presentation): string[] {
  return p.stimulus.filter((b) => b.type === "media" && b.need === "required").flatMap(blockAssetIds);
}

/** {focus} in a prompt needs a focusCue from the presentation's media. */
export function resolveFocus(p: Presentation, assets: AssetManifest): Presentation | null {
  const media = p.stimulus.find((b) => b.type === "media");
  const cue = media && media.type === "media" ? assets.get(media.assetId)?.focusCue : undefined;

  let unresolved = false;
  const stimulus = p.stimulus.map((b) => {
    if (b.type !== "prompt" || !b.text.includes("{focus}")) return b;
    if (!cue) {
      unresolved = true;
      return b;
    }
    return { ...b, text: b.text.replaceAll("{focus}", cue) };
  });
  return unresolved ? null : { ...p, stimulus };
}

export function isServable(p: Presentation, assets: AssetManifest): boolean {
  const assetsOk = requiredAssets(p).every((id) => {
    const a = assets.get(id);
    return a?.status === "provided" || a?.status === "diagram";
  });
  return assetsOk && resolveFocus(p, assets) !== null;
}

/** Printable to-do list after a seeding pass. */
export function assetChecklist(assets: AssetManifest): string {
  return [...assets.values()]
    .filter((a) => a.status === "requested")
    .map(
      (a) =>
        `□ ${a.path}\n` +
        `  shows: ${a.request.depicts}\n` +
        `  avoid: ${a.request.avoid?.join(", ") ?? "—"}\n` +
        `  → provide it (and a focus cue), say "diagram", or drop the question`
    )
    .join("\n\n");
}
