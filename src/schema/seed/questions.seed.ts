// Seed batch v1 — 22 questions across all nine templates.
// Hand-authored facts are 2025-season unless noted; `verified: false`
// until checked against the data pull. Ids must match public/data.

import { generateStatlineRead } from "../generators/statline";
import type { Option, Question } from "../question";
import type { Ref } from "../types";
import { paintHeavyShots } from "./shots.seed";

const player = (id: string): Ref => ({ kind: "player", id });
const team = (id: string): Ref => ({ kind: "team", id });
const concept = (id: string): Ref => ({ kind: "concept", id });
const opt = (id: string, label: string, misconception?: string): Option => ({ id, label, misconception });
const playerOpt = (id: string): Option => ({ id, refs: [player(id)] });

// ─── Reveal ───

const revealReese: Question = {
  id: "reveal:angel-reese",
  template: "reveal",
  tests: [],
  assumes: [],
  edges: ["angel-reese->college:lsu", "angel-reese->draft:2024", "angel-reese->team:sky:2025"],
  testsFields: ["name"],
  meta: { entityFame: [0], factTypes: ["college", "draft"], season: 2025 },
  verified: false,
  presentations: [
    {
      id: "p1",
      variant: "clueLadder",
      stimulus: [
        { type: "prompt", text: "Who is she?" },
        {
          type: "clueSequence",
          subject: player("angel-reese"),
          season: 2025,
          steps: [
            { id: "c1", field: "college", points: 5 },
            { id: "c2", field: "draft", points: 4 },
            { id: "c3", field: "position", points: 3 },
            { id: "c4", field: "jersey", points: 2 },
            { id: "c5", field: "team", points: 1 },
            { id: "c6", portrait: true, points: 1 },
          ],
        },
      ],
      response: {
        primary: { kind: "entityPick", pool: "player", answer: "angel-reese", minChars: 3 },
        fallback: {
          kind: "choice",
          answer: "angel-reese",
          options: ["angel-reese", "kamilla-cardoso", "aliyah-boston", "cameron-brink"].map(playerOpt),
        },
      },
      explain: [{ type: "event", ref: { kind: "event", id: "clark-reese-rivalry" }, show: ["title", "date"] }],
    },
  ],
};

const revealBurton: Question = {
  id: "reveal:veronica-burton",
  template: "reveal",
  tests: [],
  assumes: [],
  edges: ["veronica-burton->college:northwestern", "veronica-burton->team:valkyries:2025"],
  testsFields: ["name"],
  meta: { entityFame: [1], factTypes: ["college", "draft"], season: 2025, involvesFavoriteTeam: true },
  verified: false,
  presentations: [
    {
      id: "p1",
      variant: "clueLadder",
      stimulus: [
        { type: "prompt", text: "Who is she?" },
        {
          type: "clueSequence",
          subject: player("veronica-burton"),
          season: 2025,
          steps: [
            { id: "c1", field: "college", points: 5 },
            { id: "c2", field: "draft", points: 4 },
            { id: "c3", field: "position", points: 3 },
            { id: "c4", field: "team", points: 2 },
            { id: "c5", field: "jersey", points: 1 },
            { id: "c6", portrait: true, points: 1 },
          ],
        },
      ],
      response: {
        primary: { kind: "entityPick", pool: "player", answer: "veronica-burton", minChars: 3 },
        fallback: {
          kind: "choice",
          answer: "veronica-burton",
          options: ["veronica-burton", "tiffany-hayes", "kate-martin", "carla-leite"].map(playerOpt),
        },
      },
    },
  ],
};

// ─── Recall ───

const recallWilsonTeam: Question = {
  id: "recall:aja-wilson:team:2025",
  template: "recall",
  tests: [],
  assumes: [],
  edges: ["aja-wilson->team:aces:2025"],
  testsFields: ["team"],
  meta: { entityFame: [0], factTypes: ["team"], season: 2025 },
  verified: false,
  presentations: [
    {
      id: "p1",
      variant: "portraitToTeam",
      stimulus: [
        { type: "entity", ref: player("aja-wilson"), show: ["name", "position"], season: 2025, portrait: "preferred" },
        { type: "prompt", text: "Which team did she play for in 2025?" },
      ],
      response: {
        primary: { kind: "entityPick", pool: "team", answer: "aces", minChars: 3 },
        fallback: {
          kind: "choice",
          answer: "aces",
          options: ["aces", "liberty", "lynx", "fever"].map((id) => ({ id, refs: [team(id)] })),
        },
      },
    },
  ],
};

