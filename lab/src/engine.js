// The lab's renderers: no DOM controls, no state of their own. Each tab hands its parameter set in
// (B for the banners, V for Voxl, F for the icon field) and gets canvases back.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const ICONS = window.PIXL_ICONS;
// The brand font on every canvas, Geist where its files are missing.
// The words beside the mark, in place of the domain since 3 Nov 2026: they read better set.
export const SIGNATURE = 'indx search system';
export const TYPE = "'FunktionalGrotesk', Geist, sans-serif";
export const ICON_NAMES = Object.keys(ICONS).sort();

export const LADDER = {
  dark:  { lv0: '#080809', lv1: '#121215', lv2: '#1A1A21', lv3: '#393941', lv4: '#565661', lv5: '#8F8F97', lv6: '#EFEFEF', lv7: '#FBFBFB', lv8: '#FFFFFF' },
  light: { lv0: '#FFFFFF', lv1: '#FBFBFB', lv2: '#EFEFEF', lv3: '#CFCFCF', lv4: '#757575', lv5: '#4A4A50', lv6: '#1A1A21', lv7: '#121215', lv8: '#080809' },
};
const ACCENT = { info: '#6B9EFF', teal: '#72F5C6', signal: '#FF4238' };

// The banners' parameter set, current while a banner, the sheet, the morph or the icon grid draws.
let B = null;
const ink = () => LADDER[B.theme].lv8;
// With the grid over the pixels the ground is a mid grey and the lines the lightest step, as in
// the reference: the grid reads as the pixels' own, laid across them.
const gridOver = () => B.gridMode === 'over';
const ground = () => gridOver() ? LADDER[B.theme][B.theme === 'light' ? 'lv3' : 'lv1'] : LADDER[B.theme].lv0;
const gridLine = () => B.theme === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(8,8,9,0.9)';
const tone = () => ACCENT[B.tone] ?? LADDER[B.theme][B.tone];

// ── Icons ────────────────────────────────────────────────────────────────────────────
export function cells(name) {
  const icon = ICONS[name];
  const list = [];
  icon.rows.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') list.push({ x, y, level: +c }); }));
  return { w: icon.w, h: icon.h, list, filled: (x, y) => icon.rows[y]?.[x] != null && icon.rows[y][x] !== '.' };
}

// ── Metaball field ───────────────────────────────────────────────────────────────────
// The connection is a morphological closing of the pixels: grow the shape by `reach`, then
// shrink it back by the same amount. Straight edges and outer corners stay exactly on the grid;
// gaps narrower than twice the reach fill in, and inner corners get round fillets, so pixels that
// are close together join like metaballs without the icon swelling. `corner` rounds each pixel
// first. Returns the signed distance to the result, in px, negative inside.
function closedField(ic, scale, pad, reach, corner) {
  const W = Math.round((ic.w + 2 * pad) * scale), H = Math.round((ic.h + 2 * pad) * scale);
  const r = reach * scale, half = 0.5 - corner;
  // 1. Grown: inside where the distance to the nearest (rounded) pixel is at most the reach.
  const grown = new Uint8Array(W * H);
  for (let py = 0; py < H; py++) {
    const v = (py + 0.5) / scale - pad;
    for (let px = 0; px < W; px++) {
      const u = (px + 0.5) / scale - pad;
      let d = Infinity;
      for (const c of ic.list) {
        const qx = Math.abs(u - (c.x + 0.5)) - half, qy = Math.abs(v - (c.y + 0.5)) - half;
        const sd = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - corner;
        if (sd < d) d = sd;
      }
      grown[py * W + px] = d * scale <= r ? 1 : 0;
    }
  }
  // 2. Shrunk back: distance from each grown pixel to the nearest pixel outside it.
  const out = edt(grown, W, H);
  const F = new Float32Array(W * H);
  for (let i = 0; i < F.length; i++) F[i] = grown[i] ? r - out[i] : r + 1;
  return { F, W, H };
}

// Exact Euclidean distance (px) from each set pixel to the nearest unset one (Felzenszwalb).
function edt(mask, W, H) {
  const INF = 1e12, f = new Float64Array(Math.max(W, H)), d = new Float64Array(W * H);
  const z = new Float64Array(Math.max(W, H) + 1), vv = new Int32Array(Math.max(W, H)), tmp = new Float64Array(Math.max(W, H));
  const pass = (n, get, set) => {
    for (let q = 0; q < n; q++) f[q] = get(q);
    let k = 0; vv[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < n; q++) {
      let sq = ((f[q] + q * q) - (f[vv[k]] + vv[k] * vv[k])) / (2 * q - 2 * vv[k]);
      while (sq <= z[k]) { k--; sq = ((f[q] + q * q) - (f[vv[k]] + vv[k] * vv[k])) / (2 * q - 2 * vv[k]); }
      k++; vv[k] = q; z[k] = sq; z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; tmp[q] = (q - vv[k]) * (q - vv[k]) + f[vv[k]]; }
    for (let q = 0; q < n; q++) set(q, tmp[q]);
  };
  for (let x = 0; x < W; x++) pass(H, y => mask[y * W + x] ? INF : 0, (y, val) => { d[y * W + x] = val; });
  for (let y = 0; y < H; y++) pass(W, x => d[y * W + x], (x, val) => { d[y * W + x] = val; });
  for (let i = 0; i < d.length; i++) d[i] = Math.sqrt(d[i]);
  return d;
}

// ── 2D renderers: each returns a canvas of the icon at `cell` px per pixel, with `pad` cells around ──
function renderFlat(ic, cell, color) {
  const pad = 0.5;
  const cv = canvasOf((ic.w + 2 * pad) * cell, (ic.h + 2 * pad) * cell);
  const g = cv.getContext('2d');
  g.fillStyle = color;
  for (const c of ic.list) g.fillRect(Math.round((c.x + pad) * cell), Math.round((c.y + pad) * cell), Math.ceil(cell), Math.ceil(cell));
  return { canvas: cv, pad };
}

function renderMetaball(ic, cell, color, reach = B.reach, corner = B.corner) {
  const pad = Math.max(0.5, reach);
  const { F, W, H } = closedField(ic, cell, pad, reach, corner);
  const cv = canvasOf(W, H);
  const g = cv.getContext('2d');
  const img = g.createImageData(W, H);
  const [r, gr, b] = rgb(color);
  for (let i = 0; i < F.length; i++) {
    const cover = Math.min(1, Math.max(0, 0.5 - F[i]));
    if (cover > 0) { const j = i * 4; img.data[j] = r; img.data[j + 1] = gr; img.data[j + 2] = b; img.data[j + 3] = cover * 255; }
  }
  g.putImageData(img, 0, 0);
  return { canvas: cv, pad };
}

// Dither: the icon on a fine grid of `micro` cells per pixel, shaded as a bevelled block lit from
// the upper left, the shade drawn with the systm's patterns: solid, the 2 checkerboard, then the
// spaced 4 and 6 patterns, then the second tone alone. Two colours, no greys.
const PATTERNS = [
  () => true,
  (x, y) => (x + y) % 2 === 0,
  (x, y) => (x % 4 === 0 && y % 4 === 0) || (x % 4 === 2 && y % 4 === 2),
  (x, y) => (x % 6 === 0 && y % 6 === 0) || (x % 6 === 3 && y % 6 === 3),
  () => false,
];
function renderDither(ic, cell, color, second) {
  const { micro, bevel, ditherMeta: useMeta, reach, corner } = B;
  const pad = useMeta ? Math.max(0.5, reach) : 0.5;
  const MW = Math.round((ic.w + 2 * pad) * micro), MH = Math.round((ic.h + 2 * pad) * micro);
  const inside = new Uint8Array(MW * MH);
  const closed = useMeta ? closedField(ic, micro, pad, reach, corner).F : null;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const u = (x + 0.5) / micro - pad, v = (y + 0.5) / micro - pad;
    inside[y * MW + x] = closed ? (closed[y * MW + x] <= 0 ? 1 : 0) : (ic.filled(Math.floor(u), Math.floor(v)) ? 1 : 0);
  }
  // Distance to the outside (chamfer 3-4), capped at the bevel: a flat top with sloped edges.
  const INF = 1e6, dist = new Float32Array(MW * MH);
  for (let i = 0; i < dist.length; i++) dist[i] = inside[i] ? INF : 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH) ? 0 : dist[y * MW + x];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (inside[y * MW + x])
    dist[y * MW + x] = Math.min(dist[y * MW + x], at(x - 1, y) + 3, at(x, y - 1) + 3, at(x - 1, y - 1) + 4, at(x + 1, y - 1) + 4);
  for (let y = MH - 1; y >= 0; y--) for (let x = MW - 1; x >= 0; x--) if (inside[y * MW + x])
    dist[y * MW + x] = Math.min(dist[y * MW + x], at(x + 1, y) + 3, at(x, y + 1) + 3, at(x + 1, y + 1) + 4, at(x - 1, y + 1) + 4);
  const h = (x, y) => Math.min(at(x, y) / 3, bevel) / bevel;
  const L = norm([-1, -1, 1.1]);
  const scale = Math.ceil(cell / micro);
  const cv = canvasOf(MW * scale, MH * scale);
  const g = cv.getContext('2d');
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (!inside[y * MW + x]) continue;
    const hx = (h(x + 1, y) - h(x - 1, y)) / 2, hy = (h(x, y + 1) - h(x, y - 1)) / 2;
    const n = norm([-hx * bevel * 0.9, -hy * bevel * 0.9, 1]);
    const lit = n[0] * L[0] + n[1] * L[1] + n[2] * L[2]; // 0..1; a flat top is L.z
    const level = lit > 0.86 ? 0 : lit > 0.62 ? 1 : lit > 0.4 ? 2 : lit > 0.2 ? 3 : 4;
    g.fillStyle = PATTERNS[level](x, y) ? color : second;
    g.fillRect(x * scale, y * scale, scale, scale);
  }
  const out = canvasOf((ic.w + 2 * pad) * cell, (ic.h + 2 * pad) * cell);
  const og = out.getContext('2d');
  og.imageSmoothingEnabled = false;
  og.drawImage(cv, 0, 0, out.width, out.height);
  return { canvas: out, pad };
}

// ── 3D: each pixel a block, toon-shaded in the ladder's steps, no shadows ─────────────
const three = (() => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-3, 4, 6);
  scene.add(sun);
  const steps = new Uint8Array([90, 170, 255]);
  const gradient = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);
  gradient.needsUpdate = true;
  let group = null;
  return function render(ic, cell, color) {
    if (group) { scene.remove(group); group.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); }
    group = new THREE.Group();
    const size = 1 - B.gap;
    const geo = B.rounded ? new RoundedBoxGeometry(size, size, B.depth, 3, Math.min(0.12, size / 4)) : new THREE.BoxGeometry(size, size, B.depth);
    const mat = new THREE.MeshToonMaterial({ color: new THREE.Color(color), gradientMap: gradient });
    for (const c of ic.list) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(c.x + 0.5 - ic.w / 2, ic.h / 2 - (c.y + 0.5), 0);
      group.add(m);
    }
    group.rotation.set(THREE.MathUtils.degToRad(B.tilt), THREE.MathUtils.degToRad(B.turn), 0);
    scene.add(group);
    const pad = 0.9;
    const W = Math.round((ic.w + 2 * pad) * cell), H = Math.round((ic.h + 2 * pad) * cell);
    renderer.setSize(W, H, false);
    const halfW = (ic.w / 2 + pad), halfH = (ic.h / 2 + pad);
    camera.left = -halfW; camera.right = halfW; camera.top = halfH; camera.bottom = -halfH;
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    const cv = canvasOf(W, H);
    cv.getContext('2d').drawImage(renderer.domElement, 0, 0);
    return { canvas: cv, pad };
  };
})();

function renderIcon(name, cell, color = ink()) {
  const ic = cells(name);
  switch (B.style) {
    case 'flat': return renderFlat(ic, cell, color);
    case 'dither': return renderDither(ic, cell, color, tone());
    case '3d': return three(ic, cell, color);
    default: return renderMetaball(ic, cell, color);
  }
}

// ── Banners ──────────────────────────────────────────────────────────────────────────
const WORDS = ['Search.', 'Ask.', 'Observe.'];
export const BANNERS = {
  profile: { W: 1584, H: 396, safe: { x: 0.025, y: 0.38, w: 0.27, h: 0.62 } },
  company: { W: 1128, H: 191, safe: { x: 0.02, y: 0.45, w: 0.16, h: 0.55 } },
};

function drawGround(g, W, H, k) {
  g.fillStyle = ground();
  g.fillRect(0, 0, W, H);
  if (B.gridMode !== 'behind') return;
  // The systm's 6px grid at low opacity, as behind the website's hero.
  g.fillStyle = LADDER[B.theme].lv2;
  const step = 6 * k;
  for (let x = 0; x < W; x += step) g.fillRect(x, 0, k, H);
  for (let y = 0; y < H; y += step) g.fillRect(0, y, W, k);
}

function drawIndxMark(g, x, y, cell) {
  const { canvas, pad } = renderFlat(cells('indx'), cell, ink());
  g.drawImage(canvas, x - pad * cell, y - pad * cell);
}

