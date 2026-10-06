# Egghalla data pull: test report

Generated 2026-10-06T03:44:24.491Z. One-time snapshot for seasons 2025 and 2026. Raw envelopes are in `public/data/raw/`.

## 1. Endpoints

### Wikidata (query.wikidata.org/sparql)

| Query | File | Rows | Status |
|---|---|---:|---|
| Property discovery | `properties.json` | 21 | ok |
| WNBA item by label | `wnba-item.json` | 1 | ok |
| Teams | `teams.json` | 23 | ok |
| Players (P54 on a WNBA team) | `players.json` | 770 | ok |
| Players with WNBA.com ID (supplement) | `players-with-wnba-id.json` | 1320 | ok |
| Awards (P166 with "WNBA" in label), 10 batches of ≤150 players | `awards/batch-*.json` | 202 | ok |

Notes:
- The first awards query (all players joined in one query) got **HTTP 504** from WDQS. Batching by player QID with `VALUES` fixed it.
- `P118 = WNBA` is also set on people and expansion drafts. The first teams query returned 685 rows, mostly humans. Teams are now limited to items with `P31` = the item labelled "basketball team".
- The P54 player query returns **768 distinct people**, below the ~1,000+ expected. 1314 people have a WNBA.com ID (P3588-style property), so many WNBA players have no P54 statement for a WNBA team. Matching uses both sets: 1352 distinct Wikidata items in total.

### stats.wnba.com

| Endpoint | File | Rows | Status |
|---|---|---|---|
| commonallplayers | `commonallplayers` | CommonAllPlayers: 1228 | ok |
| commonteamyears | `commonteamyears` | TeamYears: 20 | ok |
| leaguedashplayerstats | `leaguedashplayerstats-2025-base` | LeagueDashPlayerStats: 182 | ok |
| leaguedashplayerstats | `leaguedashplayerstats-2025-advanced` | LeagueDashPlayerStats: 182 | ok |
| leagueleaders | `leagueleaders-2025-pts` | LeagueLeaders: 104 | ok |
| leaguedashplayerstats | `leaguedashplayerstats-2026-base` | LeagueDashPlayerStats: 239 | ok |
| leaguedashplayerstats | `leaguedashplayerstats-2026-advanced` | LeagueDashPlayerStats: 239 | ok |
| leagueleaders | `leagueleaders-2026-pts` | LeagueLeaders: 125 | ok |
| commonplayerinfo | `commonplayerinfo/*` | players: 245, ok: 245, failed: 0, skipped: 0 | ok |
| commonteamroster 2025 | `commonteamroster/2025-*.json` | 14/14 teams ok, 163 roster rows, empty: 1611661327 | ok |
| commonteamroster 2026 | `commonteamroster/2026-*.json` | 15/15 teams ok, 223 roster rows | ok |

## 2. stats.wnba.com header config that worked

```json
{
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  "Referer": "https://www.wnba.com/",
  "Origin": "https://www.wnba.com",
  "Accept": "application/json"
}
```

- Node 18+ `fetch` with exactly the four headers above returned 200 for every endpoint tried.
- The same headers via `curl` (HTTP/2 and `--http1.1`), with and without `x-nba-stats-origin`/`x-nba-stats-token`,
  `Accept-Language` or `Sec-Fetch-*`/`sec-ch-ua` headers, mostly hung until timeout (HTTP 000 after 25s). One curl call
  with full `Sec-Fetch-*` + `sec-ch-ua` headers did return 200 after ~20s. TCP/TLS connected in <50ms, so the hang is
  server-side filtering, most likely on client TLS/HTTP fingerprint rather than on headers.
- Latency is bimodal: most calls take 0.1–2s, but some take ~20–21s (looks like an edge cache miss), so the client
  uses a 45s timeout.

## 3. Headshot URL pattern

Pattern: `https://cdn.wnba.com/headshots/wnba/latest/1040x760/{personId}.png`

Found in the `<img>` src and JSON-LD `image.contentUrl` of a wnba.com player page (`https://www.wnba.com/player/1642777/monique_akoa_makani`). Headshot references on that page: `https://cdn.wnba.com/headshots/wnba/latest/1040x760/1642777.png`.

HEAD checks on 5 rostered player IDs, spread evenly through the sorted roster list:

| personId | Status | Content-Type | Bytes | ETag | Placeholder? |
|---|---|---|---:|---|---|
| 999999999 (bogus) | 200 | – | 12531 | `"dab8a90a5529e57031c31e63bcd4b7d0"` | reference |
| 201886 | 200 | image/png | 258487 | `"a2f3686c3a2ad198987f996abf4d313a"` | no |
| 1628278 | 200 | image/png | 183099 | `"e3532aabc7b7e20c5722fd09b42cd8ee"` | no |
| 1630386 | 200 | image/png | 260816 | `"da02c05f90adb09fdfc836b07cc96774"` | no |
| 1642292 | 200 | image/png | 289375 | `"827d559d8d8f21a15a39fa2277ee2042"` | no |
| 1642835 | 200 | image/png | 12531 | `"dab8a90a5529e57031c31e63bcd4b7d0"` | **yes** |

**The CDN returns HTTP 200 for any ID**, including the bogus `999999999`. For unknown IDs it serves a generic silhouette PNG (12531 bytes, ETag `"dab8a90a5529e57031c31e63bcd4b7d0"`). A 200 status therefore proves nothing on its own, so each check is compared against that ETag. 4/5 sampled players have a real photo and 1/5 get the placeholder.

