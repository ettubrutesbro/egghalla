// Pull raw data from the undocumented stats.wnba.com API (LeagueID=10).
// Raw responses saved unmodified in envelopes under public/data/raw/wnba/.
import { existsSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fetchJson } from './lib/http.mjs';
import { discoverHeadshots } from './lib/headshots.mjs';
import { readEnvelope, writeEnvelope, writeJson } from './lib/envelope.mjs';

const BASE = 'https://stats.wnba.com/stats/';
const OUT = 'public/data/raw/wnba';
const SEASONS = ['2025', '2026'];
const RESUME = !process.argv.includes('--fresh'); // skip per-player files already on disk

// Header set that worked (see REPORT.md). Note: these same headers hang with curl
// (likely TLS/HTTP2 client fingerprinting) but return promptly from Node's fetch.
const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
export const HEADERS = {
  'User-Agent': CHROME_UA,
  Referer: 'https://www.wnba.com/',
  Origin: 'https://www.wnba.com',
  Accept: 'application/json',
};

const table = (rs) => rs.rowSet.map((r) => Object.fromEntries(rs.headers.map((h, i) => [h, r[i]])));

// Pattern from a rostered player's page; verify on 5 IDs spread evenly through the sorted roster list.
async function runHeadshots(allPlayers, ids) {
  const rosterSet = new Set(ids);
  const samplePlayer = table(allPlayers.resultSets[0]).find((p) => rosterSet.has(p.PERSON_ID) && p.PLAYER_SLUG);
  const step = Math.floor(ids.length / 5);
  return discoverHeadshots({
    samplePlayer,
    verifyIds: [0, 1, 2, 3, 4].map((i) => ids[i * step]),
    userAgent: CHROME_UA,
    outFile: `${OUT}/headshots.json`,
  });
}

// --headshots-only: redo just the headshot step using rosters already on disk.
if (process.argv.includes('--headshots-only')) {
  const allPlayers = (await readEnvelope(`${OUT}/commonallplayers.json`)).data;
  const ids = new Set();
  for (const f of readdirSync(`${OUT}/commonteamroster`)) {
    const rs = (await readEnvelope(`${OUT}/commonteamroster/${f}`)).data.resultSets.find((s) => s.name === 'CommonTeamRoster');
    for (const r of table(rs)) ids.add(r.PLAYER_ID);
  }
  const m = JSON.parse(await readFile(`${OUT}/_manifest.json`, 'utf8'));
  m.headshots = await runHeadshots(allPlayers, [...ids].sort((a, b) => a - b));
  await writeJson(`${OUT}/_manifest.json`, m);
  process.exit(0);
}

const manifest = { startedAt: new Date().toISOString(), headers: HEADERS, endpoints: [], errors: [] };

function rowCounts(data) {
  const sets = data.resultSets ?? (data.resultSet ? [data.resultSet] : []);
  return Object.fromEntries((Array.isArray(sets) ? sets : [sets]).map((s) => [s.name, s.rowSet?.length ?? null]));
}

async function pull(endpoint, params, file, { record = true } = {}) {
  const url = `${BASE}${endpoint}?${new URLSearchParams(params)}`;
  const t0 = Date.now();
  try {
    const { data } = await fetchJson(url, { headers: HEADERS, timeoutMs: 45_000 });
    await writeEnvelope(`${OUT}/${file}.json`, { source: 'stats.wnba.com', url, params: { endpoint, ...params }, data });
    const rows = rowCounts(data);
    if (record) manifest.endpoints.push({ endpoint, file, params, ok: true, rows, ms: Date.now() - t0 });
    console.log(`  ${file}: ${JSON.stringify(rows)} (${Date.now() - t0}ms)`);
    return data;
  } catch (err) {
    const e = { endpoint, file, params, ok: false, error: err.message, status: err.status ?? null, ms: Date.now() - t0 };
    manifest.errors.push(e);
    if (record) manifest.endpoints.push(e);
    console.warn(`  ${file}: FAILED ${err.message}`);
    return null;
  }
}


// ---- Player index ------------------------------------------------------------
console.log('commonallplayers');
const allPlayers = await pull(
  'commonallplayers',
  { LeagueID: '10', Season: SEASONS.at(-1), IsOnlyCurrentSeason: '0' },
  'commonallplayers'
);
if (!allPlayers) {
  // Fully blocked: stop this source, the report will document it.
  manifest.blocked = true;
  await writeJson(`${OUT}/_manifest.json`, manifest);
  console.error('stats.wnba.com appears blocked; stopping WNBA source.');
  process.exit(0);
}

