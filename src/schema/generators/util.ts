import type { ListedPosition, Player, PlayerSeason, SizeClass } from "../types";

export const F_BIG_THRESHOLD_IN = 75; // plain "F" at 6'3"+ plays as a big
export const SIZE_RANK: Record<SizeClass, number> = { guard: 0, wing: 1, big: 2 };

export function sizeClass(pos: ListedPosition, heightIn: number): SizeClass {
  switch (pos) {
    case "G":
      return "guard";
    case "G-F":
    case "F-G":
      return "wing";
    case "F":
      return heightIn >= F_BIG_THRESHOLD_IN ? "big" : "wing";
    case "F-C":
    case "C-F":
    case "C":
      return "big";
  }
}

export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A player joined with one season of data. */
export interface PS {
  player: Player;
  season: PlayerSeason;
}

export const playerRef = (p: PS) => ({ kind: "player" as const, id: p.player.id });
