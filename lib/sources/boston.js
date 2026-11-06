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

export async function boston({ maxPages = 12 } = {}) {
  const first = await get(`${BASE}/bid-listings?page=0`);
  if (first.status !== 200) throw new Error(`Boston ${first.status}`);
  const last = Math.min(maxPages - 1, Math.max(0, ...[...first.text.matchAll(/\?page=(\d+)/g)].map(m => +m[1])));
  const rest = await Promise.all(Array.from({ length: last }, (_, i) => get(`${BASE}/bid-listings?page=${i + 1}`).then(r => r.status === 200 ? parseBoston(r.text) : []).catch(() => [])));
  const seen = new Set();
  return [parseBoston(first.text), ...rest].flat().filter(b => !seen.has(b.id) && seen.add(b.id));
}
