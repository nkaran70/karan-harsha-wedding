/* Hand-embroidery, drawn procedurally.
   French-knot marigolds, bullion-knot roses, satin-stitch leaves, jasmine buds,
   strung pearls, kundan stones and gold zari couching, all as SVG. A shared
   emboss filter lights the thread so it reads as raised off the linen. */
window.Art = (() => {
  'use strict';

  const TAU = Math.PI * 2;
  const DEG = 180 / Math.PI;
  const n = v => Math.round(v * 100) / 100;
  const rng = seed => () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const use = (id, x, y, s = 1, r = 0) =>
    `<use href="#${id}" transform="translate(${n(x)} ${n(y)})${r ? ` rotate(${n(r)})` : ''}${s !== 1 ? ` scale(${n(s)})` : ''}"/>`;
  const pearl = (x, y, r = 1.8) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="url(#e-pearl)"/>`;
  // Couched gold cord: a soft shadow beneath, the cord itself drawn on as it is "stitched".
  const cord = d => `<path d="${d}" class="zari-shadow" transform="translate(.8 1.5)" pathLength="1"/><path d="${d}" class="zari" pathLength="1"/>`;
  const svg = (cls, vb, body, extra = '') => `<svg class="art ${cls}" viewBox="${vb}" ${extra} aria-hidden="true" focusable="false">${body}</svg>`;
  const raised = body => `<g filter="url(#e-emb)">${body}</g>`;

  /* ── Geometry ── */
  const quadPt = (a, c, b, t) => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
  const cubicPt = (a, b, c, d, t) => {
    const u = 1 - t;
    return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]];
  };
  // Even spacing along a polyline: [x, y, tangent angle in degrees]
  function resample(poly, step, offset = 0) {
    const out = [];
    let need = offset;
    for (let i = 1; i < poly.length; i++) {
      const [x0, y0] = poly[i - 1], [x1, y1] = poly[i];
      const seg = Math.hypot(x1 - x0, y1 - y0);
      const ang = Math.atan2(y1 - y0, x1 - x0) * DEG;
      let pos = 0;
      while (need <= seg - pos + 1e-9) {
        pos += need;
        const t = seg ? pos / seg : 0;
        out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, ang]);
        need = step;
      }
      need -= seg - pos;
    }
    return out;
  }
  const swagPoly = (x1, y1, x2, y2, sag) => {
    const c = [(x1 + x2) / 2, (y1 + y2) / 2 + sag * 2];
    return Array.from({length: 121}, (_, i) => quadPt([x1, y1], c, [x2, y2], i / 120));
  };
  const swag = (x1, y1, x2, y2, sag, step, offset) => resample(swagPoly(x1, y1, x2, y2, sag), step, offset);
  const cubicPoly = (a, b, c, d, steps = 80) => Array.from({length: steps + 1}, (_, i) => cubicPt(a, b, c, d, i / steps));
  const archPoly = (L, R, base, shoulder, apex, belly = .62) => {
    const cx = (L + R) / 2, half = (R - L) / 2;
    return [
      [L, base], [L, shoulder],
      ...cubicPoly([L, shoulder], [L, shoulder - half * belly], [cx - half * .22, apex + half * .45], [cx, apex]).slice(1),
      ...cubicPoly([cx, apex], [cx + half * .22, apex + half * .45], [R, shoulder - half * belly], [R, shoulder]).slice(1),
      [R, base]
    ];
  };
  const polyPath = poly => 'M' + poly.map(p => `${n(p[0])} ${n(p[1])}`).join('L');
  const archPath = (L, R, base, shoulder, apex, belly = .62) => {
    const cx = (L + R) / 2, half = (R - L) / 2;
    return `M${L} ${base}V${shoulder}C${L} ${n(shoulder - half * belly)} ${n(cx - half * .22)} ${n(apex + half * .45)} ${cx} ${apex}` +
      `C${n(cx + half * .22)} ${n(apex + half * .45)} ${R} ${n(shoulder - half * belly)} ${R} ${shoulder}V${base}`;
  };

  /* ── Shared defs: thread colours, satin texture, lighting ── */
  const radial = (id, stops, fx = .34, fy = .3) =>
    `<radialGradient id="${id}" fx="${fx}" fy="${fy}" r=".64">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`;
  const linear = (id, stops, x2 = 1, y2 = 1, extra = '') =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}" ${extra}>${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;

  function marigold(id, main, rim, seed) {
    const r = rng(seed);
    let s = `<g id="${id}">`;
    [[8.5, 21, 1.5, rim], [6.5, 16, 1.5, main], [4.5, 11, 1.45, main], [2.5, 6, 1.35, main], [0, 1, 1.45, rim]].forEach(([rad, count, kr, g]) => {
      const off = r() * TAU;
      for (let i = 0; i < count; i++) {
        const a = off + i / count * TAU + (r() - .5) * .3;
        const rr = rad + (r() - .5) * .9;
        s += `<circle cx="${n(Math.cos(a) * rr)}" cy="${n(Math.sin(a) * rr)}" r="${n(kr * (.86 + r() * .3))}" fill="url(#${g})"/>`;
      }
    });
    return s + '</g>';
  }

  function rose(id, shades, seed) {
    const r = rng(seed);
    let s = `<g id="${id}" fill="none" stroke-linecap="round">`;
    [[6.2, 5, 2.4, shades[2]], [4.3, 4, 2.2, shades[1]], [2.6, 3, 2, shades[0]]].forEach(([rad, count, w, c]) => {
      const off = r() * TAU;
      for (let i = 0; i < count; i++) {
        const a0 = off + i / count * TAU, a1 = a0 + TAU / count * 1.32;
        s += `<path d="M${n(Math.cos(a0) * rad)} ${n(Math.sin(a0) * rad)}A${rad} ${rad} 0 0 1 ${n(Math.cos(a1) * rad)} ${n(Math.sin(a1) * rad)}" stroke="${c}" stroke-width="${w}"/>`;
      }
    });
    return s + `<circle r="1.5" fill="${shades[0]}"/></g>`;
  }

  const leafD = (len, w) => `M0 0C${w} ${-len * .22} ${w * .85} ${-len * .7} 0 ${-len}C${-w * .85} ${-len * .7} ${-w} ${-len * .22} 0 0Z`;
  const leaf = (id, len, w, grad, vein) =>
    `<g id="${id}"><path d="${leafD(len, w)}" fill="url(#${grad})"/><path d="${leafD(len, w)}" fill="url(#e-satin)" opacity=".55"/>` +
    `<path d="M0 -.6Q${n(w * .12)} ${-len * .5} 0 ${-len * .92}" fill="none" stroke="${vein}" stroke-width=".55" opacity=".75"/></g>`;

  const defs = () => `
    ${radial('e-pearl', [[0, '#ffffff'], [.38, '#f9f2ea'], [.78, '#e4d5ca'], [1, '#b7a395']])}
    ${radial('e-mo', [[0, '#ffd47c'], [.55, '#f39a26'], [1, '#c45d14']])}
    ${radial('e-mo-d', [[0, '#f6a43a'], [.6, '#d9741a'], [1, '#9e4410']])}
    ${radial('e-my', [[0, '#fff2ae'], [.55, '#f8c544'], [1, '#d18d18']])}
    ${radial('e-my-d', [[0, '#f9cf55'], [.6, '#e3a223'], [1, '#a86a10']])}
    ${radial('e-mk', [[0, '#c4586d'], [.6, '#7f2439'], [1, '#4a1020']])}
    ${radial('e-jas', [[0, '#ffffff'], [.6, '#f8f1e3'], [1, '#d8cab0']], .4, .25)}
    ${radial('e-goldr', [[0, '#fff1c2'], [.45, '#e1bd6c'], [1, '#8f6626']])}
    ${radial('e-ruby', [[0, '#ff8f9f'], [.45, '#c4163f'], [1, '#6a0a22']])}
    ${radial('e-emerald', [[0, '#9ff0c2'], [.45, '#1f8a55'], [1, '#0b4a2c']])}
    ${radial('e-coconut', [[0, '#c8946a'], [.6, '#8a5a35'], [1, '#55341c']])}
    ${linear('e-leaf', [[0, '#a5bd8e'], [.5, '#6f8a5b'], [1, '#4a6540']])}
    ${linear('e-leaf2', [[0, '#c3d2a8'], [.55, '#8ea676'], [1, '#64804f']])}
    ${linear('e-mango', [[0, '#8fae6e'], [.5, '#5c7f45'], [1, '#3d5a2f']], 1, 0)}
    ${linear('e-gold', [[0, '#94692c'], [.28, '#dcb86d'], [.48, '#fbe6ad'], [.7, '#c39847'], [1, '#86602a']])}
    ${linear('e-goldh', [[0, '#a17834'], [.5, '#ecd08b'], [1, '#a17834']], 0, 1)}
    ${linear('e-wall', [[0, '#fbf1ea'], [.6, '#f2e0d6'], [1, '#e6cdc0']], 0, 1)}
    ${linear('e-dome', [[0, '#fffaf4'], [.55, '#f4e4d9'], [1, '#dcc2b4']], 1, .3)}
    ${linear('e-sand', [[0, '#f7ddd2'], [.55, '#eec2b3'], [1, '#dda292']], 0, 1)}
    ${linear('e-arch', [[0, '#9b4058'], [1, '#541227']], 0, 1)}
    ${linear('e-maroon', [[0, '#a8384f'], [.5, '#7a1f36'], [1, '#4f0f22']], 0, 1)}
    ${linear('e-rosefill', [[0, '#f6c9d2'], [.6, '#dd8ea3'], [1, '#b85b76']], 0, 1)}
    ${linear('e-turmeric', [[0, '#ffe07a'], [1, '#e2a21c']], 0, 1)}
    ${linear('f-foil', [[0, '#8a6428'], [.24, '#c79d4c'], [.44, '#f0d898'], [.6, '#d2ad5f'], [.8, '#a07633'], [1, '#c9a35a']])}
    <linearGradient id="f-line" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="400" y2="120" spreadMethod="reflect"><stop offset="0" stop-color="#8f672b"/><stop offset=".35" stop-color="#b58d45"/><stop offset=".55" stop-color="#cfab62"/><stop offset=".75" stop-color="#a07634"/><stop offset="1" stop-color="#8f672b"/></linearGradient>
    <linearGradient id="f-fade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="160" y2="0"><stop offset="0" stop-color="#a8803e" stop-opacity="0"/><stop offset=".4" stop-color="#a8803e"/><stop offset=".6" stop-color="#a8803e"/><stop offset="1" stop-color="#a8803e" stop-opacity="0"/></linearGradient>
    <filter id="f-press" x="-20%" y="-20%" width="140%" height="150%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation=".45"/><feOffset dy=".7" result="o"/><feFlood flood-color="#5a3d14" flood-opacity=".32"/><feComposite in2="o" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <pattern id="e-satin" width="1.5" height="1.5" patternUnits="userSpaceOnUse" patternTransform="rotate(42)"><rect width=".5" height="1.5" fill="#fff" fill-opacity=".4"/></pattern>
    <pattern id="e-satin-v" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(90)"><rect width=".5" height="1.6" fill="#fff" fill-opacity=".38"/></pattern>
    <pattern id="e-satin-d" width="1.6" height="1.6" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)"><rect width=".5" height="1.6" fill="#3a1010" fill-opacity=".14"/></pattern>
    <filter id="e-emb" x="-15%" y="-15%" width="130%" height="135%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation=".85" result="blur"/>
      <feSpecularLighting in="blur" surfaceScale="2.6" specularConstant=".75" specularExponent="15" lighting-color="#fff6e8" result="spec"><feDistantLight azimuth="235" elevation="40"/></feSpecularLighting>
      <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/>
      <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3=".85" k4="0" result="lit"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation="1.15" result="sb"/>
      <feOffset in="sb" dx=".8" dy="1.5" result="so"/>
      <feFlood flood-color="#3b1a1c" flood-opacity=".34"/>
      <feComposite in2="so" operator="in" result="shadow"/>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="lit"/></feMerge>
    </filter>
    ${marigold('e-mari-o', 'e-mo', 'e-mo-d', 11)}
    ${marigold('e-mari-o2', 'e-mo', 'e-mo-d', 29)}
    ${marigold('e-mari-y', 'e-my', 'e-my-d', 17)}
    ${marigold('e-mari-y2', 'e-my', 'e-my-d', 41)}
    ${rose('e-rose-p', ['#8e2c4a', '#c1567a', '#e48aa6'], 5)}
    ${rose('e-rose-m', ['#4f0f22', '#7d2238', '#a8445c'], 9)}
    ${rose('e-rose-b', ['#c0687f', '#e6a3b4', '#f6cfd8'], 13)}
    ${leaf('e-leaf-a', 15, 5.6, 'e-leaf', '#3f5a36')}
    ${leaf('e-leaf-b', 13, 5, 'e-leaf2', '#5a7447')}
    ${leaf('e-mango', 25, 5.4, 'e-mango', '#2f4a24')}
    <g id="e-bud"><ellipse rx="1.9" ry="4" fill="url(#e-jas)"/><path d="M-1.35 3Q0 5.8 1.35 3Z" fill="#7d9668"/></g>
    <g id="e-jasmine">${[0, 72, 144, 216, 288].map(a => `<ellipse cy="-3.3" rx="1.9" ry="3.5" transform="rotate(${a})" fill="url(#e-jas)"/>`).join('')}<circle r="1.1" fill="#f0d68a"/></g>
    <g id="e-kundan-r"><rect x="-3.4" y="-4" width="6.8" height="8" rx="1.4" fill="url(#e-gold)"/><rect x="-2.2" y="-2.8" width="4.4" height="5.6" rx=".9" fill="url(#e-ruby)"/></g>
    <g id="e-kundan-e"><rect x="-3.4" y="-4" width="6.8" height="8" rx="1.4" fill="url(#e-gold)"/><rect x="-2.2" y="-2.8" width="4.4" height="5.6" rx=".9" fill="url(#e-emerald)"/></g>
    <g id="e-bell"><path d="M-3 0A3 3 0 0 1 3 0V1.4Q0 3.6-3 1.4Z" fill="url(#e-goldr)"/><circle cy="-3.4" r="1" fill="url(#e-goldr)"/><path d="M-1.8 1.2H1.8" stroke="#6b4a1c" stroke-width=".5"/></g>
    <g id="e-drop"><path d="M0-3.2C2 -0.6 2.4 1.4 0 3.4C-2.4 1.4-2 -0.6 0-3.2Z" fill="url(#e-pearl)"/></g>`;

  /* ── Strings of flowers: the building block for toran drops, ladis and curtains ── */
  function strand(x, y0, len, r, opts = {}) {
    const {marigoldEvery = 5, roseChance = .3, scale = 1, end = 'bell'} = opts;
    let s = `<path d="M${n(x)} ${n(y0)}V${n(y0 + len - 6 * scale)}" stroke="#d6c4a3" stroke-width="${n(.6 * scale)}"/>`;
    let y = y0 + 3 * scale, k = 0;
    while (y < y0 + len - 12 * scale) {
      if (k % marigoldEvery === 0) {
        const big = r() < roseChance ? (r() < .5 ? 'e-rose-p' : 'e-rose-m') : (r() < .5 ? 'e-mari-o' : 'e-mari-y');
        const sz = big.startsWith('e-rose') ? .9 : .82;
        y += 7.5 * scale * sz;
        s += use(big, x, y, sz * scale, r() * 360);
        y += 8 * scale * sz;
      } else if (k % marigoldEvery === marigoldEvery - 1) {
        y += 2.5 * scale;
        s += pearl(x, y, 2.1 * scale);
        y += 2.7 * scale;
      } else {
        y += 3.1 * scale;
        s += use('e-bud', x - 2.5 * scale, y, .9 * scale, 34) + use('e-bud', x + 2.5 * scale, y, .9 * scale, -34);
        y += 3.4 * scale;
      }
      k++;
    }
    if (end === 'bell') s += use('e-bell', x, y + 5 * scale, scale);
    else s += pearl(x, y + 2.4 * scale, 1.8 * scale) + use('e-drop', x, y + 7.4 * scale, .9 * scale);
    return s;
  }

  /* ── The opening page: gold-leaf work pressed into cotton paper ──
        One material throughout: foil-gilt fills with a dark gold edge, fine gilt line drawing,
        and only small maroon accents. Telugu touches (mango-leaf thoranam, jasmine, kalash,
        muggulu) and a Marwari one (the golden Tirumala vimana) are kept quiet. */
  const GILT = '#7d5a22';
  const gilt = (w = .45) => `fill="url(#f-foil)" stroke="${GILT}" stroke-width="${w}"`;
  const pressed = body => `<g filter="url(#f-press)">${body}</g>`;
  // A mango leaf hanging tip-down from its stem at (x, y); rotate to point it elsewhere.
  function foilLeaf(x, y, len, w, rot = 0) {
    const d = `M0 0C${n(w)} ${n(len * .12)} ${n(w * .9)} ${n(len * .62)} 0 ${len}C${n(-w * .9)} ${n(len * .62)} ${n(-w)} ${n(len * .12)} 0 0Z`;
    let veins = `M0 1V${n(len * .9)}`;
    [.22, .38, .54, .7].forEach(f => {
      const vy = len * f;
      veins += `M0 ${n(vy)}L${n(w * .6)} ${n(vy + len * .09)}M0 ${n(vy)}L${n(-w * .6)} ${n(vy + len * .09)}`;
    });
    return `<g transform="translate(${n(x)} ${n(y)})${rot ? ` rotate(${n(rot)})` : ''}"><path d="${d}" ${gilt()}/><path d="${veins}" fill="none" stroke="${GILT}" stroke-width=".38" opacity=".7"/></g>`;
  }
  const rosette = (x, y, r) => {
    let s = `<g transform="translate(${n(x)} ${n(y)})">`;
    for (let i = 0; i < 8; i++) s += `<ellipse cy="${n(-r * .62)}" rx="${n(r * .3)}" ry="${n(r * .45)}" transform="rotate(${i * 45})" ${gilt(.3)}/>`;
    return s + `<circle r="${n(r * .32)}" fill="url(#e-ruby)"/></g>`;
  };
  const ghanti = (x, y, s = 1) =>
    `<g transform="translate(${n(x)} ${n(y)}) scale(${s})"><circle cy="-.8" r="1.3" ${gilt(.3)}/>` +
    `<path d="M-3.6 6C-3.8 1.6-2.4.4 0 .4S3.8 1.6 3.6 6L4.6 7.6H-4.6Z" ${gilt(.4)}/><circle cy="9.2" r="1.1" ${gilt(.3)}/></g>`;

  /* ── Thoranam: gilt mango leaves folded over a cord, rosettes between, small bells ── */
  function thoranam() {
    const W = 400, step = 16;
    let back = '', front = '';
    for (let i = 0, x = 8; x <= W - 8; i++, x += step) {
      const long = i % 2 === 0, len = long ? 30 : 21;
      front += `<path d="M${x} 4Q${x + 2.4} .9 ${x} .2" fill="none" stroke="url(#f-foil)" stroke-width=".8"/>` + foilLeaf(x, 4, len, long ? 6.2 : 5.2, (i % 3 - 1) * 2.5);
      if (x + step / 2 < W - 8) front += rosette(x + step / 2, 4.4, 3.3);
      if (long && i % 4 === 0) back += `<path d="M${x} 30V40" stroke="#c4a66a" stroke-width=".5"/>` + ghanti(x, 40, .95);
    }
    const cord = `<path d="M0 3.4H${W}" stroke="url(#f-line)" stroke-width="1.1"/><path d="M0 6H${W}" stroke="url(#f-line)" stroke-width=".45"/>`;
    return svg('toran-art', `0 0 ${W} 52`, pressed(cord + back + front), 'preserveAspectRatio="xMidYMin meet"');
  }

  /* ── A hanging string of gold beads, pearls, jasmine buds and the odd ruby, ending in a bell ── */
  function haar(len, seed) {
    const r = rng(seed);
    let s = `<path d="M0 0V${len - 14}" stroke="#c4a66a" stroke-width=".5"/>`;
    let y = 3 + r() * 3, k = 0;
    while (y < len - 26) {
      s += `<circle cy="${n(y)}" r="1.5" ${gilt(.25)}/>`;
      y += 4.4;
      if (k % 6 === 5) { s += rosette(0, y + 3.6, 4.2); y += 9; }
      else if (k % 2) { s += `<ellipse cy="${n(y + 3)}" rx="2" ry="3.8" fill="url(#e-jas)" stroke="#d6c8ac" stroke-width=".25"/>`; y += 6.8; }
      else { s += pearl(0, y + 2.1, 2.5); y += 5.2; }
      k++;
    }
    s += ghanti(0, y + 2.4, 1.35);
    return svg('ladi', `-9 0 18 ${len}`, pressed(s), `width="18" height="${len}"`);
  }

  /* ── Kalash crest: the purna kumbham with mango leaves and a coconut ── */
  function crest() {
    let s = '';
    [-64, -33, 33, 64].forEach(a => { s += foilLeaf(0, -2, 15, 4.3, 180 + a); });
    s += `<path d="M0-15.5C4.9-14 6.5-8.2 6-3.6H-6C-6.5-8.2-4.9-14 0-15.5Z" ${gilt()}/>`;
    s += `<path d="M-5-1.4H5L5.7 3H-5.7Z" ${gilt()}/><ellipse cy="-2.4" rx="8.8" ry="1.9" ${gilt()}/>`;
    s += `<path d="M-6 3C-15.2 6.6-14.6 21.2 0 21.8C14.6 21.2 15.2 6.6 6 3Z" ${gilt()}/>`;
    s += `<path d="M-12 10.6Q0 15 12 10.6M-12.4 13.4Q0 17.8 12.4 13.4" fill="none" stroke="${GILT}" stroke-width=".45"/>`;
    for (let i = -2; i <= 2; i++) s += `<circle cx="${i * 4.6}" cy="${n(14.2 + (2 - Math.abs(i)) * .55)}" r=".85" fill="url(#e-ruby)"/>`;
    s += `<path d="M-5 21.6L-6.6 24.6H6.6L5 21.6" ${gilt()}/>`;
    return svg('crest-art', '-22 -19 44 45', pressed(s));
  }

  /* ── A gilt lotus between two hairlines ── */
  function divider() {
    const petal = `<path d="M80 1.5C83.2 4.2 83.2 8.6 80 11.6C76.8 8.6 76.8 4.2 80 1.5Z" ${gilt(.35)}/>`;
    const side = `<path d="M80 11.6C76.2 11.2 73.4 8.6 73 5.4C76.2 5.6 78.8 7.8 80 11.6Z" ${gilt(.35)}/>`;
    return svg('divider-art', '0 0 160 14',
      `<path d="M6 7H68M92 7H154" stroke="url(#f-fade)" stroke-width=".8"/>` +
      pressed(`${side}<g transform="matrix(-1 0 0 1 160 0)">${side}</g>${petal}<circle cx="69.5" cy="7" r="1" ${gilt(.25)}/><circle cx="90.5" cy="7" r="1" ${gilt(.25)}/>`));
  }

  /* ── A small gilt flower where the frame's rules meet, trailing bandhani dots ── */
  function corner() {
    let s = '';
    for (let i = 0; i < 4; i++) s += `<ellipse cy="-3.4" rx="1.5" ry="2.8" transform="rotate(${45 + i * 90})" ${gilt(.3)}/>`;
    s += `<circle r="1.2" fill="url(#e-ruby)"/>`;
    [9, 13.5, 18].forEach((d, i) => { const r = 1 - i * .18; s += `<circle cx="${d}" r="${n(r)}" ${gilt(.2)}/><circle cy="${d}" r="${n(r)}" ${gilt(.2)}/>`; });
    return svg('corner-art', '-6 -6 30 30', pressed(s), 'width="30" height="30"');
  }

  /* ── The golden Ananda Nilayam vimana of Tirumala: a gold etching made from a photograph of the shrine
        (assets/vimana-gold.png). It is revealed from the base upward when the curtains open. ── */
  function temple() {
    return '<img class="art palace-art" src="assets/vimana-gold.png?v=23" width="760" height="812" alt="The golden Ananda Nilayam vimana of Tirumala">';
  }

  /* ── The decorated camel (assets/camel-gold.png): gold linework on a faint wash, drawn facing left.
        CSS mirrors it for the right-hand side. ── */
  function camel() {
    return '<img class="art camel-art" src="assets/camel-gold.png?v=33" width="400" height="368" alt="" aria-hidden="true">';
  }

  /* ── A little desert: sand dunes with ripples, scattered grains and two small cacti ── */
  function dunes() {
    const r = rng(7);
    let s = '<defs><linearGradient id="sand-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6b070" stop-opacity=".34"/><stop offset="1" stop-color="#d6b070" stop-opacity="0"/></linearGradient></defs>';
    s += '<path d="M0 15C46 5 90 18 140 12S220 3 270 12S350 17 400 9V36H0Z" fill="url(#sand-fade)"/>';
    s += '<g fill="none" stroke="url(#f-line)" stroke-linecap="round" stroke-linejoin="round">';
    s += '<path d="M0 15C46 5 90 18 140 12S220 3 270 12S350 17 400 9" stroke-width="1.1"/>';
    s += '<path d="M0 24C60 17 112 28 182 22S306 17 400 25" stroke-width=".7" opacity=".8"/>';
    s += '<path d="M18 31q22 -4.4 44 0M120 31q26 -5 52 0M236 30q24 -4.6 48 0M330 31q22 -4.4 44 0" stroke-width=".55" opacity=".7"/>';
    // cacti: a stem with two bent arms
    [[176, 11], [230, 10]].forEach(([x, y]) => {
      s += `<path d="M${x} ${y}V${y - 15}M${x} ${y - 6}H${x - 4.6}V${y - 10.6}M${x} ${y - 8.6}H${x + 4.6}V${y - 12.6}" stroke-width="1.5"/>`;
    });
    s += '</g><g fill="url(#f-foil)">';
    for (let i = 0; i < 26; i++) s += `<circle cx="${n(8 + r() * 384)}" cy="${n(18 + r() * 16)}" r="${n(.5 + r() * .5)}" opacity=".75"/>`;
    s += '</g>';
    return svg('dunes-art', '0 -14 400 50', s);
  }

  /* ── Muggulu: a Telugu kolam chain, two threads looping around a row of dots ── */
  function muggulu() {
    const W = 400, c = 11, a = 6.6, step = 16;
    const wave = sign => {
      let d = '';
      for (let x = 0; x <= W; x += 2) d += `${x ? 'L' : 'M'}${x} ${n(c + sign * a * Math.sin(Math.PI * x / step))}`;
      return d;
    };
    let dots = '';
    for (let x = step / 2; x < W; x += step) dots += `<circle cx="${x}" cy="${c}" r="1.15"/>`;
    for (let x = step; x < W; x += step * 2) dots += `<circle cx="${x}" cy="${c - 9.4}" r=".7"/><circle cx="${x}" cy="${c + 9.4}" r=".7"/>`;
    return svg('muggulu-art', `0 0 ${W} 22`,
      `<g fill="none" stroke="url(#f-line)" stroke-width=".7"><path d="${wave(1)}"/><path d="${wave(-1)}"/></g><g fill="url(#f-foil)">${dots}</g>`,
      'preserveAspectRatio="xMidYMid meet"');
  }

  /* ── Leaf-and-pearl vine: section borders ── */
  function vine(seed = 21, {flip = false} = {}) {
    const r = rng(seed), W = 400, base = 18;
    const poly = Array.from({length: 161}, (_, i) => { const x = -4 + i * (W + 8) / 160; return [x, base + Math.sin(x / W * TAU * 2.5 + seed) * 4.5]; });
    let stem = `<path d="${polyPath(poly)}" fill="none" stroke="#56703f" stroke-width="1.5" stroke-dasharray="2.2 .6" stroke-linecap="round"/>`;
    let leaves = '', flowers = '', pearls = '';
    resample(poly, 12.5, 4).forEach(([x, y, a], k) => {
      const up = k % 2 === 0;
      leaves += use(r() < .5 ? 'e-leaf-a' : 'e-leaf-b', x, y, .95 + r() * .2, up ? a - 55 + (r() - .5) * 20 : a + 235 + (r() - .5) * 20);
    });
    const fl = resample(poly, 48, 22);
    const ids = ['e-rose-p', 'e-mari-o', 'e-rose-m', 'e-mari-y', 'e-rose-b'];
    fl.forEach(([x, y], k) => {
      flowers += use(ids[k % ids.length], x, y, 1.15, r() * 360) + use('e-bud', x + 9, y - 5, .9, 60) + use('e-bud', x - 9, y + 4, .9, -120);
      if (k < fl.length - 1) swag(x, y + 6, fl[k + 1][0], fl[k + 1][1] + 6, 9, 4.3).forEach(([px, py]) => { pearls += pearl(px, py, 1.5); });
    });
    return svg('vine-art', `0 0 ${W} 46`, raised(stem + pearls + leaves + flowers), flip ? 'style="transform:scaleY(-1)"' : '');
  }

  /* ── Flowering arch with hanging mogra strings (Two traditions) ── */
  function floralArch(seed = 31) {
    const r = rng(seed);
    const poly = archPoly(36, 324, 476, 196, 34);
    let leaves = '', flowers = '', strands = '';
    const pts = resample(poly, 8.5, 2);
    const ids = ['e-rose-p', 'e-mari-y', 'e-jasmine', 'e-rose-m', 'e-mari-o', 'e-jasmine', 'e-rose-b', 'e-mari-o2'];
    pts.forEach(([x, y, a], k) => {
      leaves += use(r() < .5 ? 'e-leaf-a' : 'e-leaf-b', x, y, 1 + r() * .25, a - 90 + 50 + (r() - .5) * 30);
      leaves += use(r() < .5 ? 'e-leaf-a' : 'e-leaf-b', x, y, .9 + r() * .2, a + 90 - 50 + (r() - .5) * 30);
      if (k % 3 === 1) flowers += use(ids[(k / 3 | 0) % ids.length], x + (r() - .5) * 3, y + (r() - .5) * 3, 1.05 + r() * .3, r() * 360);
    });
    flowers += use('e-rose-m', 180, 34, 1.7, 20) + use('e-mari-o', 166, 42, 1.2) + use('e-mari-y', 194, 42, 1.2) + use('e-jasmine', 180, 50, 1.2);
    const top = pts.filter(p => p[1] < 150);
    [-60, -40, -20, 0, 20, 40, 60].forEach((dx, i) => {
      const x = 180 + dx;
      const anchor = top.reduce((best, p) => Math.abs(p[0] - x) < Math.abs(best[0] - x) ? p : best, top[0]);
      const len = [34, 50, 64, 76, 64, 50, 34][i];
      strands += strand(x, anchor[1] + 8, len, r, {marigoldEvery: 6, roseChance: 0, scale: .85, end: 'drop'});
    });
    [[36, 476], [324, 476]].forEach(([x, y]) => { flowers += use('e-rose-p', x, y - 4, 1.4) + use('e-mari-o', x + (x < 180 ? 10 : -10), y - 12, 1); });
    return svg('arch-art', '0 0 360 490', raised(leaves + strands + flowers));
  }

  /* ── Jharokha frame in gold zari with flower clusters (Venue) ── */
  function jharokha(seed = 41) {
    const r = rng(seed);
    const B = 476;
    const outer = archPath(22, 338, B, 128, 18, .5);
    const inner = archPath(34, 326, B - 12, 134, 34, .5);
    const lines = cord(`${outer}Z`) + `<path d="${inner}Z" class="zari thin" pathLength="1"/>`;
    let pearls = '', clusters = '', leaves = '';
    resample(archPoly(34, 326, B - 12, 134, 34, .5), 13, 6).forEach(([x, y]) => { pearls += pearl(x, y, 1.7); });
    resample([[22, B - 8], [22, 150]], 24, 10).concat(resample([[338, B - 8], [338, 150]], 24, 10)).forEach(([x, y], k) => {
      leaves += use(k % 2 ? 'e-leaf-a' : 'e-leaf-b', x, y, 1, (x < 180 ? 1 : -1) * (k % 2 ? 40 : 140));
    });
    const cluster = (x, y, s) => use('e-leaf-a', x - 8, y, 1.2 * s, -60) + use('e-leaf-b', x + 8, y, 1.2 * s, 60) + use('e-leaf-a', x, y + 6, 1.1 * s, 180) +
      use('e-rose-m', x, y, 1.45 * s, r() * 360) + use('e-mari-o', x - 10 * s, y + 6 * s, 1 * s, r() * 360) + use('e-mari-y', x + 10 * s, y + 6 * s, .95 * s) + use('e-jasmine', x + 3, y - 11 * s, 1 * s);
    clusters += cluster(22, 136, 1) + cluster(338, 136, 1) + cluster(22, B - 6, .9) + cluster(338, B - 6, .9) + cluster(180, 22, 1.1);
    swag(102, 74, 258, 74, 18, 4.6).forEach(([x, y]) => { pearls += pearl(x, y, 1.8); });
    return svg('jharokha-art', `0 0 360 ${B + 12}`, lines + raised(leaves + pearls + clusters));
  }

  /* ── Curtain of hanging garlands (Dress code) ── */
  function curtain(seed = 51) {
    const r = rng(seed), W = 400;
    let top = '', strings = '';
    for (let x = 0; x <= W; x += 11) top += use(r() < .5 ? 'e-leaf-a' : 'e-leaf-b', x, 10, 1, 180 + (r() - .5) * 60);
    for (let k = 0; k < 15; k++) {
      const x = 12 + k * 26.8;
      const len = 34 + Math.abs(k - 7) ** 1.35 * 14 + r() * 14;
      strings += strand(x, 14, len, r, {marigoldEvery: 5, roseChance: .25, scale: .9, end: k % 2 ? 'drop' : 'bell'});
    }
    for (let x = 0; x <= W; x += 12) top += use(Math.round(x / 12) % 2 ? 'e-mari-y' : 'e-mari-o', x, 9, .82, r() * 360);
    return svg('curtain-art', `0 0 ${W} 216`, raised(strings + top));
  }

  /* ── Kundan-and-pearl necklace (beneath the countdown) ── */
  function necklace(seed = 61) {
    const r = rng(seed);
    let s = '';
    const pts = swag(14, 8, 386, 8, 44, 6.2);
    pts.forEach(([x, y, a], k) => {
      if (k % 3 === 0) {
        s += use(k % 6 === 0 ? 'e-kundan-r' : 'e-kundan-e', x, y, 1.05, a);
        const mid = Math.abs(x - 200) / 186;
        const drops = 1 + Math.round((1 - mid) * 2);
        let dy = y + 6;
        for (let d = 0; d < drops; d++) { s += pearl(x, dy, 1.5); dy += 3.4; }
        s += use('e-drop', x, dy + 2.4, 1);
      } else s += pearl(x, y, 2.1);
    });
    const c = pts[Math.floor(pts.length / 2)];
    s += use('e-kundan-r', c[0], c[1] + 6, 1.6) + use('e-kundan-e', c[0], c[1] + 18, 1.3) + use('e-drop', c[0], c[1] + 30, 1.6);
    return svg('necklace-art', '0 0 400 104', raised(s));
  }

  /* ── Pearl-ringed medallion for countdown numbers ── */
  function medallionRing() {
    let s = `<circle cx="40" cy="40" r="31" fill="url(#e-wall)"/><circle cx="40" cy="40" r="31" fill="url(#e-satin)" opacity=".35"/>`;
    s += `<circle cx="40" cy="40" r="29" fill="none" stroke="url(#e-gold)" stroke-width="1.2" stroke-dasharray="2 .6"/>`;
    for (let i = 0; i < 26; i++) { const a = i / 26 * TAU; s += pearl(40 + Math.cos(a) * 34.5, 40 + Math.sin(a) * 34.5, 2.9); }
    return svg('medal-art', '0 0 80 80', raised(s));
  }

  /* ── Door monogram: a scalloped satin plaque ringed in pearls and zari ── */
  function monogram(guestLine) {
    const rx = 66, ry = 78, cx = 80, cy = 92, N = 20;
    let d = '';
    for (let i = 0; i <= N; i++) {
      const a = -Math.PI / 2 + i / N * TAU;
      const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
      if (i === 0) { d += `M${n(x)} ${n(y)}`; continue; }
      const m = a - TAU / N / 2;
      d += `Q${n(cx + Math.cos(m) * rx * 1.12)} ${n(cy + Math.sin(m) * ry * 1.1)} ${n(x)} ${n(y)}`;
    }
    let s = `<path d="${d}Z" fill="url(#e-wall)"/><path d="${d}Z" fill="url(#e-satin)" opacity=".4"/>`;
    for (let i = 0; i < 40; i++) { const a = i / 40 * TAU; s += pearl(cx + Math.cos(a) * (rx - 4), cy + Math.sin(a) * (ry - 4), 2.3); }
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx - 11}" ry="${ry - 11}" fill="none" stroke="url(#e-gold)" stroke-width="1.8" stroke-dasharray="2.4 .7"/>`;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx - 15}" ry="${ry - 15}" fill="none" stroke="url(#e-gold)" stroke-width=".6"/>`;
    s += use('e-mari-o', cx, cy - ry + 2, 1.15) + use('e-leaf-a', cx - 12, cy - ry + 4, 1, -70) + use('e-leaf-b', cx + 12, cy - ry + 4, 1, 70);
    s += use('e-rose-m', cx, cy + ry - 2, 1.1) + use('e-leaf-a', cx - 12, cy + ry - 4, 1, -110) + use('e-leaf-b', cx + 12, cy + ry - 4, 1, 110);
    const text = `<text x="${cx}" y="${cy + 12}" text-anchor="middle" font-family="Cormorant, serif" font-size="40" fill="#5c1a2e" letter-spacing="1">K<tspan font-style="italic" font-size="28" fill="#a8803e" dx="5" dy="-2">&amp;</tspan><tspan dx="5" dy="2">H</tspan></text>` +
      `<text x="${cx}" y="${cy + 34}" text-anchor="middle" font-family="Cormorant, serif" font-size="7.6" letter-spacing="1.4" fill="#7a5458" dx=".7">24 · 25 · II · 2027</text>` +
      `<path d="M${cx - 24} ${cy - 26}H${cx - 6}M${cx + 6} ${cy - 26}H${cx + 24}" stroke="url(#e-gold)" stroke-width=".8"/><path d="M${cx} ${cy - 29.5}l3.5 3.5-3.5 3.5-3.5-3.5z" fill="url(#e-gold)"/>`;
    return svg('monogram-art', '0 0 160 184', raised(s) + text);
  }

  /* ── Timeline icons ── */
  /* Haldi: a brass thali heaped with turmeric paste, turmeric roots and a small katori */
  function iconHaldi() {
    const r = rng(71);
    let s = `<ellipse cx="0" cy="14" rx="31" ry="9" fill="url(#e-goldh)"/><path d="M-31 14Q-30 21 0 23Q30 21 31 14Z" fill="url(#e-gold)"/><path d="M-31 14Q-30 21 0 23Q30 21 31 14Z" fill="url(#e-satin-d)"/>`;
    s += `<ellipse cx="0" cy="14" rx="26" ry="6.2" fill="url(#e-gold)"/><ellipse cx="0" cy="14.4" rx="22" ry="4.6" fill="#b88a3a" opacity=".5"/>`;
    for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; s += pearl(Math.cos(a) * 28.6, 14 + Math.sin(a) * 7.5, 1); }
    // the heap of turmeric
    s += `<path d="M-14 15Q-10 -2 0 -7Q10 -2 14 15Q0 19 -14 15Z" fill="url(#e-my)"/><path d="M-14 15Q-10 -2 0 -7Q10 -2 14 15Q0 19 -14 15Z" fill="url(#e-satin)" opacity=".4"/>`;
    for (let i = 0; i < 22; i++) { const x = (r() - .5) * 22, top = -6 + Math.abs(x) * 1.1; s += `<circle cx="${n(x)}" cy="${n(top + r() * (15 - top + 4))}" r="${n(.6 + r() * .5)}" fill="url(#e-mo)" opacity=".8"/>`; }
    // two turmeric roots
    [[-23, 12, -24], [-18, 15, 18]].forEach(([x, y, rot]) => {
      s += `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M-7 0C-7 -3 -2 -3.4 1 -3C5 -2.6 8 -1 7.6 1C7 3.2 2 3.6 -2 3.2C-5 3 -7 2 -7 0Z" fill="#cf8a16"/><path d="M-7 0C-7 -3 -2 -3.4 1 -3" fill="none" stroke="#f0c25a" stroke-width=".7"/><path d="M-3 -2.6V3M1 -2.8V3.4M5 -1.6V2.6" stroke="#8c5a0e" stroke-width=".5"/></g>`;
    });
    // a katori with its own little heap
    s += `<path d="M16 8H30Q29 16 23 16Q17 16 16 8Z" fill="url(#e-gold)"/><path d="M16 8H30Q29 16 23 16Q17 16 16 8Z" fill="url(#e-satin-d)"/><ellipse cx="23" cy="8" rx="7" ry="1.9" fill="url(#e-goldh)"/><path d="M17.4 8Q23 -2 28.6 8Z" fill="url(#e-my)"/>`;
    s += use('e-mari-o', 26, 1, .8) + use('e-leaf-a', 10, 4, .9, 25) + use('e-leaf-b', -10, 3, .9, -30) + use('e-mari-y', -26, 4, .75) + use('e-jasmine', 4, 0, .8);
    return svg('icon-art', '-33 -13 66 38', raised(s));
  }
  /* Sangeet: a sitar, tilted on the diagonal, with ghungroo bells and a marigold */
  function iconSitar() {
    let s = '<g transform="rotate(-42)">';
    // strings, drawn first so the neck and gourd sit over their ends
    s += `<path d="M-1.6 18V-36M0 18V-36M1.6 18V-36" stroke="#e9dcc0" stroke-width=".35"/>`;
    // neck with arched frets
    s += `<rect x="-4" y="-34" width="8" height="52" rx="1.4" fill="url(#e-maroon)"/><rect x="-4" y="-34" width="8" height="52" rx="1.4" fill="url(#e-satin-v)" opacity=".5"/>`;
    for (let y = -28; y < 14; y += 4.6) s += `<path d="M-4 ${n(y)}Q0 ${n(y - 1.6)} 4 ${n(y)}" fill="none" stroke="url(#e-gold)" stroke-width=".8"/>`;
    // peg box and pegs
    s += `<path d="M-5.5 -34H5.5L4 -44H-4Z" fill="url(#e-goldh)"/><path d="M-5.5 -34H5.5L4 -44H-4Z" fill="url(#e-satin-d)"/>`;
    [-40, -36].forEach(y => { s += `<circle cx="-7" cy="${y}" r="1.6" fill="url(#e-goldr)"/><circle cx="7" cy="${y}" r="1.6" fill="url(#e-goldr)"/>`; });
    s += `<circle cx="0" cy="-45" r="1.4" fill="url(#e-goldr)"/>`;
    // the small upper gourd
    s += `<circle cx="0" cy="-22" r="4.8" fill="url(#e-goldr)" opacity=".92"/>`;
    // the large gourd with a gold inlay and a ring of pearls
    s += `<path d="M-5 14C-19 14 -22 30 -12 38C-6 43 6 43 12 38C22 30 19 14 5 14Z" fill="url(#e-maroon)"/><path d="M-5 14C-19 14 -22 30 -12 38C-6 43 6 43 12 38C22 30 19 14 5 14Z" fill="url(#e-satin)" opacity=".5"/>`;
    s += `<path d="M-12 34Q0 40 12 34M-14 28Q0 34 14 28M-12 22Q0 27 12 22" fill="none" stroke="url(#e-gold)" stroke-width=".9"/>`;
    for (let i = 0; i < 11; i++) { const a = Math.PI * .1 + i / 10 * Math.PI * .8; s += pearl(Math.cos(a) * 14, 27 + Math.sin(a) * 13.5, 1.15); }
    s += `<rect x="-5" y="17" width="10" height="2.4" rx="1" fill="url(#e-goldh)"/><path d="M-2 -1L0 -7L2 -1" fill="none" stroke="url(#e-gold)" stroke-width=".8"/>`;
    s += '</g>';
    // ghungroo bells and a marigold where the neck meets the gourd
    s += use('e-mari-o', -15, 14, .85) + use('e-leaf-a', -8, 20, .8, 140);
    [[18, 22], [23, 26], [27, 21]].forEach(([x, y]) => { s += `<path d="M${x} ${y - 5}V${y - 1.6}" stroke="#d6c4a3" stroke-width=".5"/>` + use('e-bell', x, y, .85); });
    return svg('icon-art', '-40 -32 80 72', raised(s));
  }
  function iconChhatri() {
    let s = `<path d="M0-2V40" stroke="url(#e-gold)" stroke-width="2"/>`;
    s += `<path d="M-30 6Q-28-20 0-24Q28-20 30 6Z" fill="url(#e-maroon)"/><path d="M-30 6Q-28-20 0-24Q28-20 30 6Z" fill="url(#e-satin)" opacity=".45"/>`;
    s += `<path d="M0-24Q-10-8-12 6M0-24Q10-8 12 6" fill="none" stroke="url(#e-gold)" stroke-width=".8"/>`;
    let hem = 'M-30 6';
    for (let x = -30; x < 30; x += 7.5) { hem += `Q${x + 3.75} 12 ${x + 7.5} 6`; }
    s += `<path d="${hem}" fill="url(#e-gold)" stroke="url(#e-gold)" stroke-width="1"/>`;
    for (let x = -26.25; x < 30; x += 7.5) s += pearl(x, 12.4, 1.5) + use('e-drop', x, 16.2, .7);
    s += `<circle cx="0" cy="-26" r="2.6" fill="url(#e-goldr)"/><path d="M0-28.5V-33" stroke="url(#e-gold)" stroke-width="1.2"/><circle cx="0" cy="-34" r="1.4" fill="url(#e-goldr)"/>`;
    s += use('e-mari-o', -30, 8, .7) + use('e-mari-y', 30, 8, .7);
    return svg('icon-art', '-38 -38 76 82', raised(s));
  }
  function iconKalash() {
    let s = '';
    [-62, -32, 0, 32, 62].forEach(a => { s += use('e-mango', 0, -12, .9, a); });
    s += `<ellipse cx="0" cy="-20" rx="9" ry="10.5" fill="url(#e-coconut)"/><path d="M-6-27Q0-32 6-27" fill="none" stroke="#5b3a20" stroke-width=".8"/>`;
    s += `<path d="M-16-10H16L13-5H-13Z" fill="url(#e-goldh)"/>`;
    s += `<path d="M-12-5C-26 3-25 26 0 28C25 26 26 3 12-5Z" fill="url(#e-gold)"/><path d="M-12-5C-26 3-25 26 0 28C25 26 26 3 12-5Z" fill="url(#e-satin-d)"/>`;
    s += `<path d="M-19 4Q0 9 19 4" fill="none" stroke="#b3123b" stroke-width="2" stroke-dasharray="1.6 .6"/>`;
    s += `<path d="M-10 27L-12 32H12L10 27" fill="url(#e-goldh)"/>`;
    s += use('e-mari-o', 0, 14, .75) + use('e-jasmine', -9, 13, .7) + use('e-jasmine', 9, 13, .7);
    return svg('icon-art', '-36 -40 72 76', raised(s));
  }
  function lotus() {
    let s = '';
    s += use('e-leaf-a', -16, 10, 1.5, -100) + use('e-leaf-b', 16, 10, 1.5, 100);
    [-64, -40, 40, 64].forEach(a => { s += `<path d="M0 10C${n(5)} 2 ${n(5)} -12 0 -20C-5 -12 -5 2 0 10Z" transform="rotate(${a} 0 10)" fill="url(#e-rosefill)"/><path d="M0 10C5 2 5-12 0-20C-5-12-5 2 0 10Z" transform="rotate(${a} 0 10)" fill="url(#e-satin)" opacity=".5"/>`; });
    [-20, 20, 0].forEach(a => { s += `<path d="M0 10C7 0 7-16 0-26C-7-16-7 0 0 10Z" transform="rotate(${a} 0 10)" fill="url(#e-rosefill)" stroke="#b85b76" stroke-width=".5"/><path d="M0 10C7 0 7-16 0-26C-7-16-7 0 0 10Z" transform="rotate(${a} 0 10)" fill="url(#e-satin)" opacity=".5"/>`; });
    s += pearl(-4, 8, 1.6) + pearl(0, 6.5, 1.8) + pearl(4, 8, 1.6);
    return svg('lotus-art', '-36 -30 72 46', raised(s));
  }

  /* ── Zari gift frame (Blessings) ── */
  function giftFrame(seed = 81) {
    const r = rng(seed);
    const cut = 26, W = 340, H = 300, x0 = 10, y0 = 14;
    const frame = (o) => `M${x0 + cut + o} ${y0 + o}H${x0 + W - cut - o}L${x0 + W - o} ${y0 + cut + o}V${y0 + H - cut - o}L${x0 + W - cut - o} ${y0 + H - o}H${x0 + cut + o}L${x0 + o} ${y0 + H - cut - o}V${y0 + cut + o}Z`;
    const lines = cord(frame(0)) + `<path d="${frame(8)}" class="zari thin" pathLength="1"/>`;
    let s = '';
    const poly = [[x0 + cut, y0], [x0 + W - cut, y0], [x0 + W, y0 + cut], [x0 + W, y0 + H - cut], [x0 + W - cut, y0 + H], [x0 + cut, y0 + H], [x0, y0 + H - cut], [x0, y0 + cut], [x0 + cut, y0]];
    resample(poly, 22, 11).forEach(([x, y, a], k) => {
      s += use(k % 2 ? 'e-leaf-a' : 'e-leaf-b', x, y, .95, a + (k % 2 ? -60 : -120));
      if (k % 3 === 0) s += use(k % 2 ? 'e-rose-b' : 'e-jasmine', x, y, .9, r() * 360);
    });
    [[x0, y0 + cut], [x0 + W, y0 + cut], [x0, y0 + H - cut], [x0 + W, y0 + H - cut]].forEach(([x, y]) => { s += use('e-rose-p', x, y, 1.3, r() * 360) + use('e-mari-y', x, y + (y < 200 ? 12 : -12), .9); });
    return svg('gift-art', `0 0 360 ${H + 30}`, lines + raised(s));
  }

  return {defs, thoranam, haar, crest, divider, corner, temple, camel, dunes, muggulu, vine, floralArch, jharokha, curtain, necklace, medallionRing, monogram, iconHaldi, iconSitar, iconChhatri, iconKalash, lotus, giftFrame};
})();
