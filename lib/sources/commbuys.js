import { Jar, get, post, decode, mdy } from '../http.js';

const BASE = 'https://www.commbuys.com';
const PAGE = `${BASE}/bso/view/search/external/advancedSearchBid.xhtml`;

function parseRows(html) {
  const out = [];
  for (const tr of html.match(/<tr data-ri="\d+"[\s\S]*?<\/tr>/g) || []) {
    const td = [...tr.matchAll(/<td role="gridcell"[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1]);
    if (td.length < 10) continue;
    const id = decode(td[0]);
    out.push({
      source: 'COMMBUYS',
      id,
      title: decode(td[6]),
      org: decode(td[2]),
      buyer: decode(td[5]),
      due: mdy(td[7]),
      dueText: decode(td[7]),
      status: decode(td[9]),
      url: `${BASE}/bso/external/bidDetail.sda?docId=${encodeURIComponent(id)}&external=true&parentUrl=close`,
    });
  }
  return out;
}

function pageForm(start, vs) {
  return {
    'javax.faces.partial.ajax': 'true',
    'javax.faces.source': 'bidSearchResultsForm:bidResultId',
    'javax.faces.partial.execute': 'bidSearchResultsForm:bidResultId',
    'javax.faces.partial.render': 'bidSearchResultsForm:bidResultId',
    'bidSearchResultsForm:bidResultId': 'bidSearchResultsForm:bidResultId',
    'bidSearchResultsForm:bidResultId_pagination': 'true',
    'bidSearchResultsForm:bidResultId_first': String(start),
    'bidSearchResultsForm:bidResultId_rows': '25',
    'bidSearchResultsForm:bidResultId_encodeFeature': 'true',
    'bidSearchResultsForm': 'bidSearchResultsForm',
    'javax.faces.ViewState': vs,
  };
}

async function session() {
  const jar = new Jar();
  const r = await get(`${PAGE}?openBids=true`, { jar });
  if (r.status !== 200) throw new Error(`COMMBUYS ${r.status}`);
  const vs = (r.text.match(/id="j_id1:javax\.faces\.ViewState:0" value="([^"]+)"/) || [])[1];
  if (!vs) throw new Error('COMMBUYS page layout changed (no ViewState)');
  return { jar, vs, total: +(r.text.match(/rowCount:(\d+)/) || [])[1] || 0, rows: parseRows(r.text) };
}

async function page(s, start) {
  const r = await post(PAGE, pageForm(start, s.vs), { jar: s.jar, headers: {
    'Faces-Request': 'partial/ajax', 'X-Requested-With': 'XMLHttpRequest',
    'X-XSRF-TOKEN': s.jar.get('XSRF-TOKEN') || '', Origin: BASE, Referer: `${PAGE}?openBids=true`,
    accept: 'application/xml, text/xml, */*; q=0.01',
  } });
  return parseRows(r.text);
}

// Open bids, newest first (COMMBUYS lists the most recently posted first).
// maxRows caps how deep to go; the work is split across a few parallel sessions to finish fast.
export async function commbuys({ maxRows = 1500, sessions = 6, debug } = {}) {
  const s0 = await session();
  const want = Math.min(s0.total, maxRows);
  const starts = [];
  for (let st = 25; st < want; st += 25) starts.push(st);
  const groups = Array.from({ length: Math.min(sessions, starts.length) }, (_, i) => starts.filter((_, j) => j % sessions === i));
  const pageErrors = [];
  const chunks = await Promise.all(groups.map(async (g, gi) => {
    const s = gi === 0 ? s0 : await session();
    const got = [];
    for (const st of g) {
      const rows = await page(s, st).catch(e => (pageErrors.push(`page ${st}: ${e.message}`), []));
      if (!rows.length) { pageErrors.push(`page ${st}: empty`); continue; }
      got.push(...rows);
    }
    return got;
  }));
  const seen = new Set();
  const bids = [...s0.rows, ...chunks.flat()].filter(b => !seen.has(b.id) && seen.add(b.id));
  if (pageErrors.length > 2) throw new Error(`COMMBUYS paging failed (${pageErrors.slice(0, 3).join('; ')})`);
  return debug ? { bids, diag: { total: s0.total, want, pageErrors } } : bids;
}
