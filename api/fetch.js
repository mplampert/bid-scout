// Temporary dev passthrough for studying bid pages. Allowlisted hosts only. Removed after the build.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const ALLOW = /(^|\.)(commbuys\.com|bidnetdirect\.com|boston\.gov|mbta\.com|beverlyma\.gov|salemma\.gov|gloucester-ma\.gov|swampscottma\.gov|peabody-ma\.gov|lynnma\.gov|danversma\.gov|marblehead\.org|marbleheadma\.gov|wenhamma\.gov|hamiltonma\.gov|ipswichma\.gov|lexingtonma\.gov|arlingtonma\.gov|fallriverma\.gov|salemstate\.edu|northshore\.edu|cityofpeabody\.com|lynnma\.gov|mass\.gov)$/;
export default async function handler(req, res) {
  const q = req.method === 'POST' ? JSON.parse(await new Promise(r => { let d=''; req.on('data', c => d += c); req.on('end', () => r(d || '{}')); })) : req.query;
  let u; try { u = new URL(q.u); } catch { res.statusCode = 400; return res.end('bad url'); }
  if (!ALLOW.test(u.hostname)) { res.statusCode = 403; return res.end('host not allowed'); }
  const h = { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,*/*' };
  if (q.cookie) h.cookie = q.cookie;
  if (q.ctype) h['content-type'] = q.ctype;
  if (q.headers) Object.assign(h, typeof q.headers === 'string' ? JSON.parse(q.headers) : q.headers);
  const r = await fetch(u, { method: q.method || 'GET', headers: h, body: q.body, redirect: q.follow === '0' ? 'manual' : 'follow', signal: AbortSignal.timeout(25000) });
  const t = await r.text();
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify({ status: r.status, url: r.url, cookies: r.headers.getSetCookie?.() || [], location: r.headers.get('location'), len: t.length, body: t }));
}
