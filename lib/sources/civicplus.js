import { get, decode, mdy } from '../http.js';

// Town sites built on CivicPlus/CivicEngage share the same Bid Postings page (Bids.aspx).
export const TOWNS = {
  Beverly: 'https://www.beverlyma.gov',
  Salem: 'https://www.salemma.gov',
  Gloucester: 'https://gloucester-ma.gov',
  Swampscott: 'https://www.swampscottma.gov',
  Hamilton: 'https://www.hamiltonma.gov',
  Topsfield: 'https://www.topsfield-ma.gov',
  Saugus: 'https://www.saugus-ma.gov',
  Wakefield: 'https://www.wakefieldma.gov',
  Melrose: 'https://www.cityofmelrose.org',
};

export function parseCivicPlus(html, town, base) {
  const out = [];
  const blocks = html.split(/<div class="listItemsRow bid/).slice(1);
  for (const b of blocks) {
    const link = b.match(/<a href="(bids\.aspx\?bidID=(\d+))">([\s\S]*?)<\/a>/i);
    if (!link) continue;
    const no = decode((b.match(/<strong>Bid No\.<\/strong>([\s\S]*?)<\/span>/i) || [])[1] || '');
    const spans = [...b.split(/<div class="bidStatus">/)[0].matchAll(/<span>([\s\S]*?)<\/span>/g)].map(m => decode(m[1]));
    const desc = spans.length > 1 ? spans[spans.length - 1] : '';
    const st = b.split(/<div class="bidStatus">/)[1] || '';
    const vals = [...st.matchAll(/<span>([\s\S]*?)<\/span>/g)].map(m => decode(m[1]));
    const title = decode(link[3]);
    if (/^addendum/i.test(title)) continue; // addenda are separate rows for the same bid
    out.push({
      source: `${town} (town site)`, id: `${town}-${link[2]}`, title, org: `City/Town of ${town}`,
      description: desc && desc !== title ? desc : '', bidNo: no,
      status: vals[0] || '', due: mdy(vals[1] || ''), dueText: vals[1] || '',
      url: `${base}/${link[1]}`,
    });
  }
  return out.filter(b => /open/i.test(b.status));
}

export async function civicplus({ towns = TOWNS } = {}) {
  const results = await Promise.allSettled(Object.entries(towns).map(async ([town, base]) => {
    const r = await get(`${base}/Bids.aspx`);
    if (r.status !== 200) throw new Error(`${town} ${r.status}`);
    return parseCivicPlus(r.text, town, base);
  }));
  const bids = [], errors = [];
  results.forEach((r, i) => r.status === 'fulfilled' ? bids.push(...r.value) : errors.push(`${Object.keys(towns)[i]}: ${r.reason.message}`));
  return { bids, errors };
}
