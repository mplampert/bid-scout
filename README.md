# bid-scout

Finds open public bids that fit **Todd's Sporting Goods** (uniforms, apparel, embroidery, screen printing) and **We Wrap Boston** (vehicle, wall, window and floor graphics, decals, window film).

Runs on Vercel; no computer needs to be on. `GET /api/bids` scans live and returns JSON (about a minute).

**Sources**
- COMMBUYS public bid search: all open bids (~870), paged across parallel sessions.
- City of Boston bid listings.
- Town bid pages on CivicPlus: Beverly, Salem, Gloucester, Swampscott, Hamilton, Topsfield, Saugus, Wakefield, Melrose (`lib/sources/civicplus.js`).

**Not covered:** BidNet Direct (blocks automated access); Danvers, Marblehead, Newburyport, Medford, Chelsea, Everett, Arlington town pages (block automated access); anything behind a COMMBUYS seller login. Most of those towns also post on COMMBUYS.

**Matching** lives in `lib/match.js` (keyword rules plus exclusions). Each bid comes back with `fit` (Todd's / WWB / both), `why` (which rules hit), `due` and `daysLeft`.

**Who reads it:** Matt's morning brief calls `/api/bids` daily and adds each new bid as a checklist row (`bid-<id>`), so a bid is only ever shown once.
