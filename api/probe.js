// Temporary: checks what each bid source returns from a Vercel server. Removed after the build.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const T = {
  commbuys: 'https://www.commbuys.com/bso/view/search/external/advancedSearchBid.xhtml?openBids=true',
  bidnet: 'https://www.bidnetdirect.com/massachusetts/solicitations/open-bids?keywords=uniforms',
  boston: 'https://www.boston.gov/bid-listings',
  mbta: 'https://www.mbta.com/business/mbta-solicitations-overview',
  beverly: 'https://www.beverlyma.gov/Bids.aspx',
  salem: 'https://www.salemma.gov/bids.aspx',
  peabody: 'https://peabody-ma.gov/bids.aspx',
  danvers: 'https://www.danversma.gov/bids.aspx',
  lynn: 'https://www.lynnma.gov/bids.aspx',
  gloucester: 'https://gloucester-ma.gov/bids.aspx',
  marblehead: 'https://www.marblehead.org/bids.aspx',
  swampscott: 'https://www.swampscottma.gov/bids.aspx',
};
export default async function handler(req, res) {
  const only = req.query.t, raw = req.query.raw;
  const out = {};
  await Promise.all(Object.entries(T).filter(([k]) => !only || only === k).map(async ([k, u]) => {
    try {
      const r = await fetch(u, { headers: { 'user-agent': UA, accept: 'text/html,*/*' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
      const t = await r.text();
      out[k] = { status: r.status, url: r.url, len: t.length, title: (t.match(/<title[^>]*>([^<]*)/i) || [])[1]?.trim(),
        body: raw ? t.slice(Number(req.query.o || 0), Number(req.query.o || 0) + 90000)
                  : t.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 500) };
    } catch (e) { out[k] = { error: String(e) }; }
  }));
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(out, null, 1));
}
