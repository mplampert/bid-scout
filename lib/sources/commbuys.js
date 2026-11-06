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

// All open bids, newest first. maxRows caps the pull.
export async function commbuys({ maxRows = 1200, debug } = {}) {
  const jar = new Jar();
  const first = await get(`${PAGE}?openBids=true`, { jar });
  if (first.status !== 200) throw new Error(`COMMBUYS ${first.status}`);
  const total = +(first.text.match(/rowCount:(\d+)/) || [])[1] || 0;
  let bids = parseRows(first.text);
  const vs = (first.text.match(/id="j_id1:javax\.faces\.ViewState:0" value="([^"]+)"/) || [])[1];
  const want = Math.min(total, maxRows);
  const diag = { total, firstPage: bids.length, pages: [] };
  for (let start = bids.length; start < want; start += 200) {
    const r = await post(PAGE, {
      'javax.faces.partial.ajax': 'true',
      'javax.faces.source': 'bidSearchResultsForm:bidResultId',
      'javax.faces.partial.execute': 'bidSearchResultsForm:bidResultId',
      'javax.faces.partial.render': 'bidSearchResultsForm:bidResultId',
      'bidSearchResultsForm:bidResultId': 'bidSearchResultsForm:bidResultId',
      'bidSearchResultsForm:bidResultId_pagination': 'true',
      'bidSearchResultsForm:bidResultId_first': String(start),
      'bidSearchResultsForm:bidResultId_rows': '200',
      'bidSearchResultsForm:bidResultId_skipChildren': 'true',
      'bidSearchResultsForm:bidResultId_encodeFeature': 'true',
      'bidSearchResultsForm': 'bidSearchResultsForm',
      'javax.faces.ViewState': vs,
    }, { jar, headers: {
      'Faces-Request': 'partial/ajax', 'X-Requested-With': 'XMLHttpRequest',
      'X-XSRF-TOKEN': jar.get('XSRF-TOKEN') || '', Origin: BASE, Referer: `${PAGE}?openBids=true`,
      accept: 'application/xml, text/xml, */*; q=0.01',
    } });
    const rows = parseRows(r.text);
    diag.pages.push({ start, status: r.status, rows: rows.length, ...(debug && !rows.length ? { sample: r.text.slice(0, 1500) } : {}) });
    if (!rows.length) break;
    bids = bids.concat(rows);
  }
  const seen = new Set();
  bids = bids.filter(b => !seen.has(b.id) && seen.add(b.id));
  return debug ? { bids, diag } : bids;
}
