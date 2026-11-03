(() => {
  'use strict';

  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => reducedQuery.matches;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const root = document.documentElement;
  const invite = $('#invite');
  const hero = $('#hero');
  const doors = $('#doors');
  const live = $('#live');

  /* ── Weak devices: the same design with the costliest effects swapped for cheap ones (see html.lite in styles.css) ── */
  const lite = () => root.classList.contains('lite');
  if (!lite() && !/[?&]lite=0/.test(location.search)) {
    // Backstop for phones that look capable but are slow: time ~40 frames while the curtains hang.
    let n = 0, t0 = 0;
    requestAnimationFrame(function probe(t) {
      if (!t0) t0 = t;
      if (++n < 40) return requestAnimationFrame(probe);
      if ((t - t0) / (n - 1) > 26) root.classList.add('lite');
    });
  }

  /* ── Embroidery ── */
  $('#art-defs').innerHTML = Art.defs();
  $$('[data-art]').forEach(el => {
    const make = Art[el.dataset.art];
    if (make) el.innerHTML = make(el.dataset.seed ? Number(el.dataset.seed) : undefined);
  });

  // Strings of gold, pearl and jasmine hang from the thoranam either side of the names.
  function hangLadis() {
    const H = hero.clientHeight;
    const specs = [[7, .56], [13, .44], [19, .32], [93, .56], [87, .44], [81, .32]];
    $('#ladis').innerHTML = specs.map(([x, f], i) => {
      const sway = (4.6 + (i * 1.37 % 2)).toFixed(2);
      return `<div class="ladi-wrap" style="left:${x}%;--i:${i % 3};--sway:${sway}s;--sway-delay:${(-i * .9).toFixed(2)}s">${Art.haar(Math.round(H * f), 100 + i)}</div>`;
    }).join('');
  }
  hangLadis();

  /* ── Personalised doors: ?to=The%20Sharma%20Family ── */
  const guest = (new URLSearchParams(location.search).get('to') || '').trim().slice(0, 60);
  if (guest) {
    const p = $('#door-for');
    p.innerHTML = '<small>An invitation for</small>';
    p.appendChild(document.createTextNode(guest));
    p.hidden = false;
  }

  /* ── The curtains: velvet pleats on a gilt rod ── */
  const doorEls = $$('.door');
  const rod = $('#rod');
  const badge = $('#badge');
  const halo = badge.querySelector('.halo');
  const OV = 6;                 // each pleat tucks under its neighbour so the drape never shows a gap
  const GATHER = .26, PINCH = .7, OPEN_MS = 2300, LIFT_MS = 280;
  const lift = () => reduced() ? 0 : LIFT_MS;   // the badge lifts first, then the curtains begin to move
  const seeded = seed => () => {
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const svgUrl = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
  // A small scattered gold buti woven into the velvet.
  const buti = (x, y) => `<circle cx='${x}' cy='${y}' r='1.2'/><circle cx='${x}' cy='${y - 3}' r='.7'/><circle cx='${x}' cy='${y + 3}' r='.7'/><circle cx='${x - 3}' cy='${y}' r='.7'/><circle cx='${x + 3}' cy='${y}' r='.7'/>`;
  const BUTI = svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='44' height='52'><g fill='#e4c582' opacity='.32'>${buti(11, 13)}${buti(33, 39)}</g></svg>`);
  let pleats = [];
  let hungAt = 0;
  let anims = [];

  // One fold, lit from the opening: a dark valley, a rounded crest catching the light, back into shadow.
  // Brightness is sampled across the fold and laid over the velvet as shadow or sheen.
  function foldShade(R, edge, mirror) {
    const c = .32 + R() * .16, depth = .5 + R() * .5;
    const tone = b => b < .5
      ? `rgba(16,0,6,${((.5 - b) / .5 * .9).toFixed(3)})`
      : `rgba(255,208,220,${((b - .5) / .5 * .24).toFixed(3)})`;
    const stops = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      let b;
      if (edge) b = t < .3 ? .1 + t / .3 * .42 : t > .9 ? .5 - (t - .9) / .1 * .3 : .52 + Math.sin((t - .3) / .6 * Math.PI) * .05;
      else {
        const ao = .3 + .7 * Math.pow(Math.sin(Math.PI * t), .7);
        const lit = .55 + .45 * Math.cos(Math.PI * (t - c) / (t < c ? c : 1 - c));
        // Shallow folds stay soft across the crest but meet their neighbours in the same deep valley.
        b = .5 + (ao * lit - .5) * (1 - (1 - depth) * Math.sin(Math.PI * t));
      }
      stops.push(`${tone(b)} ${((mirror ? 1 - t : t) * 100).toFixed(1)}%`);
    }
    if (mirror) stops.reverse();
    let s = `linear-gradient(90deg,${stops.join(',')})`;
    if (!edge && R() < .3) {
      const p = 60 + R() * 10, q = mirror ? 100 - p - 12 : p;
      s = `linear-gradient(90deg,transparent ${q}%,rgba(16,0,6,.22) ${q + 6}%,transparent ${q + 12}%),` + s;
    }
    return s;
  }

  function hangCurtains() {
    const half = (doors.clientWidth || innerWidth) / 2;
    const count = clamp(Math.round(half / 26), 7, 14);
    hungAt = half * 2;
    pleats = [];
    let hooks = '';
    doorEls.forEach((door, side) => {
      const R = seeded(side ? 61 : 23);
      const widths = Array.from({length: count}, (_, k) => k === count - 1 ? 1.2 : .62 + R() * .8);
      const sum = widths.reduce((a, b) => a + b, 0);
      door.querySelectorAll('.pleat').forEach(el => el.remove());
      let x = 0;
      widths.forEach((f, k) => {
        const w = f / sum * half, edge = k === count - 1, bx = x - OV;
        const pos = side ? `right ${-bx}px top 0` : `${-bx}px 0`;
        const el = document.createElement('div');
        el.className = 'pleat';
        el.style.cssText = `${side ? 'right' : 'left'}:${bx}px;width:${w + OV + (edge ? 1 : 0)}px;z-index:${k + 1}`;
        const cloth = el.appendChild(document.createElement('div'));
        cloth.className = edge ? 'cloth edge' : 'cloth';
        cloth.style.setProperty('--bd', `${(-k * .45 - side * 1.3).toFixed(2)}s`);
        // Light pools at the opening and falls away towards the outer edges.
        cloth.style.background = `${foldShade(R, edge, side)},${BUTI} ${pos}/44px 52px,hsl(344 64% ${(20 + 6 * x / half + R() * 1.6).toFixed(1)}%)`;
        if (edge) cloth.innerHTML = '<i class="hem"></i>';
        door.appendChild(el);
        hooks += `<i class="hook" style="${side ? 'right' : 'left'}:${(x + w / 2).toFixed(1)}px"></i>`;
        pleats.push({el, side, x, w, k, last: count - 1});
        x += w;
      });
      door.classList.add('hung');
    });
    rod.innerHTML = hooks;
    Array.from(rod.children).forEach((h, i) => { pleats[i].hook = h; });
  }
  hangCurtains();

  // The badge springs up off the fabric in a warm glow and floats away; then the drape gathers into
  // tight folds at each side, hem trailing the rod, and the bunches slip away.
  function curtainAnims() {
    const half = hungAt / 2;
    const dur = reduced() ? 1 : OPEN_MS;
    const ease = 'cubic-bezier(.62,.02,.3,1)', exit = 'cubic-bezier(.55,0,.8,.2)';
    const gone = {transform: 'translateY(-34px) scale(1.16)', opacity: 0, filter: 'blur(6px)'};
    const list = [
      badge.animate([
        {transform: 'translateY(0) scale(.95)', opacity: 1, filter: 'blur(0px)', easing: 'cubic-bezier(.2,.9,.3,1.25)'},
        {transform: 'translateY(-10px) scale(1.06)', opacity: 1, filter: 'blur(0px)', offset: .14, easing: 'cubic-bezier(.45,0,.75,.5)'},
        {...gone, offset: .42}, gone
      ], {duration: dur, fill: 'both'}),
      halo.animate([
        {opacity: 0, transform: 'translate(-50%,-50%) scale(.5)'},
        {opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .14},
        {opacity: 0, transform: 'translate(-50%,-50%) scale(1.5)', offset: .45},
        {opacity: 0, transform: 'translate(-50%,-50%) scale(1.5)'}
      ], {duration: dur, fill: 'both'})
    ];
    doorEls.forEach((door, side) => {
      const dir = side ? -1 : 1;
      const own = pleats.filter(p => p.side === side);
      const lead = own[own.length - 1];
      const bunch = lead.x * GATHER + lead.w * PINCH;
      const off = bunch + 60;
      const slide = (du, s) => `translateX(${(dir * du).toFixed(1)}px)${s ? ` scaleX(${s})` : ''}`;
      const move = (el, du, s, delay) => list.push(el.animate(
        [{transform: slide(0, s && 1), easing: ease}, {transform: slide(du, s), offset: .64, easing: exit}, {transform: slide(du - off, s)}],
        {duration: dur, delay, fill: 'both'}));
      own.forEach(p => {
        const delay = reduced() ? 0 : LIFT_MS + (p.last - p.k) * 16;
        move(p.el, p.x * (GATHER - 1) + OV * (1 - PINCH), PINCH, delay);
        move(p.hook, p.x * GATHER + p.w * PINCH / 2 - p.x - p.w / 2, 0, delay);
        if (reduced()) return;
        const lean = dir * (.6 + 2.6 * p.x / half);
        list.push(p.el.firstChild.animate([
          {transform: 'skewX(0deg)'},
          {transform: `skewX(${lean.toFixed(2)}deg)`, offset: .3},
          {transform: `skewX(${(-lean * .25).toFixed(2)}deg)`, offset: .58},
          {transform: 'skewX(0deg)', offset: .68},
          {transform: `skewX(${(lean * .8).toFixed(2)}deg)`}
        ], {duration: dur, delay, easing: 'ease-in-out'}));
      });
    });
    return list;
  }
  const stopCurtains = () => { anims.forEach(a => a.cancel()); anims = []; };

  let resizeTimer = 0;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (!opened && !busy && doors.clientWidth !== hungAt) { stopCurtains(); hangCurtains(); } }, 150);
  });

  /* ── Opening and closing ── */
  let opened = false;
  let busy = false;
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, reduced() ? 0 : ms));

  function openDoors() {
    if (opened || busy) return;
    opened = true;
    busy = true;
    stopCurtains();
    doors.classList.add('pressing');
    if (navigator.vibrate && !reduced()) try { navigator.vibrate(12); } catch (e) { /* unsupported */ }
    later(() => {
      doors.classList.remove('pressing');
      doors.classList.add('open');
      anims = curtainAnims();
      later(() => { invite.classList.add('opened'); setBars(false); }, lift() + 300);
      later(() => petals.burst(54, 1800), lift() + 650);
      later(() => {
        doors.hidden = true;
        root.classList.remove('locked');
        busy = false;
        live.textContent = 'The invitation is open. Scroll to read.';
        hero.focus({preventScroll: true});
      }, lift() + OPEN_MS + 260);
    }, 220);
  }

  function closeDoors() {
    if (!opened || busy) return;
    busy = true;
    window.scrollTo({top: 0, behavior: reduced() ? 'auto' : 'smooth'});
    later(() => {
      root.classList.add('locked');
      stopCurtains();
      doors.hidden = false;
      if (doors.clientWidth !== hungAt) hangCurtains();
      anims = curtainAnims();
      anims.forEach(a => { a.finish(); a.reverse(); });
      void doors.offsetWidth;
      doors.classList.remove('open');
      setBars(true);
      later(() => {
        stopCurtains();
        invite.classList.remove('opened');
        $$('.in').forEach(el => el.classList.remove('in'));
        observeAll();
        opened = false;
        busy = false;
        $('#open-doors').focus({preventScroll: true});
        live.textContent = 'The invitation is closed. Tap to open it again.';
      }, OPEN_MS + 250);
    }, window.scrollY > 40 && !reduced() ? 900 : 0);
  }

  $('#open-doors').addEventListener('click', openDoors);
  $('#replay').addEventListener('click', closeDoors);
  document.addEventListener('keydown', e => {
    if (!opened && (e.key === 'Enter' || e.key === ' ') && document.activeElement === document.body) { e.preventDefault(); openDoors(); }
  });
  /* ── Reveals as each piece of embroidery scrolls into view ── */
  const revealables = () => $$('.reveal, .unroll, .bloom, .bloom-arch, .stitch-in, .walk-in');
  // An element fully hidden by its own clip-path never intersects, so clip reveals watch their parent.
  const watchers = new Map();
  let camelsDone = 0;
  // Browser bars take the curtain's velvet while it is closed, and the page's cream once it is open.
  const themeMeta = document.querySelector('meta[name=theme-color]');
  function setBars(closed) {
    root.classList.toggle('curtained', closed);
    if (themeMeta) themeMeta.content = closed ? '#5a1429' : '#efe2d6';
  }
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      (watchers.get(entry.target) || []).forEach(el => {
        if (el.matches('.walk-in') && !camelsDone) camelsDone = performance.now() + 3200;
        // the Celebrations hold back until the camels have finished walking in
        const wait = el.closest('.celebrations') && camelsDone ? camelsDone - performance.now() : 0;
        if (wait > 0) setTimeout(() => el.classList.add('in'), wait); else el.classList.add('in');
      });
      watchers.delete(entry.target);
      io.unobserve(entry.target);
    });
  }, {rootMargin: '0px 0px -12% 0px', threshold: .12}) : null;
  function observeAll() {
    camelsDone = 0;
    if (!io) { revealables().forEach(el => el.classList.add('in')); return; }
    revealables().forEach(el => {
      const target = el.matches('.unroll, .bloom-arch') ? el.parentElement : el.matches('.walk-in') ? el.parentElement : el;   // the camels set off as soon as the arch appears, well before the Celebrations
      if (!watchers.has(target)) watchers.set(target, []);
      watchers.get(target).push(el);
      io.observe(target);
    });
  }
  // Stagger siblings so lines of type arrive one after another.
  $$('.sec, .arch-text, .frame-text, .medals, .tl-item').forEach(group => {
    Array.from(group.children).filter(c => c.matches('.reveal, .bloom')).forEach((c, i) => c.style.setProperty('--rd', `${Math.min(i, 6) * .12}s`));
  });
  observeAll();

  /* ── Timeline: a pearl slides down the thread with the scroll ── */
  const timeline = $('#timeline');
  const tlItems = $$('.tl-item');
  let scrollFrame = 0, tlTop = 0, tlH = 1, tlMarks = [];
  // Layout is measured once (and on resize/reveal), so scrolling only does arithmetic.
  function measureTimeline() {
    const y = scrollY, r = timeline.getBoundingClientRect();
    tlTop = r.top + y; tlH = r.height || 1;
    tlMarks = tlItems.map(item => { const ir = item.getBoundingClientRect(); return ir.top + y + ir.height * .45 - tlTop; });
  }
  function onScroll() {
    scrollFrame = 0;
    const top = tlTop - scrollY;
    if (top + tlH < -100 || top > innerHeight + 100) return;
    const p = clamp((innerHeight * .55 - top) / tlH, 0, 1);
    timeline.style.setProperty('--p', p.toFixed(4));
    const reach = p * tlH;
    tlItems.forEach((item, i) => item.classList.toggle('lit', tlMarks[i] < reach));
  }
  measureTimeline();
  addEventListener('load', measureTimeline);
  addEventListener('resize', () => { measureTimeline(); onScroll(); });
  // reveals shift transforms, not layout, but fonts/art can change heights: re-measure when the timeline nears
  if ('ResizeObserver' in window) new ResizeObserver(measureTimeline).observe(timeline);
  addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(onScroll); }, {passive: true});

  /* ── Countdown to the muhurat ── */
  const target = new Date('2027-02-25T11:42:00+05:30').getTime();
  const cdEls = ['cd-days', 'cd-hours', 'cd-mins', 'cd-secs'].map(id => $('#' + id));
  const medals = $('#countdown');
  let medalsVisible = false;
  if (io) new IntersectionObserver(es => { medalsVisible = es[0].isIntersecting; }).observe(medals);
  let cdTimer = 0;
  function tick() {
    const ms = target - Date.now();
    if (ms <= 0) {
      medals.removeAttribute('role');
      medals.innerHTML = '<p class="countdown-done">Together, at last.</p>';
      clearInterval(cdTimer);
      return;
    }
    [Math.floor(ms / 864e5), Math.floor(ms / 36e5) % 24, Math.floor(ms / 6e4) % 60, Math.floor(ms / 1e3) % 60].forEach((v, i) => {
      const text = String(v).padStart(i === 0 ? 3 : 2, '0');
      const el = cdEls[i];
      if (el.textContent === text) return;
      el.textContent = text;
      if (medalsVisible && !reduced()) { el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick'); }
    });
  }
  const startCountdown = () => { clearInterval(cdTimer); tick(); cdTimer = setInterval(tick, 1000); };
  startCountdown();

  /* ── Petals: marigold, rose and jasmine ── */
  const petals = (() => {
    const canvas = $('#petals');
    const ctx = canvas.getContext('2d');
    // Rose petals in maroon and blush, jasmine, and gold leaf: the opening page's palette.
    const palette = [
      ['#c2546a', '#6d1a2e', 'rose', 5], ['#e9b8c0', '#b4606f', 'rose', 3],
      ['#f4dad5', '#c99590', 'rose', 2], ['#fffaf0', '#e2d6c0', 'jasmine', 3]
    ];
    const sprites = [];
    palette.forEach(([light, dark, kind, weight]) => {
      const s = 64, c = document.createElement('canvas');
      c.width = c.height = s;
      const x = c.getContext('2d');
      x.translate(s / 2, s / 2);
      x.beginPath();
      if (kind === 'rose') {
        const g = x.createRadialGradient(0, s * .42, 2, 0, 0, s * .55);
        g.addColorStop(0, dark); g.addColorStop(1, light);
        x.fillStyle = g;
        x.moveTo(0, s * .42);
        x.bezierCurveTo(-s * .2, s * .3, -s * .42, s * .02, -s * .36, -s * .22);
        x.bezierCurveTo(-s * .3, -s * .42, -s * .08, -s * .46, 0, -s * .34);
        x.bezierCurveTo(s * .08, -s * .46, s * .3, -s * .42, s * .36, -s * .22);
        x.bezierCurveTo(s * .42, s * .02, s * .2, s * .3, 0, s * .42);
      } else {
        const g = x.createLinearGradient(-s * .3, -s * .4, s * .3, s * .4);
        g.addColorStop(0, light); g.addColorStop(1, dark);
        x.fillStyle = g;
        x.moveTo(0, -s * .44);
        x.bezierCurveTo(s * .26, -s * .3, s * .22, s * .24, 0, s * .44);
        x.bezierCurveTo(-s * .22, s * .24, -s * .26, -s * .3, 0, -s * .44);
      }
      x.fill();
      for (let i = 0; i < weight; i++) sprites.push(c);
    });
    let list = [], raf = 0, last = 0, W = 0, H = 0, dpr = 1;
    function burst(count, spread) {
      if (reduced()) return;
      if (lite()) count = Math.ceil(count * .5);
      dpr = lite() ? 1 : Math.min(2, devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      for (let i = 0; i < count; i++) {
        const gold = Math.random() < .3;
        list.push({
          x: Math.random() * W, y: -30 - Math.random() * 80,
          vx: (Math.random() - .5) * 40, vy: 60 + Math.random() * 60, fall: 80 + Math.random() * 70,
          sway: 14 + Math.random() * 30, phase: Math.random() * 6.3, swayRate: .9 + Math.random() * 1.2,
          rot: Math.random() * 6.3, spin: (Math.random() - .5) * 3, flip: Math.random() * 6.3, flipRate: 2 + Math.random() * 3.5,
          size: gold ? 3 + Math.random() * 3.5 : 11 + Math.random() * 10,
          sprite: sprites[(Math.random() * sprites.length) | 0], gold, delay: Math.random() * spread
        });
      }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }
    function frame(now) {
      const dt = Math.min(.05, (now - last) / 1000);
      last = now;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      list = list.filter(p => p.y < H + 40);
      for (const p of list) {
        if (p.delay > 0) { p.delay -= dt * 1000; continue; }
        p.vx *= 1 - 1.4 * dt;
        p.vy += (p.fall - p.vy) * 1.3 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.phase += p.swayRate * dt; p.rot += p.spin * dt; p.flip += p.flipRate * dt;
        ctx.setTransform(dpr, 0, 0, dpr, (p.x + Math.sin(p.phase) * p.sway) * dpr, p.y * dpr);
        ctx.rotate(p.rot);
        ctx.scale(Math.cos(p.flip), 1);
        if (p.gold) {
          ctx.globalAlpha = .55 + .45 * Math.abs(Math.sin(p.flip * 1.3));
          ctx.fillStyle = Math.sin(p.flip) > 0 ? '#f5dc9a' : '#b48a3e';
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .7);
        } else {
          ctx.globalAlpha = .94;
          ctx.drawImage(p.sprite, -p.size / 2, -p.size / 2, p.size, p.size);
        }
      }
      ctx.globalAlpha = 1;
      raf = list.length ? requestAnimationFrame(frame) : 0;
      if (!raf) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); }
    }
    return {burst, stop() { list = []; }};
  })();

  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('page-hidden', document.hidden);
    if (document.hidden) { clearInterval(cdTimer); petals.stop(); } else startCountdown();
  });
  hero.tabIndex = -1;

  // The hanging strings sway forever; stop spending frames on them once the hero has scrolled away.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => root.classList.toggle('hero-off', !e.isIntersecting)).observe(hero);
  }
})();
