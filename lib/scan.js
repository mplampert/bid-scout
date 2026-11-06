import { commbuys } from './sources/commbuys.js';
import { boston } from './sources/boston.js';
import { civicplus } from './sources/civicplus.js';
import { classify } from './match.js';

// Runs every source, keeps open bids that fit Todd's or WWB and are due today or later.
export async function scan({ maxCommbuys = 1500 } = {}) {
  const t0 = Date.now();
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  const sources = {}, errors = [];
  const run = async (name, fn) => {
    const s = Date.now();
    try { const r = await fn(); const bids = Array.isArray(r) ? r : r.bids; if (r.errors) errors.push(...r.errors); sources[name] = { ok: true, scanned: bids.length, ms: Date.now() - s }; return bids; }
    catch (e) { errors.push(`${name}: ${e.message}`); sources[name] = { ok: false, error: e.message, ms: Date.now() - s }; return []; }
  };
  const all = (await Promise.all([
    run('COMMBUYS', () => commbuys({ maxRows: maxCommbuys })),
    run('Boston', () => boston()),
    run('Town sites', () => civicplus()),
  ])).flat();
  const matches = [];
  for (const b of all) {
    if (b.due && b.due < today) continue;
    const c = classify(b);
    if (c) matches.push({ ...b, ...c, daysLeft: b.due ? Math.round((Date.parse(b.due) - Date.parse(today)) / 864e5) : null });
  }
  matches.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
  return { generatedAt: new Date().toISOString(), today, ms: Date.now() - t0, scanned: all.length, count: matches.length, sources, errors, bids: matches };
}