`headshotUrl` is filled for every player using the verified pattern. Individual URLs were not checked, so some will resolve to the placeholder. A future pass could HEAD each URL and compare ETags to flag them (no image download needed).

## 4. WNBA → Wikidata matching

245 players appear on a 2025 or 2026 roster.

| Method | Confidence | Players | Share |
|---|---|---:|---:|
| wnba-id | high | 238 | 97.1% |
| name+birthdate | medium | 0 | 0.0% |
| name-only | low | 0 | 0.0% |
| ambiguous | – | 0 | 0.0% |
| none | – | 7 | 2.9% |

Matched total: **238/245 (97.1%)**. Low-confidence: **0**. Unmatched: **7**. Ambiguous: **0**. Data conflicts on matched players: **1**. Details are in `public/data/review/match-issues.json`.

Conflicts:

- Myisha Hines-Allen (wnba:1628899, Q56224090): birthdate differs: WNBA 1995-05-30 vs Wikidata 1996-05-30

Unmatched players:

- Raquel Carrera (wnba:1630384, born 2001-10-31): no Wikidata candidate
- Marine Fauthoux (wnba:1630469, born 2001-01-23): no Wikidata candidate
- Elizabeth Balogun (wnba:1641663, born 2000-09-09): no Wikidata candidate
- Holly Winterburn (wnba:1641683, born 2000-10-01): no Wikidata candidate
- Morgan Maly (wnba:1642835, born 2002-01-25): no Wikidata candidate
- Elena Buenavida (wnba:1643825, born 2004-03-08): no Wikidata candidate
- Aminata Gueye (wnba:1643832, born 2002-07-10): no Wikidata candidate

The candidate pool contains only Wikidata people with P54 on a WNBA team or a WNBA.com ID. These players may still exist in Wikidata (for example under European club teams) without either link. A wider name+birthdate search across all of Wikidata was not run.

## 5. Wikidata external-ID properties

Discovered: ExternalId properties whose English label mentions WNBA, Basketball-Reference or ESPN.

| Property | Label | Chosen as |
|---|---|---|
| P4790 | Basketball Reference international player ID |  |
| P4795 | Basketball Reference referee ID |  |
| P4796 | Basketball Reference NBL player ID |  |
| P7262 | ESPN.com college football player ID |  |
| P10073 | ESPN.com MMA fighter ID |  |
| P11585 | ESPN.com tennis player ID |  |
| P13284 | ESPN.com football match ID |  |
| P13590 | espn.com soccer team ID |  |
| P858 | ESPNscrum player ID (archived) |  |
| P2685 | Basketball Reference NBA player ID |  |
| P3571 | ESPN.com MLB player ID |  |
| P3572 | ESPNcricinfo playing ground ID |  |
| P3588 | WNBA.com player ID | **ids.wnba** |
| P3681 | ESPN FC player ID |  |
| P3685 | ESPN.com NBA player ID |  |
| P3686 | ESPN.com NFL player ID |  |
| P3687 | ESPN.com NHL player ID |  |
| P4561 | Basketball Reference WNBA player ID | **ids.bref** |
| P4718 | Basketball Reference NBA coach ID |  |
| P4720 | Basketball Reference WNBA coach ID |  |
| P4744 | Basketball Reference NBA G League player ID |  |

Why these were chosen (label rules in `pull-wikidata.mjs`; no hardcoded P-numbers):
- **wnba = P3588**: the only property with "WNBA" + "player" that is not a BRef or ESPN property.
- **bref = P4561**: Basketball Reference + WNBA + player. The NBA/G League/coach variants were left out.
- **espn = none**: Wikidata has **no ESPN WNBA player property**. The ESPN properties found cover NBA, NFL, NHL, MLB, college football, soccer, MMA, tennis and cricket. ESPN.com NBA player ID is a different namespace, so it was not used as a substitute. `ids.espn` is null for every player.

Population among the 238 matched current players:

| Field | Populated | Share |
|---|---:|---:|
| WNBA.com ID (P3588) on Wikidata item | 238 | 100.0% |
| BRef WNBA ID (P4561) on Wikidata item | 238 | 100.0% |
| Birthdate (P569) on Wikidata item | 238 | 100.0% |
| Has P54 on a WNBA team | 91 | 38.2% |
| Across all 245 current players: ids.bref set | 238 | 97.1% |

## 6. Notable gaps and oddities

Missing bio fields (null) across all players:

| Field | Null | Share |
|---|---:|---:|
| birthdate | 0 | 0.0% |
| height | 1 | 0.4% |
| position | 0 | 0.0% |
| college | 28 | 11.4% |
| country | 3 | 1.2% |
| draft.year | 54 | 22.0% |

- Raw non-numeric DRAFT_YEAR values (mapped to null): `Undrafted` ×54.
- **Awards are sparse**: 223/245 players (91.0%) have no WNBA award on Wikidata. Among matched players: 216/238 have none. There were only 202 award rows across all 1352 Wikidata people. Treat this as incomplete, not as "never won an award".
- 1/53 award entries on current players have no P585 year qualifier.
- 2025: 163 players on a roster, of whom 2 have no 2025 regular-season stats row (did not play, or roster/stats mismatch).
- 2026: 223 players on a roster, of whom 8 have no 2026 regular-season stats row (did not play, or roster/stats mismatch).
- **Rosters are end-of-season snapshots.** `commonteamroster` returns about 11–13 players per team, so players who were waived or traded mid-season appear only on their final team or not at all. This explains why leaguedashplayerstats has more players than the rosters. Players on more than one 2026 roster: 0.
- Empty rosters: 2025-1611661327. `commonteamyears` gives TEAM_ID 1611661327 (PDX) MIN_YEAR 2000. The new Portland Fire reuses the 2000–2002 franchise ID, so a 2025 roster request returns nothing.
- `height` is the raw WNBA string (feet-inches, e.g. "6-4"). It is not converted.
- `bio.birthdate` comes only from WNBA commonplayerinfo. Wikidata birthdates are used for matching but are never copied into the record.