const recallStaley: Question = {
  id: "recall:dawn-staley:program",
  template: "recall",
  tests: [],
  assumes: [],
  edges: ["dawn-staley->coach:south-carolina"],
  testsFields: [],
  meta: { entityFame: [], factTypes: ["coachingStaff"] },
  verified: false,
  presentations: [
    {
      id: "p1",
      variant: "personToOrg",
      stimulus: [
        { type: "entity", ref: { kind: "person", id: "dawn-staley" }, show: ["name"], portrait: "preferred" },
        { type: "prompt", text: "Which college program has she coached to NCAA titles in 2017, 2022, and 2024?" },
      ],
      response: {
        primary: {
          kind: "text",
          answer: { canonical: "South Carolina", also: ["Gamecocks", "South Carolina Gamecocks", "USC", "SC"] },
        },
        fallback: {
          kind: "choice",
          answer: "south-carolina",
          options: [opt("south-carolina", "South Carolina"), opt("uconn", "UConn"), opt("lsu", "LSU"), opt("iowa", "Iowa")],
        },
      },
    },
  ],
};

// ─── Define ───

const defineScreen: Question = {
  id: "define:screen",
  template: "define",
  facet: "what",
  tests: ["screen"],
  assumes: [],
  edges: [],
  testsFields: [],
  meta: { entityFame: [], factTypes: [] },
  presentations: [
    {
      id: "p1",
      variant: "termToMeaning",
      stimulus: [{ type: "prompt", text: "What is a screen (also called a pick)?" }],
      response: {
        primary: { kind: "selfGrade", canonical: [{ type: "concept", ref: concept("screen"), facet: "definition" }] },
        fallback: {
          kind: "choice",
          answer: "screen",
          options: [
            opt("screen", "A teammate plants her body in a defender's path to free the ball handler"),
            opt("switch", "Two defenders swap who they're guarding", "switch"),
            opt("box", "Sealing an opponent away from the rim on a missed shot", "box-out"),
            opt("post", "Setting up near the basket with your back to the defender", "post-up"),
          ],
        },
      },
    },
    {
      id: "p2",
      variant: "meaningToTerm",
      stimulus: [
        { type: "concept", ref: concept("screen"), facet: "definition" },
        { type: "prompt", text: "What's this called?" },
      ],
      response: {
        primary: {
          kind: "text",
          answer: { canonical: "screen", also: ["pick", "a screen", "a pick", "set a screen", "setting a screen"] },
        },
        fallback: {
          kind: "choice",
          answer: "screen",
          options: [opt("screen", "Screen"), opt("switch", "Switch", "switch"), opt("box", "Box out", "box-out"), opt("post", "Post up", "post-up")],
        },
      },
    },
  ],
};

const defineBoxOut: Question = {
  id: "define:box-out:photo",
  template: "define",
  facet: "what",
  tests: ["box-out"],
  assumes: ["rebound"],
  edges: [],
  testsFields: [],
  meta: { entityFame: [], factTypes: [] },
  presentations: [
    {
      id: "p1",
      variant: "photoToTerm",
      stimulus: [
        { type: "media", assetId: "concept/box-out", alt: "A defender sealing an opponent away from the rim", need: "required" },
        { type: "prompt", text: "What is {focus} doing?" },
      ],
      response: {
        primary: {
          kind: "text",
          answer: { canonical: "box out", also: ["boxing out", "block out", "blocking out", "boxout"] },
        },
        fallback: {
          kind: "choice",
          answer: "box",
          options: [opt("box", "Boxing out"), opt("screen", "Setting a screen", "screen"), opt("charge", "Taking a charge", "charge"), opt("post", "Posting up", "post-up")],
        },
      },
      explain: [{ type: "concept", ref: concept("box-out"), facet: "definition" }],
    },
  ],
};

