import type { ConceptNode } from "./types";

// Direct prerequisites only. `given` concepts are assumed known at the start.
export const CONCEPTS: ConceptNode[] = [
  // ─── Scoring basics ───
  { id: "field-goal", label: "Field goal", tier: 0, given: true, requires: [],
    gloss: "Any made shot other than a free throw, worth two or three points." },
  { id: "three-pointer", label: "Three-pointer", tier: 0, given: true, requires: ["field-goal"],
    gloss: "A field goal made from behind the arc, worth three points." },
  { id: "free-throw", label: "Free throw", tier: 0, given: true, requires: [],
    gloss: "An uncontested one-point shot from the line, usually awarded after a foul." },
  { id: "foul", label: "Foul", tier: 0, given: true, requires: [],
    gloss: "Illegal physical contact; enough of them sends the other team to the free-throw line." },
  { id: "rebound", label: "Rebound", tier: 0, given: true, requires: [],
    gloss: "Gaining possession of the ball after a missed shot." },
  { id: "turnover", label: "Turnover", tier: 0, requires: [],
    gloss: "Losing possession without getting a shot off: a bad pass, a steal, stepping out of bounds." },
  { id: "assist", label: "Assist", tier: 0, requires: ["field-goal"],
    gloss: "A pass that leads directly to a teammate's made basket." },

  // ─── Percentages ───
  { id: "fg-pct", label: "Field goal %", tier: 0, requires: ["field-goal"],
    gloss: "Made field goals divided by attempted field goals, twos and threes together." },
  { id: "three-pct", label: "Three-point %", tier: 0, requires: ["three-pointer"],
    gloss: "Made threes divided by attempted threes." },
  { id: "ft-pct", label: "Free throw %", tier: 0, requires: ["free-throw"],
    gloss: "Made free throws divided by attempted free throws." },

  // ─── Positions ───
  { id: "position", label: "Positions", tier: 0, requires: [],
    gloss: "Roster labels describing a player's role and size: guard, forward, center, or a hybrid." },
  { id: "pos-g", label: "Guard (G)", tier: 0, requires: ["position"],
    gloss: "Smaller ball handlers and shooters who usually play on the perimeter." },
  { id: "pos-f", label: "Forward (F)", tier: 0, requires: ["position"],
    gloss: "Mid-sized players who score from both inside and outside." },
  { id: "pos-c", label: "Center (C)", tier: 0, requires: ["position"],
    gloss: "The tallest players, who anchor the paint on both ends." },
  { id: "pos-gf", label: "Guard-forward (G-F)", tier: 1, requires: ["pos-g", "pos-f"],
    gloss: "A wing who can play either guard or forward." },
  { id: "pos-fc", label: "Forward-center (F-C)", tier: 1, requires: ["pos-f", "pos-c"],
    gloss: "A big who can play either forward or center." },

  // ─── Offensive actions ───
  { id: "screen", label: "Screen", aliases: ["pick"], tier: 0, requires: [],
    gloss: "A teammate plants her body in a defender's path to free the ball handler or a cutter." },
  { id: "pick-and-roll", label: "Pick-and-roll", tier: 1, requires: ["screen"],
    gloss: "The screener sets a pick for the ball handler, then rolls toward the rim for a pass." },
  { id: "post-up", label: "Post up", tier: 1, requires: ["position"],
    gloss: "Setting up near the basket with your back to the defender to use size and strength." },
  { id: "box-out", label: "Box out", tier: 1, requires: ["rebound"],
    gloss: "Using your body to seal an opponent away from the rim while a shot is in the air." },
  { id: "offensive-rebound", label: "Offensive rebound", tier: 0, requires: ["rebound"],
    gloss: "Grabbing your own team's missed shot, extending the possession." },

  // ─── Defense ───
  { id: "switch", label: "Switch", tier: 1, requires: ["screen"],
    gloss: "Two defenders swap assignments, usually when a screen is set." },
  { id: "mismatch", label: "Mismatch", tier: 1, requires: ["switch", "position"],
    gloss: "A matchup where one player has a clear size or skill edge, often created by a switch." },
  { id: "hunt", label: "Hunting a mismatch", tier: 2, requires: ["mismatch"],
    gloss: "Repeatedly using screens to get a favorable matchup, then attacking it." },
  { id: "blocking-foul", label: "Blocking foul", tier: 1, requires: ["foul"],
    gloss: "A defensive foul for contact when the defender wasn't set or moved into the ball handler's path." },
  { id: "charge", label: "Charge", tier: 2, requires: ["foul", "blocking-foul"],
    gloss: "An offensive foul for running into a defender who had established position first." },

  // ─── Fouls and free throws ───
  { id: "and-one", label: "And-one", tier: 1, requires: ["foul", "free-throw"],
    gloss: "A made shot while being fouled: the basket counts, plus one free throw." },
  { id: "four-point-play", label: "Four-point play", tier: 1, requires: ["and-one", "three-pointer"],
    gloss: "An and-one on a made three: three points plus one free throw." },
  { id: "intentional-foul", label: "Intentional fouling", tier: 2, requires: ["foul", "free-throw", "game-clock"],
    gloss: "Fouling on purpose late in a game to stop the clock or send a poor free-throw shooter to the line." },

  // ─── Clock ───
  { id: "game-clock", label: "Game clock", tier: 0, requires: [],
    gloss: "Time left in the period: four 10-minute quarters, plus 5-minute overtimes." },
  { id: "shot-clock", label: "Shot clock", tier: 0, requires: [],
    gloss: "A team has 24 seconds to attempt a shot that hits the rim." },
  { id: "shot-clock-off", label: "Shot clock off", tier: 1, requires: ["shot-clock", "game-clock"],
    gloss: "When less time remains in the period than on the shot clock, the shot clock is turned off." },
  { id: "oreb-reset", label: "Offensive rebound reset", tier: 2, requires: ["shot-clock", "offensive-rebound"],
    gloss: "After an offensive rebound off the rim, the shot clock resets to 14 if it was lower." },
  { id: "clock-management", label: "Clock management", tier: 2, requires: ["shot-clock-off"],
    gloss: "Timing possessions late in a game so your team gets the last shot or the opponent runs out of time." },

  // ─── Stat lines ───
  { id: "double-double", label: "Double-double", tier: 0, requires: [],
    gloss: "Ten or more in two stat categories in one game, usually points and rebounds." },
  { id: "triple-double", label: "Triple-double", tier: 1, requires: ["double-double"],
    gloss: "Ten or more in three stat categories in one game." },
  { id: "shot-selection", label: "Shot selection", tier: 2, requires: ["fg-pct", "shot-clock"],
    gloss: "Choosing when a shot is a good one, given who's shooting, from where, and how much time is left." },
  { id: "spacing", label: "Spacing", tier: 2, requires: ["three-pointer"],
    gloss: "Spreading shooters around the arc so defenders can't crowd the paint." },

  // ─── Roles ───
  { id: "stretch-big", label: "Stretch big", tier: 1, requires: ["position", "three-pointer"],
    gloss: "A forward or center who shoots threes, pulling her defender away from the rim." },
  { id: "rim-protector", label: "Rim protector", tier: 1, requires: ["pos-c"],
    gloss: "A big who deters and blocks shots near the basket." },
  { id: "floor-general", label: "Floor general", tier: 1, requires: ["pos-g", "assist"],
    gloss: "A guard who runs the offense and creates shots for teammates." },
  { id: "ball-hawk", label: "Ball hawk", tier: 1, requires: ["turnover"],
    gloss: "A defender who forces turnovers by jumping passing lanes and picking pockets." },

  // ─── League structure ───
  { id: "draft", label: "Draft", tier: 0, requires: [],
    gloss: "The annual selection of new players, with the worst teams generally picking first." },
  { id: "conference", label: "Conferences", tier: 0, requires: [],
    gloss: "The league splits into East and West, which shapes schedules and the Commissioner's Cup." },
  { id: "commissioners-cup", label: "Commissioner's Cup", tier: 2, requires: ["conference"],
    gloss: "An in-season tournament built from designated in-conference games, with a final and a prize pool." },
  { id: "expansion", label: "Expansion", tier: 1, requires: [],
    gloss: "Adding new franchises to the league." },
];
