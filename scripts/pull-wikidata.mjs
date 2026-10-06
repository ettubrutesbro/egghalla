// Pull WNBA-related data from the Wikidata SPARQL endpoint.
// Raw responses are saved unmodified in envelopes under public/data/raw/wikidata/.
import { fetchJson } from './lib/http.mjs';
import { writeEnvelope } from './lib/envelope.mjs';

const ENDPOINT = 'https://query.wikidata.org/sparql';
const USER_AGENT = 'egghalla/0.1 (personal project; contact: REPLACE_WITH_EMAIL)';
const OUT = 'public/data/raw/wikidata';

if (USER_AGENT.includes('REPLACE_WITH_EMAIL')) {
  console.warn('WARNING: Wikidata User-Agent still contains REPLACE_WITH_EMAIL. Set a real contact in scripts/pull-wikidata.mjs.');
}

async function sparql(name, query, extraParams = {}) {
  const url = `${ENDPOINT}?${new URLSearchParams({ format: 'json', query })}`;
  const t0 = Date.now();
  const { data } = await fetchJson(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/sparql-results+json' },
    timeoutMs: 70_000, // WDQS has a 60s server-side limit
  });
  await writeEnvelope(`${OUT}/${name}.json`, {
    source: 'wikidata-sparql',
    url: ENDPOINT,
    params: { query, ...extraParams },
    data,
  });
  console.log(`  ${name}: ${data.results.bindings.length} rows (${Date.now() - t0}ms)`);
  return data.results.bindings;
}

const val = (b, k) => b[k]?.value ?? null;
const pid = (uri) => uri.split('/').pop();

// ---- 1. Property discovery -------------------------------------------------
console.log('1. Discovering external-ID properties');
const props = await sparql(
  'properties',
  `SELECT ?p ?pLabel ?pDescription ?formatter WHERE {
  ?p wikibase:propertyType wikibase:ExternalId ;
     rdfs:label ?pLabel .
  FILTER(LANG(?pLabel) = "en")
  FILTER(CONTAINS(LCASE(?pLabel), "wnba")
      || CONTAINS(LCASE(?pLabel), "basketball-reference")
      || CONTAINS(LCASE(?pLabel), "basketball reference")
      || CONTAINS(LCASE(?pLabel), "espn"))
  OPTIONAL { ?p schema:description ?pDescription . FILTER(LANG(?pDescription) = "en") }
  OPTIONAL { ?p wdt:P1630 ?formatter }
}`
);

const propList = props.map((b) => ({
  pid: pid(val(b, 'p')),
  label: val(b, 'pLabel'),
  description: val(b, 'pDescription'),
  formatter: val(b, 'formatter'),
}));
for (const p of propList) console.log(`    ${p.pid}  ${p.label}  ${p.formatter ?? ''}`);

// Selection rules (by label only; no hardcoded P-numbers):
//   wnba: label mentions WNBA + player, and is not a Basketball-Reference/ESPN property
//   bref: label mentions Basketball-Reference + WNBA (+ player)
//   espn: label mentions ESPN + WNBA if present, else ESPN + basketball/NBA player
function pick(kind, pred, why) {
  const cands = [...new Map(propList.filter(pred).map((p) => [p.pid, p])).values()];
  if (cands.length === 0) {
    console.log(`    -> ${kind}: none found (${why})`);
    return null;
  }
  if (cands.length > 1) console.log(`    -> ${kind}: ${cands.length} candidates ${cands.map((c) => c.pid).join(', ')}; taking first`);
  console.log(`    -> ${kind}: ${cands[0].pid} "${cands[0].label}" — ${why}`);
  return cands[0].pid;
}
const L = (p) => p.label.toLowerCase();
const isBref = (p) => /basketball[- ]reference/.test(L(p));
const isEspn = (p) => L(p).includes('espn');
const chosen = {
  wnba: pick(
    'wnba',
    (p) => L(p).includes('wnba') && L(p).includes('player') && !isBref(p) && !isEspn(p),
    'official WNBA player ID property (label has "WNBA" + "player", not BRef/ESPN)'
  ),
  bref: pick(
    'bref',
    (p) => isBref(p) && L(p).includes('wnba') && L(p).includes('player'),
    'Basketball-Reference WNBA player property'
  ),
  // No fallback to ESPN NBA/other-sport IDs: those are different ID namespaces/pages.
  espn: pick('espn', (p) => isEspn(p) && L(p).includes('wnba') && L(p).includes('player'), 'ESPN WNBA player property'),
};

