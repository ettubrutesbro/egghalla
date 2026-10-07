import type { StoryEvent } from "./types";

// Verify each against a source before setting `verified: true`.
// Policy: relationships only when publicly confirmed AND part of a basketball story.
export const EVENTS: StoryEvent[] = [
  {
    id: "moore-steps-away",
    date: "2019-02",
    title: "Maya Moore steps away at her peak to fight Jonathan Irons' wrongful conviction",
    participants: [
      { ref: { kind: "player", id: "maya-moore" }, role: "subject" },
      { ref: { kind: "team", id: "lynx" }, role: "team" },
    ],
    beats: [
      { date: "2020-07", text: "Irons released after his conviction is overturned" },
      { date: "2020", text: "Moore and Irons announce their marriage" },
      { date: "2023-01", text: "Moore officially retires" },
    ],
    tags: ["retirement", "justice"],
    verified: false,
  },
  {
    id: "griner-detention",
    date: "2022-02",
    title: "Brittney Griner detained in Russia; released in a December 2022 prisoner swap",
    participants: [{ ref: { kind: "player", id: "brittney-griner" }, role: "subject" }],
    tags: ["international", "politics"],
    verified: false,
  },
  {
    id: "hammon-suspension",
    date: "2022-12",
    title: "League suspends Becky Hammon two games after investigating Dearica Hamby's pregnancy-trade allegation",
    participants: [
      { ref: { kind: "person", id: "becky-hammon" }, role: "subject" },
      { ref: { kind: "player", id: "dearica-hamby" }, role: "complainant" },
      { ref: { kind: "team", id: "aces" }, role: "team" },
    ],
    tags: ["controversy", "league-discipline"],
    verified: false,
  },
  {
    id: "clark-reese-rivalry",
    date: "2023-04",
    title: "Clark–Reese rivalry begins when LSU beats Iowa in the NCAA title game",
    participants: [
      { ref: { kind: "player", id: "caitlin-clark" }, role: "rival" },
      { ref: { kind: "player", id: "angel-reese" }, role: "rival" },
    ],
    tags: ["rivalry"],
    verified: false,
  },
  {
    id: "unrivaled-launch",
    date: "2025-01",
    title: "Unrivaled 3-on-3 league launches, co-founded by Napheesa Collier and Breanna Stewart",
    participants: [
      { ref: { kind: "player", id: "napheesa-collier" }, role: "co-founder" },
      { ref: { kind: "player", id: "breanna-stewart" }, role: "co-founder" },
    ],
    tags: ["business", "offseason"],
    verified: false,
  },
  {
    id: "taurasi-retires",
    date: "2025-02",
    title: "Diana Taurasi retires after 20 seasons with the Mercury",
    participants: [
      { ref: { kind: "player", id: "diana-taurasi" }, role: "subject" },
      { ref: { kind: "team", id: "mercury" }, role: "team" },
    ],
    tags: ["retirement"],
    verified: false,
  },
  {
    id: "cba-fight-2025",
    date: "2025-07",
    title: "Players wear \"Pay us what you owe us\" shirts at All-Star amid CBA negotiations",
    participants: [
      { ref: { kind: "org", id: "wnbpa" }, role: "union" },
      { ref: { kind: "person", id: "cathy-engelbert" }, role: "commissioner" },
    ],
    beats: [
      { date: "2025-09", text: "Napheesa Collier publicly criticizes league leadership" },
      { date: "2026-05", text: "Season opens under a new CBA after a chaotic free agency" },
    ],
    tags: ["business", "labor"],
    verified: false,
  },
  {
    id: "aces-2025-title",
    date: "2025-10",
    title: "Aces sweep the Mercury 4–0 for their third title in four seasons",
    participants: [
      { ref: { kind: "team", id: "aces" }, role: "champion" },
      { ref: { kind: "team", id: "mercury" }, role: "runner-up" },
    ],
    tags: ["championship", "dynasty"],
    verified: false,
  },
  {
    id: "wilson-supermax",
    date: "2026",
    title: "A'ja Wilson signs a three-year, $5 million supermax, the biggest deal in league history",
    participants: [
      { ref: { kind: "player", id: "aja-wilson" }, role: "subject" },
      { ref: { kind: "team", id: "aces" }, role: "team" },
    ],
    tags: ["business", "contracts"],
    verified: false,
  },
  {
    id: "expansion-2026",
    date: "2026-05",
    title: "Toronto Tempo and Portland Fire debut as expansion teams",
    participants: [
      { ref: { kind: "team", id: "tempo" }, role: "expansion" },
      { ref: { kind: "team", id: "fire" }, role: "expansion" },
    ],
    tags: ["expansion", "business"],
    verified: false,
  },
  {
    id: "fudd-bueckers-reunion",
    date: "2026-04",
    title: "Wings draft Azzi Fudd No. 1, reuniting her with UConn teammate Paige Bueckers",
    participants: [
      { ref: { kind: "player", id: "azzi-fudd" }, role: "draftee" },
      { ref: { kind: "player", id: "paige-bueckers" }, role: "teammate" },
      { ref: { kind: "team", id: "wings" }, role: "team" },
    ],
    tags: ["draft", "reunion"],
    verified: false,
  },
  {
    id: "reese-to-dream",
    date: "2026",
    title: "Angel Reese traded from the Sky to the Dream",
    participants: [
      { ref: { kind: "player", id: "angel-reese" }, role: "subject" },
      { ref: { kind: "team", id: "sky" }, role: "from" },
      { ref: { kind: "team", id: "dream" }, role: "to" },
    ],
    tags: ["trade"],
    verified: false,
  },
];
