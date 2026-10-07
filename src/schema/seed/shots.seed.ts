// Synthetic shot chart: paint-heavy team that rarely shoots threes.
// Deterministic so the answer key never drifts.
import type { Shot } from "../types";

function prng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

const RIM = { x: 25, y: 5.25 }; // feet; half court is 50 × 47

function ring(rand: () => number, minR: number, maxR: number): { x: number; y: number } {
  for (;;) {
    const r = minR + rand() * (maxR - minR);
    const a = rand() * Math.PI; // upper half-circle, toward half court
    const x = RIM.x + r * Math.cos(a);
    const y = RIM.y + r * Math.sin(a);
    if (x > 1 && x < 49 && y > 0.5 && y < 40) return { x: +x.toFixed(1), y: +y.toFixed(1) };
  }
}

export function paintHeavyShots(): Shot[] {
  const rand = prng(7);
  const make = (n: number, made: number, minR: number, maxR: number, three: boolean): Shot[] =>
    Array.from({ length: n }, (_, i) => ({ ...ring(rand, minR, maxR), made: i < made, three }));
  return [
    ...make(26, 16, 0.5, 6, false), // at the rim: 16/26
    ...make(8, 3, 10, 18, false), // mid-range: 3/8
    ...make(6, 1, 23, 25, true), // threes: 1/6
  ];
}