## 7. Five random players.json records

### Dorka Juhasz (wnba:1641657)

```json
{
  "id": "wnba:1641657",
  "name": "Dorka Juhasz",
  "ids": {
    "wnba": "1641657",
    "wikidata": "Q118591697",
    "bref": "j/juhasdo01w",
    "espn": null
  },
  "bio": {
    "birthdate": "1999-12-18",
    "height": "6-5",
    "position": "Forward",
    "college": "Connecticut",
    "country": "Hungary",
    "draft": {
      "year": 2023,
      "round": 2,
      "pick": 16
    }
  },
  "teams": [
    {
      "season": "2026",
      "teamId": 1611661324,
      "teamAbbr": "MIN"
    }
  ],
  "stats": {
    "2025": null,
    "2026": {
      "teamAbbr": "MIN",
      "GP": 21,
      "MIN": 15.2,
      "PTS": 3.6,
      "REB": 3.1,
      "OREB": 0.4,
      "DREB": 2.7,
      "AST": 1.4,
      "STL": 0.2,
      "BLK": 0.6,
      "TOV": 0.7,
      "PF": 1,
      "FGM": 1.4,
      "FGA": 3.9,
      "FG_PCT": 0.37,
      "FG3M": 0.7,
      "FG3A": 2.5,
      "FG3_PCT": 0.288,
      "FTM": 0,
      "FTA": 0.2,
      "FT_PCT": 0.25,
      "PLUS_MINUS": -3.5,
      "TS_PCT": 0.459,
      "EFG_PCT": 0.463,
      "USG_PCT": 0.128,
      "OFF_RATING": 94.9,
      "DEF_RATING": 106.2,
      "NET_RATING": -11.4,
      "AST_PCT": 0.15,
      "REB_PCT": 0.099,
      "PIE": 0.078
    }
  },
  "awards": [],
  "headshotUrl": "https://cdn.wnba.com/headshots/wnba/latest/1040x760/1641657.png",
  "sources": [
    {
      "url": "https://stats.wnba.com/stats/commonteamroster?LeagueID=10&Season=2026&TeamID=1611661324",
      "retrievedAt": "2026-10-06T03:35:15.937Z",
      "kind": "wnba:commonteamroster"
    },
    {
      "url": "https://stats.wnba.com/stats/commonplayerinfo?LeagueID=10&PlayerID=1641657",
      "retrievedAt": "2026-10-06T03:39:17.656Z",
      "kind": "wnba:commonplayerinfo"
    },
    {
      "url": "https://stats.wnba.com/stats/leaguedashplayerstats?LeagueID=10&SeasonType=Regular+Season&PerMode=PerGame&PaceAdjust=N&PlusMinus=N&Rank=N&LastNGames=0&Month=0&OpponentTeamID=0&Period=0&TeamID=0&DateFrom=&DateTo=&GameSegment=&Location=&Outcome=&SeasonSegment=&VsConference=&VsDivision=&PORound=0&PlayerExperience=&PlayerPosition=&StarterBench=&GameScope=&ShotClockRange=&Conference=&Division=&College=&Country=&DraftPick=&DraftYear=&Height=&Weight=&TwoWay=0&ISTRound=&Season=2026&MeasureType=Base",
      "retrievedAt": "2026-10-06T03:32:16.543Z",
      "kind": "wnba:leaguedashplayerstats:base"
    },
    {
      "url": "https://stats.wnba.com/stats/leaguedashplayerstats?LeagueID=10&SeasonType=Regular+Season&PerMode=PerGame&PaceAdjust=N&PlusMinus=N&Rank=N&LastNGames=0&Month=0&OpponentTeamID=0&Period=0&TeamID=0&DateFrom=&DateTo=&GameSegment=&Location=&Outcome=&SeasonSegment=&VsConference=&VsDivision=&PORound=0&PlayerExperience=&PlayerPosition=&StarterBench=&GameScope=&ShotClockRange=&Conference=&Division=&College=&Country=&DraftPick=&DraftYear=&Height=&Weight=&TwoWay=0&ISTRound=&Season=2026&MeasureType=Advanced",
      "retrievedAt": "2026-10-06T03:32:18.012Z",
      "kind": "wnba:leaguedashplayerstats:advanced"
    },
    {
      "url": "https://query.wikidata.org/sparql",
      "retrievedAt": "2026-10-06T03:31:00.342Z",
      "kind": "wikidata:players"
    },
    {
      "url": "https://www.wnba.com/player/1642777/monique_akoa_makani",
      "retrievedAt": "2026-10-06T03:44:03.839Z",
      "kind": "wnba:headshot-pattern"
    }
  ],
  "match": {
    "method": "wnba-id",
    "confidence": "high",
    "notes": null
  }
}
```

### Kiana Williams (wnba:1630461)

