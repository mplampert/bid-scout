export const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

// Minimal cookie jar: keeps name=value pairs across requests to one site.
export class Jar {
  constructor() { this.c = new Map(); }
  take(res) { for (const s of res.headers.getSetCookie?.() || []) { const [kv] = s.split(';'); const i = kv.indexOf('='); this.c.set(kv.slice(0, i).trim(), kv.slice(i + 1)); } }
  get(name) { return this.c.get(name); }
  toString() { return [...this.c].map(([k, v]) => `${k}=${v}`).join('; '); }
}

export async function get(url, { jar, headers = {}, timeout = 25000 } = {}) {
  const h = { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,*/*', ...headers };
  if (jar?.c.size) h.cookie = jar.toString();
  const r = await fetch(url, { headers: h, redirect: 'follow', signal: AbortSignal.timeout(timeout) });
  jar?.take(r);
  return { status: r.status, url: r.url, text: await r.text() };
}

export async function post(url, form, { jar, headers = {}, timeout = 30000 } = {}) {
  const h = { 'user-agent': UA, 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8', ...headers };
  if (jar?.c.size) h.cookie = jar.toString();
  const r = await fetch(url, { method: 'POST', headers: h, body: new URLSearchParams(form).toString(), redirect: 'follow', signal: AbortSignal.timeout(timeout) });
  jar?.take(r);
  return { status: r.status, url: r.url, text: await r.text() };
}

export const decode = (s = '') => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&#039;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/\s+/g, ' ').trim();

// "11/26/2026 11:00 AM" -> ISO date "2026-11-26" (date only, Eastern).
export function mdy(s = '') {
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : null;
}
