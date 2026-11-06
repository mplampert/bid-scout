// Temporary: checks candidate town bid pages. Removed after the build.
import { get } from '../lib/http.js';
import { parseCivicPlus } from '../lib/sources/civicplus.js';
const C = {
  Peabody: ['https://www.peabody-ma.gov', 'https://peabody-ma.gov'], Lynn: ['https://www.lynnma.gov'], Danvers: ['https://www.danversma.gov'],
  Marblehead: ['https://www.marblehead.org'], Wenham: ['https://www.wenhamma.gov'], Hamilton: ['https://www.hamiltonma.gov'],
  Ipswich: ['https://www.ipswichma.gov'], Manchester: ['https://www.manchester.ma.us'], Rockport: ['https://www.rockportma.gov'],
  Newburyport: ['https://www.cityofnewburyport.com'], Saugus: ['https://www.saugus-ma.gov'], Revere: ['https://www.revere.org'],
  Medford: ['https://www.medfordma.org'], Malden: ['https://www.cityofmalden.org'], Melrose: ['https://www.cityofmelrose.org'],
  Wakefield: ['https://www.wakefield.ma.us'], Reading: ['https://www.readingma.gov'], Woburn: ['https://www.woburnma.gov'],
  Lexington: ['https://www.lexingtonma.gov'], Arlington: ['https://www.arlingtonma.gov'], Topsfield: ['https://www.topsfield-ma.gov'],
  Middleton: ['https://www.middletonma.gov'], NorthAndover: ['https://www.northandoverma.gov'], Andover: ['https://andoverma.gov'],
  Methuen: ['https://www.cityofmethuen.net'], Haverhill: ['https://www.cityofhaverhill.com'], Lawrence: ['https://www.cityoflawrence.com'],
  Everett: ['https://cityofeverett.com'], Chelsea: ['https://www.chelseama.gov'], Somerville: ['https://www.somervillema.gov'],
  Cambridge: ['https://www.cambridgema.gov'], Quincy: ['https://www.quincyma.gov'], Burlington: ['https://www.burlington.org'],
  Winchester: ['https://www.winchester.us'], Stoneham: ['https://www.stoneham-ma.gov'], Lynnfield: ['https://www.town.lynnfield.ma.us'],
  Nahant: ['https://nahantma.gov'], Amesbury: ['https://www.amesburyma.gov'], Rowley: ['https://www.townofrowley.org'], Essex: ['https://www.essexma.org'],
};
export default async function handler(req, res) {
  const out = {};
  await Promise.all(Object.entries(C).map(async ([t, bases]) => {
    for (const b of bases) { try { const r = await get(`${b}/Bids.aspx`, { timeout: 15000 }); const civic = /listItemsRow bid|bidItems|Bid Postings/i.test(r.text); out[t] = { base: b, status: r.status, civic, open: civic ? parseCivicPlus(r.text, t, b).length : null, final: r.url }; if (civic) break; } catch (e) { out[t] = { base: b, error: String(e).slice(0, 80) }; } }
  }));
  res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(out, null, 1));
}