const defineOrebWhy: Question = {
  id: "define:why:offensive-rebound",
  template: "define",
  facet: "why",
  tests: ["offensive-rebound"],
  assumes: ["oreb-reset"],
  edges: [],
  testsFields: [],
  meta: { entityFame: [], factTypes: [] },
  presentations: [
    {
      id: "p1",
      variant: "toggleReasons",
      stimulus: [
        { type: "prompt", text: "Why is an offensive rebound valuable? Mark each reason." },
        {
          id: "reasons",
          type: "list",
          items: [
            { id: "r1", label: "Your team gets another chance to score" },
            { id: "r2", label: "The shot clock resets to 14 if it was lower" },
            { id: "r3", label: "It's often a short putback right at the rim" },
            { id: "r4", label: "It counts as an assist for the shooter" },
            { id: "r5", label: "It adds a point to the original shot" },
          ],
        },
      ],
      response: {
        primary: {
          kind: "perItemToggle",
          listId: "reasons",
          labels: ["Not a reason", "Reason"],
          answers: { r1: 1, r2: 1, r3: 1, r4: 0, r5: 0 },
        },
      },
    },
  ],
};

const definePositions: Question = {
  id: "define:position-abbreviations",
  template: "define",
  facet: "what",
  tests: ["pos-g", "pos-f", "pos-c", "pos-gf", "pos-fc"],
  assumes: [],
  edges: [],
  testsFields: [],
  meta: { entityFame: [], factTypes: ["position"], involvesFavoriteTeam: true },
  presentations: [
    {
      id: "p1",
      variant: "perItemText",
      stimulus: [
        { type: "prompt", text: "Based on context, what do these stand for?" },
        {
          id: "abbr",
          type: "list",
          items: [
            { id: "g", label: "G" },
            { id: "f", label: "F" },
            { id: "c", label: "C" },
            { id: "gf", label: "G-F" },
            { id: "fc", label: "F-C" },
          ],
        },
      ],
      response: {
        primary: {
          kind: "perItemText",
          listId: "abbr",
          answers: {
            g: { canonical: "guard" },
            f: { canonical: "forward" },
            c: { canonical: "center", also: ["centre"] },
            gf: { canonical: "guard-forward", also: ["guard forward", "guard/forward", "wing"] },
            fc: { canonical: "forward-center", also: ["forward center", "forward/center"] },
          },
        },
      },
      info: [
        {
          label: "2025 Valkyries",
          block: {
            type: "comparison",
            subjects: ["veronica-burton", "tiffany-hayes", "kayla-thornton", "janelle-salaun", "iliana-rupert"].map(player),
            fields: ["position", "height"],
            season: 2025,
          },
        },
      ],
    },
    {
      id: "p2",
      variant: "match",
      stimulus: [{ type: "prompt", text: "Match each abbreviation to its position." }],
      response: {
        primary: {
          kind: "match",
          left: [opt("g", "G"), opt("f", "F"), opt("c", "C"), opt("gf", "G-F"), opt("fc", "F-C")],
          right: [
            opt("guard", "Guard"),
            opt("forward", "Forward"),
            opt("center", "Center"),
            opt("guard-forward", "Guard-forward"),
            opt("forward-center", "Forward-center"),
          ],
          pairs: { g: "guard", f: "forward", c: "center", gf: "guard-forward", fc: "forward-center" },
        },
      },
    },
  ],
};

// ─── Apply ───

const applyTripleDouble: Question = {
  id: "apply:call-it:triple-double",
  template: "apply",
  applyMode: "callIt",
  tests: ["triple-double"],
  assumes: [],
  edges: [],
  testsFields: [],
  meta: { entityFame: [], factTypes: [] },
  presentations: [
    {
      id: "p1",
      variant: "statLineToTerm",
      stimulus: [
        {
          type: "statLine",
          line: { min: 35, pts: 12, reb: 10, ast: 10, tov: 3, fgm: 5, fga: 11, tpm: 0, tpa: 1, ftm: 2, fta: 2 },
        },
        { type: "prompt", text: "What's this kind of game called?" },
      ],
      response: {
        primary: { kind: "text", answer: { canonical: "triple-double", also: ["triple double", "a triple-double", "a triple double"] } },
        fallback: {
          kind: "choice",
          answer: "td",
          options: [opt("td", "Triple-double"), opt("dd", "Double-double", "double-double"), opt("ao", "And-one", "and-one"), opt("4pp", "Four-point play", "four-point-play")],
        },
      },
    },
  ],
};

