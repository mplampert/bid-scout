import { scan } from '../lib/scan.js';

// GET /api/bids — every open public bid that fits Todd's (apparel) or We Wrap Boston (graphics).
// Sources: COMMBUYS (all open bids), City of Boston, North Shore town bid pages.
export default async function handler(req, res) {
  const r = await scan({ maxCommbuys: +(req.query.max || 1500) });
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'private, no-store');
  res.end(JSON.stringify(r, null, 1));
}