// While a banner is laid out, type waits here, so the grid can be drawn over the pixels first.
let textQueue = null;
function text(g, s, x, y, px, weight = 350, color = ink(), align = 'left') {
  if (textQueue) { textQueue.push(() => { const q = textQueue; textQueue = null; text(g, s, x, y, px, weight, color, align); textQueue = q; }); return; }
  g.font = `${weight} ${px}px ${TYPE}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  g.fillText(s, x, y);
}

// The grid laid over a banner: lines every `cell` px from the top left, the icons snapped to it.
let overCell = 0;
function drawGridOver(g, W, H, cell, k) {
  if (!gridOver() || !cell) return;
  g.fillStyle = gridLine();
  const t = Math.max(1, Math.round(1.2 * k));
  for (let x = 0; x <= W; x += cell) g.fillRect(Math.round(x - t / 2), 0, t, H);
  for (let y = 0; y <= H; y += cell) g.fillRect(0, Math.round(y - t / 2), W, t);
}

function placeIcon(g, name, x, y, iconH) {
  // x, y: the icon's top left on its own 7 by 5 grid; the render's padding falls around it.
  const cell = iconH / 5;
  if (gridOver()) { x = Math.round(x / cell) * cell; y = Math.round(y / cell) * cell; if (!overCell || cell > overCell) overCell = cell; }
  const { canvas, pad } = renderIcon(name, cell);
  g.drawImage(canvas, x - pad * cell, y - pad * cell);
  return cell * 7;
}

export function drawBanner(kind, k, params) {
  B = params;
  const { W, H } = BANNERS[kind];
  const cv = canvasOf(W * k, H * k);
  const g = cv.getContext('2d');
  drawGround(g, W * k, H * k, k);
  overCell = 0;
  textQueue = [];
  const wide = kind === 'profile';
  if (B.layout === 'row') {
    // Three icons with their word under each, to the right of the photo.
    const iconH = (wide ? 120 : 62) * k, cell = iconH / 5, snap = v => Math.round(v / cell) * cell;
    const gapX = snap((wide ? 120 : 70) * k);
    const iconW = iconH / 5 * 7;
    const total = 3 * iconW + 2 * gapX;
    const x0 = snap((wide ? W * 0.62 : W * 0.6) * k - total / 2);
    const y0 = snap((wide ? 104 : 36) * k);
    B.icons.forEach((name, i) => {
      const x = x0 + i * (iconW + gapX);
      placeIcon(g, name, x, y0, iconH);
      text(g, WORDS[i], x + iconW / 2, y0 + iconH + (wide ? 70 : 44) * k, (wide ? 34 : 20) * k, 350, ink(), 'center');
    });
    drawIndxMark(g, (W - (wide ? 64 : 40)) * k - 7 * 5 * k, (wide ? 40 : 18) * k, 5 * k);
  } else if (B.layout === 'slogan') {
    // The slogan as a line of type, a small icon before each word.
    const px = (wide ? 64 : 34) * k, iconH = px * 0.62;
    let x = (wide ? 520 : 300) * k;
    const y = (wide ? 230 : 112) * k;
    g.font = `350 ${px}px ${TYPE}`;
    B.icons.forEach((name, i) => {
      const w = placeIcon(g, name, x, y - iconH * 1.02, iconH);
      x += w + px * 0.32;
      text(g, WORDS[i], x, y, px);
      x += g.measureText(WORDS[i]).width + px * 0.8;
    });
    text(g, SIGNATURE, (W - (wide ? 64 : 40)) * k, (H - (wide ? 44 : 22)) * k, (wide ? 18 : 12) * k, 350, LADDER[B.theme].lv5, 'right');
  } else {
    // Hero: one big icon (the middle one) bleeding off the right edge, the slogan small on the left of it.
    const iconH = H * 1.25 * k;
    placeIcon(g, B.icons[1], (W - (wide ? 560 : 380)) * k, -H * 0.12 * k, iconH);
    const px = (wide ? 40 : 22) * k;
    WORDS.forEach((w, i) => text(g, w, (wide ? 560 : 290) * k, ((wide ? 150 : 66) + i * px / k * 1.3) * k, px));
  }
  const queued = textQueue;
  textQueue = null;
  drawGridOver(g, W * k, H * k, overCell, k);
  queued.forEach(draw => draw());
  return cv;
}

/** The three slogan icons large, each on the ground. */
export function drawSheet(params) {
  B = params;
  return B.icons.map(name => {
    const { canvas } = renderIcon(name, 64);
    const out = canvasOf(canvas.width, canvas.height);
    const g = out.getContext('2d');
    g.fillStyle = ground(); g.fillRect(0, 0, out.width, out.height);
    g.drawImage(canvas, 0, 0);
    return { name, canvas: out };
  });
}

/** One icon small, for the grid of every icon. */
export function drawThumb(name, params) {
  B = params;
  return renderIcon(name, 18).canvas;
}

// ── Morph ───────────────────────────────────────────────────────────────────────────
// Every pixel of one icon is paired with a pixel of the next: each target takes its nearest
// source (a source used twice splits in two), and a source left over joins its nearest target,
// so pixels merge and divide on the way. Each pair moves with an ease and a small delay of its
// own, so the shape flows rather than jumps.
function pairUp(a, b) {
  const used = new Map(), out = [];
  for (const t of b) {
    let best = 0, bd = Infinity;
    a.forEach((p, i) => { const d = (p.x - t.x) ** 2 + (p.y - t.y) ** 2 + (used.get(i) ?? 0) * 3; if (d < bd) { bd = d; best = i; } });
    used.set(best, (used.get(best) ?? 0) + 1);
    out.push({ from: a[best], to: t });
  }
  a.forEach((p, i) => {
    if (used.has(i)) return;
    let best = b[0], bd = Infinity;
    for (const t of b) { const d = (p.x - t.x) ** 2 + (p.y - t.y) ** 2; if (d < bd) { bd = d; best = t; } }
    out.push({ from: p, to: best });
  });
  return out.map((pair, i) => ({ ...pair, delay: ((i * 7919) % 97) / 97 * 0.32 }));
}
const HOLD = 1.5, MOVE = 1.2, STEP = HOLD + MOVE;
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** The morph on a canvas, running until stopped. Recording captures one loop from its start. */
export function createMorph(cv) {
  const m = { params: null, pairs: [], playing: true, recording: false, start: performance.now(), pausedAt: 0, frame: 0 };
  const draw = seconds => {
    B = m.params;
    const g = cv.getContext('2d'), W = cv.width, H = cv.height;
    const cell = Math.round(H / 12);
    g.fillStyle = gridOver() ? ground() : LADDER[B.theme].lv0;
    g.fillRect(0, 0, W, H);
    const t = seconds % (3 * STEP), i = Math.floor(t / STEP), local = t - i * STEP;
    const moving = local > HOLD, p = (local - HOLD) / MOVE;
    const list = moving
      ? m.pairs[i].map(q => { const k = ease(Math.min(1, Math.max(0, (p - q.delay) / (1 - 0.32))));
          return { x: q.from.x + (q.to.x - q.from.x) * k, y: q.from.y + (q.to.y - q.from.y) * k }; })
      : cells(B.icons[i]).list;
    const ic = { w: 7, h: 5, list };
    const ox = Math.round((W / cell - 7) / 2) * cell, oy = 3 * cell;
    const { canvas, pad } = renderMetaball(ic, cell, ink());
    g.drawImage(canvas, ox - pad * cell, oy - pad * cell);
    drawGridOver(g, W, H, cell, 1);
    // The word under the icon, the next one coming in as the pixels move.
    const px = Math.round(cell * 0.9), y = oy + 5 * cell + cell * 2.2;
    const fade = moving ? ease(Math.min(1, Math.max(0, p))) : 0;
    g.globalAlpha = 1 - fade; text(g, WORDS[i], W / 2, y, px, 350, ink(), 'center');
    g.globalAlpha = fade; if (fade > 0) text(g, WORDS[(i + 1) % 3], W / 2, y, px, 350, ink(), 'center');
    g.globalAlpha = 1;
  };
  const loop = now => {
    if (m.params && (m.playing || m.recording)) draw((now - m.start) / 1000);
    m.frame = requestAnimationFrame(loop);
  };
  m.frame = requestAnimationFrame(loop);
  return {
    setParams(params) {
      m.params = params;
      m.pairs = [0, 1, 2].map(i => pairUp(cells(params.icons[i]).list, cells(params.icons[(i + 1) % 3]).list));
      if (!m.playing) draw(m.pausedAt / 1000);
    },
    toggle() {
      m.playing = !m.playing;
      if (m.playing) m.start = performance.now() - m.pausedAt; else m.pausedAt = performance.now() - m.start;
      return m.playing;
    },
    /** Records one loop; resolves with { url, type }, or null when the browser cannot record a canvas. */
    record() {
      const type = ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'].find(t => window.MediaRecorder?.isTypeSupported?.(t));
      if (!type) return Promise.resolve(null);
      return new Promise(resolve => {
        const rec = new MediaRecorder(cv.captureStream(60), { mimeType: type, videoBitsPerSecond: 12_000_000 });
        const chunks = [];
        rec.ondataavailable = e => chunks.push(e.data);
        rec.onstop = () => { m.recording = false; resolve({ url: URL.createObjectURL(new Blob(chunks, { type })), type }); };
        m.start = performance.now(); m.recording = true;
        rec.start();
        setTimeout(() => rec.stop(), 3 * STEP * 1000 + 100);
      });
    },
    stop() { cancelAnimationFrame(m.frame); },
  };
}

// ── Shared helpers ──────────────────────────────────────────────────────────────────
// A deterministic 0..1 per grid position, so a field or a relief stays the same between renders.
export function hash(x, y) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function mix(a, b, t) {
  const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b);
  const c = v => Math.round(v).toString(16).padStart(2, '0');
  return '#' + c(r1 + (r2 - r1) * t) + c(g1 + (g2 - g1) * t) + c(b1 + (b2 - b1) * t);
}

// The tech glass palettes: the boards, the traces, the LED and the accent part, the ground. Classic is
// the moodboard's PCB; terminal green and amber are Anders's swatches (3 Nov 2026), bright, mid and
// background, the bright one glowing.
export const GLASS_PALETTES = {
  classic: { label: 'Classic PCB', board: '#1F4A2B', trace: '#C8A24A', led: '#E5322D', accent: '#C6FF3D', chip: '#0B0B0B', ribbon: '#9A9A9A', ground: '#000000', glow: 0, tint: null, words: 'stacked dark green circuit boards with fine gold traces, black processor chips with fine pins, small grey modules and capacitors, thin grey ribbon cables, a single tiny red LED and one lime-green component' },
  terminal: { label: 'Terminal green', board: '#3D6C58', trace: '#5DD1A4', led: '#5DD1A4', accent: '#5DD1A4', chip: '#0D1C1A', ribbon: '#3D6C58', ground: '#0D1C1A', glow: 0.9, tint: '#5DD1A4', words: 'stacked muted green circuit boards (#3D6C58) with fine glowing terminal-green traces (#5DD1A4), near-black chips with fine pins, capacitors, ribbon cables and a single tiny glowing green LED' },
  amber: { label: 'Amber', board: '#644439', trace: '#C84916', led: '#C84916', accent: '#C84916', chip: '#221713', ribbon: '#644439', ground: '#221713', glow: 0.9, tint: '#C84916', words: 'stacked brown circuit boards (#644439) with fine glowing amber traces (#C84916), near-black chips with fine pins, capacitors, ribbon cables and a single tiny glowing amber LED' },
};

// Film grain over a render: monochrome noise, the same every time for the same pixel.
function grain(cv, amount) {
  if (!amount) return cv;
  const g = cv.getContext('2d', { willReadFrequently: true }), img = g.getImageData(0, 0, cv.width, cv.height), d = img.data;
  const a = amount * 255;
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
    const i = (y * cv.width + x) * 4, n = (hash(x, y) - 0.5) * a;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
  return cv;
}

// The largest side the Voxl renderer draws at, supersampling included.
const MAX_RENDER = 6144;

// ── Voxl: the icon as cubes, physically lit in a dark studio ──────────────────────────
const voxl = (() => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  // The reflections: a black room with a softbox overhead, a strip each side and one behind, so
  // metal and glass read as bands of light on black, as on the moodboard.
  const studio = new THREE.Scene();
  studio.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ color: 0x030303, side: THREE.BackSide })));
  const panel = (w, h, pos, power) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(power, power, power), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); studio.add(m);
  };
  panel(30, 12, [0, 20, 4], 4);
  panel(3, 26, [-18, 4, 10], 2.5);
  panel(3, 26, [18, 4, 6], 1.4);
  panel(40, 3, [0, 6, -20], 3);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(studio, 0.03).texture;
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-2, 6, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.1); rim.position.set(1, 3, -6); scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.12));

  let group = null;
  const MATERIALS = {
    voxl: () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0, envMapIntensity: 0.35 }),
    anodized: () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.34, clearcoat: 0.25, envMapIntensity: 1.3 }),
    aluminium: () => new THREE.MeshPhysicalMaterial({ color: '#D3D4D6', metalness: 1, roughness: 0.3, envMapIntensity: 1.2 }),
    chrome: () => new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', metalness: 1, roughness: 0.03, envMapIntensity: 1.4 }),
    glass: () => new THREE.MeshPhysicalMaterial({ color: '#FFFFFF', metalness: 0, roughness: 0.03, transmission: 1, thickness: 0.6, ior: 1.5, envMapIntensity: 1.6, specularIntensity: 1 }),
  };
  const TINTED = new Set(['voxl', 'anodized']);

  // Items are positions, with an optional scale (sx, sy, sz) and turn about the board's normal (rot).
  function instanced(geo, mat, items) {
    const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length));
    mesh.count = items.length;
    const m4 = new THREE.Matrix4(), col = new THREE.Color(), q = new THREE.Quaternion(), zAxis = new THREE.Vector3(0, 0, 1);
    items.forEach((b, n) => {
      q.setFromAxisAngle(zAxis, b.rot ?? 0);
      m4.compose(new THREE.Vector3(b.x, b.y, b.z), q, new THREE.Vector3(b.sx ?? 1, b.sy ?? 1, b.sz ?? 1));
      mesh.setMatrixAt(n, m4);
      if (b.color) mesh.setColorAt(n, col.set(b.color));
    });
    return mesh;
  }

  // Glass internals, in the glass palette's colours. Simple: a board per pixel, a chip on the one
  // nearest the middle, a few parts, one LED and one accent part. Technical: every board also gets
  // copper traces, chips with pins on all four sides, capacitors, SMD parts, header pins and a short
  // ribbon cable, each from a hash of its cube so a cube keeps its parts between renders.
  function internals(ic, z, V) {
    const P = GLASS_PALETTES[V.glassPalette] ?? GLASS_PALETTES.classic;
    const technical = V.detail === 'technical';
    const g = new THREE.Group();
    const cx = ic.w / 2, cy = ic.h / 2;
    const at = c => ({ x: c.x + 0.5 - cx, y: cy - (c.y + 0.5) });
    const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
    const glow = color => std(color, { emissive: color, emissiveIntensity: P.glow, roughness: 0.4 });
    g.add(instanced(new THREE.BoxGeometry(0.92, 0.92, 0.05), std(P.board), ic.list.map(c => ({ ...at(c), z }))));
    const byMiddle = ic.list.slice().sort((a, b) => Math.hypot(a.x + 0.5 - cx, a.y + 0.5 - cy) - Math.hypot(b.x + 0.5 - cx, b.y + 0.5 - cy));
    const ranked = ic.list.slice().sort((a, b) => hash(a.x, a.y + 3) - hash(b.x, b.y + 3));
    const led = ranked[0], accent = ranked[ranked.length - 1];
    // A small chip on the board, not a black face: a chip filling the cube came back from the image
    // model as one opaque black cube in every result.
    const chips = [{ ...at(byMiddle[0]), z: z + 0.065, sx: 0.34, sy: 0.34 }];
    const traces = [], pins = [], caps = [], smd = [], headers = [], ribbons = [], parts = [];
    for (const c of ic.list) {
      const o = at(c), r = i => hash(c.x * 31 + i * 13, c.y * 17 + i * 7);
      if (!technical) {
        if (c !== byMiddle[0] && hash(c.x, c.y) > 0.45) parts.push({ x: o.x + (hash(c.y, c.x) - 0.5) * 0.4, y: o.y + (hash(c.x + 9, c.y) - 0.5) * 0.4, z: z + 0.07 });
        continue;
      }
      // Traces: thin copper runs along or across the board, a turn of 90° for the across ones.
      for (let i = 0; i < 9; i++) {
        const across = r(i) > 0.5, len = 0.2 + r(i + 20) * 0.62, off = (r(i + 40) - 0.5) * 0.78, mid = (r(i + 60) - 0.5) * (0.84 - len);
        traces.push({ x: o.x + (across ? off : mid), y: o.y + (across ? mid : off), z: z + 0.028, sx: len, rot: across ? Math.PI / 2 : 0 });
      }
      // A chip with pins on four sides, on most boards.
      if (c !== byMiddle[0] && r(1) > 0.3) {
        const size = 0.2 + r(2) * 0.14, ox = o.x + (r(3) - 0.5) * (0.6 - size), oy = o.y + (r(4) - 0.5) * (0.6 - size), n = 4 + Math.floor(r(5) * 4);
        chips.push({ x: ox, y: oy, z: z + 0.055, sx: size, sy: size });
        for (let k = 0; k < n; k++) {
          const t = (k + 0.5) / n * size - size / 2;
          pins.push({ x: ox + t, y: oy + size / 2 + 0.02, z: z + 0.04 }, { x: ox + t, y: oy - size / 2 - 0.02, z: z + 0.04 });
          pins.push({ x: ox + size / 2 + 0.02, y: oy + t, z: z + 0.04, rot: Math.PI / 2 }, { x: ox - size / 2 - 0.02, y: oy + t, z: z + 0.04, rot: Math.PI / 2 });
        }
      }
      for (let i = 0; i < Math.floor(r(6) * 3); i++) caps.push({ x: o.x + (r(70 + i) - 0.5) * 0.7, y: o.y + (r(80 + i) - 0.5) * 0.7, z: z + 0.08 });
      for (let i = 0; i < 6; i++) smd.push({ x: o.x + (r(90 + i) - 0.5) * 0.76, y: o.y + (r(100 + i) - 0.5) * 0.76, z: z + 0.035, rot: r(110 + i) > 0.5 ? Math.PI / 2 : 0, color: i % 2 ? '#C9B79C' : '#1A1A1A' });
      if (r(7) > 0.68) { const hy = o.y + (r(8) > 0.5 ? 0.36 : -0.36); for (let k = 0; k < 5; k++) headers.push({ x: o.x - 0.12 + k * 0.06, y: hy, z: z + 0.09 }); }
      if (r(9) > 0.7) ribbons.push({ x: o.x + (r(10) - 0.5) * 0.3, y: o.y + (r(11) - 0.5) * 0.3, z: z + 0.1, rot: (r(12) - 0.5) * 1.2 });
    }
    g.add(instanced(new THREE.BoxGeometry(1, 1, 0.08), std(P.chip, { roughness: 0.35 }), chips));
    if (parts.length) g.add(instanced(new THREE.BoxGeometry(0.22, 0.12, 0.1), std('#8C8C80', { metalness: 0.6 }), parts));
    if (traces.length) g.add(instanced(new THREE.BoxGeometry(1, 0.014, 0.006), P.glow ? glow(P.trace) : std(P.trace, { metalness: 0.8, roughness: 0.3 }), traces));
    if (pins.length) g.add(instanced(new THREE.BoxGeometry(0.014, 0.045, 0.012), std('#B8B8B0', { metalness: 0.9, roughness: 0.25 }), pins));
    if (caps.length) g.add(instanced(new THREE.CylinderGeometry(0.035, 0.035, 0.11, 16).rotateX(Math.PI / 2), std('#2E2E30', { metalness: 0.5, roughness: 0.4 }), caps));
    if (smd.length) g.add(instanced(new THREE.BoxGeometry(0.05, 0.025, 0.02), std('#FFFFFF'), smd));
    if (headers.length) g.add(instanced(new THREE.BoxGeometry(0.016, 0.016, 0.14), std('#D4B160', { metalness: 0.9, roughness: 0.3 }), headers));
    if (ribbons.length) g.add(instanced(new THREE.BoxGeometry(0.34, 0.1, 0.008), std(P.ribbon), ribbons));
    const ledMesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 8), new THREE.MeshStandardMaterial({ color: P.led, emissive: P.led, emissiveIntensity: 2.5 }));
    ledMesh.position.set(at(led).x + 0.25, at(led).y + 0.25, z + 0.08); g.add(ledMesh);
    const plug = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.14), P.glow ? glow(P.accent) : std(P.accent));
    plug.position.set(at(accent).x, at(accent).y - 0.3, z + 0.08); g.add(plug);
    return g;
  }

  // `faces`: draw every surface by its normal instead of its material (no internals, no background),
  // for the looks that shade by face rather than by light.
  const normals = new THREE.MeshNormalMaterial();
  return function render(V, W, H, faces = false) {
    if (group) { scene.remove(group); group.traverse(n => { n.geometry?.dispose(); n.material?.dispose(); }); }
    group = new THREE.Group();
    const ic = cells(V.icon), res = V.res, s = 1 / res, size = s * (1 - V.gap);
    const layers = Math.max(1, Math.round(V.depth * res));
    const glass = V.mat === 'glass';
    // Glass is one clear column per cube face, so the internals read through it; the rest are cubes.
    const depthOf = glass ? layers * s - s * V.gap : size;
    // Five segments a rounded edge: two looked faceted close up.
    const geo = V.rounded ? new RoundedBoxGeometry(size, size, depthOf, 5, Math.min(size, depthOf) * 0.14) : new THREE.BoxGeometry(size, size, depthOf);
    const tint = TINTED.has(V.mat);
    const items = [];
    let zMin = 0, zMax = 0;
    for (const c of ic.list) for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) {
      const lift = V.relief ? hash(c.x * res + i, c.y * res + j) * V.relief : 0;
      // Two-tone icons: lower ladder levels a darker shade of the colour.
      const color = tint ? (c.level >= 8 ? V.colour : mix(V.colour, '#000000', 0.75 - c.level / 8 * 0.6)) : null;
      const x = c.x + (i + 0.5) * s - ic.w / 2, y = ic.h / 2 - (c.y + (j + 0.5) * s);
      if (glass) items.push({ x, y, z: lift - layers * s / 2, color });
      else for (let k = 0; k < layers; k++) items.push({ x, y, z: lift - (k + 0.5) * s, color });
      zMax = Math.max(zMax, lift); zMin = Math.min(zMin, lift - layers * s);
    }
    const mat = MATERIALS[V.mat]();
    // A palette's glass carries a trace of its bright colour, as tinted acrylic does.
    const paletteTint = GLASS_PALETTES[V.glassPalette]?.tint;
    if (glass && paletteTint) { mat.attenuationColor = new THREE.Color(paletteTint); mat.attenuationDistance = 2.2; }
    group.add(instanced(geo, mat, items));
    if (glass && V.inside && !faces) group.add(internals(ic, -layers * s / 2, V));
    group.rotation.set(THREE.MathUtils.degToRad(V.tilt), THREE.MathUtils.degToRad(V.turn), 0);
    scene.add(group);
    scene.background = V.ground === 'none' ? null : new THREE.Color(groundOf(V));

    const camera = frameCamera(V, ic, group, zMin, zMax, W / H);
    // Supersampled: drawn at up to twice the size and scaled down, since the renderer's own
    // antialiasing misses edges seen through glass and the smallest parts inside it. Capped so the
    // GPU never draws much above 6000 px a side. The face map needs exact faces, not smooth edges.
    const ss = faces ? 1 : Math.max(1, Math.min(2, MAX_RENDER / Math.max(W, H)));
    renderer.setSize(Math.round(W * ss), Math.round(H * ss), false);
    if (faces) { scene.overrideMaterial = normals; scene.background = new THREE.Color('#000000'); }
    renderer.render(scene, camera);
    scene.overrideMaterial = null;
    const cv = canvasOf(W, H), g = cv.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(renderer.domElement, 0, 0, W, H);
    return cv;
  };
})();

// Frame the rotated bounds: the corners of the unrotated box, turned with the group. Shared by the
// render and by voxlAnchors, so a point projected for a callout lands where the render drew it.
function frameCamera(V, ic, group, zMin, zMax, aspect) {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3();
  for (const x of [-ic.w / 2, ic.w / 2]) for (const y of [-ic.h / 2, ic.h / 2]) for (const z of [zMin, zMax])
    box.expandByPoint(new THREE.Vector3(x, y, z).applyMatrix4(group.matrixWorld));
  const center = box.getCenter(new THREE.Vector3()), dim = box.getSize(new THREE.Vector3());
  const halfH = Math.max(dim.y / V.fill, dim.x / (V.fill * aspect)) / 2;
  let camera;
  if (V.ortho) {
    camera = new THREE.OrthographicCamera(-halfH * aspect, halfH * aspect, halfH, -halfH, 0.1, 400);
    camera.position.set(center.x, center.y, center.z + 100);
  } else {
    const fov = 18;
    camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 400);
    camera.position.set(center.x, center.y, center.z + dim.z / 2 + halfH / Math.tan(THREE.MathUtils.degToRad(fov / 2)));
  }
  camera.lookAt(center);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return camera;
}

/** Where each pixel's cube sits in a render of V, as fractions of the frame (0..1 from the top left),
 *  with the cubes the glass internals mark: the red LED, the lime part, the chip. A generated image
 *  keeps the render's framing, so these point into it too. */
export function voxlAnchors(V) {
  const ic = cells(V.icon), res = V.res, s = 1 / res;
  const layers = Math.max(1, Math.round(V.depth * res));
  let zMin = 0, zMax = 0;
  for (const c of ic.list) for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) {
    const lift = V.relief ? hash(c.x * res + i, c.y * res + j) * V.relief : 0;
    zMax = Math.max(zMax, lift); zMin = Math.min(zMin, lift - layers * s);
  }
  const group = new THREE.Group();
  group.rotation.set(THREE.MathUtils.degToRad(V.tilt), THREE.MathUtils.degToRad(V.turn), 0);
  const camera = frameCamera(V, ic, group, zMin, zMax, V.aspect);
  const at = c => {
    const v = new THREE.Vector3(c.x + 0.5 - ic.w / 2, ic.h / 2 - (c.y + 0.5), 0).applyMatrix4(group.matrixWorld).project(camera);
    return { x: (v.x + 1) / 2, y: (1 - v.y) / 2, cell: [c.x, c.y] };
  };
  const cx = ic.w / 2, cy = ic.h / 2;
  const ranked = ic.list.slice().sort((a, b) => hash(a.x, a.y + 3) - hash(b.x, b.y + 3));
  const middle = ic.list.slice().sort((a, b) => Math.hypot(a.x + 0.5 - cx, a.y + 0.5 - cy) - Math.hypot(b.x + 0.5 - cx, b.y + 0.5 - cy))[0];
  return { cubes: ic.list.map(at), led: at(ranked[0]), lime: at(ranked[ranked.length - 1]), chip: at(middle) };
}

export const voxlSize = (aspect, long) => aspect >= 1 ? [long, Math.round(long / aspect)] : [Math.round(long * aspect), long];
export const drawVoxl = (V, long) => drawLook(V, long);
const draw3d = (V, long) => grain(voxl(V, ...voxlSize(V.aspect, long)), V.grain ?? 0);
export const normalsRender = (V, W, H) => voxl(V, W, H, true);

// ── The flat looks: the cubes' faces, found from the normals render ──────────────────
// Every pixel as 0 (ground), 1 (a front face), 2 (a top or bottom face) or 3 (a side face), by the
// axis its normal points along most. The camera turns the object, so "front" is the face looking at
// it, which is what the eye reads as front.
export function faceMap(V, W, H) {
  const cv = voxl(V, W, H, true);
  const d = cv.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
  const out = new Uint8Array(W * H);
  // MeshNormalMaterial is not colour-managed: a face to camera is exactly (128, 128, 255), so the
  // bytes are the normal, packed. (Treating them as sRGB turned fronts into sides.)
  for (let i = 0; i < W * H; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    if (r + g + b < 30) continue;
    const nx = Math.abs(r / 127.5 - 1), ny = Math.abs(g / 127.5 - 1), nz = Math.abs(b / 127.5 - 1);
    out[i] = nz >= nx && nz >= ny ? 1 : ny >= nx ? 2 : 3;
  }
  return out;
}

// The systm's patterns (patterns.css), as which pixels of a tile are ink.
export const SYSTM_PATTERNS = {
  solid: { label: 'Solid', on: () => true },
  checker: { label: 'Checkerboard 2', on: (x, y) => (x + y) % 2 === 0 },
  spaced4: { label: 'Spaced 4', on: (x, y) => (x % 4 === 0 && y % 4 === 0) || (x % 4 === 2 && y % 4 === 2) },
  spaced6: { label: 'Spaced 6', on: (x, y) => (x % 6 === 0 && y % 6 === 0) || (x % 6 === 3 && y % 6 === 3) },
  spaced8: { label: 'Spaced 8', on: (x, y) => (x % 8 === 0 && y % 8 === 0) || (x % 8 === 4 && y % 8 === 4) },
  spaced10: { label: 'Spaced 10', on: (x, y) => (x % 10 === 0 && y % 10 === 0) || (x % 10 === 5 && y % 10 === 5) },
  grid6: { label: 'Grid 6', on: (x, y) => x % 6 === 0 || y % 6 === 0 },
  grid12: { label: 'Grid 12', on: (x, y) => x % 12 === 0 || y % 12 === 0 },
  none: { label: 'Empty', on: () => false },
};
// Patterns' and ASCII's ink: the theme's bright colour (white on black), plain white, or the chosen colour.
const inkOf = V => V.lookInk === 'colour' ? V.colour
  : V.lookInk === 'theme' ? ({ terminal: '#5DD1A4', amber: '#C84916' }[V.glassPalette] ?? '#FFFFFF') : '#FFFFFF';
// The background: the theme's (black for the black theme), the dark ladder's lv0, or none.
const groundOf = V => V.ground === 'lv0' ? LADDER.dark.lv0 : (GLASS_PALETTES[V.glassPalette] ?? GLASS_PALETTES.classic).ground;

// systm patterns: each face filled with its pattern, a pattern pixel `patScale` px of the output.
function drawPattern(V, long) {
  const [W, H] = voxlSize(V.aspect, long), sc = Math.max(1, Math.round(V.patScale * long / 1200));
  const w = Math.ceil(W / sc), h = Math.ceil(H / sc), faces = faceMap(V, w, h);
  const pats = [null, SYSTM_PATTERNS[V.patFront], SYSTM_PATTERNS[V.patTop], SYSTM_PATTERNS[V.patSide]];
  const small = canvasOf(w, h), g = small.getContext('2d'), img = g.createImageData(w, h);
  const [ir, ig, ib] = rgb(inkOf(V)), [gr, gg, gb] = rgb(groundOf(V));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const f = faces[y * w + x], on = f && pats[f]?.on(x, y), j = (y * w + x) * 4;
    img.data[j] = on ? ir : gr; img.data[j + 1] = on ? ig : gg; img.data[j + 2] = on ? ib : gb; img.data[j + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const cv = canvasOf(W, H), og = cv.getContext('2d');
  og.imageSmoothingEnabled = false;
  og.drawImage(small, 0, 0, w * sc, h * sc);
  return cv;
}

// ASCII voxels: the face map sampled into a grid of monospaced cells, a character per face and,
// where two faces meet, an edge character.
export const ASCII_SETS = {
  indx: { label: 'X . :  (the layout grid)', chars: ['X', '.', ':'] },
  code: { label: '# = /', chars: ['#', '=', '/'] },
  blocks: { label: '█ ▓ ▒', chars: ['█', '▓', '▒'] },
  dense: { label: '@ % *', chars: ['@', '%', '*'] },
  binary: { label: '1 0 0', chars: ['1', '0', '0'] },
};
function asciiGrid(V, W, H) {
  const cols = V.asciiCols, cw = W / cols, ch = cw * 1.7, rows = Math.floor(H / ch);
  // The face map at the frame's own proportions (a character is 1.7 times taller than wide, so a
  // cell samples Sy pixels down for every S across); rendered at the grid's proportions instead,
  // the camera framed a scene 1.7 times too wide and the icons came out narrow.
  const S = 4, Sy = Math.round(S * ch / cw), fw = cols * S, faces = faceMap(V, fw, rows * Sy);
  const at = (c, r) => {
    if (c < 0 || r < 0 || c >= cols || r >= rows) return 0;
    const count = [0, 0, 0, 0];
    for (let y = 0; y < Sy; y++) for (let x = 0; x < S; x++) count[faces[(r * Sy + y) * fw + c * S + x]]++;
    return count[1] + count[2] + count[3] < S * Sy * 0.35 ? 0 : count.indexOf(Math.max(count[1], count[2], count[3]), 1);
  };
  const cls = [];
  for (let r = 0; r < rows; r++) { cls.push([]); for (let c = 0; c < cols; c++) cls[r].push(at(c, r)); }
  const set = ASCII_SETS[V.asciiSet].chars;
  const lines = cls.map((row, r) => row.map((f, c) => {
    if (!f) return ' ';
    // Edges only along the outline, where a face meets the ground: between two faces the faces are
    // often one or two cells wide, and edge characters there swallow the faces.
    if (V.asciiEdges) {
      const v = !(cls[r - 1]?.[c]) || !(cls[r + 1]?.[c]);
      const hz = !row[c - 1] || !row[c + 1];
      if (v && hz) return '+';
      if (v) return '-';
      if (hz) return '|';
    }
    return set[f - 1];
  }).join(''));
  return { lines, cw, ch, cols, rows };
}
export function voxlAsciiText(V) { return asciiGrid(V, ...voxlSize(V.aspect, 1200)).lines.join('\n').replace(/ +$/gm, ''); }
function drawAscii(V, long) {
  const [W, H] = voxlSize(V.aspect, long), { lines, cw, ch, rows } = asciiGrid(V, W, H);
  const cv = canvasOf(W, H), g = cv.getContext('2d');
  g.fillStyle = groundOf(V); g.fillRect(0, 0, W, H);
  g.font = `400 ${ch * 0.82}px ${MONO_FONT}`;
  g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillStyle = inkOf(V);
  const oy = (H - rows * ch) / 2;
  lines.forEach((line, r) => [...line].forEach((c, i) => { if (c !== ' ') g.fillText(c, (i + 0.5) * cw, oy + (r + 0.5) * ch); }));
  return cv;
}
const MONO_FONT = "'Geist Mono', ui-monospace, monospace";

/** The Voxl tab's object in its chosen look. */
export function drawLook(V, long) {
  if (V.look === 'ascii') return drawAscii(V, long);
  if (V.look === 'pattern') return drawPattern(V, long);
  return draw3d(V, long);
}

/** The flat icon in the render's framing, white on black: the exact shape for the model to keep. */
export function drawSilhouette(V, long) {
  const [W, H] = voxlSize(V.aspect, long), ic = cells(V.icon);
  const cv = canvasOf(W, H), g = cv.getContext('2d');
  g.fillStyle = '#000000'; g.fillRect(0, 0, W, H);
  const cell = Math.floor(Math.min(H * V.fill / ic.h, W * V.fill / ic.w));
  const x0 = Math.round((W - ic.w * cell) / 2), y0 = Math.round((H - ic.h * cell) / 2);
  g.fillStyle = '#FFFFFF';
  for (const c of ic.list) g.fillRect(x0 + c.x * cell, y0 + c.y * cell, cell, cell);
  return cv;
}

// The prompt that goes with the render: the moodboard's PRM-00 base and material lines, told that
// the render is the composition to keep.
export function voxlPrompt(V) {
  const colour = `${V.colourName.toLowerCase()} (${V.colour.toUpperCase()})`;
  const front = V.ortho && Math.abs(V.turn) < 3 && Math.abs(V.tilt) < 3;
  const keep = `Image 1 is the composition: keep its silhouette, the number and layout of the cubes, the proportions, the camera angle${V.mat === 'voxl' || V.mat === 'anodized' ? ' and the colour' : ''} exactly. Image 2 is the flat pixel icon it was built from${V.res > 1 ? `; every pixel of it is a ${V.res}×${V.res} block of cubes` : ', one cube per pixel'}.`;
  const material = {
    voxl: `Make it real: matte injection-moulded plastic in ${colour}, each cube with softly rounded edges and a hairline gap so the grid stays readable. Fine surface texture, no gloss, no gradients.`,
    glass: V.inside
      ? `Make it real: a thick, perfectly clear glass shell in exactly this shape, fused cubes with polished faces, rounded edges and clean refraction. The shell is packed with the inside of a small computer, as if it were the housing: ${(GLASS_PALETTES[V.glassPalette] ?? GLASS_PALETTES.classic).words}. Every internal part sharp and readable through the glass, the boards following the shape of each cube.`
      : 'Make it real: a solid block of clear optical glass in this shape, polished cube faces, internal reflections and caustics only, a thin bright highlight along the top edges.',
    anodized: `Make it real: machined from solid aluminium, satin anodized in ${colour}, fine horizontal brushing on the front faces, crisp bead-blasted edges with a thin bright chamfer. A precision industrial object, like a high-end synthesizer part.`,
    aluminium: 'Make it real: machined from solid aluminium, natural finish, fine horizontal brushing on the front faces, bead-blasted edges with a thin bright chamfer. Quiet and precise, hardware-honest.',
    chrome: 'Make it real: flawless mirror-polished chrome, reflecting a dark studio with a single softbox strip so the faces read as bands of black and white. Hairline seams between cubes, no scratches, no colour tint.',
  }[V.mat];
  const bg = groundOf(V);
  const base = `Studio product render on ${bg === '#000000' ? 'a pure black background' : `a solid ${bg} background`}. ${front ? 'Front orthographic view' : 'Camera as in image 1'}, object centred and filling about ${Math.round(V.fill * 100)}% of the frame. Soft overhead key light, faint rim light from behind, very subtle contact shadow. No text, no logos, no props, no floor line. Ultra clean, crisp edges, high detail.`;
  return `${keep}\n\n${material}\n\n${base}`;
}

/** The icon's cubes as text for the prompt: the exact count and the grid, X a cube and . empty.
 *  An image model keeps a picture's material better than its count; told the layout in words, it
 *  stops adding blocks around the shape or fusing neighbours. */
export function voxlLayout(V) {
  const icon = ICONS[V.icon], n = cells(V.icon).list.length;
  const rows = icon.rows.map(r => r.replace(/[^.]/g, 'X')).join('\n');
  const deep = V.depth === 1 ? 'one cube deep' : `${V.depth} cubes deep`;
  const each = V.res > 1 ? ` Each X is a ${V.res}×${V.res} block of small cubes, ${deep}.` : ` Each X is one cube, ${deep}.`;
  // Empty positions the cubes close around (search's ring): the model reads a ring as a block with
  // a hole and fills it in, so these are named. Found as the empty cells not reachable from the edge.
  const holes = enclosedEmpty(icon);
  const ring = holes ? ` The cubes close around ${holes === 1 ? 'one empty position' : `${holes} empty positions`} inside the shape: that space stays empty and open; the shape is not a solid block and not a grid.` : '';
  return `Cube layout: exactly ${n} ${V.res > 1 ? 'blocks' : 'cubes'}, no more and no fewer, in this grid (X = ${V.res > 1 ? 'a block' : 'a cube'}, . = empty space), as seen from the front:\n${rows}\n${each.trim()}${ring} Do not add any cube or block outside these positions, and keep empty positions empty.`;
}

function enclosedEmpty(icon) {
  const H = icon.rows.length, W = icon.rows[0].length;
  const empty = (x, y) => icon.rows[y][x] === '.';
  const seen = new Set(), stack = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
    if ((x === 0 || y === 0 || x === W - 1 || y === H - 1) && empty(x, y)) { seen.add(y * W + x); stack.push([x, y]); }
  while (stack.length) {
    const [x, y] = stack.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || !empty(nx, ny) || seen.has(ny * W + nx)) continue;
      seen.add(ny * W + nx); stack.push([nx, ny]);
    }
  }
  let holes = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (empty(x, y) && !seen.has(y * W + x)) holes++;
  return holes;
}

// ── Icon field: the mark knocked out of a field of icons ─────────────────────────────
export const FIELD_SIZES = {
  board: [1600, 1000, 'Moodboard, 1600 × 1000'], profile: [1584, 396, 'LinkedIn profile, 1584 × 396'],
  company: [1128, 191, 'LinkedIn company, 1128 × 191'], wide: [1920, 1080, '16:9, 1920 × 1080'],
  square: [1080, 1080, 'Square, 1080 × 1080'], portrait: [1080, 1350, 'Portrait post, 1080 × 1350'],
  posterA: [1240, 1754, 'Poster, A series (1 : √2)'], poster5070: [1000, 1400, 'Poster, 50 × 70'],
};
const POOLS = { main: n => ICONS[n].board === 'main', all: () => true };
export const poolSize = pool => ICON_NAMES.filter(n => n !== 'indx' && ICONS[n].w === 7 && ICONS[n].h === 5 && POOLS[pool](n)).length;

// The field's colours: ground, grid lines, dots, icons, and the dimmed icons of the inverse. The
// ladder follows the field's theme; terminal black is the dark ladder (lv0, lv3, lv6, lv4);
// terminal green and amber are Anders's swatches.
export const FIELD_PALETTES = {
  ladder: { label: 'The ladder' },
  black: { label: 'Terminal black', ground: '#080809', stroke: '#393941', dots: '#393941', icon: '#EFEFEF', dim: '#565661' },
  terminal: { label: 'Terminal green', ground: '#0D1C1A', stroke: '#3D6C58', dots: '#3D6C58', icon: '#5DD1A4', dim: '#3D6C58' },
  amber: { label: 'Amber', ground: '#221713', stroke: '#644439', dots: '#644439', icon: '#C84916', dim: '#644439' },
};

/** The field at `k`x. Every icon is used once: a cell with none left stays empty, counted in `empty`.
 *  The cells shrink, if they must, until the mark fits with a cell to spare around it (`fitted`).
 *  With the grid on, a cell is a whole number of icon pixels (the 7 by 5 icon, `cellPad` pixels
 *  round it and one more above and below, so it stays square): the lines run unbroken along every
 *  cell edge, the dots cover the whole field at the icon pixel's pitch, and the icons sit on them. */
export function drawField(F, k) {
  const [W0, H0] = FIELD_SIZES[F.size];
  const W = W0 * k, H = H0 * k;
  const mark = cells('indx'), want0 = F.cell * k;
  const grid = F.cellGrid || F.cellDots;
  // Auto puts the mark at the right third on the LinkedIn banners, clear of the profile photo and
  // the page logo on the left, and in the middle elsewhere.
  const banner = F.size === 'profile' || F.size === 'company';
  const pos = F.pos === 'auto' || !F.pos ? (banner ? 'right' : 'centre') : F.pos;
  // Fill the frame: the grid runs to every edge and cells are cut where they meet it. Otherwise whole
  // cells with the same margin on all four sides.
  const bleed = F.edges === 'fill';
  const poolSize = ICON_NAMES.filter(n => n !== 'indx' && ICONS[n].w === 7 && ICONS[n].h === 5 && POOLS[F.pool](n)).length;
  // The layout for a cell size: how many whole cells fit, and how many cells a mark pixel takes across
  // and down (fewer across than down on cells wider than tall, so the mark stays about square), as
  // many as F.scale allows with a cell to spare round the mark.
  const layout = (cw, ch, trim = false) => {
    let cols = Math.max(1, Math.floor(W / cw)), rows = Math.max(1, Math.floor(H / ch));
    const sy = Math.max(1, Math.min(F.scale, Math.floor((rows - 2) / mark.h)));
    const sx = Math.max(1, Math.min(Math.round(sy * ch / cw), Math.floor((cols - 2) / mark.w)));
    const fits = rows >= mark.h * sy + 2 && cols >= mark.w * sx + 2;
    const markCells = F.mode === 'knockout' ? mark.list.length * sx * sy : 0;
    // Centred on whole cells: as many rows above the mark as below (and columns, when it is centred
    // across). No cell is ever cut by the frame, so this is found, not forced.
    // `trim`: a row (or column) less where that is what centres the mark, the half cell it leaves an
    // even margin round the field.
    if (bleed) return { cw, ch, cols, rows, sx, sy, fits, even: true, free: (Math.ceil(W / cw) + 1) * (Math.ceil(H / ch) + 1) - markCells };
    if (trim && (rows - mark.h * sy) % 2) rows--;
    if (trim && pos === 'centre' && (cols - mark.w * sx) % 2) cols--;
    const even = (rows - mark.h * sy) % 2 === 0 && (pos !== 'centre' || (cols - mark.w * sx) % 2 === 0);
    return { cw, ch, cols, rows, sx, sy, fits: fits && rows >= mark.h * sy + 2 && cols >= mark.w * sx + 2, even, free: cols * rows - markCells };
  };
  const full = Gc => !(F.fillAll ?? true) || Gc.free <= poolSize;
  const q = grid ? Math.max(0, Math.round(F.cellPad ?? 2)) : 0;
  const nx = grid ? 7 + 2 * q : 1, ny = grid ? 5 + 2 * q : 1;
  // The cell is nx by ny pitches: on the grid the 7 by 5 icon and `q` round it, so the dots run on
  // unbroken and the icons sit on them; without the grid a square of one "pitch", the cell itself.
  const p0 = grid ? want0 / nx : want0;
  let G = null;
  if (bleed) {
    // Fill the frame: the slider's pitch, grown until every cell (the cut ones too) gets an icon.
    let p = p0, Gc = layout(nx * p, ny * p);
    while (!full(Gc) && Gc.fits) { p *= 1.04; Gc = layout(nx * p, ny * p); }
    G = { ...Gc, pitch: grid ? p : 0, pad: q };
  } else {
    // The same margin on all four sides. For a number of columns and rows there is one pitch that
    // does it: W - 2m = cols·nx·p and H - 2m = rows·ny·p. Of those that centre the mark on whole
    // cells, fit it with a cell to spare and (unless empty cells are allowed) give every cell an
    // icon, the one nearest the slider's size with a margin nearest half a cell.
    let best = Infinity;
    for (let rows = 3; rows <= 80; rows++) for (let cols = 3; cols <= 120; cols++) {
      // cols·nx = rows·ny has no single pitch; only a square frame takes it, with half a cell round.
      const d = cols * nx - rows * ny;
      if (d === 0 && W !== H) continue;
      const p = d === 0 ? W / (cols * nx + ny) : (W - H) / d;
      if (!(p > 0.5 * k) || !isFinite(p)) continue;
      const m = (W - cols * nx * p) / 2, mv = (H - rows * ny * p) / 2;
      if (m < 0 || mv < 0 || Math.abs(m - mv) > 0.5 * k || m > ny * p * 1.5) continue;
      const cw = nx * p, ch = ny * p;
      const sy = Math.max(1, Math.min(F.scale, Math.floor((rows - 2) / mark.h)));
      const sx = Math.max(1, Math.min(Math.round(sy * ch / cw), Math.floor((cols - 2) / mark.w)));
      if (rows < mark.h * sy + 2 || cols < mark.w * sx + 2) continue;
      if ((rows - mark.h * sy) % 2 || (pos === 'centre' && (cols - mark.w * sx) % 2)) continue;
      const free = cols * rows - (F.mode === 'knockout' ? mark.list.length * sx * sy : 0);
      if ((F.fillAll ?? true) && free > poolSize) continue;
      const score = Math.abs(Math.log(p / p0)) + 0.6 * Math.abs(m - ch / 2) / ch;
      if (score < best) { best = score; G = { cw, ch, cols, rows, sx, sy, pitch: grid ? p : 0, pad: q, margin: m }; }
    }
    if (!G) {
      // Nothing gives an even margin here: whole cells, centred, as before.
      let p = p0, Gc = layout(nx * p, ny * p, true);
      while (!full(Gc) && Gc.fits) { p *= 1.04; Gc = layout(nx * p, ny * p, true); }
      G = { ...Gc, pitch: grid ? p : 0, pad: q };
    }
  }
  const { cw, ch, sx, sy, pitch, pad } = G;
  let { cols, rows } = G;
  const fitted = Math.abs(cw - want0) > k;
  const mw = mark.w * sx, mh = mark.h * sy;
  let gx, gy, mc, mr;
  if (bleed) {
    // The mark placed exactly (centred down; across at its centre or third, a cell inside the frame),
    // the grid laid out from it to every edge.
    const mxPix = Math.round(Math.min(Math.max(W * (pos === 'left' ? 0.25 : pos === 'right' ? 0.75 : 0.5) - mw * cw / 2, cw), W - (mw + 1) * cw));
    const myPix = Math.round(H / 2 - mh * ch / 2);
    mc = Math.ceil(mxPix / cw); mr = Math.ceil(myPix / ch);
    gx = mxPix - mc * cw; gy = myPix - mr * ch;
    cols = Math.ceil((W - gx) / cw); rows = Math.ceil((H - gy) / ch);
  } else {
    // The margin, the same on all four sides where a layout above found one.
    gx = (W - cols * cw) / 2; gy = (H - rows * ch) / 2;
    mc = pos === 'centre' ? (cols - mw) / 2 : Math.min(Math.max(Math.round(cols * (pos === 'left' ? 0.25 : 0.75) - mw / 2), 1), cols - mw - 1);
    mr = (rows - mh) / 2 | 0;
  }
  // A design's text blocks (the posters): rectangles of cells with no icons and no dots, the lines
  // only round their outline. The design may move the mark (`mark: { c, r }`) or leave it out (null).
  let showMark = true;
  const blockOf = new Map();
  if (F.blocks) {
    const B = F.blocks({ cols, rows, mw, mh, mc, mr });
    if (B.mark === null) showMark = false; else if (B.mark) { mc = B.mark.c; mr = B.mark.r; }
    for (const b of B.blocks ?? []) for (let r = b.r; r < b.r + b.h; r++) for (let c = b.c; c < b.c + b.w; c++) blockOf.set(r * 10000 + c, b.id);
  }
  const blockAt = (c, r) => blockOf.get(r * 10000 + c) ?? 0;
  const inMarkAt = (c, r) => showMark && c >= mc && r >= mr && c < mc + mw && r < mr + mh && mark.filled(Math.floor((c - mc) / sx), Math.floor((r - mr) / sy));
  const knocked = (c, r) => F.mode === 'knockout' && inMarkAt(c, r);
  // An edge is drawn unless both its cells are inside the mark, or inside the same text block.
  const inner = (c1, r1, c2, r2) => (knocked(c1, r1) && knocked(c2, r2)) || (blockAt(c1, r1) !== 0 && blockAt(c1, r1) === blockAt(c2, r2));
  // The pool shuffled by the seed (Fisher-Yates on the hash), dealt out one icon per cell.
  const pool = ICON_NAMES.filter(n => n !== 'indx' && ICONS[n].w === 7 && ICONS[n].h === 5 && POOLS[F.pool](n));
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(hash(i, F.seed * 7919 + 1) * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const L = LADDER[F.theme], pal = FIELD_PALETTES[F.palette] ?? FIELD_PALETTES.ladder;
  const C = pal.ground ? pal : { ground: L.lv0, stroke: L.lv2, dots: L.lv3, icon: L.lv8, dim: L.lv3 };
  const px = grid ? pitch : cw * F.icon / 7;
  const cv = canvasOf(W, H), g = cv.getContext('2d');
  g.fillStyle = C.ground; g.fillRect(0, 0, W, H);

  if (F.cellDots) {
    // Every pitch of the field, one dot, except inside the knocked-out mark.
    const dot = Math.max(k, Math.round(pitch * 0.16));
    g.fillStyle = C.dots;
    for (let y = 0; y < rows * ny; y++) for (let x = 0; x < cols * nx; x++) {
      const cx = Math.floor(x / nx), cy = Math.floor(y / ny);
      if (knocked(cx, cy) || blockAt(cx, cy)) continue;
      g.fillRect(Math.round(gx + (x + 0.5) * pitch - dot / 2), Math.round(gy + (y + 0.5) * pitch - dot / 2), dot, dot);
    }
  }
  if (F.cellGrid) {
    // Each cell edge, unless both its cells are in the knocked-out mark: the lines run edge to edge
    // and stop at the mark.
    const lw = Math.max(1, Math.round(k));
    g.fillStyle = C.stroke;
    for (let r = 0; r < rows; r++) for (let c = 0; c <= cols; c++) {
      if (inner(c - 1, r, c, r)) continue;
      const x0 = Math.round(gx + c * cw), y0 = Math.round(gy + r * ch), y1 = Math.round(gy + (r + 1) * ch);
      g.fillRect(x0 - Math.floor(lw / 2), y0, lw, y1 - y0);
    }
    for (let r = 0; r <= rows; r++) for (let c = 0; c < cols; c++) {
      if (inner(c, r - 1, c, r)) continue;
      const x0 = Math.round(gx + c * cw), x1 = Math.round(gx + (c + 1) * cw), y0 = Math.round(gy + r * ch);
      g.fillRect(x0, y0 - Math.floor(lw / 2), x1 - x0, lw);
    }
  }

  const spots = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!knocked(c, r) && !blockAt(c, r)) spots.push({ r, c, inMark: inMarkAt(c, r) });
  // More cells than icons: the cells left empty are scattered by the hash, never the mark's own
  // (in the inverse they draw it), rather than collecting at the end of the field.
  const empty = Math.max(0, spots.length - pool.length);
  const skip = new Set(spots.filter(s => !s.inMark).sort((a, b) => hash(a.c + 5, a.r + F.seed * 13) - hash(b.c + 5, b.r + F.seed * 13)).slice(0, empty));
  let next = 0, shown = 0;
  for (const s of spots) {
    if (skip.has(s) || next >= pool.length) continue;
    const { r, c, inMark } = s;
    const sparked = hash(c * 7 + 3, r * 11 + F.seed * 101) < F.spark;
    const color = F.mode === 'knockout' ? (sparked ? F.colour : C.icon)
      : F.mode === 'inverse' ? (inMark ? F.colour : C.dim)
      : (inMark ? F.colour : C.icon);
    const ic = cells(pool[next++]);
    const { canvas, pad: rp } = F.style === 'metaball' ? renderMetaball(ic, px, color, F.reach, F.corner) : renderFlat(ic, px, color);
    // On the grid the icon sits on the dots, `pad` pitches in from the cell's edges.
    const x = grid ? gx + c * cw + pad * pitch : gx + c * cw + (cw - 7 * px) / 2;
    const y = grid ? gy + r * ch + pad * pitch : gy + r * ch + (ch - 5 * px) / 2;
    g.drawImage(canvas, Math.round(x - rp * px), Math.round(y - rp * px));
    shown++;
  }
  return { canvas: cv, empty, shown, pool: pool.length, fitted, cell: cw / k, scale: sy, pad, padAsked: Math.round(F.cellPad ?? 2), margin: [gx / k, gy / k], around: [mc, cols - mc - mw, mr, rows - mr - mh],
    // The grid itself, for a design that sets type in its blocks; and the colours it was drawn in.
    grid: { gx, gy, cw, ch, cols, rows, pitch, pad }, colours: C };
}

// ── Posters: the icon field as the grid, the type set in blocks of its cells ──────────
export const POSTER_DESIGNS = {
  index: { label: 'The Index' },
  words: { label: 'Three words' },
  indexed: { label: 'Indexed' },
};
export const POSTER_SIZES = { posterA: FIELD_SIZES.posterA, poster5070: FIELD_SIZES.poster5070 };

// The largest size, up to `maxH`, at which the line fits `maxW`.
function fitSize(g, text, maxW, maxH, weight = 350, font = TYPE) {
  g.font = `${weight} ${maxH}px ${font}`;
  const w = g.measureText(text).width;
  return w > maxW ? maxH * maxW / w : maxH;
}

/** A poster at `k`x: the icon field with the design's blocks, and the type set in them, on the grid:
 *  text starts a pitch in from the block's left line and sits on its bottom line. */
export function drawPoster(D, k) {
  const pal = FIELD_PALETTES[D.palette] ?? FIELD_PALETTES.terminal;
  const blocks = ({ cols, rows, mw, mh }) => {
    const span = cols - 2, foot = { c: 1, r: rows - 2, w: span, h: 1, id: 9 };
    if (D.design === 'index') {
      // Top: the three words over three rows. Middle: the mark. Foot: the lockup and the part line.
      const top = 3, mr = Math.round((top + 1 + rows - 3 - mh) / 2);
      return { mark: { c: Math.floor((cols - mw) / 2), r: mr }, blocks: [{ c: 1, r: 1, w: span, h: top, id: 1 }, foot] };
    }
    if (D.design === 'words') {
      // A word per block down the left, its icon large in the block beside it; no mark.
      const ww = Math.max(3, Math.round(cols * 0.55)), iw = Math.max(2, Math.min(4, cols - ww - 3));
      const rowsAt = [2, Math.round(rows / 2) - 1, rows - 6];
      return { mark: null, blocks: rowsAt.flatMap((r, i) => [{ c: 1, r, w: ww, h: 2, id: 10 + i }, { c: 1 + ww + 1, r, w: iw, h: 2, id: 20 + i }]).concat(foot) };
    }
    if (D.design === 'indexed') {
      // A large block of indexed text in the middle of the field.
      const h = Math.max(4, Math.round(rows * 0.55)), r0 = Math.round((rows - h) / 2) - 1;
      return { mark: null, blocks: [{ c: 1, r: r0, w: span, h, id: 1 }, foot] };
    }
    return { blocks: [foot] };
  };
  const F = {
    size: D.size, mode: 'knockout', cell: D.cell ?? 70, icon: 0.5, scale: D.design === 'index' ? 2 : 1, pos: 'centre', pool: 'all',
    spark: D.spark ?? 0.03, style: 'flat', reach: 0.45, corner: 0, theme: 'dark', seed: D.seed ?? 0, colour: D.colour,
    palette: D.palette, cellGrid: true, cellDots: true, cellPad: D.pad ?? 1, fillAll: true, edges: 'even', blocks,
  };
  const r = drawField(F, k), g = r.canvas.getContext('2d'), G = r.grid, C = r.colours;
  const rect = b => ({ x: G.gx + b.c * G.cw, y: G.gy + b.r * G.ch, w: b.w * G.cw, h: b.h * G.ch });
  const inset = Math.max(G.pitch, G.cw * 0.08);
  // Bold and uppercase on the posters (3 Nov 2026): the words read across a room.
  const line = (text, b, weight = 700, colour = C.icon, maxH) => {
    const R = rect(b), size = fitSize(g, text, R.w - 2 * inset, maxH ?? R.h * 0.86, weight);
    g.font = `${weight} ${size}px ${TYPE}`; g.letterSpacing = `${-size * 0.01}px`;
    g.fillStyle = colour; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillText(text, R.x + inset - size * 0.04, R.y + R.h - inset * 0.7 - size * 0.02);
    g.letterSpacing = '0px';
  };
  const footB = { c: 1, r: G.rows - 2, w: G.cols - 2, h: 1 };
  // The foot row: the mark at its left end, indx.co at its right.
  const foot = () => {
    const R = rect(footB), h = Math.min(R.h * 0.42, 30 * k);
    brandMark(g, R.x + inset, R.y + (R.h - h) / 2, h);
    wordmark(g, R.x + R.w - inset, R.y + (R.h - h * 0.8) / 2, h * 0.8, 'right');
  };
  if (D.design === 'index') {
    line('SEARCH. ASK. OBSERVE.', { c: 1, r: 1, w: G.cols - 2, h: 3 });
    foot();
  } else if (D.design === 'indexed') {
    const h = Math.max(4, Math.round(G.rows * 0.55)), r0 = Math.round((G.rows - h) / 2) - 1;
    const R = rect({ c: 1, r: r0, w: G.cols - 2, h });
    const theme = { terminal: 'terminal', amber: 'amber', black: 'black' }[D.palette] ?? 'black';
    const t = drawIndexed({ ...(D.type ?? {}), frame: 'index', theme, box: [R.w / k, R.h / k], bare: true }, k).canvas;
    g.drawImage(t, Math.round(R.x), Math.round(R.y), Math.round(R.w), Math.round(R.h));
    foot();
  } else {
    const ww = Math.max(3, Math.round(G.cols * 0.55)), iw = Math.max(2, Math.min(4, G.cols - ww - 3));
    const rowsAt = [2, Math.round(G.rows / 2) - 1, G.rows - 6];
    PACK_WORDS.forEach((w, i) => {
      line(w.word.toUpperCase(), { c: 1, r: rowsAt[i], w: ww, h: 2 });
      // The icon large, centred in its block, in the accent.
      const R = rect({ c: 1 + ww + 1, r: rowsAt[i], w: iw, h: 2 }), ic = cells(w.icon);
      const cell = Math.floor(Math.min((R.w - 2 * inset) / 7, (R.h - 2 * inset) / 5));
      const { canvas, pad } = renderFlat(ic, cell, D.colour);
      g.drawImage(canvas, Math.round(R.x + (R.w - 7 * cell) / 2 - pad * cell), Math.round(R.y + (R.h - 5 * cell) / 2 - pad * cell));
    });
    foot();
  }
  return r.canvas;
}

// ── Indexed text: type on a character grid, read the way Indx reads it ───────────────
// After Ksawery Kirklewski's Symphony in Acid (for Max Cooper): every letter sits in a cell of one
// character grid, justified so lines fill the measure; words are units that a small set of moves
// acts on (box, invert, redact, swap a letter for a glyph, thin out), and density does the rest, from
// a sentence to a wall of text. Here the moves are Indx's own: the query's trigrams find the hits
// (boxed in the accent, the matching letters picked out), the near misses get the second tone, and a
// glyph swapped in for a letter is a pixl icon.
export const TYPE_FRAMES = {
  sentence: { label: 'Sentence', cols: 16 },
  block: { label: 'Block', cols: 32 },
  index: { label: 'Index', cols: 64, fill: true },
  sparse: { label: 'Sparse', cols: 64, fill: true, sparse: true },
};
// Each theme: ground, ink, the hit's box, the near miss's box, the dim of the sparse frame, and the
// set Mixed boxes draws from. Black, paper, terminal green and amber are the brand's; the loud flat
// grounds below them are experiments (3 Nov 2026), after the reference's yellow, red and blue.
export const TYPE_THEMES = {
  black: { label: 'Black', ground: '#080809', ink: '#EFEFEF', hit: '#FF4238', near: '#393941', dim: '#565661', mix: ['#FF4238', '#6B9EFF', '#393941', '#EFEFEF'] },
  paper: { label: 'Paper', ground: '#FFFFFF', ink: '#080809', hit: '#0000FF', near: '#CFCFCF', dim: '#757575', mix: ['#0000FF', '#080809', '#CFCFCF', '#FF4238', '#72F5C6'] },
  terminal: { label: 'Terminal green', ground: '#0D1C1A', ink: '#5DD1A4', hit: '#EFEFEF', near: '#3D6C58', dim: '#3D6C58', mix: ['#EFEFEF', '#3D6C58', '#5DD1A4'] },
  amber: { label: 'Amber', ground: '#221713', ink: '#C84916', hit: '#EFEFEF', near: '#644439', dim: '#644439', mix: ['#EFEFEF', '#644439', '#C84916'] },
  // Experiments (3 Nov 2026), after the reference: loud flat grounds and sets of five to seven
  // colours, which Mixed boxes, the panels and the table's cells all draw from.
  primary: { label: 'Primary on white (experiment)', ground: '#FFFFFF', ink: '#080809', hit: '#0000FF', near: '#C8C8C8', dim: '#8F8F97', mix: ['#0000FF', '#FF2A1A', '#00E5FF', '#080809', '#C8C8C8', '#FFF200', '#4A4A4A'] },
  night: { label: 'Primary on black (experiment)', ground: '#080809', ink: '#FFFFFF', hit: '#FF2A1A', near: '#4A4A4A', dim: '#5A5A62', mix: ['#0000FF', '#FF2A1A', '#00E5FF', '#FFFFFF', '#C8C8C8', '#FFF200', '#4A4A4A'] },
  yellow: { label: 'Acid yellow (experiment)', ground: '#FFF200', ink: '#080809', hit: '#0000FF', near: '#080809', dim: '#8F8F97', mix: ['#0000FF', '#080809', '#FFFFFF', '#FF2A1A', '#00E5FF', '#C8C8C8'] },
  red: { label: 'Signal red (experiment)', ground: '#FF2A1A', ink: '#080809', hit: '#0000FF', near: '#080809', dim: '#8F2A20', mix: ['#0000FF', '#080809', '#FFFFFF', '#FFF200', '#C8C8C8', '#00E5FF'] },
  blue: { label: 'Pure blue (experiment)', ground: '#0000FF', ink: '#FFFFFF', hit: '#FF2A1A', near: '#080809', dim: '#6B6BFF', mix: ['#080809', '#FFFFFF', '#FF2A1A', '#00E5FF', '#FFF200', '#C8C8C8'] },
  cyan: { label: 'Cyan (experiment)', ground: '#00E5FF', ink: '#080809', hit: '#0000FF', near: '#FFFFFF', dim: '#2B8F9C', mix: ['#0000FF', '#080809', '#FFFFFF', '#FF2A1A', '#FFF200'] },
  teal: { label: 'Teal (experiment)', ground: '#72F5C6', ink: '#080809', hit: '#0000FF', near: '#080809', dim: '#3D8F72', mix: ['#0000FF', '#080809', '#FFFFFF', '#FF4238', '#FFF200', '#6B2BFF'] },
  lime: { label: 'Lime (experiment)', ground: '#C6FF3D', ink: '#080809', hit: '#080809', near: '#0000FF', dim: '#6E8F22', mix: ['#080809', '#0000FF', '#FFFFFF', '#FF4238', '#FF3EA5', '#00E5FF'] },
  pink: { label: 'Hot pink (experiment)', ground: '#FF3EA5', ink: '#080809', hit: '#0000FF', near: '#FFF200', dim: '#A3246A', mix: ['#0000FF', '#FFF200', '#080809', '#FFFFFF', '#00E5FF', '#6B2BFF'] },
  orange: { label: 'Orange (experiment)', ground: '#FF6A00', ink: '#080809', hit: '#0000FF', near: '#FFFFFF', dim: '#A34400', mix: ['#0000FF', '#080809', '#FFFFFF', '#72F5C6', '#FFF200', '#FF3EA5'] },
  violet: { label: 'Violet (experiment)', ground: '#6B2BFF', ink: '#FFFFFF', hit: '#FFF200', near: '#080809', dim: '#A98BFF', mix: ['#FFF200', '#FF3EA5', '#FFFFFF', '#080809', '#00E5FF', '#FF6A00'] },
  grey: { label: 'Concrete (experiment)', ground: '#C8C8C8', ink: '#080809', hit: '#FF2A1A', near: '#FFFFFF', dim: '#7A7A7A', mix: ['#080809', '#FFFFFF', '#FF2A1A', '#0000FF', '#4A4A4A', '#FFF200'] },
  phosphor: { label: 'Phosphor (experiment)', ground: '#0D1C1A', ink: '#5DD1A4', hit: '#FFF200', near: '#3D6C58', dim: '#3D6C58', mix: ['#5DD1A4', '#FFF200', '#FF4238', '#6B9EFF', '#EFEFEF', '#3D6C58', '#C84916'] },
};
// The copy lives in lab/copy.json, a list of pieces ({id, label, source, headline, query, text}):
// the lab's own sets, pieces written by the model and your own, saved from the Type tab.
// A sentence ends at . ! or ? before a space or the end, so ".NET" stays one word.
const SENTENCE = /\S[\s\S]*?[.!?]+(?=\s|$)|\S[\s\S]*$/g;
const sentencesOf = c => (c.text.match(SENTENCE) ?? [c.text]).map(x => x.trim());
// The copy list as the lab loaded it, so a frame that fills the page can go on with the other
// pieces' sentences when its own text runs out, rather than starting it over.
let COPY_LIBRARY = [];
export function setCopyLibrary(list) { COPY_LIBRARY = Array.isArray(list) ? list : []; }
/** The text, then every other sentence of the copy list not already in it, shuffled by `seed`. */
function continued(text, seed) {
  const own = new Set((text.match(SENTENCE) ?? []).map(t => t.trim().toLowerCase()));
  const more = [...new Set(COPY_LIBRARY.flatMap(sentencesOf))].filter(t => !own.has(t.toLowerCase()))
    .map((t, i) => [hash(i * 5 + 1, seed * 19 + 4), t]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  return [text, ...more].join(' ');
}

/** Every piece's sentences, one chosen by `seed` leading: its headline and query head the piece and
 *  its own sentences come first, so even a Block shows what the query finds. The rest follow,
 *  shuffled by `seed`: much more text, and a new mix on each Shuffle. */
export function shuffledCopy(list, seed) {
  if (!list?.length) return null;
  const pick = list[Math.floor(hash(seed, 91) * list.length)];
  const rest = list.filter(c => c !== pick).flatMap(sentencesOf)
    .map((t, i) => [hash(i * 7 + 3, seed * 13 + 1), t]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  return { headline: pick.headline, query: pick.query, text: [...sentencesOf(pick), ...rest].join(' ') };
}

// Black or white on a box, whichever reads.
const onBox = hex => { const [r, g, b] = rgb(hex); return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#080809' : '#FFFFFF'; };
export const TYPE_SIZES = Object.fromEntries(['board', 'wide', 'square', 'portrait', 'posterA', 'profile', 'company'].map(key => [key, FIELD_SIZES[key]]));

// Trigrams as Indx makes them for a scalar field: two start characters, so a word's beginning is a
// fact the grams hold.
const trigrams = w => { const t = '\u0001\u0001' + w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''); const out = []; for (let i = 0; i + 3 <= t.length; i++) out.push({ g: t.slice(i, i + 3), at: i - 2 }); return out; };

/** The query's reading of one word: the share of a query word's grams it holds (the best over the
 *  query's words), and which of its letters those grams cover. */
function readWord(word, queryGrams) {
  const grams = trigrams(word);
  let best = 0, letters = new Set();
  for (const q of queryGrams) {
    if (!q.size) continue;
    const hit = grams.filter(x => q.has(x.g));
    const share = new Set(hit.map(x => x.g)).size / q.size;
    if (share > best) { best = share; letters = new Set(hit.flatMap(x => [x.at, x.at + 1, x.at + 2].filter(i => i >= 0))); }
  }
  return { share: best, letters };
}

/** The sequence at `t` seconds of its loop: the query typed on the Sentence, then Block, Index and
 *  Sparse, each building up line by line and holding. As in the reference, a sentence grows into a
 *  wall of text and thins out again. */
export const SEQUENCE_STEPS = [
  { frame: 'sentence', typing: true, build: 1.6, hold: 1.2 },
  { frame: 'block', build: 1.2, hold: 1.4 },
  { frame: 'index', build: 1.6, hold: 1.4 },
  { frame: 'sparse', build: 0.6, hold: 1.6 },
];
export const SEQUENCE_LENGTH = SEQUENCE_STEPS.reduce((a, s) => a + s.build + s.hold, 0);
export function drawSequence(T, t, k) {
  let at = t % SEQUENCE_LENGTH;
  for (const s of SEQUENCE_STEPS) {
    const len = s.build + s.hold;
    if (at < len) {
      const p = Math.min(1, at / s.build);
      if (s.typing) {
        const n = Math.round((T.query ?? '').length * Math.min(1, p * 1.4));
        return drawIndexed({ ...T, frame: s.frame, query: (T.query ?? '').slice(0, n), typing: (T.query ?? '').slice(0, n) }, k);
      }
      return drawIndexed({ ...T, frame: s.frame, reveal: s.frame === 'sparse' ? 1 : p }, k);
    }
    at -= len;
  }
  return drawIndexed(T, k);
}

// Framings round the text, after the Figma sketches in lab/reference images (3 Nov 2026): a terminal
// window with a tab of pixl buttons, a sequencer's control strip (after the find-and-step text
// sequencer in the GIF), and a spec sheet of ruled cells with a striped headline.
export const TYPE_CHROMES = { none: 'None', window: 'Window', sequencer: 'Sequencer', spec: 'Spec sheet' };
// What the empty cells hold: nothing, or a dot on each (a + every eighth cell on every eighth row).
export const TYPE_BACKGROUNDS = { none: 'Nothing', dots: 'Dot grid' };
// A motif: a pixl icon set large on the character grid, the text flowing round it.
export const TYPE_MOTIF_STYLES = { dots: 'Dots', solid: 'Solid', stripes: 'Stripes', letters: 'Letters' };

/** Indexed text at `k`x. Returns the canvas and how many words the query hit. */
export function drawIndexed(T, k) {
  if (T.layout === 'panels' || T.layout === 'table') return drawLayout(T, k);
  // `box`: draw at this size instead of a named one (a poster's block, a pack tile); `bare`: no head
  // or foot, a small margin (the frame round it is someone else's); `reveal`: the share of the lines
  // drawn, for the sequence building up.
  const [W0, H0] = T.box ?? TYPE_SIZES[T.size] ?? FIELD_SIZES.board, W = W0 * k, H = H0 * k;
  const frame = TYPE_FRAMES[T.frame] ?? TYPE_FRAMES.block, th = TYPE_THEMES[T.theme] ?? TYPE_THEMES.black;
  // The hit's box: the theme's own, or the colour chosen in the panel.
  const accent = T.hitFrom === 'chosen' ? (T.colour ?? th.hit) : th.hit;
  const cv = canvasOf(W, H), g = cv.getContext('2d');
  g.fillStyle = th.ground; g.fillRect(0, 0, W, H);
  const chrome = T.bare ? 'none' : (TYPE_CHROMES[T.chrome] ? T.chrome : 'none');
  const bg = T.background ?? (chrome === 'sequencer' ? 'dots' : 'none');

  // The area the text sets in, which the framing decides: the margin, a head line and a foot line by
  // default; inside the window, under the sequencer's strip, in the spec sheet's main cell.
  const m = Math.round(Math.min(W, H) * (T.bare ? 0.03 : 0.06)), headH = T.bare ? 0 : Math.max(14 * k, Math.min(W, H) * 0.04);
  const line = Math.max(1, Math.round(Math.min(W, H) * 0.0025)) || 1;
  const strokeRect = (x, y, w, h) => { g.fillRect(x, y, w, line); g.fillRect(x, y + h - line, w, line); g.fillRect(x, y, line, h); g.fillRect(x + w - line, y, line, h); };
  let area;
  const F = {}; // the framing's own measures, for drawing it after the text
  if (chrome === 'window') {
    // The tab holds Search, Ask and Observe's icons. Their drawn pixels, not their 7 × 5 boxes, set
    // the edge: the tab's margin round them is even, and the text, the headline and the mark at the
    // foot all keep the same distance from the frame as the first icon's left edge.
    const fx = Math.round(m * 0.7), fy = Math.round(m * 0.7), fw = W - 2 * fx, fh = H - 2 * fy, tabH = Math.round(headH * 2.4);
    const btns = PACK_WORDS.map(w => cells(w.icon));
    const icp = Math.max(1, Math.round(tabH * 0.42 / 5)), gap = icp * 2;
    const xs = ic => ic.list.map(c => c.x), ys = btns.flatMap(ic => ic.list.map(c => c.y));
    const minX = Math.min(...xs(btns[0])), maxX = Math.max(...xs(btns[btns.length - 1]));
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const iconsW = (btns.length - 1) * (7 * icp + gap) + (maxX + 1) * icp - minX * icp; // drawn width, first pixel to last
    const edge = Math.round((tabH - (maxY - minY + 1) * icp) / 2); // the margin round the icons, above and below as at the sides
    const tabW = iconsW + 2 * edge;
    Object.assign(F, { fx, fy, fw, fh, tabH, btns, icp, gap, minX, minY, edge, tabW });
    area = { left: fx + edge, right: fx + fw - edge, top: fy + tabH + edge, bottom: fy + fh - edge - headH * 1.6 };
  } else if (chrome === 'sequencer') {
    const stripH = Math.round(headH * 4.6), barH = Math.round(headH * 1.9);
    Object.assign(F, { stripH, barH });
    area = { left: m, right: W - m, top: m + stripH + barH + headH * 1.2, bottom: H - m - headH * 1.6 };
  } else if (chrome === 'spec') {
    const fx = m, fy = m, fw = W - 2 * m, fh = H - 2 * m, bandH = Math.round(fh * 0.2), ruleH = Math.round(fh * 0.045), footH = Math.round(fh * 0.17);
    Object.assign(F, { fx, fy, fw, fh, bandH, ruleH, footH });
    const pad = Math.round(headH * 0.9);
    area = { left: fx + pad, right: fx + fw - pad, top: fy + bandH + ruleH + pad, bottom: fy + fh - footH - pad };
  } else {
    area = { left: m, right: W - m, top: m + headH * 1.6, bottom: H - m - headH * 1.6 };
  }

  const cols = Math.max(4, Math.round(T.cols ?? frame.cols));
  // `leading`: extra space between lines, a share of a line; the boxes keep the line's own height.
  const cw = (area.right - area.left) / cols, ch = cw * 1.32, pitch = ch * (1 + (T.leading ?? 0));
  const rows = Math.max(1, Math.floor((area.bottom - area.top - ch) / pitch) + 1);
  const cellX = c => area.left + c * cw, cellY = r => area.top + r * pitch;

  // The motif: a pixl icon on the grid, its pixels whole blocks of cells, a cell of air round it.
  const blocked = new Uint8Array(rows * cols), motifCell = new Uint8Array(rows * cols);
  const motifName = T.motif && ICONS[T.motif] ? T.motif : null;
  if (motifName) {
    const ic = cells(motifName);
    const pr = Math.max(1, Math.round(rows * (T.motifSize ?? 0.6) / ic.h));
    const pc = Math.max(1, Math.round(pr * pitch / cw));
    const mw = ic.w * pc, mh = ic.h * pr;
    const at = T.motifAt ?? 'center';
    const c0 = Math.round(at === 'left' ? cols * 0.04 : at === 'right' ? cols * 0.96 - mw : (cols - mw) / 2);
    const r0 = Math.round((rows - mh) / 2);
    for (const px of ic.list) for (let dy = 0; dy < pr; dy++) for (let dx = 0; dx < pc; dx++) {
      const r = r0 + px.y * pr + dy, c = c0 + px.x * pc + dx;
      if (r >= 0 && r < rows && c >= 0 && c < cols) motifCell[r * cols + c] = 1;
    }
    // Air: a cell either side and none above or below, so a line runs close under the shape.
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (motifCell[r * cols + c]) for (let d = -1; d <= 1; d++) if (c + d >= 0 && c + d < cols) blocked[r * cols + c + d] = 1;
  }
  // The free runs of each row, the text's measures: a run shorter than four cells stays empty.
  const runsOf = r => { const out = []; let c = 0; while (c < cols) { while (c < cols && blocked[r * cols + c]) c++; const s0 = c; while (c < cols && !blocked[r * cols + c]) c++; if (c - s0 >= 4) out.push({ c0: s0, len: c - s0 }); } return out; };

  // The words: the first sentence for a Sentence, the text for a Block, the text over and over for
  // the full frames.
  const source = (T.upper ? T.text.toUpperCase() : T.text).replace(/\s+/g, ' ').trim();
  // A Sentence takes whole sentences until it holds three words: "Search." alone was too little.
  const sentences = source.match(SENTENCE) ?? [source];
  let first = '';
  for (const t of sentences) { first = (first + ' ' + t.trim()).trim(); if (first.split(' ').filter(Boolean).length >= 3) break; }
  // A Block holds at most `length` words, whole sentences, so a long text still leaves it air above
  // and below and the wide justified gaps of a few lines (the hero's 25 words were the look).
  // A frame that fills the page goes on into the rest of the copy list before it repeats anything.
  const filled = frame.fill ? (T.upper ? continued(T.text, T.seed ?? 0).toUpperCase() : continued(T.text, T.seed ?? 0)).replace(/\s+/g, ' ').trim() : source;
  let words0 = (T.frame === 'sentence' ? first : filled).split(' ').filter(Boolean);
  if (T.frame === 'block' && T.length && words0.length > T.length) {
    let n = T.length;
    while (n < words0.length && !/[.!?]$/.test(words0[n - 1])) n++;
    words0 = words0.slice(0, n);
  }
  const queryGrams = (T.query ?? '').split(/\s+/).filter(Boolean).map(q => new Set(trigrams(q).map(x => x.g)));

  // Lines: each free run of each row takes as many words as fit, then is justified, the spare cells
  // shared between the gaps. `air`: now and then a word takes a wide gap before it (3 cells to a
  // third of the run), and now and then a row is left empty, placed by the seed.
  const air = T.air ?? 0;
  const padOf = (n, len) => hash(n * 5 + 2, T.seed * 23 + 3) < air ? 3 + Math.floor(hash(n * 11 + 1, T.seed * 7 + 9) * Math.max(1, len / 3 - 3)) : 0;
  const lines = [];
  let i = 0;
  const more = () => frame.fill || i < words0.length;
  for (let r = 0; r < rows && more(); r++) {
    if (r && hash(r * 3 + 1, T.seed * 41 + 7) < air * 0.35 && r < rows - 1) continue;
    for (const run of runsOf(r)) {
      if (!more()) break;
      const words = [], pads = [];
      let used = 0, ragged = false;
      while (more()) {
        const w0 = words0[i % words0.length];
        if (!words.length && w0.length > run.len && run.len < cols) break; // too narrow for this word: left empty
        const w = w0.slice(0, run.len), pad = Math.min(padOf(i, run.len), Math.floor(run.len / 3));
        const need = (words.length ? 1 : 0) + pad + w.length;
        if (words.length && used + need > run.len) break;
        const padded = used + need <= run.len;
        words.push(w); pads.push(padded ? pad : 0); used += padded ? need : need - pad; i++;
        // Breaks: a sentence ends its line. 'ragged' leaves the rest of the run empty, 'spread'
        // justifies it, so a short sentence opens wide gaps between its words.
        if (T.breaks && T.breaks !== 'none' && /[.!?]$/.test(w)) { ragged = T.breaks === 'ragged'; break; }
      }
      if (words.length) lines.push({ r, c0: run.c0, len: run.len, words, pads, used, last: ragged || !more() });
    }
  }
  // A Block with nothing in its way sits in the middle of the area, by whole rows so the grid holds.
  if (!frame.fill && !motifName && lines.length) {
    const shift = Math.max(0, Math.floor((rows - 1 - lines[lines.length - 1].r) / 2));
    for (const ln of lines) ln.r += shift;
  }
  const lastRow = lines.length ? lines[lines.length - 1].r : 0;
  const shownRows = (lines[0]?.r ?? 0) + Math.ceil((lastRow - (lines[0]?.r ?? 0) + 1) * (T.reveal ?? 1));

  const size = ch * 0.72;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  // The icons a letter can turn into: the main board's by default, every board's on request.
  const pool = ICON_NAMES.filter(n => n !== 'indx' && ICONS[n].w === 7 && ICONS[n].h === 5 && (T.iconSet === 'all' || ICONS[n].board === 'main'));
  const used = new Uint8Array(rows * cols);
  let hits = 0, wordNo = 0;
  for (const ln of lines) {
    const gaps = ln.words.length - 1, spare = ln.len - ln.used;
    const justify = !ln.last && gaps > 0 && T.justify !== false;
    let col = ln.c0 + (ln.pads[0] ?? 0);
    ln.words.forEach((w, n) => {
      const y = cellY(ln.r), x = cellX(col), read = readWord(w, queryGrams);
      // A near miss has three letters at least: "in" holding two of "index"'s grams is noise.
      const hit = read.share >= (T.hitAt ?? 0.5), near = !hit && w.replace(/[^\p{L}\p{N}]/gu, '').length >= 3 && read.share >= (T.nearAt ?? 0.25);
      const redact = !hit && !near && hash(wordNo * 7 + 1, T.seed * 31 + 5) < (T.redact ?? 0);
      if (hit) hits++;
      wordNo++;
      const show = ln.r < shownRows && !(frame.sparse && !hit && !near && !redact);
      if (show || !frame.sparse) for (let j = 0; j < w.length; j++) used[ln.r * cols + col + j] = frame.sparse && !hit && !near ? 0 : 1;
      if (ln.r < shownRows) {
        // Mixed: each boxed word takes a colour of the theme's set, by its place, never the ground's.
        const mixed = T.mixed && (hit || near) ? th.mix[Math.floor(hash(wordNo * 13 + 7, T.seed * 5 + (hit ? 1 : 2)) * th.mix.length)] : null;
        // The word's box: the accent for a hit, the second tone for a near miss, the ink for a redaction.
        // `hitStyle` letters: only the letters the query's grams cover are boxed, as a find marks them.
        const box = redact ? th.ink : hit ? (mixed ?? accent) : near ? (mixed ?? T.nearColour ?? th.near) : null;
        const lettersOnly = T.hitStyle === 'letters' && (hit || near);
        if (box && !lettersOnly) { g.fillStyle = box; g.fillRect(Math.round(x), Math.round(y + ch * 0.06), Math.round(w.length * cw), Math.round(ch * 0.88)); }
        // Framed words: a hairline box round every word, as the reference frames "The picture PRESENTS".
        if (T.frameWords) { g.strokeStyle = th.ink; g.lineWidth = Math.max(1, k); g.strokeRect(Math.round(x - cw * 0.15) + 0.5, Math.round(y + ch * 0.02) + 0.5, Math.round((w.length + 0.3) * cw), Math.round(ch * 0.96)); }
        if (!redact) [...w].forEach((c, j) => {
          const cx = x + (j + 0.5) * cw, cy = y + ch / 2;
          // Sparse: only what the query found stays.
          if (frame.sparse && !hit && !near) return;
          const matched = read.letters.has(j);
          let colour = box ? onBox(box) : (frame.sparse ? th.dim : th.ink);
          if (lettersOnly) {
            colour = th.ink;
            if (matched) { g.fillStyle = box; g.fillRect(Math.round(x + j * cw), Math.round(y + ch * 0.06), Math.ceil(cw), Math.round(ch * 0.88)); colour = onBox(box); }
          }
          // A letter swapped for a pixl icon, now and then, never inside a hit.
          if (!hit && /\p{L}/u.test(c) && hash((wordNo * 31 + j) * 3, T.seed * 17 + 11) < (T.icons ?? 0)) {
            const icp = Math.min(cw * 0.86 / 7, ch * 0.5 / 5), ic = cells(pool[Math.floor(hash(wordNo + j, T.seed) * pool.length)]);
            const { canvas, pad } = renderFlat(ic, icp, colour);
            g.drawImage(canvas, Math.round(cx - 3.5 * icp - pad * icp), Math.round(cy - 2.5 * icp - pad * icp));
          } else {
            g.font = `${matched && hit ? 700 : (T.weight ?? 400)} ${size}px ${TYPE}`;
            g.fillStyle = colour; g.fillText(c, cx, cy + size * 0.04);
          }
          // Letter cells: a hairline between the letters of a word, as in the letter-by-letter frames.
          if (T.cellLines && j > 0) { g.fillStyle = box && !lettersOnly ? onBox(box) : th.near; g.fillRect(Math.round(x + j * cw), Math.round(y + ch * 0.12), Math.max(1, k), Math.round(ch * 0.76)); }
        });
      }
      col += w.length + (n < gaps ? 1 + (ln.pads[n + 1] ?? 0) + (justify ? Math.floor(spare / gaps) + (n < spare % gaps ? 1 : 0) : 0) : 0);
    });
  }

  // The motif, drawn on its cells: a dot each (the hands sketch), solid blocks, a stripe each (the
  // spec sheet's striped headline), or the query's letters over and over.
  if (motifName) {
    const style = T.motifStyle ?? 'dots', mcol = T.motifColour === 'accent' ? accent : th.ink;
    const q = (T.query || 'indx').toUpperCase().replace(/\s+/g, '');
    let n = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (!motifCell[r * cols + c]) continue;
      const x = cellX(c), y = cellY(r);
      g.fillStyle = mcol;
      if (style === 'solid') g.fillRect(Math.floor(x), Math.floor(y), Math.ceil(cw) + 1, Math.ceil(pitch) + 1);
      else if (style === 'stripes') g.fillRect(Math.floor(x), Math.round(y + ch * 0.3), Math.ceil(cw) + 1, Math.max(1, Math.round(ch * 0.4)));
      else if (style === 'letters') {
        // A box per cell, the query's letters knocked out of it: the shape reads, and so do the letters.
        g.fillRect(Math.floor(x), Math.floor(y), Math.ceil(cw) + 1, Math.ceil(pitch) + 1);
        g.font = `700 ${size}px ${TYPE}`; g.fillStyle = th.ground; g.fillText(q[n++ % q.length], x + cw / 2, y + ch / 2 + size * 0.04);
      }
      else { g.beginPath(); g.arc(x + cw / 2, y + pitch / 2, Math.min(cw, pitch) * 0.42, 0, Math.PI * 2); g.fill(); }
    }
  }
  // The dot grid in the empty cells, as the sequencer draws its unused steps.
  if (bg === 'dots') {
    g.fillStyle = th.dim;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (used[r * cols + c] || motifCell[r * cols + c]) continue;
      const x = cellX(c) + cw / 2, y = cellY(r) + ch / 2;
      if (r % 8 === 7 && c % 8 === 0) { const a = cw * 0.32, t = Math.max(1, Math.round(cw * 0.07)); g.fillRect(Math.round(x - a), Math.round(y - t / 2), Math.round(2 * a), t); g.fillRect(Math.round(x - t / 2), Math.round(y - a), t, Math.round(2 * a)); }
      else { const d = Math.max(1, Math.round(cw * 0.1)); g.fillRect(Math.round(x - d / 2), Math.round(y + ch * 0.2), d, d); }
    }
  }

  if (T.bare) return { canvas: cv, hits, rows, cols };
  const mono = Math.max(10 * k, headH * 0.55);
  const headline = T.upper ? (T.headline ?? '').toUpperCase() : (T.headline ?? '');
  // A text set in FunktionalGrotesk at the largest size up to `px` that fits `width`.
  const fitFont = (s, px, width, weight) => { g.font = `${weight} ${px}px ${TYPE}`; const w = g.measureText(s).width; return w > width ? px * width / w : px; };
  const foot = (yMid, x0, x1) => {
    drawMark(g, x0 + headH * 7 / 5, yMid - headH / 2, headH / 5, th.ink);
    g.save(); g.font = `350 ${headH * 0.66}px ${TYPE}`; g.fillStyle = th.ink; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(SIGNATURE, x1, yMid); g.restore();
  };

  if (chrome === 'window') {
    // The window: a frame, a filled tab with Search, Ask and Observe, the headline at top right.
    const { fx, fy, fw, fh, tabH, btns, icp, gap, minX, minY, edge, tabW } = F;
    g.fillStyle = th.ink; strokeRect(fx, fy, fw, fh);
    g.fillRect(fx, fy, tabW, tabH);
    g.fillStyle = th.ground;
    btns.forEach((ic, n) => { for (const c of ic.list) g.fillRect(fx + edge + (n * (7 * icp + gap)) + (c.x - minX) * icp, fy + edge + (c.y - minY) * icp, icp, icp); });
    if (headline && T.head !== 'none') {
      const px = fitFont(headline, tabH * 0.62, fw - tabW - 3 * edge, 500);
      g.font = `500 ${px}px ${TYPE}`; g.fillStyle = th.ink; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(headline, fx + fw - edge, fy + tabH / 2 + px * 0.04);
    }
    // The foot: the mark's left edge and the signature's right edge on the same lines as the text's.
    foot(fy + fh - edge - headH / 2, fx + edge, fx + fw - edge);
  } else if (chrome === 'sequencer') {
    // The control strip: the query in an input, the first hit in a find box, the counts at the right
    // after a rule, then a ruled bar with the headline, as the sequencer's insert-mode hint.
    const { stripH, barH } = F, x0 = m, x1 = W - m, lab = mono * 0.95, boxH = Math.round(headH * 1.25);
    const statsX = x0 + (x1 - x0) * 0.68, colW = (statsX - x0 - headH * 1.4) / 2;
    const field = (x, label, value, fill) => {
      monoText(g, label, x, m + lab * 0.7, lab, 'left', th.ink);
      const y = Math.round(m + lab * 1.6);
      g.fillStyle = fill; g.fillRect(Math.round(x), y, Math.round(colW), boxH);
      monoText(g, value, x + headH * 0.35, y + boxH / 2, mono, 'left', onBox(fill));
    };
    const firstHit = (() => { for (const ln of lines) for (const w of ln.words) if (readWord(w, queryGrams).share >= (T.hitAt ?? 0.5)) return w.replace(/[^\p{L}\p{N}]/gu, ''); return ''; })();
    field(x0, 'input', T.typing ?? T.query ?? '', th.near);
    field(x0 + colW + headH * 0.7, 'find', firstHit, accent);
    g.fillStyle = th.ink; g.fillRect(Math.round(statsX - headH * 0.5), m, line, Math.round(stripH - headH * 0.6));
    [['frame', TYPE_FRAMES[T.frame]?.label ?? ''], ['cols', cols], ['rows', rows], ['seed', T.seed ?? 0]].forEach(([kk, v], n) => {
      const y = m + lab * 0.7 + n * lab * 1.45;
      monoText(g, `${kk} :`, statsX, y, lab, 'left', th.ink);
      monoText(g, String(v), x1, y, lab, 'right', th.ink);
    });
    const by = Math.round(m + stripH);
    g.fillStyle = th.ink; strokeRect(x0, by, Math.round(x1 - x0), barH);
    if (headline && T.head !== 'none') monoText(g, headline, (x0 + x1) / 2, by + barH / 2, mono, 'center', th.ink);
    foot(H - m - headH / 2, m, W - m);
  } else if (chrome === 'spec') {
    // The spec sheet: a ruled card; the mark in a filled cell with corner brackets beside a striped
    // headline, a band of rules, the text, then indx.co in a filled cell and the facts in mono.
    const { fx, fy, fw, fh, bandH, ruleH, footH } = F;
    g.fillStyle = th.ink; strokeRect(fx, fy, fw, fh);
    const cell = bandH;
    g.fillRect(fx, fy, cell, bandH);
    const br = Math.round(cell * 0.12), bl = Math.round(cell * 0.12), bt = line;
    g.fillStyle = th.ground;
    for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const cx = fx + (sx ? cell - br : br), cy = fy + (sy ? bandH - br : br);
      g.fillRect(sx ? cx - bl : cx, cy - (sy ? bt : 0), bl, bt); g.fillRect(cx - (sx ? bt : 0), sy ? cy - bl : cy, bt, bl);
    }
    drawMark(g, fx + cell / 2 + 3.5 * cell * 0.08, fy + bandH / 2 - 2.5 * cell * 0.08, cell * 0.08, th.ground);
    g.fillStyle = th.ink; g.fillRect(fx + cell, fy + bandH - line, fw - cell, line);
    if (headline && T.head !== 'none') {
      const hx = fx + cell + bandH * 0.18, hw = fw - cell - bandH * 0.36;
      const px = fitFont(headline, bandH * 0.62, hw, 700);
      g.font = `700 ${px}px ${TYPE}`; g.fillStyle = th.ink; g.textAlign = 'left'; g.textBaseline = 'middle';
      const hy = fy + bandH / 2;
      g.fillText(headline, hx, hy + px * 0.04);
      // The stripes: the ground's colour through the letters, a scan line every few pixels.
      const step = Math.max(3, Math.round(px / 9));
      g.fillStyle = th.ground;
      for (let y = Math.round(hy - px * 0.6); y < hy + px * 0.6; y += step) g.fillRect(hx, y, hw, Math.max(1, Math.round(step * 0.35)));
    }
    const ry = fy + bandH;
    g.fillStyle = th.ink;
    for (let n = 1; n <= 4; n++) g.fillRect(fx, Math.round(ry + n * ruleH / 5), fw, line);
    g.fillRect(fx, ry + ruleH - line, fw, line);
    const fyy = fy + fh - footH;
    g.fillRect(fx, fyy, fw, line);
    const leftW = Math.round(fw * 0.36);
    g.fillRect(fx + leftW, fyy, line, footH);
    // indx.co in a filled strip at the bottom of the left cell, the mark nowhere else.
    const stripH2 = Math.round(footH * 0.42);
    g.fillRect(fx, fy + fh - stripH2, leftW, stripH2);
    g.save(); g.font = `350 ${stripH2 * 0.5}px ${TYPE}`; g.fillStyle = th.ground; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(SIGNATURE, fx + stripH2 * 0.5, fy + fh - stripH2 / 2); g.restore();
    monoText(g, `[ ${(T.query || 'search').toUpperCase()} ]`, fx + stripH2 * 0.5, fyy + (footH - stripH2) / 2, mono * 1.15, 'left', th.ink);
    const facts = [['query', T.query || '-'], ['frame', TYPE_FRAMES[T.frame]?.label ?? ''], ['status', 'ready']];
    const fl = Math.min(mono, footH * 0.8 / (facts.length * 1.5));
    facts.forEach(([kk, v], n) => monoText(g, `${kk}: ${v}`, fx + leftW + stripH2 * 0.5, fyy + footH * 0.1 + (n + 0.5) * fl * 1.5, fl, 'left', th.ink));
  } else {
    // Head: the query as typed (`> SERCH`), a headline, or nothing. While the sequence types, the query.
    const head = T.typing != null ? 'query' : (T.head ?? 'query');
    if (head === 'query' && (T.query || T.typing != null)) monoText(g, `> ${T.typing ?? T.query}${T.typing != null ? '_' : ''}`, m, m + headH / 2, mono, 'left', th.ink);
    if (head === 'headline' && headline) monoText(g, headline, m, m + headH / 2, mono, 'left', th.ink);
    foot(H - m - headH / 2, m, W - m);
  }
  return { canvas: cv, hits, rows, cols };
}

// ── Layouts after the reference: panels and a table ──────────────────────────────────
// Symphony in Acid frames its text from the inside: the page cut into rectangles of colour, each
// holding a sentence or a few in its own size and alignment, some lines on a strip of their own;
// or a ruled table, one word to a cell. The words keep every move of the grid (hits, near misses,
// redactions, icons), through `setWord`.
export const TYPE_LAYOUTS = { grid: 'One grid', panels: 'Panels', table: 'Table' };

/** One word at (x, y) on cells cw × ch: its box, its letters, an icon swapped in now and then.
 *  `bg` is what it sits on, for the letters' colour. Returns whether it was a hit. */
function setWord(g, w, x, y, cw, ch, C) {
  const { T, th, accent, queryGrams, pool, k, bg } = C;
  const n = C.n++;
  const read = readWord(w, queryGrams);
  const hit = read.share >= (T.hitAt ?? 0.5), near = !hit && w.replace(/[^\p{L}\p{N}]/gu, '').length >= 3 && read.share >= (T.nearAt ?? 0.25);
  const redact = !hit && !near && hash(n * 7 + 1, T.seed * 31 + 5) < (T.redact ?? 0);
  const mixed = T.mixed && (hit || near) ? th.mix[Math.floor(hash(n * 13 + 7, T.seed * 5 + (hit ? 1 : 2)) * th.mix.length)] : null;
  let box = redact ? onBox(bg) : hit ? (mixed ?? accent) : near ? (mixed ?? T.nearColour ?? th.near) : null;
  if (box && box.toLowerCase() === bg.toLowerCase()) box = onBox(bg); // a box the colour of its ground would vanish
  const lettersOnly = T.hitStyle === 'letters' && (hit || near);
  if (box && !lettersOnly) { g.fillStyle = box; g.fillRect(Math.round(x), Math.round(y + ch * 0.06), Math.round(w.length * cw), Math.round(ch * 0.88)); }
  if (T.frameWords) { g.strokeStyle = onBox(bg); g.lineWidth = Math.max(1, k); g.strokeRect(Math.round(x - cw * 0.15) + 0.5, Math.round(y + ch * 0.02) + 0.5, Math.round((w.length + 0.3) * cw), Math.round(ch * 0.96)); }
  if (redact) return hit;
  const size = ch * 0.72, base = bg === th.ground ? th.ink : onBox(bg);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  [...w].forEach((c, j) => {
    const cx = x + (j + 0.5) * cw, cy = y + ch / 2, matched = read.letters.has(j);
    let colour = box && !lettersOnly ? onBox(box) : base;
    if (lettersOnly && matched) { g.fillStyle = box; g.fillRect(Math.round(x + j * cw), Math.round(y + ch * 0.06), Math.ceil(cw), Math.round(ch * 0.88)); colour = onBox(box); }
    if (!hit && /\p{L}/u.test(c) && hash((n * 31 + j) * 3, T.seed * 17 + 11) < (T.icons ?? 0)) {
      const icp = Math.min(cw * 0.86 / 7, ch * 0.5 / 5), ic = cells(pool[Math.floor(hash(n + j, T.seed) * pool.length)]);
      const { canvas, pad } = renderFlat(ic, icp, colour);
      g.drawImage(canvas, Math.round(cx - 3.5 * icp - pad * icp), Math.round(cy - 2.5 * icp - pad * icp));
    } else {
      g.font = `${matched && hit ? 700 : (T.weight ?? 400)} ${size}px ${TYPE}`;
      g.fillStyle = colour; g.fillText(c, cx, cy + size * 0.04);
    }
  });
  return hit;
}

function drawLayout(T, k) {
  const [W0, H0] = T.box ?? TYPE_SIZES[T.size] ?? FIELD_SIZES.board, W = W0 * k, H = H0 * k;
  const frame = TYPE_FRAMES[T.frame] ?? TYPE_FRAMES.block, th = TYPE_THEMES[T.theme] ?? TYPE_THEMES.black;
  const accent = T.hitFrom === 'chosen' ? (T.colour ?? th.hit) : th.hit;
  const cv = canvasOf(W, H), g = cv.getContext('2d');
  g.fillStyle = th.ground; g.fillRect(0, 0, W, H);
  const m = Math.round(Math.min(W, H) * (T.bare ? 0.03 : 0.06)), headH = T.bare ? 0 : Math.max(14 * k, Math.min(W, H) * 0.04);
  const A = { x: m, y: m + headH * 1.6, w: W - 2 * m, h: H - 2 * m - headH * 3.2 };
  const source = (T.upper ? T.text.toUpperCase() : T.text).replace(/\s+/g, ' ').trim();
  const queryGrams = (T.query ?? '').split(/\s+/).filter(Boolean).map(q => new Set(trigrams(q).map(x => x.g)));
  const pool = ICON_NAMES.filter(n => n !== 'indx' && ICONS[n].w === 7 && ICONS[n].h === 5 && (T.iconSet === 'all' || ICONS[n].board === 'main'));
  const C = { T, th, accent, queryGrams, pool, k, bg: th.ground, n: 0 };
  // The colours a panel or a cell can take: the ground, the ink and the theme's set.
  const palette = [...new Set([th.ground, th.ink, ...th.mix].map(c => c.toUpperCase()))];
  const rnd = (a, b) => hash(a * 977 + 13, T.seed * 59 + b);
  const base = A.w / frame.cols; // the grid's own cell, the smallest a panel sets in
  let hits = 0;

  if (T.layout === 'panels') {
    // Cut the area: always the largest panel, across its longer side, at a whole number of base
    // cells between a quarter and three quarters, until there are `panels` of them.
    const want = Math.max(1, Math.round(T.panels ?? 7));
    let leaves = [{ x: 0, y: 0, w: A.w, h: A.h }];
    // A panel is never cut narrower than ten base cells, or lower than three lines: a panel too small
    // to cut one way is cut the other, and one too small for both is left whole.
    const minW = base * 10, minH = base * 1.32 * 3;
    for (let n = 1, tries = 0; n < want && tries < want * 4; tries++) {
      leaves.sort((a, b) => b.w * b.h - a.w * a.h);
      const i = leaves.findIndex(r => r.w >= 2 * minW || r.h >= 2 * minH);
      if (i < 0) break;
      const r = leaves.splice(i, 1)[0];
      const canV = r.w >= 2 * minW, canH = r.h >= 2 * minH;
      let across = r.w / r.h > 1.2 ? 'v' : r.h / r.w > 1.2 ? 'h' : (rnd(n, 1) < 0.5 ? 'v' : 'h');
      if (across === 'v' && !canV) across = 'h';
      if (across === 'h' && !canH) across = 'v';
      const t = 0.25 + rnd(n, 2) * 0.5;
      if (across === 'v') { const cut = Math.min(r.w - minW, Math.max(minW, Math.round(r.w * t / base) * base)); leaves.push({ ...r, w: cut }, { ...r, x: r.x + cut, w: r.w - cut }); }
      else { const cut = Math.min(r.h - minH, Math.max(minH, Math.round(r.h * t / base) * base)); leaves.push({ ...r, h: cut }, { ...r, y: r.y + cut, h: r.h - cut }); }
      n++;
    }
    leaves.sort((a, b) => a.y - b.y || a.x - b.x);
    // The text in sentences, handed out in order: a panel takes one to three; a few take none.
    const all = (T.upper ? continued(T.text, T.seed ?? 0).toUpperCase() : continued(T.text, T.seed ?? 0)).replace(/\s+/g, ' ').trim();
    const sentences = (frame.fill ? all : source).match(SENTENCE) ?? [source];
    let si = 0, prev = th.ground;
    leaves.forEach((r, n) => {
      // A colour unlike its neighbour's; the first panel often the ground, so the page keeps its theme.
      let fill = palette[Math.floor(rnd(n, 3) * palette.length)];
      if (fill === prev) fill = palette[(palette.indexOf(fill) + 1) % palette.length];
      prev = fill;
      const x0 = A.x + r.x, y0 = A.y + r.y;
      g.fillStyle = fill; g.fillRect(Math.floor(x0), Math.floor(y0), Math.ceil(r.w) + 1, Math.ceil(r.h) + 1);
      if (rnd(n, 4) < (T.emptyPanels ?? 0.2) && n > 0) return;
      // As many sentences as the panel's share asks for, fewer if they do not fit; the size the
      // largest of a few steps, from four base cells down to one, at which every line and every
      // whole word fits. Only a single sentence at the smallest size is ever cut.
      const pad = base * 0.6, iw = r.w - 2 * pad, ih = r.h - 2 * pad;
      const align = ['left', 'right', 'justify'][Math.floor(rnd(n, 6) * 3)];
      const strips = rnd(n, 7) < (T.strips ?? 0.4);
      const want2 = 1 + Math.floor(rnd(n, 5) * 3 * Math.min(1.5, (r.w * r.h) / (A.w * A.h) * want));
      let set = null;
      for (let take = want2; take >= 1 && !set; take--) {
        const words = Array.from({ length: take }, (_, t) => sentences[(si + t) % sentences.length]).join(' ').split(' ').filter(Boolean);
        const longest = Math.max(...words.map(w => w.length));
        for (const scale of [4, 3, 2.5, 2, 1.6, 1.3, 1]) {
          const cw = base * scale, ch = cw * 1.32, cols = Math.floor(iw / cw), rows = Math.floor(ih / ch);
          if (cols < 4 || rows < 1) continue;
          const lines = wrapWords(words, cols);
          if (lines.length <= rows && longest <= cols) { set = { cw, ch, cols, lines, take }; break; }
          if (take === 1 && scale === 1) set = { cw, ch, cols, lines: lines.slice(0, rows), take };
        }
      }
      if (set) si += set.take;
      if (!set) return;
      const { cw, ch, cols, lines } = set;
      // A third of the panels set their text at the foot, as the reference often does.
      const drop = rnd(n, 9) < 0.35 ? Math.max(0, Math.floor((ih - lines.length * ch) / ch)) * ch : 0;
      // Strips: each line on a band of its own, white or grey or the ink, its length the line's.
      const stripColour = [onBox(fill) === '#080809' ? '#FFFFFF' : '#080809', '#C8C8C8', '#FFFFFF'][Math.floor(rnd(n, 8) * 3)];
      lines.forEach((ln, li) => {
        const used = ln.reduce((a, w) => a + w.length, 0) + ln.length - 1, spare = cols - used;
        const just = align === 'justify' && li < lines.length - 1 && ln.length > 1;
        let col = align === 'right' ? spare : 0;
        const y = y0 + pad + drop + li * ch;
        const bg = strips ? stripColour : fill;
        if (strips) { g.fillStyle = stripColour; g.fillRect(Math.round(x0 + pad + col * cw - cw * 0.2), Math.round(y), Math.round((just ? cols : used) * cw + cw * 0.4), Math.ceil(ch)); }
        C.bg = bg;
        ln.forEach((w, wi) => {
          if (setWord(g, w, x0 + pad + col * cw, y, cw, ch, C)) hits++;
          col += w.length + 1 + (just ? Math.floor(spare / (ln.length - 1)) + (wi < spare % (ln.length - 1) ? 1 : 0) : 0);
        });
      });
    });
  } else {
    // The table: columns of four to twelve base cells, rows a line tall and now and then two, a word
    // to a cell, right-aligned (a few left), the rules in the ink; hits fill their cell in the accent,
    // and `fills` of the others take a colour of the set.
    const cw = base * (T.tableScale ?? 1.4), ch = cw * 1.32;
    const colsW = [];
    for (let x = 0, n = 0; x < A.w - cw * 3; n++) { const c = Math.min(Math.floor((A.w - x) / cw), 4 + Math.floor(rnd(n, 11) * 9)); colsW.push(c); x += c * cw; }
    const tw = colsW.reduce((a, c) => a + c, 0) * cw, tx = A.x + (A.w - tw) / 2;
    const rows = [];
    for (let y = 0, n = 0; y + ch <= A.h; n++) { const h = rnd(n, 12) < 0.14 && y + 2 * ch <= A.h ? 2 * ch : ch; rows.push({ y, h }); y += h; }
    const words = (frame.fill ? (T.upper ? continued(T.text, T.seed ?? 0).toUpperCase() : continued(T.text, T.seed ?? 0)) : source).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    const line = Math.max(1, Math.round(k));
    let wi = 0;
    rows.forEach((row, ri) => {
      let x = tx;
      colsW.forEach((c, ci) => {
        const w0 = words[wi++ % words.length], wcw = c * cw, y = A.y + row.y;
        if (!frame.fill && wi > words.length) return;
        const read = readWord(w0, queryGrams);
        const hit = read.share >= (T.hitAt ?? 0.5);
        const fillCell = hit ? accent : rnd(ri * 31 + ci, 13) < (T.fills ?? 0.14) ? palette[Math.floor(rnd(ri * 7 + ci, 14) * palette.length)] : th.ground;
        if (fillCell !== th.ground) { g.fillStyle = fillCell; g.fillRect(Math.round(x), Math.round(y), Math.ceil(wcw), Math.ceil(row.h)); }
        const w = w0.slice(0, c);
        const right = rnd(ri * 13 + ci, 15) > 0.15;
        const wx = right ? x + wcw - (w.length + 0.2) * cw : x + cw * 0.2;
        g.save(); g.beginPath(); g.rect(x, y, wcw, row.h); g.clip();
        // A hit's word sits on its own filled cell, so it is not boxed again.
        C.bg = fillCell;
        if (hit) { hits++; C.n++; g.font = `700 ${ch * 0.72}px ${TYPE}`; g.fillStyle = onBox(fillCell); g.textAlign = 'left'; g.textBaseline = 'middle'; [...w].forEach((ch2, j) => { g.textAlign = 'center'; g.fillText(ch2, wx + (j + 0.5) * cw, y + row.h - ch / 2 + ch * 0.03); }); }
        else setWord(g, w, wx, y + row.h - ch, cw, ch, C);
        g.restore();
        // The rules.
        g.fillStyle = th.ink; g.fillRect(Math.round(x), Math.round(y), line, Math.ceil(row.h));
        x += wcw;
      });
      g.fillStyle = th.ink; g.fillRect(Math.round(tx), Math.round(A.y + row.y), Math.round(tw), line);
      g.fillRect(Math.round(x), Math.round(A.y + row.y), line, Math.ceil(row.h));
    });
    const last = rows[rows.length - 1];
    if (last) { g.fillStyle = th.ink; g.fillRect(Math.round(tx), Math.round(A.y + last.y + last.h), Math.round(tw), line); }
  }

  if (T.bare) return { canvas: cv, hits, rows: 0, cols: frame.cols };
  // Head and foot as on the grid: the headline or the query, the mark and the signature.
  const mono = Math.max(10 * k, headH * 0.55);
  const head = T.typing != null ? 'query' : (T.head ?? 'query');
  if (head === 'query' && (T.query || T.typing != null)) monoText(g, `> ${T.typing ?? T.query}${T.typing != null ? '_' : ''}`, m, m + headH / 2, mono, 'left', th.ink);
  if (head === 'headline' && T.headline) monoText(g, T.upper ? T.headline.toUpperCase() : T.headline, m, m + headH / 2, mono, 'left', th.ink);
  drawMark(g, m + headH * 7 / 5, H - m - headH, headH / 5, th.ink);
  g.save(); g.font = `350 ${headH * 0.66}px ${TYPE}`; g.fillStyle = th.ink; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(SIGNATURE, W - m, H - m - headH / 2); g.restore();
  return { canvas: cv, hits, rows: 0, cols: frame.cols };
}

/** Words into lines of at most `cols` characters, a word longer than the line cut to it. */
function wrapWords(words, cols) {
  const lines = [];
  let line = [], used = 0;
  for (const w0 of words) {
    const w = w0.slice(0, cols), need = (line.length ? 1 : 0) + w.length;
    if (line.length && used + need > cols) { lines.push(line); line = []; used = 0; }
    line.push(w); used += (line.length > 1 ? 1 : 0) + w.length;
  }
  if (line.length) lines.push(line);
  return lines;
}

// ── Pack: Search. Ask. Observe. over the chosen generations ─────────────────────────
export const PACK_WORDS = [
  { key: 'search', word: 'Search.', icon: 'search' },
  { key: 'ask', word: 'Ask.', icon: 'question' },
  { key: 'observe', word: 'Observe.', icon: 'observr' },
];
export const PACK_LAYOUTS = {
  post: { W: 1080, H: 1080, label: 'Square posts', title: 'Square posts, 1080 × 1080, one per word', each: true },
  portrait: { W: 1080, H: 1350, label: 'Portrait posts', title: 'Portrait posts, 1080 × 1350, one per word', each: true },
  triptych: { W: 1920, H: 1080, label: '16:9, the three', title: '16:9, 1920 × 1080, the three together' },
  profile: { W: 1584, H: 396, label: 'LinkedIn profile', title: 'LinkedIn profile, 1584 × 396' },
  company: { W: 1128, H: 191, label: 'LinkedIn company', title: 'LinkedIn company, 1128 × 191' },
};
const MONO = "'Geist Mono', ui-monospace, monospace";
const INK = '#EFEFEF';

function monoText(g, s, x, y, px, align = 'left', color = INK) {
  g.font = `400 ${px}px ${MONO}`;
  g.letterSpacing = `${px * 0.06}px`;
  g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle';
  g.fillText(s.toUpperCase(), x, y);
  g.letterSpacing = '0px';
}

// An image drawn to cover a square, and the map from a point of the image (fractions) to the canvas.
function tile(g, img, x, y, size) {
  const k = Math.max(size / img.width, size / img.height);
  const w = img.width * k, h = img.height * k, ox = x + (size - w) / 2, oy = y + (size - h) / 2;
  g.save(); g.beginPath(); g.rect(x, y, size, size); g.clip();
  g.drawImage(img, ox, oy, w, h);
  g.restore();
  return f => ({ x: ox + f.x * w, y: oy + f.y * h });
}

// A callout as on a technical drawing: a dot on the cube, a thin straight line out past the object's
// outline, a dot, the label. The label goes beside the object on the side the cube is on if it fits
// there, else the other side, else above or below it; never over the cubes. `safe` is where labels
// may sit: inside the frame, clear of the part labels and the big word.
function callout(g, at, text, obj, scale, safe, taken) {
  const px = 13 * scale, gap = 10 * scale, clear = 22 * scale;
  g.font = `400 ${px}px ${MONO}`; g.letterSpacing = `${px * 0.06}px`;
  const tw = g.measureText(text.toUpperCase()).width; g.letterSpacing = '0px';
  const need = tw + gap + clear;
  const leftRoom = obj.x0 - safe.x0, rightRoom = safe.x1 - obj.x1;
  const prefer = at.x < (obj.x0 + obj.x1) / 2 ? 'left' : 'right';
  const sides = prefer === 'left' ? ['left', 'right'] : ['right', 'left'];
  let end, align;
  const side = sides.find(sd => (sd === 'left' ? leftRoom : rightRoom) >= need);
  if (side) {
    let y = Math.min(safe.y1, Math.max(safe.y0, at.y));
    // Two labels on one side never share a line.
    for (const t of taken) if (t.side === side && Math.abs(t.y - y) < px * 2.2) y = t.y + (y >= t.y ? 1 : -1) * px * 2.2;
    end = { x: side === 'left' ? obj.x0 - clear : obj.x1 + clear, y };
    align = side === 'left' ? 'right' : 'left';
    taken.push({ side, y });
  } else {
    // Above the object if there is a line's room and no label there yet, else below.
    const up = obj.y0 - safe.y0 >= px * 2.5 && !taken.some(t => t.side === 'up');
    end = { x: Math.min(safe.x1 - tw - gap, Math.max(safe.x0, at.x)), y: up ? Math.max(safe.y0, obj.y0 - clear) : Math.min(safe.y1, obj.y1 + clear) };
    align = 'left';
    taken.push({ side: up ? 'up' : 'down', y: end.y });
  }
  g.strokeStyle = 'rgba(239, 239, 239, 0.85)';
  g.lineWidth = Math.max(1, scale * 0.8);
  g.beginPath(); g.moveTo(at.x, at.y); g.lineTo(end.x, end.y); g.stroke();
  g.fillStyle = INK;
  for (const p of [at, end]) { g.beginPath(); g.arc(p.x, p.y, 2.4 * scale, 0, Math.PI * 2); g.fill(); }
  monoText(g, text, end.x + (align === 'left' ? gap : -gap), end.y, px, align);
}

// What the generated image itself shows, read once per image at 256 px: the object's outline (every
// pixel brighter than the black ground) and where the red LED and the lime part are (the 16 px block
// with most pixels of that colour). The model frames its image close to our render but not exactly,
// so this is what callouts trust; the projection is the fallback.
const seen = new WeakMap();
function readImage(img) {
  if (seen.has(img)) return seen.get(img);
  const N = 256, cv = canvasOf(N, N), g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, N, N);
  const d = g.getImageData(0, 0, N, N).data;
  let x0 = N, y0 = N, x1 = -1, y1 = -1;
  const red = new Map(), lime = new Map(), add = (m, x, y) => { const k = (y >> 4) * 16 + (x >> 4); const b = m.get(k) ?? { n: 0, x: 0, y: 0 }; b.n++; b.x += x; b.y += y; m.set(k, b); };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = (y * N + x) * 4, r = d[i], gr = d[i + 1], b = d[i + 2];
    if (Math.max(r, gr, b) > 48) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    if (r > 150 && gr < 90 && b < 90 && r - gr > 90) add(red, x, y);
    else if (gr > 140 && r > 90 && b < 110 && gr - b > 80 && r < gr * 1.1) add(lime, x, y);
  }
  const best = m => { let top = null; for (const b of m.values()) if (b.n >= 6 && (!top || b.n > top.n)) top = b; return top && { x: top.x / top.n / N, y: top.y / top.n / N }; };
  const out = { outline: x1 < 0 ? null : { x0: x0 / N, y0: y0 / N, x1: (x1 + 1) / N, y1: (y1 + 1) / N }, led: best(red), lime: best(lime) };
  seen.set(img, out);
  return out;
}

// Two points per word for the callouts (the LED and the lime part where the glass has them, else the
// leftmost and rightmost cubes) and the object's outline.
function calloutPoints(V, img) {
  const a = voxlAnchors(V), seenIn = readImage(img);
  const xs = a.cubes.map(c => c.x), ys = a.cubes.map(c => c.y);
  const half = 0.6 * (Math.max(...xs) - Math.min(...xs)) / Math.max(1, cells(V.icon).w - 1);
  const outline = seenIn.outline ?? { x0: Math.min(...xs) - half, x1: Math.max(...xs) + half, y0: Math.min(...ys) - half, y1: Math.max(...ys) + half };
  if (V.mat === 'glass' && V.inside) return { points: [seenIn.led ?? a.led, seenIn.lime ?? a.lime], outline };
  const sorted = a.cubes.slice().sort((p, q) => p.x - q.x);
  return { points: [sorted[0], sorted[sorted.length - 1]], outline };
}

// The Indx mark, from its own pixels in pixl.json: `cell` px a pixel, its top right at (x, y).
function drawMark(g, xRight, y, cell, colour = INK) {
  const ic = cells('indx');
  g.fillStyle = colour;
  for (const c of ic.list) g.fillRect(Math.round(xRight - (ic.w - c.x) * cell), Math.round(y + c.y * cell), Math.ceil(cell), Math.ceil(cell));
  return { w: ic.w * cell, h: ic.h * cell };
}

// The pack's ground is its motifs' own: the corner pixel of the first image, so a patterns or ASCII
// set on a palette background sits on one ground, not three panels on black.
function packGround(items) {
  const img = Object.values(items).find(it => it?.img)?.img;
  if (!img) return '#000000';
  const c = canvasOf(1, 1), g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, 1, 1, 0, 0, 1, 1);
  const [r, gg, b] = g.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${gg}, ${b})`;
}