const applyChargeCall: Question = {
  id: "apply:call-it:block-or-charge",
  template: "apply",
  applyMode: "callIt",
  tests: ["charge"],
  assumes: ["blocking-foul"],
  edges: [],
  testsFields: [],
  meta: { entityFame: [], factTypes: ["nicheRule"] },
  presentations: [
    {
      id: "p1",
      variant: "photoCall",
      stimulus: [
        { type: "media", assetId: "concept/charge-call", alt: "A driving player collides with a set defender", need: "required" },
        { type: "prompt", text: "{focus} — block or charge?" },
      ],
      response: {
        primary: {
          kind: "choice",
          answer: "charge",
          options: [opt("charge", "Charge (offensive foul)"), opt("block", "Block (defensive foul)", "blocking-foul")],
        },
      },
      explain: [{ type: "concept", ref: concept("charge"), facet: "definition" }],
    },
  ],
};

const applyFourPointPlay: Question = {
  id: "apply:what-next:fouled-on-made-three",
  template: "apply",
  applyMode: "whatNext",
  tests: ["four-point-play"],
  assumes: ["and-one"],
  edges: [],
  testsFields: [],
  meta: { entityFame: [], factTypes: [] },
  presentations: [
    {
      id: "p1",
      variant: "outcomeChoice",
      stimulus: [{ type: "prompt", text: "She's fouled while making a three. What happens?" }],
      response: {
        primary: {
          kind: "choice",
          answer: "and1",
          options: [
            opt("and1", "The three counts, plus one free throw"),
            opt("3ft", "No basket; she shoots three free throws", "free-throw"),
            opt("plus3", "The three counts, plus three free throws", "and-one"),
            opt("2ft", "No basket; she shoots two free throws", "foul"),
          ],
        },
      },
      explain: [{ type: "concept", ref: concept("four-point-play"), facet: "definition" }],
    },
  ],
};

const applyOrebReset: Question = {
  id: "apply:what-next:oreb-reset",
  template: "apply",
  applyMode: "whatNext",
  tests: ["oreb-reset"],
  assumes: ["shot-clock", "offensive-rebound"],
  edges: [],
  testsFields: [],
  meta: { entityFame: [], factTypes: ["nicheRule"] },
  presentations: [
    {
      id: "p1",
      variant: "outcomeNumber",
      stimulus: [
        { type: "prompt", text: "The shot clock reads 5. A shot hits the rim and her teammate grabs the offensive rebound. What does the shot clock reset to?" },
      ],
      response: {
        primary: { kind: "number", answer: 14, unit: "sec" },
        fallback: {
          kind: "choice",
          answer: "14",
          options: [opt("14", "14 seconds"), opt("24", "24 seconds", "shot-clock"), opt("5", "It stays at 5"), opt("off", "It turns off")],
        },
      },
    },
    {
      id: "p2",
      variant: "factCheck",
      stimulus: [{ type: "prompt", text: "A fan says the shot clock resets to 24 after every offensive rebound. Right or wrong?" }],
      response: {
        primary: { kind: "choice", answer: "wrong", options: [opt("right", "Right", "shot-clock"), opt("wrong", "Wrong")] },
      },
      followUp: {
        id: "p2-correct",
        variant: "factCheckCorrection",
        stimulus: [{ type: "prompt", text: "What does it actually reset to (when it was lower)?" }],
        response: { primary: { kind: "number", answer: 14, unit: "sec" } },
      },
    },
  ],
};

const applyRimProtectorEvidence: Question = {
  id: "apply:evidence:rim-protector",
  template: "apply",
  applyMode: "evidence",
  tests: ["rim-protector"],
  assumes: [],
  edges: [],
  testsFields: [],
  meta: { entityFame: [], factTypes: [] },
  presentations: [
    {
      id: "p1",
      variant: "claimToStat",
      stimulus: [{ type: "prompt", text: "A broadcaster calls her an elite rim protector. Which stat would back that up?" }],
      response: {
        primary: {
          kind: "choice",
          answer: "bpg",
          options: [
            opt("bpg", "Blocks per game"),
            opt("rpg", "Rebounds per game", "rebound"),
            opt("spg", "Steals per game", "ball-hawk"),
            opt("ppg", "Points per game"),
          ],
        },
      },
      explain: [{ type: "concept", ref: concept("rim-protector"), facet: "definition" }],
    },
  ],
};

// ─── Set selection ───