```json
{
  "id": "wnba:1630461",
  "name": "Kiana Williams",
  "ids": {
    "wnba": "1630461",
    "wikidata": "Q106838172",
    "bref": "w/williki02w",
    "espn": null
  },
  "bio": {
    "birthdate": "1999-04-09",
    "height": "5-8",
    "position": "Guard",
    "college": "Stanford",
    "country": "USA",
    "draft": {
      "year": 2021,
      "round": 2,
      "pick": 18
    }
  },
  "teams": [
    {
      "season": "2025",
      "teamId": 1611661317,
      "teamAbbr": "PHX"
    }
  ],
  "stats": {
    "2025": {
      "teamAbbr": "PHX",
      "GP": 11,
      "MIN": 9.7,
      "PTS": 4.1,
      "REB": 1,
      "OREB": 0,
      "DREB": 1,
      "AST": 0.9,
      "STL": 0.3,
      "BLK": 0,
      "TOV": 0.5,
      "PF": 0.5,
      "FGM": 1.5,
      "FGA": 3.6,
      "FG_PCT": 0.425,
      "FG3M": 0.8,
      "FG3A": 2.4,
      "FG3_PCT": 0.346,
      "FTM": 0.2,
      "FTA": 0.4,
      "FT_PCT": 0.5,
      "PLUS_MINUS": -3,
      "TS_PCT": 0.539,
      "EFG_PCT": 0.538,
      "USG_PCT": 0.198,
      "OFF_RATING": 87.5,
      "DEF_RATING": 102.3,
      "NET_RATING": -14.8,
      "AST_PCT": 0.192,
      "REB_PCT": 0.047,
      "PIE": 0.094
    },
    "2026": {
      "teamAbbr": "TOR",
      "GP": 24,
      "MIN": 12.9,
      "PTS": 4.1,
      "REB": 0.4,
      "OREB": 0,
      "DREB": 0.4,
      "AST": 1.2,
      "STL": 0.4,
      "BLK": 0,
      "TOV": 0.8,
      "PF": 1.1,
      "FGM": 1.5,
      "FGA": 4.2,
      "FG_PCT": 0.35,
      "FG3M": 0.8,
      "FG3A": 2.8,
      "FG3_PCT": 0.284,
      "FTM": 0.4,
      "FTA": 0.5,
      "FT_PCT": 0.75,
      "PLUS_MINUS": -2.8,
      "TS_PCT": 0.465,
      "EFG_PCT": 0.445,
      "USG_PCT": 0.166,
      "OFF_RATING": 97.6,
      "DEF_RATING": 108.5,
      "NET_RATING": -10.9,
      "AST_PCT": 0.153,
      "REB_PCT": 0.015,
      "PIE": 0.029
    }
  },
  "awards": [],
  "headshotUrl": "https://cdn.wnba.com/headshots/wnba/latest/1040x760/1630461.png",
  "sources": [
    {
      "url": "https://stats.wnba.com/stats/commonteamroster?LeagueID=10&Season=2025&TeamID=1611661317",
      "retrievedAt": "2026-10-06T03:32:39.632Z",
      "kind": "wnba:commonteamroster"
    },
    {
      "url": "https://stats.wnba.com/stats/commonplayerinfo?LeagueID=10&PlayerID=1630461",
      "retrievedAt": "2026-10-06T03:38:29.103Z",
      "kind": "wnba:commonplayerinfo"
    },
    {
      "url": "https://stats.wnba.com/stats/leaguedashplayerstats?LeagueID=10&SeasonType=Regular+Season&PerMode=PerGame&PaceAdjust=N&PlusMinus=N&Rank=N&LastNGames=0&Month=0&OpponentTeamID=0&Period=0&TeamID=0&DateFrom=&DateTo=&GameSegment=&Location=&Outcome=&SeasonSegment=&VsConference=&VsDivision=&PORound=0&PlayerExperience=&PlayerPosition=&StarterBench=&GameScope=&ShotClockRange=&Conference=&Division=&College=&Country=&DraftPick=&DraftYear=&Height=&Weight=&TwoWay=0&ISTRound=&Season=2025&MeasureType=Base",
      "retrievedAt": "2026-10-06T03:31:53.470Z",
      "kind": "wnba:leaguedashplayerstats:base"
    },
    {
      "url": "https://stats.wnba.com/stats/leaguedashplayerstats?LeagueID=10&SeasonType=Regular+Season&PerMode=PerGame&PaceAdjust=N&PlusMinus=N&Rank=N&LastNGames=0&Month=0&OpponentTeamID=0&Period=0&TeamID=0&DateFrom=&DateTo=&GameSegment=&Location=&Outcome=&SeasonSegment=&VsConference=&VsDivision=&PORound=0&PlayerExperience=&PlayerPosition=&StarterBench=&GameScope=&ShotClockRange=&Conference=&Division=&College=&Country=&DraftPick=&DraftYear=&Height=&Weight=&TwoWay=0&ISTRound=&Season=2025&MeasureType=Advanced",
      "retrievedAt": "2026-10-06T03:32:14.772Z",
      "kind": "wnba:leaguedashplayerstats:advanced"
    },
    {
      "url": "https://stats.wnba.com/stats/leaguedashplayerstats?LeagueID=10&SeasonType=Regular+Season&PerMode=PerGame&PaceAdjust=N&PlusMinus=N&Rank=N&LastNGames=0&Month=0&OpponentTeamID=0&Period=0&TeamID=0&DateFrom=&DateTo=&GameSegment=&Location=&Outcome=&SeasonSegment=&VsConference=&VsDivision=&PORound=0&PlayerExperience=&PlayerPosition=&StarterBench=&GameScope=&ShotClockRange=&Conference=&Division=&College=&Country=&DraftPick=&DraftYear=&Height=&Weight=&TwoWay=0&ISTRound=&Season=2026&MeasureType=Base",
      "retrievedAt": "2026-10-06T03:32:16.543Z",
      "kind": "wnba:leaguedashplayerstats:base"
    },
    {
      "url": "https://stats.wnba.com/stats/leaguedashplayerstats?LeagueID=10&SeasonType=Regular+Season&PerMode=PerGame&PaceAdjust=N&PlusMinus=N&Rank=N&LastNGames=0&Month=0&OpponentTeamID=0&Period=0&TeamID=0&DateFrom=&DateTo=&GameSegment=&Location=&Outcome=&SeasonSegment=&VsConference=&VsDivision=&PORound=0&PlayerExperience=&PlayerPosition=&StarterBench=&GameScope=&ShotClockRange=&Conference=&Division=&College=&Country=&DraftPick=&DraftYear=&Height=&Weight=&TwoWay=0&ISTRound=&Season=2026&MeasureType=Advanced",
      "retrievedAt": "2026-10-06T03:32:18.012Z",
      "kind": "wnba:leaguedashplayerstats:advanced"
    },
    {
      "url": "https://query.wikidata.org/sparql",
      "retrievedAt": "2026-10-06T03:31:00.342Z",
      "kind": "wikidata:players"
    },
    {
      "url": "https://www.wnba.com/player/1642777/monique_akoa_makani",
      "retrievedAt": "2026-10-06T03:44:03.839Z",
      "kind": "wnba:headshot-pattern"
    }
  ],
  "match": {
    "method": "wnba-id",
    "confidence": "high",
    "notes": null
  }
}
```

