// Merge raw WNBA + Wikidata pulls into public/data/players.json,
// write match issues to public/data/review/match-issues.json, and write REPORT.md.
// Reads only from raw envelopes. Never fills fields from anywhere else.
import { existsSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { readEnvelope, writeJson } from './lib/envelope.mjs';

const RAW_WNBA = 'public/data/raw/wnba';
const RAW_WD = 'public/data/raw/wikidata';
const SEASONS = ['2025', '2026'];

const table = (rs) => rs.rowSet.map((r) => Object.fromEntries(rs.headers.map((h, i) => [h, r[i]])));
const resultSet = (data, name) => (data.resultSets ?? [data.resultSet]).find((s) => s.name === name);
const qid = (uri) => uri?.split('/').pop() ?? null;
const ymd = (s) => (s ? String(s).slice(0, 10) : null);
const src = (env, kind) => ({ url: env.url, retrievedAt: env.retrievedAt, kind });
const tryRead = async (p) => (existsSync(p) ? readEnvelope(p) : null);

export function normName(s) {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`.]/g, '')
    .replace(/[-,]/g, ' ')
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------- WNBA side
const manifest = existsSync(`${RAW_WNBA}/_manifest.json`) ? JSON.parse(await readFile(`${RAW_WNBA}/_manifest.json`, 'utf8')) : null;
const teamYearsEnv = await tryRead(`${RAW_WNBA}/commonteamyears.json`);
const teamAbbr = new Map(teamYearsEnv ? table(teamYearsEnv.data.resultSets[0]).map((t) => [t.TEAM_ID, t.ABBREVIATION]) : []);

// Rosters: personId -> { name, teams[], sources[] }
const rostered = new Map();
const rosterDir = `${RAW_WNBA}/commonteamroster`;
const rosterFiles = existsSync(rosterDir) ? readdirSync(rosterDir).filter((f) => f.endsWith('.json')).sort() : [];
const rosterCounts = {};
for (const f of rosterFiles) {
  const env = await readEnvelope(`${rosterDir}/${f}`);
  const rs = resultSet(env.data, 'CommonTeamRoster');
  const season = env.params.Season;
  const rows = rs ? table(rs) : [];
  rosterCounts[f.replace('.json', '')] = rows.length;
  for (const r of rows) {
    const p = rostered.get(r.PLAYER_ID) ?? { name: r.PLAYER, teams: [], sources: [] };
    p.teams.push({ season, teamId: r.TeamID, teamAbbr: teamAbbr.get(r.TeamID) ?? null });
    p.sources.push(src(env, 'wnba:commonteamroster'));
    rostered.set(r.PLAYER_ID, p);
  }
}

// Season stats
const stats = {}; // season -> { base: Map, adv: Map, envs }
for (const s of SEASONS) {
  const base = await tryRead(`${RAW_WNBA}/leaguedashplayerstats-${s}-base.json`);
  const adv = await tryRead(`${RAW_WNBA}/leaguedashplayerstats-${s}-advanced.json`);
  const toMap = (env) => new Map(env ? table(resultSet(env.data, 'LeagueDashPlayerStats')).map((r) => [r.PLAYER_ID, r]) : []);
  stats[s] = { base: toMap(base), adv: toMap(adv), baseEnv: base, advEnv: adv };
}
const BASE_FIELDS = ['GP', 'MIN', 'PTS', 'REB', 'OREB', 'DREB', 'AST', 'STL', 'BLK', 'TOV', 'PF', 'FGM', 'FGA', 'FG_PCT', 'FG3M', 'FG3A', 'FG3_PCT', 'FTM', 'FTA', 'FT_PCT', 'PLUS_MINUS'];
const ADV_FIELDS = ['TS_PCT', 'EFG_PCT', 'USG_PCT', 'OFF_RATING', 'DEF_RATING', 'NET_RATING', 'AST_PCT', 'REB_PCT', 'PIE'];
const pickFields = (row, fields) => Object.fromEntries(fields.map((f) => [f, row?.[f] ?? null]));

// Headshots
const headshotEnv = await tryRead(`${RAW_WNBA}/headshots.json`);
const hs = headshotEnv?.data;
// Pattern counts as verified when all 5 HEADs return 200 and at least one is a real photo
// (the CDN serves a generic placeholder with 200 for unknown IDs; see report).
const headshotVerified =
  !!hs?.pattern && hs.verification.length === 5 && hs.verification.every((v) => v.status === 200) && hs.verification.some((v) => !v.isPlaceholder);

// ---------------------------------------------------------------- Wikidata side
const wdPlayersEnv = await tryRead(`${RAW_WD}/players.json`);
const wdSuppEnv = await tryRead(`${RAW_WD}/players-with-wnba-id.json`);
const choices = (await tryRead(`${RAW_WD}/property-choices.json`))?.data ?? { chosen: {} };

const wd = new Map(); // QID -> { labels:Set, birthdates:Set, wnbaIds:Set, brefIds:Set, espnIds:Set, viaP54:bool, envs:Set }
for (const [env, viaP54] of [[wdPlayersEnv, true], [wdSuppEnv, false]]) {
  if (!env) continue;
  for (const b of env.data.results.bindings) {
    const q = qid(b.player.value);
    const e = wd.get(q) ?? { qid: q, labels: new Set(), birthdates: new Set(), wnbaIds: new Set(), brefIds: new Set(), espnIds: new Set(), viaP54: false, envs: new Set() };
    if (b.playerLabel) e.labels.add(b.playerLabel.value);
    if (b.birthdate) e.birthdates.add(ymd(b.birthdate.value));
    if (b.wnbaId) e.wnbaIds.add(b.wnbaId.value);
    if (b.brefId) e.brefIds.add(b.brefId.value);
    if (b.espnId) e.espnIds.add(b.espnId.value);
    e.viaP54 ||= viaP54;
    e.envs.add(env);
    wd.set(q, e);
  }
}
const byWnbaId = new Map();
const byName = new Map();
for (const e of wd.values()) {
  for (const id of e.wnbaIds) byWnbaId.set(id, [...(byWnbaId.get(id) ?? []), e]);
  for (const l of e.labels) {
    const n = normName(l);
    if (!byName.has(n)) byName.set(n, new Set());
    byName.get(n).add(e);
  }
}

// Awards
const awardsByQid = new Map();
const awardsDir = `${RAW_WD}/awards`;
let awardsEnvs = [];
if (existsSync(awardsDir)) {
  for (const f of readdirSync(awardsDir).filter((f) => f.endsWith('.json')).sort()) {
    const env = await readEnvelope(`${awardsDir}/${f}`);
    awardsEnvs.push(env);
    for (const b of env.data.results.bindings) {
      const q = qid(b.player.value);
      const a = { label: b.awardLabel.value, year: b.pointInTime ? Number(b.pointInTime.value.slice(0, 4)) : null, wikidataAward: qid(b.award.value) };
      const list = awardsByQid.get(q) ?? [];
      if (!list.some((x) => x.wikidataAward === a.wikidataAward && x.year === a.year)) list.push(a);
      awardsByQid.set(q, list);
    }
  }
}

// ---------------------------------------------------------------- Build
const issues = { ambiguous: [], unmatched: [], lowConfidence: [], conflicts: [] };
const players = [];

for (const [personId, r] of [...rostered.entries()].sort((a, b) => a[0] - b[0])) {
  const cpiEnv = await tryRead(`${RAW_WNBA}/commonplayerinfo/${personId}.json`);
  const info = cpiEnv ? table(resultSet(cpiEnv.data, 'CommonPlayerInfo'))[0] : null;
  const name = info?.DISPLAY_FIRST_LAST ?? r.name;
  const birthdate = ymd(info?.BIRTHDATE);
  const nn = normName(name);
  const summary = { personId, name, birthdate };

  // --- matching
  let match = { method: 'none', confidence: null, notes: [] };
  let wdEntry = null;
  const byId = byWnbaId.get(String(personId)) ?? [];
  if (byId.length === 1) {
    wdEntry = byId[0];
    match = { method: 'wnba-id', confidence: 'high', notes: [] };
    if (birthdate && wdEntry.birthdates.size && !wdEntry.birthdates.has(birthdate)) {
      match.notes.push(`birthdate differs: WNBA ${birthdate} vs Wikidata ${[...wdEntry.birthdates].join('/')}`);
      issues.conflicts.push({ ...summary, qid: wdEntry.qid, issue: match.notes.at(-1) });
    }
  } else if (byId.length > 1) {
    match = { method: 'ambiguous', confidence: null, notes: [`${byId.length} Wikidata items share WNBA.com ID ${personId}`] };
    issues.ambiguous.push({ ...summary, reason: 'multiple Wikidata items with same WNBA ID', candidates: byId.map(candidate) });
  } else {
    const nameCands = [...(byName.get(nn) ?? [])];
    const dobCands = birthdate ? nameCands.filter((e) => e.birthdates.has(birthdate)) : [];
    const noConflict = nameCands.filter((e) => !birthdate || e.birthdates.size === 0 || e.birthdates.has(birthdate));
    if (dobCands.length === 1) {
      wdEntry = dobCands[0];
      match = { method: 'name+birthdate', confidence: 'medium', notes: [] };
    } else if (dobCands.length > 1) {
      match = { method: 'ambiguous', confidence: null, notes: [`${dobCands.length} name+birthdate candidates`] };
      issues.ambiguous.push({ ...summary, reason: 'multiple name+birthdate candidates', candidates: dobCands.map(candidate) });
    } else if (noConflict.length === 1) {
      wdEntry = noConflict[0];
      match = { method: 'name-only', confidence: 'low', notes: [birthdate ? 'Wikidata item has no birthdate to confirm' : 'WNBA record has no birthdate to confirm'] };
      issues.lowConfidence.push({ ...summary, qid: wdEntry.qid, wikidataLabel: [...wdEntry.labels][0] });
    } else if (noConflict.length > 1) {
      match = { method: 'ambiguous', confidence: null, notes: [`${noConflict.length} name-only candidates`] };
      issues.ambiguous.push({ ...summary, reason: 'multiple name-only candidates', candidates: noConflict.map(candidate) });
    } else {
      const reason = nameCands.length ? `name matches ${nameCands.length} Wikidata item(s) but birthdate conflicts` : 'no Wikidata candidate';
      match.notes.push(reason);
      issues.unmatched.push({ ...summary, reason, candidates: nameCands.map(candidate) });
    }
  }
  if (wdEntry) {
    if (wdEntry.wnbaIds.size && !wdEntry.wnbaIds.has(String(personId))) {
      match.notes.push(`Wikidata item has a different WNBA.com ID: ${[...wdEntry.wnbaIds].join('/')}`);
      issues.conflicts.push({ ...summary, qid: wdEntry.qid, issue: match.notes.at(-1) });
    }
    if (wdEntry.brefIds.size > 1) match.notes.push(`multiple BRef IDs on Wikidata: ${[...wdEntry.brefIds].join('/')}; ids.bref left null`);
  }

  // --- stats
  const st = {};
  const sources = [...dedupeSources(r.sources)];
  if (cpiEnv) sources.push(src(cpiEnv, 'wnba:commonplayerinfo'));
  for (const s of SEASONS) {
    const b = stats[s].base.get(personId);
    const a = stats[s].adv.get(personId);
    st[s] = b || a ? { teamAbbr: b?.TEAM_ABBREVIATION ?? a?.TEAM_ABBREVIATION ?? null, ...pickFields(b, BASE_FIELDS), ...pickFields(a, ADV_FIELDS) } : null;
    if (b) sources.push(src(stats[s].baseEnv, 'wnba:leaguedashplayerstats:base'));
    if (a) sources.push(src(stats[s].advEnv, 'wnba:leaguedashplayerstats:advanced'));
  }
  if (wdEntry) {
    for (const env of wdEntry.envs) sources.push(src(env, 'wikidata:players'));
    if (awardsByQid.has(wdEntry.qid)) sources.push(...awardsEnvs.filter((e) => e.data.results.bindings.some((b) => qid(b.player.value) === wdEntry.qid)).map((e) => src(e, 'wikidata:awards')));
  }
  if (headshotVerified) sources.push(src(headshotEnv, 'wnba:headshot-pattern'));

  const draftNum = (v) => (v == null || v === '' || /undrafted/i.test(String(v)) ? null : Number(v));
  players.push({
    id: `wnba:${personId}`,
    name,
    ids: {
      wnba: String(personId),
      wikidata: wdEntry?.qid ?? null,
      bref: wdEntry && wdEntry.brefIds.size === 1 ? [...wdEntry.brefIds][0] : null,
      espn: wdEntry && wdEntry.espnIds.size === 1 ? [...wdEntry.espnIds][0] : null,
    },
    bio: {
      birthdate,
      height: info?.HEIGHT || null,
      position: info?.POSITION || null,
      college: info?.SCHOOL || null,
      country: info?.COUNTRY || null,
      draft: { year: draftNum(info?.DRAFT_YEAR), round: draftNum(info?.DRAFT_ROUND), pick: draftNum(info?.DRAFT_NUMBER) },
    },
    teams: r.teams.sort((a, b) => a.season.localeCompare(b.season) || a.teamId - b.teamId),
    stats: st,
    awards: wdEntry ? (awardsByQid.get(wdEntry.qid) ?? []).sort((a, b) => (a.year ?? 0) - (b.year ?? 0) || a.label.localeCompare(b.label)) : [],
    headshotUrl: headshotVerified ? hs.pattern.replace('{personId}', personId) : null,
    sources,
    match: { method: match.method, confidence: match.confidence, notes: match.notes.join('; ') || null },
    _raw: { draftRaw: info ? { year: info.DRAFT_YEAR, round: info.DRAFT_ROUND, pick: info.DRAFT_NUMBER } : null, hasCpi: !!cpiEnv },
  });
}

function candidate(e) {
  return { qid: e.qid, labels: [...e.labels], birthdates: [...e.birthdates], wnbaIds: [...e.wnbaIds], viaP54: e.viaP54 };
}
function* dedupeSources(list) {
  const seen = new Set();
  for (const s of list) if (!seen.has(s.url)) (seen.add(s.url), yield s);
}

// Flag Wikidata items matched to more than one WNBA player.
const byQ = new Map();
for (const p of players) if (p.ids.wikidata) byQ.set(p.ids.wikidata, [...(byQ.get(p.ids.wikidata) ?? []), p]);
for (const [q, ps] of byQ) if (ps.length > 1) issues.ambiguous.push({ qid: q, reason: 'Wikidata item matched to multiple WNBA players', players: ps.map((p) => ({ id: p.id, name: p.name, method: p.match.method })) });

const internal = players.map((p) => p._raw);
for (const p of players) delete p._raw;

await writeJson('public/data/players.json', players);
await writeJson('public/data/review/match-issues.json', { generatedAt: new Date().toISOString(), counts: Object.fromEntries(Object.entries(issues).map(([k, v]) => [k, v.length])), ...issues });
console.log(`players.json: ${players.length} players`);
console.log(`match issues: ${JSON.stringify(Object.fromEntries(Object.entries(issues).map(([k, v]) => [k, v.length])))}`);

// ---------------------------------------------------------------- Report
const { writeReport } = await import('./lib/report.mjs');
await writeReport({ players, issues, manifest, rosterCounts, choices, wd, headshot: hs, headshotVerified, internal, awardsEnvs, wdPlayersEnv, wdSuppEnv });
console.log('REPORT.md written');
