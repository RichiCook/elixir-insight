/**
 * Case Study copy model + standalone HTML renderer.
 *
 * The generated HTML is fully self-contained: the hero image is inlined as a
 * base64 data URL and fonts load from the Google Fonts CDN, so the downloaded
 * file is portable with no external asset dependencies.
 */

export interface CaseStudyCopy {
  name: string;
  tagline: string;
  category: string;
  sector: string;
  client: string;
  intro: string;
  /** Exactly three paragraphs: naming/strategy, design story, finishes/details. */
  body: string[];
  closing: string;
  services: string[];
}

/** Minimal HTML escaping for text interpolated into the template. */
function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function slugify(s: string): string {
  return (s || 'case-study')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'case-study';
}

/**
 * Render the case-study page.
 * @param copy   The editorial copy fields.
 * @param heroDataUri A `data:` URL (or remote URL) for the hero image.
 * @param gridDataUris Optional extra images for the grid; falls back to the hero.
 */
export function buildCaseStudyHtml(
  copy: CaseStudyCopy,
  heroDataUri: string,
  gridDataUris: string[] = [],
): string {
  const grid = gridDataUris.length ? gridDataUris : [heroDataUri];
  const servicesLi = (copy.services ?? []).map((s) => `<li>${esc(s)}</li>`).join('');
  const bodyP = (copy.body ?? []).map((p) => `<p>${esc(p)}</p>`).join('');
  const gridCells = Array.from({ length: Math.max(6, grid.length) }, (_, i) => {
    const src = grid[i % grid.length];
    const wide = i % 3 === 2 ? ' wide' : '';
    return `<div class="g${wide}"><img src="${src}" alt=""></div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(copy.name)} — Case Study</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  :root{--ink:#111;--muted:#6b6b6b;--line:#e4e2dd;--paper:#f6f4ef;--maxw:1120px}
  *{box-sizing:border-box} body{margin:0;font-family:'Inter',system-ui,sans-serif;color:var(--ink);background:var(--paper);-webkit-font-smoothing:antialiased}
  .hero{position:relative;width:100%;height:78vh;min-height:480px;overflow:hidden;background:#ddd}
  .hero img{width:100%;height:100%;object-fit:cover;display:block}
  .hero .cap{position:absolute;left:0;right:0;bottom:0;padding:48px 6vw;background:linear-gradient(to top,rgba(0,0,0,.5),transparent)}
  .hero h1{font-family:'Cormorant Garamond';font-weight:300;color:#fff;font-size:clamp(46px,8vw,104px);line-height:.95;margin:0}
  .hero p{color:rgba(255,255,255,.92);font-size:clamp(15px,2vw,22px);font-weight:300;margin:10px 0 0;letter-spacing:.03em}
  .wrap{max-width:var(--maxw);margin:0 auto;padding:0 6vw}
  .cat{display:inline-block;margin:42px 0 0;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);border:1px solid var(--line);border-radius:30px;padding:6px 16px}
  .lede{font-family:'Cormorant Garamond';font-weight:300;font-size:clamp(22px,2.6vw,32px);line-height:1.35;margin:30px 0 0;max-width:880px}
  .body{display:grid;grid-template-columns:1fr 260px;gap:60px;margin:46px 0 0}
  .prose p{font-size:16px;line-height:1.75;color:#2a2a2a;font-weight:300;margin:0 0 22px;max-width:620px}
  .meta h4{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin:0 0 8px;font-weight:600}
  .meta .blk{margin-bottom:26px} .meta .v{font-weight:400;line-height:1.5}
  .meta ul{list-style:none;margin:0;padding:0} .meta li{padding:4px 0;border-bottom:1px solid var(--line);color:#333;font-size:13px}
  .grid{margin:72px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .grid .g{overflow:hidden;background:#e7e4dd;aspect-ratio:3/4} .grid .g.wide{grid-column:1/3;aspect-ratio:16/9}
  .grid .g img{width:100%;height:100%;object-fit:cover;display:block}
  .closing{font-family:'Cormorant Garamond';font-style:italic;font-weight:300;font-size:clamp(22px,3vw,38px);text-align:center;margin:90px auto 0;max-width:760px;line-height:1.4}
  .foot{margin:80px auto 0;border-top:1px solid var(--line);padding:30px 6vw 70px;display:flex;justify-content:space-between;color:var(--muted);font-size:12px;max-width:var(--maxw)}
  @media(max-width:900px){.body{grid-template-columns:1fr;gap:34px}}
</style>
</head>
<body>
  <div class="hero">
    <img src="${heroDataUri}" alt="">
    <div class="cap"><h1>${esc(copy.name)}</h1><p>${esc(copy.tagline)}</p></div>
  </div>
  <div class="wrap">
    <span class="cat">${esc(copy.category)}</span>
    <p class="lede">${esc(copy.intro)}</p>
    <div class="body">
      <div class="prose">${bodyP}</div>
      <div class="meta">
        <div class="blk"><h4>Sector</h4><div class="v">${esc(copy.sector)}</div></div>
        <div class="blk"><h4>Client</h4><div class="v">${esc(copy.client)}</div></div>
        <div class="blk"><h4>Services</h4><ul>${servicesLi}</ul></div>
      </div>
    </div>
    <div class="grid">${gridCells}</div>
    <div class="closing">${esc(copy.closing)}</div>
  </div>
  <div class="foot"><span>Case study generated from product photography</span><span>${esc(copy.client)}</span></div>
</body>
</html>`;
}