### Michelle Onyiah (wnba:1642803)

```json
{
  "id": "wnba:1642803",
  "name": "Michelle Onyiah",
  "ids": {
    "wnba": "1642803",
    "wikidata": "Q119545957",
    "bref": "o/onyiaug01w",
    "espn": null
  },
  "bio": {
    "birthdate": "2002-03-12",
    "height": "6-3",
    "position": "Forward-Center",
    "college": "California-Berkeley",
    "country": "USA",
    "draft": {
      "year": null,
      "round": null,
      "pick": null
    }
  },
  "teams": [
    {
      "season": "2026",
      "teamId": 1611661325,
      "teamAbbr": "IND"
    }
  ],
  "stats": {
    "2025": null,
    "2026": {
      "teamAbbr": "IND",
      "GP": 2,
      "MIN": 6.5,
      "PTS": 2,
      "REB": 2.5,
      "OREB": 1,
      "DREB": 1.5,
      "AST": 0,
      "STL": 0,
      "BLK": 0,
      "TOV": 1,
      "PF": 0.5,
      "FGM": 0.5,
      "FGA": 1.5,
      "FG_PCT": 0.333,
      "FG3M": 0,
      "FG3A": 0,
      "FG3_PCT": 0,
      "FTM": 1,
      "FTA": 2.5,
      "FT_PCT": 0.4,
      "PLUS_MINUS": 9,
      "TS_PCT": 0.385,
      "EFG_PCT": 0.333,
      "USG_PCT": 0.219,
      "OFF_RATING": 115.4,
      "DEF_RATING": 44.4,
      "NET_RATING": 70.9,
      "AST_PCT": 0,
      "REB_PCT": 0.156,
      "PIE": 0
    }
  },
  "awards": [],
  "headshotUrl": "https://cdn.wnba.com/headshots/wnba/latest/1040x760/1642803.png",
  "sources": [
    {
      "url": "https://stats.wnba.com/stats/commonteamroster?LeagueID=10&Season=2026&TeamID=1611661325",
      "retrievedAt": "2026-10-06T03:35:16.794Z",
      "kind": "wnba:commonteamroster"
    },
    {
      "url": "https://stats.wnba.com/stats/commonplayerinfo?LeagueID=10&PlayerID=1642803",
      "retrievedAt": "2026-10-06T03:40:40.167Z",
      "kind": "wnba:commonplayerinfo"
    },
    {
      "url": "https://stats.wnba.com/stats/leaguedashplayerstats?LeagueID=10&SeasonType=Regular+Season&PerMode=PerGame&PaceAdjust=N&PlusMinus=N&Rank=N&LastNGames=0&Month=0&OpponentTeamID=0&Period=0&TeamID=0&DateFrom=&DateTo=&GameSegment=&Location=&Outcome=&SeasonSegment=&VsConference=&VsDivision=&PORound=0&PlayerExperience=&PlayerPosition=&StarterBench=&GameScope=&ShotClockRange=&Conference=&Division=&College=&Country=&DraftPick=&DraftYear=&Height=&Weight=&TwoWay=0&ISTRound=&Season=2026&MeasureType=Base",
      "retrievedAt": "2026-10-06T03:32:16.543Z",
      "kind": "wnba:leaguedashplayerstats:base"
    },
    {
      "url": "https://stats.wnba.com/stats/leaguedashplayerstats?LeagueID=10&SeasonType=Regular+Season&PerMode=PerGame&PaceAdjust=N&PlusMinus=N&Rank=N&LastNGames=0&Month=0&OpponentTeamID=0&Period=0&TeamID=0&DateFrom=&DateTo=&GameSegment=&Location=&Outcome=&SeasonSegment=&VsConference=&VsDivision=&PORound=0&PlayerExperience=&PlayerPosition=&StarterBench=&GameScope=&ShotClockRange=&Conference=&Division=&College=&Country=&DraftPick=&DraftYear=&Height=&Weight=&TwoWay=0&ISTRound=&Season=2026&MeasureType=Advanced",
      "retrievedAt": "2026-10-06T03:32:18.012Z",
      "kind": "wnba:leaguedashplayerstats:advanced"
    },
    {
      "url": "https://query.wikidata.org/sparql",
      "retrievedAt": "2026-10-06T03:31:00.342Z",
      "kind": "wikidata:players"
    },
    {
      "url": "https://www.wnba.com/player/1642777/monique_akoa_makani",
      "retrievedAt": "2026-10-06T03:44:03.839Z",
      "kind": "wnba:headshot-pattern"
    }
  ],
  "match": {
    "method": "wnba-id",
    "confidence": "high",
    "notes": null
  }
}
```