const setHasDunked: Question = {
  id: "set-select:has-dunked",
  template: "setSelect",
  polarity: "allThatApply",
  tests: [],
  assumes: [],
  edges: ["lisa-leslie->hasDunked", "brittney-griner->hasDunked", "candace-parker->hasDunked"],
  testsFields: [],
  meta: { entityFame: [1, 0, 1, 0, 1, 0], factTypes: ["curated"], season: 2002 },
  verified: false,
  presentations: [
    {
      id: "p1",
      variant: "entityOptions",
      stimulus: [{ type: "prompt", text: "Which of these players have dunked in a WNBA game?" }],
      response: {
        primary: {
          kind: "multi",
          answer: ["lisa-leslie", "brittney-griner", "candace-parker"],
          options: ["lisa-leslie", "caitlin-clark", "brittney-griner", "sue-bird", "candace-parker", "sabrina-ionescu"].map(playerOpt),
        },
      },
      explain: [{ type: "prompt", text: "Lisa Leslie threw down the first dunk in WNBA history in 2002." }],
    },
  ],
};

const setNotUconn: Question = {
  id: "set-select:not-uconn",
  template: "setSelect",
  polarity: "oneIsNot",
  tests: [],
  assumes: [],
  edges: ["kelsey-plum->college:washington", "breanna-stewart->college:uconn", "paige-bueckers->college:uconn", "maya-moore->college:uconn"],
  testsFields: ["college"],
  meta: { entityFame: [0, 0, 1, 1], factTypes: ["college"] },
  verified: false,
  presentations: [
    {
      id: "p1",
      variant: "entityOptions",
      stimulus: [{ type: "prompt", text: "Which of these players did NOT play college ball at UConn?" }],
      response: {
        primary: {
          kind: "choice",
          answer: "kelsey-plum",
          options: ["breanna-stewart", "paige-bueckers", "maya-moore", "kelsey-plum"].map(playerOpt),
        },
      },
      explain: [{ type: "prompt", text: "Kelsey Plum played at Washington, where she became the NCAA's all-time leading scorer at the time." }],
    },
  ],
};

// ─── Mismatch (hand-authored; generator handles this from data) ───

const mismatchAcesFever: Question = {
  id: "mismatch:aja-wilson~kelsey-mitchell:2025",
  template: "mismatch",
  tests: ["mismatch"],
  assumes: ["switch", "position", "post-up"],
  edges: ["aja-wilson->team:aces:2025", "kelsey-mitchell->team:fever:2025"],
  testsFields: [],
  meta: { entityFame: [0, 1, 2, 2, 1, 1], factTypes: ["team", "position"], season: 2025 },
  verified: false,
  presentations: [
    {
      id: "p1",
      variant: "pairOptions",
      stimulus: [{ type: "prompt", text: "Aces vs. Fever. After switches, which matchup would the offense hunt? (Ball handler listed first.)" }],
      response: {
        primary: {
          kind: "choice",
          answer: "aja-wilson~kelsey-mitchell",
          options: [
            { id: "aja-wilson~kelsey-mitchell", refs: [player("aja-wilson"), player("kelsey-mitchell")] },
            { id: "kiah-stokes~sydney-colson", refs: [player("kiah-stokes"), player("sydney-colson")], misconception: "hunt" },
            { id: "jackie-young~lexie-hull", refs: [player("jackie-young"), player("lexie-hull")], misconception: "mismatch" },
          ],
        },
      },
      info: [
        {
          label: "Players",
          block: {
            type: "comparison",
            subjects: ["aja-wilson", "kelsey-mitchell", "kiah-stokes", "sydney-colson", "jackie-young", "lexie-hull"].map(player),
            fields: ["position", "height", "ppg", "allStar"],
            season: 2025,
            portrait: "preferred",
          },
        },
      ],
      followUp: {
        id: "p1-exploit",
        variant: "exploit",
        stimulus: [
          { type: "prompt", text: "How does A'ja Wilson exploit it?" },
          {
            type: "comparison",
            subjects: [player("aja-wilson"), player("kelsey-mitchell")],
            fields: ["height", "ppg"],
            season: 2025,
            highlight: ["height"],
            portrait: "preferred",
          },
        ],
        response: {
          primary: {
            kind: "choice",
            answer: "post",
            options: [opt("post", "Post up or shoot over the top"), opt("drive", "Attack off the dribble"), opt("none", "No real advantage")],
          },
        },
      },
    },
  ],
};

// ─── Connection ───

