// Decides whether a bid fits Todd's (apparel) or We Wrap Boston (graphics).
// Each rule: [label, regex]. A bid matches if its title/description hits a rule and no exclusion.

const TODDS = [
  ['uniforms', /\buniforms?\b/i],
  ['apparel', /\bapparel\b|\bclothing\b|\bgarments?\b/i],
  ['shirts', /\bt-?\s?shirts?\b|\btee shirts?\b|\bpolo(s| shirts?)?\b|\bsweatshirts?\b|\bhoodies?\b|\bshirts\b/i],
  ['outerwear', /\bjackets?\b|\bouterwear\b|\bvests?\b|\bfleece\b|\bwinter coats?\b/i],
  ['decoration', /embroider|screen[- ]?print|heat transfer|sublimat/i],
  ['team/athletic wear', /\bspirit wear\b|\bteam (wear|gear|apparel)\b|\bathletic (uniforms?|apparel|wear|equipment and apparel)\b|\bjerseys?\b|\bwarm-?ups?\b/i],
  ['promo items', /\bpromotional (items|products|merchandise|apparel)\b|\bbranded merchandise\b|\blogo (wear|items|merchandise)\b|\bhats?\b|\bcaps and\b/i],
];
const WWB = [
  ['vehicle graphics', /\bvehicle (wraps?|graphics|markings|decals|lettering|striping)\b|\bfleet (graphics|markings|decals|wraps?)\b|\bcruiser (graphics|markings|decals)\b|\bwraps?\b(?![- ]?around)/i],
  ['decals/vinyl', /\bdecals?\b|\bvinyl (graphics|lettering|decals|banners?|wraps?)\b|\bvinyl\b(?! (flooring|siding|composition|tile|fence|windows?))/i],
  ['window film', /\bwindow (film|tint(ing)?|graphics|frosting)\b|\bsecurity film\b|\bsolar film\b|\bprivacy film\b|\bfrosted film\b/i],
  ['wall graphics', /\bmurals?\b|\bwall (graphics|wraps?|covering|decals)\b|\bwallcovering\b|\benvironmental graphics\b|\bwayfinding\b|\binterior graphics\b/i],
  ['graphics', /\bgraphics?\b/i],
  ['floor graphics', /\bfloor (graphics|decals)\b/i],
  ['signage (check scope)', /\bsignage\b|\bbanners?\b|\bdisplays? (and|&) exhibits?\b|\btrade show\b|\blarge[- ]format print/i],
];
const EXCLUDE = /\b(pavement|road|line|traffic|street) (marking|striping|signs?)\b|\bgraphic design services only\b|\bGIS\b|\bgraphics (cards?|processing units?|workstations?)\b|\blaundry\b|\b(dry )?cleaning\b|\btailoring\b|\buniform rental\b|\bsealcoat|\bcourt (painting|resurfacing)\b|\b(conservation|restoration) of\b.*\bmural\b|\bsafety vests? only\b|\bvinyl (flooring|siding|composition)\b|\bauction\b/i;

export function classify(bid) {
  const text = `${bid.title} ${bid.description || ''}`;
  if (EXCLUDE.test(text)) return null;
  const hits = (rules) => rules.filter(([, re]) => re.test(text)).map(([l]) => l);
  const t = hits(TODDS), w = hits(WWB);
  if (!t.length && !w.length) return null;
  return { fit: t.length && w.length ? "Todd's + WWB" : t.length ? "Todd's" : 'WWB', why: [...t, ...w] };
}