### Olivia Nelson-Ododa (wnba:1631135)

```json
{
  "id": "wnba:1631135",
  "name": "Olivia Nelson-Ododa",
  "ids": {
    "wnba": "1631135",
    "wikidata": "Q108203260",
    "bref": "n/nelsool01w",
    "espn": null
  },
  "bio": {
    "birthdate": "2000-08-17",
    "height": "6-5",
    "position": "Center",
    "college": "Connecticut",
    "country": "USA",
    "draft": {
      "year": 2022,
      "round": 2,
      "pick": 19
    }
  },
  "teams": [
    {
      "season": "2025",
      "teamId": 1611661323,
      "teamAbbr": "CON"
    },
    {
      "season": "2026",
      "teamId": 1611661323,
      "teamAbbr": "CON"
    }
  ],
  "stats": {
    "2025": {
      "teamAbbr": "CON",
      "GP": 37,
      "MIN": 21.6,
      "PTS": 8.2,
      "REB": 5,
      "OREB": 1.6,
      "DREB": 3.4,
      "AST": 0.9,
      "STL": 0.7,
      "BLK": 1.2,
      "TOV": 1.1,
      "PF": 2.4,
      "FGM": 3.1,
      "FGA": 5.8,
      "FG_PCT": 0.526,
      "FG3M": 0,
      "FG3A": 0.1,
      "FG3_PCT": 0.5,
      "FTM": 2.1,
      "FTA": 3,
      "FT_PCT": 0.703,
      "PLUS_MINUS": -4.7,
      "TS_PCT": 0.578,
      "EFG_PCT": 0.528,
      "USG_PCT": 0.169,
      "OFF_RATING": 93.2,
      "DEF_RATING": 103.2,
      "NET_RATING": -10,
      "AST_PCT": 0.08,
      "REB_PCT": 0.119,
      "PIE": 0.111
    },
    "2026": {
      "teamAbbr": "CON",
      "GP": 33,
      "MIN": 21.2,
      "PTS": 10.1,
      "REB": 5.9,
      "OREB": 1.6,
      "DREB": 4.3,
      "AST": 1.6,
      "STL": 0.8,
      "BLK": 0.8,
      "TOV": 1.6,
      "PF": 3,
      "FGM": 3.8,
      "FGA": 6.6,
      "FG_PCT": 0.576,
      "FG3M": 0,
      "FG3A": 0.1,
      "FG3_PCT": 0,
      "FTM": 2.5,
      "FTA": 3.7,
      "FT_PCT": 0.683,
      "PLUS_MINUS": -3,
      "TS_PCT": 0.616,
      "EFG_PCT": 0.576,
      "USG_PCT": 0.195,
      "OFF_RATING": 99.9,
      "DEF_RATING": 106.8,
      "NET_RATING": -6.9,
      "AST_PCT": 0.133,
      "REB_PCT": 0.142,
      "PIE": 0.137
    }
  },
  "awards": [],
  "headshotUrl": "https://cdn.wnba.com/headshots/wnba/latest/1040x760/1631135.png",
  "sources": [
    {
      "url": "https://stats.wnba.com/stats/commonteamroster?LeagueID=10&Season=2025&TeamID=1611661323",
      "retrievedAt": "2026-10-06T03:34:02.571Z",
      "kind": "wnba:commonteamroster"
    },
    {
      "url": "https://stats.wnba.com/stats/commonteamroster?LeagueID=10&Season=2026&TeamID=1611661323",
      "retrievedAt": "2026-10-06T03:35:15.504Z",
      "kind": "wnba:commonteamroster"
    },
    {
      "url": "https://stats.wnba.com/stats/commonplayerinfo?LeagueID=10&PlayerID=1631135",
      "retrievedAt": "2026-10-06T03:38:52.377Z",
      "kind": "wnba:commonplayerinfo"
    },
    {
      "url": "https://stats.wnba.com/stats/leaguedashplayerstats?LeagueID=10&SeasonType=Regular+Season&PerMode=PerGame&PaceAdjust=N&PlusMinus=N&Rank=N&LastNGames=0&Month=0&OpponentTeamID=0&Period=0&TeamID=0&DateFrom=&DateTo=&GameSegment=&Location=&Outcome=&SeasonSegment=&VsConference=&VsDivision=&PORound=0&PlayerExperience=&PlayerPosition=&StarterBench=&GameScope=&ShotClockRange=&Conference=&Division=&College=&Country=&DraftPick=&DraftYear=&Height=&Weight=&TwoWay=0&ISTRound=&Season=2025&MeasureType=Base",
      "retrievedAt": "2026-10-06T03:31:53.470Z",
      "kind": "wnba:leaguedashplayerstats:base"
    },
    {
      "url": "https://stats.wnba.com/stats/leaguedashplayerstats?LeagueID=10&SeasonType=Regular+Season&PerMode=PerGame&PaceAdjust=N&PlusMinus=N&Rank=N&LastNGames=0&Month=0&OpponentTeamID=0&Period=0&TeamID=0&DateFrom=&DateTo=&GameSegment=&Location=&Outcome=&SeasonSegment=&VsConference=&VsDivision=&PORound=0&PlayerExperience=&PlayerPosition=&StarterBench=&GameScope=&ShotClockRange=&Conference=&Division=&College=&Country=&DraftPick=&DraftYear=&Height=&Weight=&TwoWay=0&ISTRound=&Season=2025&MeasureType=Advanced",
      "retrievedAt": "2026-10-06T03:32:14.772Z",
      "kind": "wnba:leaguedashplayerstats:advanced"
    },
    {
      "url": "https://stats.wnba.com/stats/leaguedashplayerstats?LeagueID=10&SeasonType=Regular+Season&PerMode=PerGame&PaceAdjust=N&PlusMinus=N&Rank=N&LastNGames=0&Month=0&OpponentTeamID=0&Period=0&TeamID=0&DateFrom=&DateTo=&GameSegment=&Location=&Outcome=&SeasonSegment=&VsConference=&VsDivision=&PORound=0&PlayerExperience=&PlayerPosition=&StarterBench=&GameScope=&ShotClockRange=&Conference=&Division=&College=&Country=&DraftPick=&DraftYear=&Height=&Weight=&TwoWay=0&ISTRound=&Season=2026&MeasureType=Base",
      "retrievedAt": "2026-10-06T03:32:16.543Z",
      "kind": "wnba:leaguedashplayerstats:base"
    },
    {
      "url": "https://stats.wnba.com/stats/leaguedashplayerstats?LeagueID=10&SeasonType=Regular+Season&PerMode=PerGame&PaceAdjust=N&PlusMinus=N&Rank=N&LastNGames=0&Month=0&OpponentTeamID=0&Period=0&TeamID=0&DateFrom=&DateTo=&GameSegment=&Location=&Outcome=&SeasonSegment=&VsConference=&VsDivision=&PORound=0&PlayerExperience=&PlayerPosition=&StarterBench=&GameScope=&ShotClockRange=&Conference=&Division=&College=&Country=&DraftPick=&DraftYear=&Height=&Weight=&TwoWay=0&ISTRound=&Season=2026&MeasureType=Advanced",
      "retrievedAt": "2026-10-06T03:32:18.012Z",
      "kind": "wnba:leaguedashplayerstats:advanced"
    },
    {
      "url": "https://query.wikidata.org/sparql",
      "retrievedAt": "2026-10-06T03:31:00.342Z",
      "kind": "wikidata:players"
    },
    {
      "url": "https://www.wnba.com/player/1642777/monique_akoa_makani",
      "retrievedAt": "2026-10-06T03:44:03.839Z",
      "kind": "wnba:headshot-pattern"
    }
  ],
  "match": {
    "method": "wnba-id",
    "confidence": "high",
    "notes": null
  }
}
```