const connectionWilsonBoston: Question = {
  id: "connection:aja-wilson+aliyah-boston",
  template: "connection",
  tests: [],
  assumes: [],
  edges: ["aja-wilson->college:south-carolina", "aliyah-boston->college:south-carolina"],
  testsFields: ["college", "draft"],
  meta: { entityFame: [0, 1], factTypes: ["college", "draft"] },
  verified: false,
  presentations: [
    {
      id: "p1",
      variant: "pairPortraits",
      stimulus: [
        {
          type: "comparison",
          subjects: [player("aja-wilson"), player("aliyah-boston")],
          fields: ["name"],
          portrait: "preferred",
        },
        { type: "prompt", text: "What do these two have in common?" },
      ],
      response: {
        primary: {
          kind: "text",
          answer: {
            canonical: "South Carolina",
            also: ["Gamecocks", "Dawn Staley", "played for Dawn Staley", "both No. 1 picks", "number one picks", "1st overall picks", "both went first overall"],
          },
        },
        fallback: {
          kind: "choice",
          answer: "sc",
          options: [
            opt("sc", "Both played at South Carolina under Dawn Staley"),
            opt("team", "Both played for the Aces", "team"),
            opt("uconn", "Both played at UConn"),
            opt("fever", "Both played for the Fever", "team"),
          ],
        },
      },
      explain: [{ type: "prompt", text: "Both starred at South Carolina under Dawn Staley, and both went No. 1 overall in the WNBA draft (2018 and 2023)." }],
    },
  ],
};

const connectionCollierStewart: Question = {
  id: "connection:napheesa-collier+breanna-stewart",
  template: "connection",
  tests: [],
  assumes: [],
  edges: ["napheesa-collier->event:unrivaled-launch", "breanna-stewart->event:unrivaled-launch"],
  testsFields: ["college"],
  meta: { entityFame: [1, 0], factTypes: ["event", "college"] },
  verified: false,
  presentations: [
    {
      id: "p1",
      variant: "pairPortraits",
      stimulus: [
        {
          type: "comparison",
          subjects: [player("napheesa-collier"), player("breanna-stewart")],
          fields: ["name"],
          portrait: "preferred",
        },
        { type: "prompt", text: "What do these two have in common? (There's more than one right answer.)" },
      ],
      response: {
        primary: {
          kind: "text",
          answer: {
            canonical: "co-founded Unrivaled",
            also: ["Unrivaled", "started Unrivaled", "UConn", "Connecticut", "Huskies", "Team USA", "USA Basketball", "Olympics", "Olympic gold"],
          },
        },
        fallback: {
          kind: "choice",
          answer: "unrivaled",
          options: [
            opt("unrivaled", "Co-founded the Unrivaled 3-on-3 league"),
            opt("team", "Teammates on the Liberty", "team"),
            opt("coach", "Both now coach in college"),
            opt("draft", "Both drafted in 2019"),
          ],
        },
      },
      info: [
        {
          label: "Players",
          block: {
            type: "comparison",
            subjects: [player("napheesa-collier"), player("breanna-stewart")],
            fields: ["team", "position"],
            season: 2025,
          },
        },
      ],
      explain: [{ type: "event", ref: { kind: "event", id: "unrivaled-launch" }, show: ["title", "date"] }],
    },
  ],
};

// ─── Scenario ───

const scenarioHoldLastShot: Question = {
  id: "scenario:why:hold-last-shot",
  template: "scenario",
  facet: "why",
  tests: ["clock-management"],
  assumes: ["shot-clock-off"],
  edges: [],
  testsFields: [],
  meta: { entityFame: [], factTypes: ["strategy"] },
  presentations: [
    {
      id: "p1",
      variant: "toggleReasons",
      stimulus: [
        {
          type: "scoreboard",
          state: { score: { us: 88, them: 88 }, gameClockSec: 18, shotClockSec: null, possession: "us", period: 4 },
        },
        { type: "prompt", text: "Your ball, tied, 18 seconds left. Why might you not shoot right away?" },
        {
          id: "reasons",
          type: "list",
          items: [
            { id: "r1", label: "Shooting late leaves them no time to answer" },
            { id: "r2", label: "A quick shot hands them the last possession" },
            { id: "r3", label: "The shot clock will expire first" },
            { id: "r4", label: "A miss would lose the game" },
          ],
        },
      ],
      response: {
        primary: {
          kind: "perItemToggle",
          listId: "reasons",
          labels: ["Not a reason", "Reason"],
          answers: { r1: 1, r2: 1, r3: 0, r4: 0 },
        },
      },
      explain: [
        {
          type: "prompt",
          text: "With under 24 seconds left the shot clock is off. Hold, attack with about 5 seconds left, and the worst case is overtime, not a loss.",
        },
      ],
    },
  ],
};

