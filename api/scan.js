import { scan } from '../lib/scan.js';
export default async function handler(req, res) {
  const r = await scan({ maxCommbuys: +(req.query.max || 1200) });
  res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(r, null, 1));
}