### Kelsey Mitchell (wnba:1628909)

```json
{
  "id": "wnba:1628909",
  "name": "Kelsey Mitchell",
  "ids": {
    "wnba": "1628909",
    "wikidata": "Q50282206",
    "bref": "m/mitchke01w",
    "espn": null
  },
  "bio": {
    "birthdate": "1995-11-12",
    "height": "5-8",
    "position": "Guard",
    "college": "Ohio State",
    "country": "USA",
    "draft": {
      "year": 2018,
      "round": 1,
      "pick": 2
    }
  },
  "teams": [
    {
      "season": "2025",
      "teamId": 1611661325,
      "teamAbbr": "IND"
    },
    {
      "season": "2026",
      "teamId": 1611661325,
      "teamAbbr": "IND"
    }
  ],
  "stats": {
    "2025": {
      "teamAbbr": "IND",
      "GP": 44,
      "MIN": 31.4,
      "PTS": 20.2,
      "REB": 1.8,
      "OREB": 0.4,
      "DREB": 1.3,
      "AST": 3.4,
      "STL": 0.9,
      "BLK": 0.2,
      "TOV": 1.8,
      "PF": 2,
      "FGM": 7.2,
      "FGA": 15.7,
      "FG_PCT": 0.456,
      "FG3M": 2.5,
      "FG3A": 6.4,
      "FG3_PCT": 0.394,
      "FTM": 3.4,
      "FTA": 4.3,
      "FT_PCT": 0.784,
      "PLUS_MINUS": 3.4,
      "TS_PCT": 0.574,
      "EFG_PCT": 0.536,
      "USG_PCT": 0.264,
      "OFF_RATING": 107.8,
      "DEF_RATING": 101.8,
      "NET_RATING": 6,
      "AST_PCT": 0.188,
      "REB_PCT": 0.029,
      "PIE": 0.119
    },
    "2026": {
      "teamAbbr": "IND",
      "GP": 44,
      "MIN": 32.5,
      "PTS": 24.7,
      "REB": 1.7,
      "OREB": 0.5,
      "DREB": 1.2,
      "AST": 2.8,
      "STL": 1,
      "BLK": 0.1,
      "TOV": 1.6,
      "PF": 2.4,
      "FGM": 8.7,
      "FGA": 17,
      "FG_PCT": 0.509,
      "FG3M": 3.1,
      "FG3A": 6.8,
      "FG3_PCT": 0.45,
      "FTM": 4.3,
      "FTA": 5,
      "FT_PCT": 0.851,
      "PLUS_MINUS": 5.6,
      "TS_PCT": 0.642,
      "EFG_PCT": 0.6,
      "USG_PCT": 0.267,
      "OFF_RATING": 116.8,
      "DEF_RATING": 108.2,
      "NET_RATING": 8.7,
      "AST_PCT": 0.143,
      "REB_PCT": 0.027,
      "PIE": 0.136
    }
  },
  "awards": [],
  "headshotUrl": "https://cdn.wnba.com/headshots/wnba/latest/1040x760/1628909.png",
  "sources": [
    {
      "url": "https://stats.wnba.com/stats/commonteamroster?LeagueID=10&Season=2025&TeamID=1611661325",
      "retrievedAt": "2026-10-06T03:34:03.922Z",
      "kind": "wnba:commonteamroster"
    },
    {
      "url": "https://stats.wnba.com/stats/commonteamroster?LeagueID=10&Season=2026&TeamID=1611661325",
      "retrievedAt": "2026-10-06T03:35:16.794Z",
      "kind": "wnba:commonteamroster"
    },
    {
      "url": "https://stats.wnba.com/stats/commonplayerinfo?LeagueID=10&PlayerID=1628909",
      "retrievedAt": "2026-10-06T03:37:11.512Z",
      "kind": "wnba:commonplayerinfo"
    },
    {
      "url": "https://stats.wnba.com/stats/leaguedashplayerstats?LeagueID=10&SeasonType=Regular+Season&PerMode=PerGame&PaceAdjust=N&PlusMinus=N&Rank=N&LastNGames=0&Month=0&OpponentTeamID=0&Period=0&TeamID=0&DateFrom=&DateTo=&GameSegment=&Location=&Outcome=&SeasonSegment=&VsConference=&VsDivision=&PORound=0&PlayerExperience=&PlayerPosition=&StarterBench=&GameScope=&ShotClockRange=&Conference=&Division=&College=&Country=&DraftPick=&DraftYear=&Height=&Weight=&TwoWay=0&ISTRound=&Season=2025&MeasureType=Base",
      "retrievedAt": "2026-10-06T03:31:53.470Z",
      "kind": "wnba:leaguedashplayerstats:base"
    },
    {
      "url": "https://stats.wnba.com/stats/leaguedashplayerstats?LeagueID=10&SeasonType=Regular+Season&PerMode=PerGame&PaceAdjust=N&PlusMinus=N&Rank=N&LastNGames=0&Month=0&OpponentTeamID=0&Period=0&TeamID=0&DateFrom=&DateTo=&GameSegment=&Location=&Outcome=&SeasonSegment=&VsConference=&VsDivision=&PORound=0&PlayerExperience=&PlayerPosition=&StarterBench=&GameScope=&ShotClockRange=&Conference=&Division=&College=&Country=&DraftPick=&DraftYear=&Height=&Weight=&TwoWay=0&ISTRound=&Season=2025&MeasureType=Advanced",
      "retrievedAt": "2026-10-06T03:32:14.772Z",
      "kind": "wnba:leaguedashplayerstats:advanced"
    },
    {
      "url": "https://stats.wnba.com/stats/leaguedashplayerstats?LeagueID=10&SeasonType=Regular+Season&PerMode=PerGame&PaceAdjust=N&PlusMinus=N&Rank=N&LastNGames=0&Month=0&OpponentTeamID=0&Period=0&TeamID=0&DateFrom=&DateTo=&GameSegment=&Location=&Outcome=&SeasonSegment=&VsConference=&VsDivision=&PORound=0&PlayerExperience=&PlayerPosition=&StarterBench=&GameScope=&ShotClockRange=&Conference=&Division=&College=&Country=&DraftPick=&DraftYear=&Height=&Weight=&TwoWay=0&ISTRound=&Season=2026&MeasureType=Base",
      "retrievedAt": "2026-10-06T03:32:16.543Z",
      "kind": "wnba:leaguedashplayerstats:base"
    },
    {
      "url": "https://stats.wnba.com/stats/leaguedashplayerstats?LeagueID=10&SeasonType=Regular+Season&PerMode=PerGame&PaceAdjust=N&PlusMinus=N&Rank=N&LastNGames=0&Month=0&OpponentTeamID=0&Period=0&TeamID=0&DateFrom=&DateTo=&GameSegment=&Location=&Outcome=&SeasonSegment=&VsConference=&VsDivision=&PORound=0&PlayerExperience=&PlayerPosition=&StarterBench=&GameScope=&ShotClockRange=&Conference=&Division=&College=&Country=&DraftPick=&DraftYear=&Height=&Weight=&TwoWay=0&ISTRound=&Season=2026&MeasureType=Advanced",
      "retrievedAt": "2026-10-06T03:32:18.012Z",
      "kind": "wnba:leaguedashplayerstats:advanced"
    },
    {
      "url": "https://query.wikidata.org/sparql",
      "retrievedAt": "2026-10-06T03:31:00.342Z",
      "kind": "wikidata:players"
    },
    {
      "url": "https://www.wnba.com/player/1642777/monique_akoa_makani",
      "retrievedAt": "2026-10-06T03:44:03.839Z",
      "kind": "wnba:headshot-pattern"
    }
  ],
  "match": {
    "method": "wnba-id",
    "confidence": "high",
    "notes": null
  }
}
```
