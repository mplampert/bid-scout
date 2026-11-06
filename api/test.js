// Temporary: runs one source and reports. Removed after the build.
import { commbuys } from '../lib/sources/commbuys.js';
export default async function handler(req, res) {
  const t0 = Date.now(); let out;
  try { const r = await commbuys({ debug: true, maxRows: +(req.query.max || 1200) }); out = { ms: Date.now() - t0, count: r.bids.length, diag: r.diag, sample: r.bids.slice(0, 3), last: r.bids.slice(-2) }; }
  catch (e) { out = { error: String(e), ms: Date.now() - t0 }; }
  res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(out, null, 1));
}