// ---- 2. Resolve WNBA item by label -----------------------------------------
console.log('2. Resolving WNBA item');
const leagueRows = await sparql(
  'wnba-item',
  `SELECT ?item ?itemDescription (COUNT(?team) AS ?teams) WHERE {
  ?item rdfs:label "Women's National Basketball Association"@en .
  OPTIONAL { ?team wdt:P118 ?item }
  OPTIONAL { ?item schema:description ?itemDescription . FILTER(LANG(?itemDescription) = "en") }
} GROUP BY ?item ?itemDescription`
);
if (leagueRows.length === 0) throw new Error('No Wikidata item labelled "Women\'s National Basketball Association"');
// If multiple items share the label, take the one that teams point to via P118 (log it).
leagueRows.sort((a, b) => Number(val(b, 'teams')) - Number(val(a, 'teams')));
const WNBA = pid(val(leagueRows[0], 'item'));
console.log(`    WNBA item: ${WNBA} (${leagueRows.length} item(s) with that label; picked the one with most P118 teams = ${val(leagueRows[0], 'teams')})`);

// P118 (league) is also set on people and drafts, so restrict to items that are
// instances of "basketball team" (resolved by label, like the league item).
const TEAM_PATTERN = `?team wdt:P118 wd:${WNBA} ; wdt:P31 ?teamType . ?teamType rdfs:label "basketball team"@en .`;

// ---- 4 (first, needed for split fallback). Teams ----------------------------
console.log('4. Teams');
const teams = await sparql(
  'teams',
  `SELECT ?team ?teamLabel ?inception ?dissolved ?location ?locationLabel ?hq ?hqLabel ?venue ?venueLabel WHERE {
  ${TEAM_PATTERN}
  OPTIONAL { ?team wdt:P571 ?inception }
  OPTIONAL { ?team wdt:P576 ?dissolved }
  OPTIONAL { ?team wdt:P131 ?location }
  OPTIONAL { ?team wdt:P159 ?hq }
  OPTIONAL { ?team wdt:P115 ?venue }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`,
  { wnbaItem: WNBA }
);

// ---- 2. Players -------------------------------------------------------------
console.log('2. Players');
const idVars = Object.entries(chosen).filter(([, p]) => p);
const idSelect = idVars.map(([k]) => `?${k}Id`).join(' ');
const idOptionals = idVars.map(([k, p]) => `  OPTIONAL { ?player wdt:${p} ?${k}Id }`).join('\n');
const playerQuery = (match) => `SELECT DISTINCT ?player ?playerLabel ?birthdate ${idSelect} WHERE {
  ${match}
  OPTIONAL { ?player wdt:P569 ?birthdate }
${idOptionals}
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
try {
  await sparql('players', playerQuery(`${TEAM_PATTERN}\n  ?player wdt:P54 ?team .`), { wnbaItem: WNBA, idProperties: chosen });
} catch (err) {
  console.warn(`    full players query failed (${err.message}); splitting by team`);
  const teamQids = [...new Set(teams.map((b) => pid(val(b, 'team'))))];
  for (const t of teamQids) {
    await sparql(`players-by-team/${t}`, playerQuery(`VALUES ?team { wd:${t} }\n  ?player wdt:P54 ?team .`), {
      wnbaItem: WNBA,
      team: t,
      idProperties: chosen,
    });
  }
}

// ---- 2b. Supplement: people with a WNBA.com ID but no P54 on a WNBA team ----
// Not a replacement for the P54 query; saved separately so matching can use it.
if (chosen.wnba) {
  console.log('2b. Players with WNBA.com ID (supplement)');
  await sparql(
    'players-with-wnba-id',
    playerQuery(`?player wdt:${chosen.wnba} [] .`),
    { idProperties: chosen }
  );
}

// ---- 3. Awards --------------------------------------------------------------
// A single query joining all players to P166 times out on WDQS, so batch by player QID.
console.log('3. Awards');
const { readEnvelope } = await import('./lib/envelope.mjs');
const playerQids = new Set();
for (const f of ['players', 'players-with-wnba-id']) {
  try {
    for (const b of (await readEnvelope(`${OUT}/${f}.json`)).data.results.bindings) playerQids.add(pid(val(b, 'player')));
  } catch {}
}
const qids = [...playerQids].sort();
const BATCH = 150;
for (let i = 0; i < qids.length; i += BATCH) {
  const batch = qids.slice(i, i + BATCH);
  await sparql(
    `awards/batch-${String(i / BATCH).padStart(2, '0')}`,
    `SELECT ?player ?award ?awardLabel ?pointInTime WHERE {
  VALUES ?player { ${batch.map((q) => `wd:${q}`).join(' ')} }
  ?player p:P166 ?st .
  ?st ps:P166 ?award .
  ?award rdfs:label ?awardLabel .
  FILTER(LANG(?awardLabel) = "en" && CONTAINS(?awardLabel, "WNBA"))
  OPTIONAL { ?st pq:P585 ?pointInTime }
}`,
    { wnbaItem: WNBA, batch: i / BATCH, players: batch.length }
  );
}

// Record the property choices alongside the raw data (derived metadata, not a source response).
await writeEnvelope(`${OUT}/property-choices.json`, {
  source: 'derived',
  url: null,
  params: { from: 'properties.json' },
  data: { chosen, candidates: propList, wnbaItem: WNBA },
});
console.log('Done.');
