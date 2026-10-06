// Discover the official headshot URL pattern from a wnba.com player page,
// then verify it with HEAD requests. Stores URLs and HEAD results only.
import { fetchText, head } from './http.mjs';
import { writeEnvelope } from './envelope.mjs';

// An ID that cannot be a real player, used to fingerprint the CDN's fallback image.
// The CDN answers 200 for any ID, so status alone does not prove a real photo exists.
const BOGUS_ID = '999999999';

export async function discoverHeadshots({ samplePlayer, verifyIds, userAgent, outFile }) {
  const pageUrl = `https://www.wnba.com/player/${samplePlayer.PERSON_ID}/${samplePlayer.PLAYER_SLUG}`;
  const page = await fetchText(pageUrl, { headers: { 'User-Agent': userAgent, Accept: 'text/html' } });
  const refs = [...new Set(page.text.match(/https?:\/\/[^"'\s)\\]*headshot[^"'\s)\\]*/gi) ?? [])];
  const withId = refs.filter((u) => u.includes(String(samplePlayer.PERSON_ID)));
  const pattern = withId[0]?.replace(String(samplePlayer.PERSON_ID), '{personId}') ?? null;

  let placeholder = null;
  const verification = [];
  if (pattern) {
    const p = await head(pattern.replace('{personId}', BOGUS_ID), { headers: { 'User-Agent': userAgent } });
    placeholder = { personId: BOGUS_ID, status: p.status, etag: p.headers?.etag ?? null, contentLength: p.headers?.['content-length'] ?? null };
    console.log(`  HEAD bogus id ${BOGUS_ID} -> ${p.status} etag ${placeholder.etag}`);
    for (const id of verifyIds) {
      const u = pattern.replace('{personId}', id);
      const r = await head(u, { headers: { 'User-Agent': userAgent } });
      const etag = r.headers?.etag ?? null;
      verification.push({
        personId: id,
        url: u,
        status: r.status,
        contentType: r.headers?.['content-type'] ?? null,
        contentLength: r.headers?.['content-length'] ?? null,
        etag,
        isPlaceholder: !!placeholder.etag && etag === placeholder.etag,
      });
      console.log(`  HEAD ${u} -> ${r.status}${verification.at(-1).isPlaceholder ? ' (placeholder)' : ''}`);
    }
  }
  const data = { pageStatus: page.status, headshotRefsFound: refs, pattern, placeholder, verification };
  await writeEnvelope(outFile, {
    source: 'www.wnba.com player page + cdn HEAD checks',
    url: pageUrl,
    params: { samplePersonId: samplePlayer.PERSON_ID, bogusId: BOGUS_ID },
    data,
  });
  return { pageUrl, pattern, placeholder, verification };
}
