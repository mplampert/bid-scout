import { get, decode, mdy } from '../http.js';

const BASE = 'https://www.boston.gov';

export function parseBoston(html) {
  const out = [];
  for (const row of html.split('<div class="views-row">').slice(1)) {
    const ev = decode((row.match(/field-event-project-number[\s\S]*?<div>([\s\S]*?)<\/div>/) || [])[1] || '');
    const a = row.match(/<a href="(\/bid-listings\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!a) continue;
    const due = decode((row.match(/Due:<\/span>\s*<span class="dl-d">([\s\S]*?)<\/span>/) || [])[1] || '');
    const dept = (row.match(/class="di-tt"[^>]*title="([^"]+)"|title="([^"]+)" class="di-tt"/) || []).slice(1).find(Boolean) || '';
    out.push({ source: 'City of Boston', id: `Boston-${ev || a[1]}`, title: decode(a[2]), org: `City of Boston${dept ? ' — ' + decode(dept) : ''}`,
      bidNo: ev, due: mdy(due), dueText: due, url: BASE + a[1] });
  }
  return out;
}

export async function boston({ maxPages = 15 } = {}) {
  let bids = [];
  for (let p = 0; p < maxPages; p++) {
    const r = await get(`${BASE}/bid-listings?page=${p}`);
    if (r.status !== 200) { if (p === 0) throw new Error(`Boston ${r.status}`); break; }
    const rows = parseBoston(r.text);
    if (!rows.length) break;
    bids = bids.concat(rows);
    if (!r.text.includes(`?page=${p + 1}`)) break;
  }
  return bids;
}
