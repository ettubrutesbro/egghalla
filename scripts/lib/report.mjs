// Generates public/data/REPORT.md from the build results and raw manifests.
import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { readEnvelope } from './envelope.mjs';

const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(1)}%` : 'n/a');

// Observations from the header probing done while building pull-wnba.mjs (2026-10-05).
const HEADER_NOTES = `- Node 18+ \`fetch\` with exactly the four headers above returned 200 for every endpoint tried.
- The same headers via \`curl\` (HTTP/2 and \`--http1.1\`), with and without \`x-nba-stats-origin\`/\`x-nba-stats-token\`,
  \`Accept-Language\` or \`Sec-Fetch-*\`/\`sec-ch-ua\` headers, mostly hung until timeout (HTTP 000 after 25s). One curl call
  with full \`Sec-Fetch-*\` + \`sec-ch-ua\` headers did return 200 after ~20s. TCP/TLS connected in <50ms, so the hang is
  server-side filtering, most likely on client TLS/HTTP fingerprint rather than on headers.
- Latency is bimodal: most calls take 0.1–2s, but some take ~20–21s (looks like an edge cache miss), so the client
  uses a 45s timeout.`;

export async function writeReport({ players, issues, manifest, rosterCounts, choices, wd, headshot, headshotVerified, internal, awardsEnvs, wdPlayersEnv, wdSuppEnv }) {
  const L = [];
  const n = players.length;
  L.push('# Egghalla data pull: test report', '');
  L.push(`Generated ${new Date().toISOString()}. One-time snapshot for seasons 2025 and 2026. Raw envelopes are in \`public/data/raw/\`.`, '');

  // ---------------------------------------------------------------- endpoints
  L.push('## 1. Endpoints', '', '### Wikidata (query.wikidata.org/sparql)', '');
  L.push('| Query | File | Rows | Status |', '|---|---|---:|---|');
  for (const [label, f] of [
    ['Property discovery', 'properties'],
    ['WNBA item by label', 'wnba-item'],
    ['Teams', 'teams'],
    ['Players (P54 on a WNBA team)', 'players'],
    ['Players with WNBA.com ID (supplement)', 'players-with-wnba-id'],
  ]) {
    const p = `public/data/raw/wikidata/${f}.json`;
    if (existsSync(p)) L.push(`| ${label} | \`${f}.json\` | ${(await readEnvelope(p)).data.results.bindings.length} | ok |`);
    else L.push(`| ${label} | \`${f}.json\` | – | **missing** |`);
  }
  const awardRows = awardsEnvs.reduce((s, e) => s + e.data.results.bindings.length, 0);
  L.push(`| Awards (P166 with "WNBA" in label), ${awardsEnvs.length} batches of ≤150 players | \`awards/batch-*.json\` | ${awardRows} | ok |`, '');
  L.push('Notes:');
  L.push('- The first awards query (all players joined in one query) got **HTTP 504** from WDQS. Batching by player QID with `VALUES` fixed it.');
  L.push('- `P118 = WNBA` is also set on people and expansion drafts. The first teams query returned 685 rows, mostly humans. Teams are now limited to items with `P31` = the item labelled "basketball team".');
  if (wdPlayersEnv && wdSuppEnv) {
    const p54 = new Set(wdPlayersEnv.data.results.bindings.map((b) => b.player.value)).size;
    const supp = new Set(wdSuppEnv.data.results.bindings.map((b) => b.player.value)).size;
    L.push(`- The P54 player query returns **${p54} distinct people**, below the ~1,000+ expected. ${supp} people have a WNBA.com ID (P3588-style property), so many WNBA players have no P54 statement for a WNBA team. Matching uses both sets: ${wd.size} distinct Wikidata items in total.`);
  }
  L.push('');

  L.push('### stats.wnba.com', '');
  if (!manifest) L.push('**No manifest found. The WNBA pull did not run.**', '');
  else if (manifest.blocked) L.push('**Blocked.** commonallplayers failed after retries, so the source was stopped.', '');
  if (manifest) {
    L.push('| Endpoint | File | Rows | Status |', '|---|---|---|---|');
    const rosters = manifest.endpoints.filter((e) => e.endpoint === 'commonteamroster');
    for (const e of manifest.endpoints.filter((e) => e.endpoint !== 'commonteamroster')) {
      L.push(`| ${e.endpoint} | \`${e.file}\` | ${e.rows ? Object.entries(e.rows).map(([k, v]) => `${k}: ${v}`).join(', ') : '–'} | ${e.ok ? 'ok' : `**FAILED** ${e.error ?? ''}`} |`);
    }
    for (const season of ['2025', '2026']) {
      const rs = rosters.filter((e) => e.params.Season === season);
      const ok = rs.filter((e) => e.ok);
      const players = ok.reduce((s, e) => s + (e.rows?.CommonTeamRoster ?? 0), 0);
      const empty = ok.filter((e) => !e.rows?.CommonTeamRoster).map((e) => e.params.TeamID);
      L.push(`| commonteamroster ${season} | \`commonteamroster/${season}-*.json\` | ${ok.length}/${rs.length} teams ok, ${players} roster rows${empty.length ? `, empty: ${empty.join(', ')}` : ''} | ${ok.length === rs.length ? 'ok' : '**partial**'} |`);
    }
    L.push('');
    if (manifest.errors.length) {
      L.push('Errors:', '');
      for (const e of manifest.errors) L.push(`- \`${e.file}\`: ${e.error}`);
      L.push('');
    }
  }

  // ---------------------------------------------------------------- headers
  L.push('## 2. stats.wnba.com header config that worked', '');
  if (manifest) L.push('```json', JSON.stringify(manifest.headers, null, 2), '```', '');
  L.push(HEADER_NOTES, '');

  // ---------------------------------------------------------------- headshots
  L.push('## 3. Headshot URL pattern', '');
  if (headshot?.pattern) {
    L.push(`Pattern: \`${headshot.pattern}\``, '');
    L.push(`Found in the \`<img>\` src and JSON-LD \`image.contentUrl\` of a wnba.com player page (\`${manifest?.headshots?.pageUrl}\`). Headshot references on that page: ${headshot.headshotRefsFound.map((u) => `\`${u}\``).join(', ')}.`, '');
    L.push('HEAD checks on 5 rostered player IDs, spread evenly through the sorted roster list:', '');
    L.push('| personId | Status | Content-Type | Bytes | ETag | Placeholder? |', '|---|---|---|---:|---|---|');
    if (headshot.placeholder) L.push(`| ${headshot.placeholder.personId} (bogus) | ${headshot.placeholder.status} | – | ${headshot.placeholder.contentLength ?? '–'} | \`${headshot.placeholder.etag}\` | reference |`);
    for (const v of headshot.verification) L.push(`| ${v.personId} | ${v.status} | ${v.contentType ?? '–'} | ${v.contentLength ?? '–'} | \`${v.etag}\` | ${v.isPlaceholder ? '**yes**' : 'no'} |`);
    const ph = headshot.verification.filter((v) => v.isPlaceholder).length;
    L.push('');
    L.push(`**The CDN returns HTTP 200 for any ID**, including the bogus \`${headshot.placeholder?.personId}\`. For unknown IDs it serves a generic silhouette PNG (${headshot.placeholder?.contentLength} bytes, ETag \`${headshot.placeholder?.etag}\`). A 200 status therefore proves nothing on its own, so each check is compared against that ETag. ${5 - ph}/5 sampled players have a real photo and ${ph}/5 get the placeholder.`);
    L.push('', headshotVerified ? '`headshotUrl` is filled for every player using the verified pattern. Individual URLs were not checked, so some will resolve to the placeholder. A future pass could HEAD each URL and compare ETags to flag them (no image download needed).' : '**Verification failed, so `headshotUrl` is null for everyone.**', '');
  } else L.push('**No headshot pattern found.** `headshotUrl` is null.', '');

  // ---------------------------------------------------------------- matching
  L.push('## 4. WNBA → Wikidata matching', '');
  const methods = {};
  for (const p of players) methods[p.match.method] = (methods[p.match.method] ?? 0) + 1;
  L.push(`${n} players appear on a 2025 or 2026 roster.`, '');
  L.push('| Method | Confidence | Players | Share |', '|---|---|---:|---:|');
  const conf = { 'wnba-id': 'high', 'name+birthdate': 'medium', 'name-only': 'low', ambiguous: '–', none: '–' };
  for (const m of ['wnba-id', 'name+birthdate', 'name-only', 'ambiguous', 'none']) L.push(`| ${m} | ${conf[m]} | ${methods[m] ?? 0} | ${pct(methods[m] ?? 0, n)} |`);
  const matched = players.filter((p) => p.ids.wikidata).length;
  L.push('', `Matched total: **${matched}/${n} (${pct(matched, n)})**. Low-confidence: **${issues.lowConfidence.length}**. Unmatched: **${issues.unmatched.length}**. Ambiguous: **${issues.ambiguous.length}**. Data conflicts on matched players: **${issues.conflicts.length}**. Details are in \`public/data/review/match-issues.json\`.`, '');
  if (issues.conflicts.length) {
    L.push('Conflicts:', '');
    for (const c of issues.conflicts) L.push(`- ${c.name} (wnba:${c.personId}, ${c.qid}): ${c.issue}`);
    L.push('');
  }
  if (issues.unmatched.length) {
    L.push('Unmatched players:', '');
    for (const u of issues.unmatched) L.push(`- ${u.name} (wnba:${u.personId}, born ${u.birthdate ?? '?'}): ${u.reason}`);
    L.push('', 'The candidate pool contains only Wikidata people with P54 on a WNBA team or a WNBA.com ID. These players may still exist in Wikidata (for example under European club teams) without either link. A wider name+birthdate search across all of Wikidata was not run.', '');
  }

  // ---------------------------------------------------------------- properties
  L.push('## 5. Wikidata external-ID properties', '');
  L.push('Discovered: ExternalId properties whose English label mentions WNBA, Basketball-Reference or ESPN.', '');
  L.push('| Property | Label | Chosen as |', '|---|---|---|');
  const chosenBy = Object.fromEntries(Object.entries(choices.chosen ?? {}).filter(([, v]) => v).map(([k, v]) => [v, k]));
  for (const c of choices.candidates ?? []) L.push(`| ${c.pid} | ${c.label} | ${chosenBy[c.pid] ? `**ids.${chosenBy[c.pid]}**` : ''} |`);
  L.push('');
  L.push('Why these were chosen (label rules in `pull-wikidata.mjs`; no hardcoded P-numbers):');
  L.push(`- **wnba = ${choices.chosen?.wnba}**: the only property with "WNBA" + "player" that is not a BRef or ESPN property.`);
  L.push(`- **bref = ${choices.chosen?.bref}**: Basketball Reference + WNBA + player. The NBA/G League/coach variants were left out.`);
  L.push(`- **espn = ${choices.chosen?.espn ?? 'none'}**: Wikidata has **no ESPN WNBA player property**. The ESPN properties found cover NBA, NFL, NHL, MLB, college football, soccer, MMA, tennis and cricket. ESPN.com NBA player ID is a different namespace, so it was not used as a substitute. \`ids.espn\` is null for every player.`, '');
  const m = players.filter((p) => p.ids.wikidata);
  const matchedItems = m.map((p) => wd.get(p.ids.wikidata));
  L.push(`Population among the ${m.length} matched current players:`, '');
  L.push('| Field | Populated | Share |', '|---|---:|---:|');
  L.push(`| WNBA.com ID (${choices.chosen?.wnba}) on Wikidata item | ${matchedItems.filter((e) => e.wnbaIds.size).length} | ${pct(matchedItems.filter((e) => e.wnbaIds.size).length, m.length)} |`);
  L.push(`| BRef WNBA ID (${choices.chosen?.bref}) on Wikidata item | ${matchedItems.filter((e) => e.brefIds.size).length} | ${pct(matchedItems.filter((e) => e.brefIds.size).length, m.length)} |`);
  L.push(`| Birthdate (P569) on Wikidata item | ${matchedItems.filter((e) => e.birthdates.size).length} | ${pct(matchedItems.filter((e) => e.birthdates.size).length, m.length)} |`);
  L.push(`| Has P54 on a WNBA team | ${matchedItems.filter((e) => e.viaP54).length} | ${pct(matchedItems.filter((e) => e.viaP54).length, m.length)} |`);
  L.push(`| Across all ${n} current players: ids.bref set | ${players.filter((p) => p.ids.bref).length} | ${pct(players.filter((p) => p.ids.bref).length, n)} |`, '');

  // ---------------------------------------------------------------- gaps
  L.push('## 6. Notable gaps and oddities', '');
  const bioFields = ['birthdate', 'height', 'position', 'college', 'country'];
  L.push('Missing bio fields (null) across all players:', '');
  L.push('| Field | Null | Share |', '|---|---:|---:|');
  for (const f of bioFields) {
    const c = players.filter((p) => p.bio[f] == null).length;
    L.push(`| ${f} | ${c} | ${pct(c, n)} |`);
  }
  const noDraft = players.filter((p) => p.bio.draft.year == null).length;
  L.push(`| draft.year | ${noDraft} | ${pct(noDraft, n)} |`, '');
  const draftRawVals = {};
  for (const r of internal) if (r?.draftRaw && !/^\d+$/.test(String(r.draftRaw.year ?? ''))) draftRawVals[String(r.draftRaw.year)] = (draftRawVals[String(r.draftRaw.year)] ?? 0) + 1;
  if (Object.keys(draftRawVals).length) L.push(`- Raw non-numeric DRAFT_YEAR values (mapped to null): ${Object.entries(draftRawVals).map(([k, v]) => `\`${k}\` ×${v}`).join(', ')}.`);
  const noCpi = internal.filter((r) => !r.hasCpi).length;
  if (noCpi) L.push(`- ${noCpi} players have no commonplayerinfo file, so their bio is empty.`);
  const noAwards = players.filter((p) => p.awards.length === 0).length;
  L.push(`- **Awards are sparse**: ${noAwards}/${n} players (${pct(noAwards, n)}) have no WNBA award on Wikidata. Among matched players: ${m.filter((p) => !p.awards.length).length}/${m.length} have none. There were only ${awardRows} award rows across all ${wd.size} Wikidata people. Treat this as incomplete, not as "never won an award".`);
  const yearless = players.flatMap((p) => p.awards).filter((a) => a.year == null).length;
  const allAwards = players.flatMap((p) => p.awards).length;
  L.push(`- ${yearless}/${allAwards} award entries on current players have no P585 year qualifier.`);
  for (const s of ['2025', '2026']) {
    const onRoster = players.filter((p) => p.teams.some((t) => t.season === s));
    const noStats = onRoster.filter((p) => !p.stats[s]);
    L.push(`- ${s}: ${onRoster.length} players on a roster, of whom ${noStats.length} have no ${s} regular-season stats row (did not play, or roster/stats mismatch).`);
  }
  const multi = players.filter((p) => new Set(p.teams.filter((t) => t.season === '2026').map((t) => t.teamId)).size > 1).length;
  L.push(`- **Rosters are end-of-season snapshots.** \`commonteamroster\` returns about 11–13 players per team, so players who were waived or traded mid-season appear only on their final team or not at all. This explains why leaguedashplayerstats has more players than the rosters. Players on more than one 2026 roster: ${multi}.`);
  const emptyRosters = Object.entries(rosterCounts).filter(([, c]) => c === 0).map(([k]) => k);
  if (emptyRosters.length) L.push(`- Empty rosters: ${emptyRosters.join(', ')}. \`commonteamyears\` gives TEAM_ID 1611661327 (PDX) MIN_YEAR 2000. The new Portland Fire reuses the 2000–2002 franchise ID, so a 2025 roster request returns nothing.`);
  const nullAbbr = players.flatMap((p) => p.teams).filter((t) => !t.teamAbbr).length;
  if (nullAbbr) L.push(`- ${nullAbbr} team entries have no abbreviation in commonteamyears.`);
  L.push('- `height` is the raw WNBA string (feet-inches, e.g. "6-4"). It is not converted.');
  L.push('- `bio.birthdate` comes only from WNBA commonplayerinfo. Wikidata birthdates are used for matching but are never copied into the record.', '');

  // ---------------------------------------------------------------- samples
  L.push('## 7. Five random players.json records', '');
  const pool = [...players];
  for (let i = 0; i < Math.min(5, pool.length); i++) {
    const p = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    L.push(`### ${p.name} (${p.id})`, '', '```json', JSON.stringify(p, null, 2), '```', '');
  }

  await writeFile('public/data/REPORT.md', L.join('\n'));
}