// The mark and the wordmark go separately (3 Nov 2026), each in its own place. The wordmark is
// lowercase indx.co in FunktionalGrotesk at weight 400, as the site's header sets "indx"; `h` is its
// box height, like the mark's height where the two share a line.
function brandMark(g, x, y, h, align = 'left') {
  drawMark(g, align === 'right' ? x : x + h * 7 / 5, y, h / 5);
}
function wordmark(g, x, y, h, align = 'left') {
  // Book and smaller (3 Nov 2026): at 400 and the mark's height it read as a headline.
  h *= 0.66;
  g.font = `350 ${h}px ${TYPE}`; g.letterSpacing = '0px';
  g.fillStyle = INK; g.textAlign = align; g.textBaseline = 'middle';
  g.fillText(SIGNATURE, x, y + h / 2 - h * 0.03);
}

/** One canvas of the pack. `items` is per word { img, V } (V the generation's settings); `only` draws
 *  a single word for the one-per-word layouts. */
export function drawPack(P, items, k, only) {
  const L = PACK_LAYOUTS[P.layout], W = L.W * k, H = L.H * k;
  const cv = canvasOf(W, H), g = cv.getContext('2d');
  g.fillStyle = packGround(items); g.fillRect(0, 0, W, H);
  const words = only ? PACK_WORDS.filter(w => w.key === only) : PACK_WORDS;
  const word = (s, x, y, px, align = 'left') => {
    g.font = `350 ${px}px ${TYPE}`; g.letterSpacing = `${-px * 0.02}px`;
    g.fillStyle = INK; g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillText(s, x, y); g.letterSpacing = '0px';
  };
  const place = (w, x, y, size, calls, scale, safe = { x0: x + 16 * k, x1: x + size - 16 * k, y0: y + 16 * k, y1: y + size - 16 * k }) => {
    const it = items[w.key];
    if (!it?.img) { g.strokeStyle = '#262626'; g.lineWidth = k; g.strokeRect(x, y, size, size); monoText(g, `pick a ${w.key} image`, x + size / 2, y + size / 2, 12 * k, 'center', '#8E8E89'); return; }
    const map = tile(g, it.img, x, y, size);
    if (P.callouts && calls > 0 && it.V) {
      const { points, outline } = calloutPoints(it.V, it.img);
      const a = map({ x: outline.x0, y: outline.y0 }), b = map({ x: outline.x1, y: outline.y1 });
      const obj = { x0: a.x, y0: a.y, x1: b.x, y1: b.y }, taken = [];
      points.slice(0, calls).forEach((pt, i) => {
        const text = P.texts[w.key]?.[i];
        if (text) callout(g, map(pt), text, obj, scale, safe, taken);
      });
    }
  };
  const m = 56 * k;
  if (P.layout === 'post' || P.layout === 'portrait') {
    const w = words[0], size = W;
    const px = (P.layout === 'portrait' ? 150 : 128) * k;
    // Labels stay below the part labels and above the word.
    place(w, 0, 0, size, 2, 1.25 * k, { x0: m, x1: W - m, y0: m + 48 * k, y1: Math.min(size, H - m - px * 1.05) });
    // The mark in its corner (top right, or bottom right), indx.co in the other right-hand corner,
    // at the top level with the part label, at the bottom level with the word.
    const h = 28 * k, top = m - h / 2, bottom = H - m - px * 0.36 - h / 2;
    if (P.labels) monoText(g, `${P.parts[w.key]} / ${w.key}`, m, m, 15 * k);
    word(w.word, m - 6 * k, H - m, px);
    const markBottom = P.markCorner === 'br';
    if (P.mark) brandMark(g, W - m, markBottom ? bottom : top, h, 'right');
    wordmark(g, W - m, (markBottom ? top : bottom) + h * 0.1, h * 0.8, 'right');
  } else if (P.layout === 'triptych') {
    const gap = 28 * k, size = (W - 2 * m - 2 * gap) / 3, y = 132 * k;
    // The mark top left (or bottom right), indx.co top right.
    const h = 30 * k;
    if (P.mark) { if (P.markCorner === 'br') brandMark(g, W - m, H - m - h, h, 'right'); else brandMark(g, m, 66 * k - h / 2, h); }
    wordmark(g, W - m, 66 * k - h * 0.4, h * 0.8, 'right');
    words.forEach((w, i) => {
      const x = m + i * (size + gap);
      place(w, x, y, size, 1, 1.1 * k);
      if (P.labels) monoText(g, P.parts[w.key], x, y + size + 30 * k, 13 * k, 'left', '#8E8E89');
      word(w.word, x - 4 * k, y + size + 130 * k, 88 * k);
    });
  } else {
    // The banners. LinkedIn covers the lower left with the profile photo (from about 38% of the
    // height) or the page logo, so everything sits in two places: the mark and the line of type at
    // the top left, above that area, and the three images in a row to the right, each word below its
    // image, never over it. No callouts: at this size their labels would crowd the cubes.
    const wide = P.layout === 'profile';
    const top = (wide ? 36 : 16) * k, m2 = (wide ? 48 : 24) * k;
    const wordPx = (wide ? 34 : 19) * k, wordGap = (wide ? 14 : 7) * k;
    const size = H - top - wordGap - wordPx * 1.15 - (wide ? 20 : 10) * k, gap = (wide ? 28 : 44) * k;
    const x0 = W - m2 - 3 * size - 2 * gap;
    words.forEach((w, i) => {
      const x = x0 + i * (size + gap);
      place(w, x, top, size, 0, 1);
      word(w.word, x, top + size + wordGap + wordPx * 0.95, wordPx);
      if (P.labels) monoText(g, P.parts[w.key], x + size, top + size + wordGap + wordPx * 0.6, (wide ? 11 : 8) * k, 'right', '#8E8E89');
    });
    // Level with the images' tops: the mark at the top left, indx.co at the far end of the same line,
    // just before the images; both above where the profile photo or page logo goes.
    const h = (wide ? 30 : 17.5) * k;
    if (P.mark) brandMark(g, (wide ? 48 : 24) * k, top, h);
    wordmark(g, x0 - gap, top + h * 0.1, h * 0.8, 'right');
  }
  return cv;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────
export function canvasOf(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function norm(v) { const l = Math.hypot(...v); return v.map(x => x / l); }