// ---- Teams (to know which TeamIDs to request rosters for) --------------------
console.log('commonteamyears');
const teamYears = await pull('commonteamyears', { LeagueID: '10' }, 'commonteamyears');

// ---- Season-level stats ------------------------------------------------------
const DASH_DEFAULTS = {
  LeagueID: '10', SeasonType: 'Regular Season', PerMode: 'PerGame', PaceAdjust: 'N', PlusMinus: 'N', Rank: 'N',
  LastNGames: '0', Month: '0', OpponentTeamID: '0', Period: '0', TeamID: '0', DateFrom: '', DateTo: '',
  GameSegment: '', Location: '', Outcome: '', SeasonSegment: '', VsConference: '', VsDivision: '', PORound: '0',
  PlayerExperience: '', PlayerPosition: '', StarterBench: '', GameScope: '', ShotClockRange: '', Conference: '',
  Division: '', College: '', Country: '', DraftPick: '', DraftYear: '', Height: '', Weight: '', TwoWay: '0', ISTRound: '',
};
for (const season of SEASONS) {
  console.log(`season ${season}`);
  await pull('leaguedashplayerstats', { ...DASH_DEFAULTS, Season: season, MeasureType: 'Base' }, `leaguedashplayerstats-${season}-base`);
  await pull('leaguedashplayerstats', { ...DASH_DEFAULTS, Season: season, MeasureType: 'Advanced' }, `leaguedashplayerstats-${season}-advanced`);
  await pull(
    'leagueleaders',
    { LeagueID: '10', PerMode: 'PerGame', Scope: 'S', Season: season, SeasonType: 'Regular Season', StatCategory: 'PTS', ActiveFlag: '' },
    `leagueleaders-${season}-pts`
  );
}

// ---- Rosters -------------------------------------------------------------------
const teamRows = teamYears ? table(teamYears.resultSets[0]) : [];
const rosterPlayerIds = new Set();
for (const season of SEASONS) {
  const teams = teamRows.filter((t) => Number(t.MIN_YEAR) <= Number(season) && Number(t.MAX_YEAR) >= Number(season));
  console.log(`rosters ${season}: ${teams.length} teams`);
  for (const t of teams) {
    const data = await pull('commonteamroster', { LeagueID: '10', Season: season, TeamID: String(t.TEAM_ID) }, `commonteamroster/${season}-${t.TEAM_ID}`);
    const rs = data?.resultSets?.find((s) => s.name === 'CommonTeamRoster');
    if (rs) for (const r of table(rs)) rosterPlayerIds.add(r.PLAYER_ID);
  }
}

// ---- commonplayerinfo for each rostered player (slow) --------------------------
const ids = [...rosterPlayerIds].sort((a, b) => a - b);
console.log(`commonplayerinfo: ${ids.length} players`);
let done = 0;
let skipped = 0;
const cpiResults = { ok: 0, failed: 0, skipped: 0 };
const queue = [...ids];
const CONCURRENCY = 3; // requests still start >=1s apart via the per-host throttle
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const id = queue.shift();
      const file = `commonplayerinfo/${id}`;
      if (RESUME && existsSync(`${OUT}/${file}.json`)) {
        cpiResults.skipped++;
        skipped++;
        continue;
      }
      const data = await pull('commonplayerinfo', { LeagueID: '10', PlayerID: String(id) }, file, { record: false });
      if (data) cpiResults.ok++;
      else cpiResults.failed++;
      if (++done % 25 === 0) console.log(`    ${done + skipped}/${ids.length}`);
    }
  })
);
manifest.endpoints.push({ endpoint: 'commonplayerinfo', file: 'commonplayerinfo/*', ok: cpiResults.failed === 0, rows: { players: ids.length, ...cpiResults } });

// ---- Headshot URL pattern --------------------------------------------------------
console.log('headshots');
manifest.headshots = await runHeadshots(allPlayers, ids);

manifest.finishedAt = new Date().toISOString();
await writeJson(`${OUT}/_manifest.json`, manifest);
console.log(`Done. ${manifest.errors.length} errors.`);
