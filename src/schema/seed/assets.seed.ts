import type { AssetEntry, AssetManifest } from "../assets";

const ENTRIES: AssetEntry[] = [
  {
    id: "concept/box-out",
    path: "public/media/concepts/box-out.jpg",
    kind: "photo",
    status: "requested",
    request: {
      depicts:
        "A defender with her back to an offensive player, sealing her away from the rim with her body while a shot is in the air",
      avoid: ["captions or overlays naming the action", "the ball already in someone's hands"],
    },
  },
  {
    id: "concept/charge-call",
    path: "public/media/concepts/charge-call.jpg",
    kind: "photo",
    status: "requested",
    request: {
      depicts:
        "A defender with feet set, squared up and outside the restricted-area arc, taking contact in the chest from a driving ball handler",
      avoid: ["a referee visibly signaling the call", "captions naming the call"],
    },
  },
];

export const ASSETS: AssetManifest = new Map(ENTRIES.map((a) => [a.id, a]));