const scenarioHuntTheSwitch: Question = {
  id: "scenario:hunt-the-switch",
  template: "scenario",
  facet: "what",
  tests: ["hunt"],
  assumes: ["mismatch", "screen", "post-up"],
  edges: [],
  testsFields: [],
  meta: { entityFame: [], factTypes: ["strategy"] },
  presentations: [
    {
      id: "p1",
      variant: "playCall",
      stimulus: [
        {
          type: "scoreboard",
          state: { score: { us: 71, them: 71 }, gameClockSec: 8, shotClockSec: null, possession: "us", period: 4, timeoutsLeft: 0 },
        },
        {
          type: "prompt",
          text: "Your best scorer is a 6'4\" All-Star post. The defense switches every screen. What do you run?",
        },
      ],
      response: {
        primary: {
          kind: "choice",
          answer: "hunt",
          options: [
            opt("hunt", "Have a small guard screen for her, so the switch leaves a guard on your post, then feed the post"),
            opt("iso", "Clear out and let your point guard go one-on-one", "mismatch"),
            opt("three", "Hoist a quick three to beat the clock", "clock-management"),
            opt("hold", "Hold the ball and play for overtime", "clock-management"),
          ],
        },
      },
      explain: [{ type: "concept", ref: concept("hunt"), facet: "definition" }],
    },
  ],
};

// ─── Read ───

const readGrittyWin = generateStatlineRead({
  id: "gritty-win",
  season: 2025,
  context: "W 78–74 (hypothetical player)",
  line: { min: 36, pts: 27, reb: 5, ast: 4, tov: 7, fgm: 4, fga: 17, tpm: 1, tpa: 8, ftm: 18, fta: 20 },
});
if (!readGrittyWin) throw new Error("gritty-win line produced no claims");
readGrittyWin.presentations[0].explain = [
  {
    type: "prompt",
    text: "4-for-17 and 7 turnovers are rough for anyone — but 18 made free throws kept her team in it. Bad percentages and a good game can coexist.",
  },
];

const readPaintHeavy: Question = {
  id: "read:shot-chart:paint-heavy",
  template: "read",
  tests: ["spacing"],
  assumes: ["three-pointer"],
  edges: [],
  testsFields: [],
  meta: { entityFame: [], factTypes: ["strategy"] },
  presentations: [
    {
      id: "p1",
      variant: "toggleStatements",
      stimulus: [
        { type: "shotChart", shots: paintHeavyShots(), context: "One team, one game (hypothetical)" },
        { type: "prompt", text: "Does each statement match the chart?" },
        {
          id: "claims",
          type: "list",
          items: [
            { id: "s1", label: "Most of their shots came at the rim" },
            { id: "s2", label: "They took very few threes" },
            { id: "s3", label: "They shot well from deep" },
            { id: "s4", label: "Mid-range jumpers were their main weapon" },
          ],
        },
      ],
      response: {
        primary: {
          kind: "perItemToggle",
          listId: "claims",
          labels: ["Doesn't match", "Matches"],
          answers: { s1: 1, s2: 1, s3: 0, s4: 0 },
        },
      },
      explain: [
        {
          type: "prompt",
          text: "26 of 40 shots at the rim, only 6 threes (1 made). Few threes lets defenders crowd the paint — that's why spacing matters.",
        },
      ],
    },
  ],
};

export const SEED_QUESTIONS: Question[] = [
  revealReese,
  revealBurton,
  recallWilsonTeam,
  recallStaley,
  defineScreen,
  defineBoxOut,
  defineOrebWhy,
  definePositions,
  applyTripleDouble,
  applyChargeCall,
  applyFourPointPlay,
  applyOrebReset,
  applyRimProtectorEvidence,
  setHasDunked,
  setNotUconn,
  mismatchAcesFever,
  connectionWilsonBoston,
  connectionCollierStewart,
  scenarioHoldLastShot,
  scenarioHuntTheSwitch,
  readGrittyWin,
  readPaintHeavy,
];
