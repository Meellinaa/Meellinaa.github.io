/**
 * Bright Pastel Dragon Scales
 * - Full-page animated hex tiles (pink → purple → blue → mint → yellow → peach)
 * - Click anywhere → "rock in water" ripple wave spreads across hex grid
 * - Click opens GitHub profile in new tab
 */

const canvas = document.getElementById('dragonCanvas');
const ctx    = canvas.getContext('2d');

const COLORS = [
  [255, 140, 185],  // hot pink
  [180, 130, 255],  // purple
  [100, 190, 255],  // sky blue
  [80,  230, 200],  // mint
  [255, 215,  80],  // yellow
  [255, 160, 120],  // peach
];

const SIZE     = 28;
const GAP      = 2;
const EFF      = SIZE + GAP;
const COL_STEP = EFF * 2 * 0.75;
const ROW_STEP = Math.sqrt(3) * EFF;

const PUSH_R   = 130;
const MAX_PUSH = 40;
const SPRING   = 0.10;
const DAMP     = 0.82;

// Rock-drop ripple waves
const waves = [];
const WAVE_SPEED  = 520;   // px per second
const WAVE_WIDTH  = 55;    // thickness of the wave band
const WAVE_FORCE  = 70;    // max outward push per hex
const MAX_WAVE_R  = 1600;  // wave dies after this radius

let hexes = [], W = 0, H = 0;
let mouseX = -9999, mouseY = -9999;
let t = 0;

function lerp(a, b, f) { return a + (b - a) * f; }

function getColor(nx, ny, time) {
  const idx  = ((nx + ny * 0.6 + time * 0.05) % 1 + 1) % 1;
  const i0   = Math.floor(idx * COLORS.length) % COLORS.length;
  const i1   = (i0 + 1) % COLORS.length;
  const bl   = (idx * COLORS.length) % 1;
  return [
    lerp(COLORS[i0][0], COLORS[i1][0], bl),
    lerp(COLORS[i0][1], COLORS[i1][1], bl),
    lerp(COLORS[i0][2], COLORS[i1][2], bl),
  ];
}

function hexPts(cx, cy, r) {
  const p = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return p;
}

function fillHex(pts, style) {
  ctx.beginPath();
  pts.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.closePath();
  ctx.fillStyle = style;
  ctx.fill();
}

function strokeHex(pts, style, lw) {
  ctx.beginPath();
  pts.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.closePath();
  ctx.strokeStyle = style;
  ctx.lineWidth = lw;
  ctx.stroke();
}

function buildGrid() {
  hexes = [];
  const cols = Math.ceil(W / COL_STEP) + 3;
  const rows = Math.ceil(H / ROW_STEP) + 3;
  for (let c = -1; c < cols; c++) {
    for (let r = -1; r < rows; r++) {
      const bx = c * COL_STEP;
      const by = r * ROW_STEP + (c % 2 ? ROW_STEP / 2 : 0);
      hexes.push({
        bx, by, x: bx, y: by,
        vx: 0, vy: 0,
        phase: c * 0.22 + r * 0.15 + Math.random() * 0.3,
        sparkle: 0,
      });
    }
  }
}

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  buildGrid();
}

// ── Splash effect at click centre ──────────────────────────────
function drawSplash(wx, wy, r, age) {
  // Expanding white ring
  const alpha = Math.max(0, 1 - age * 1.8);
  ctx.save();
  ctx.globalAlpha = alpha * 0.7;
  ctx.beginPath();
  ctx.arc(wx, wy, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  // Thin bright ring
  ctx.beginPath();
  ctx.arc(wx, wy, r * 0.35, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - (animate.last || now)) / 1000, 0.05);
  animate.last = now;
  t = now * 0.001;

  // Advance waves
  for (const w of waves) w.r += WAVE_SPEED * dt;
  // Remove expired
  for (let i = waves.length - 1; i >= 0; i--) {
    if (waves[i].r > MAX_WAVE_R) waves.splice(i, 1);
  }

  // White base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Occasional sparkle
  if (Math.random() < 0.005)
    hexes[Math.floor(Math.random() * hexes.length)].sparkle = 1;

  for (const h of hexes) {
    const nx = h.bx / W;
    const ny = h.by / H;

    // Bob
    const bobY = Math.sin(t * 0.9 + h.phase) * 4.5;
    const bobX = Math.cos(t * 0.6 + h.phase) * 1.5;

    // Mouse repulsion
    const mxd = h.bx - mouseX, myd = h.by - mouseY;
    const md  = Math.hypot(mxd, myd);
    let px = 0, py = 0, prox = 0;
    if (md < PUSH_R && md > 0) {
      prox = 1 - md / PUSH_R;
      const f = prox * prox;
      px = (mxd / md) * f * MAX_PUSH;
      py = (myd / md) * f * MAX_PUSH;
    }

    // ── Rock-drop wave forces ──
    for (const w of waves) {
      const wdx = h.bx - w.x, wdy = h.by - w.y;
      const wd  = Math.hypot(wdx, wdy);
      const dist = wd - w.r;            // signed distance from wave front
      if (dist > -WAVE_WIDTH && dist < WAVE_WIDTH * 0.4) {
        // bell-shaped impulse centred on the wave front
        const norm  = dist / WAVE_WIDTH;       // -1..~0.4
        const bell  = Math.exp(-norm * norm * 6);
        const age   = w.r / MAX_WAVE_R;
        const fade  = Math.max(0, 1 - age * 1.2);
        const force = bell * WAVE_FORCE * fade;
        // push outward from wave origin
        if (wd > 0) {
          px += (wdx / wd) * force;
          py += (wdy / wd) * force;
          // quick sparkle as the wave hits
          if (bell > 0.5 && h.sparkle < 0.3) h.sparkle = 0.55 * fade;
        }
      }
    }

    // Spring physics
    h.vx = (h.vx + (h.bx + bobX + px - h.x) * SPRING) * DAMP;
    h.vy = (h.vy + (h.by + bobY + py - h.y) * SPRING) * DAMP;
    h.x += h.vx;
    h.y += h.vy;
    h.sparkle *= 0.87;

    // Color
    let [r, g, b] = getColor(nx, ny, t);
    r = Math.min(255, r + h.sparkle * 120 + prox * 30);
    g = Math.min(255, g + h.sparkle * 120 + prox * 30);
    b = Math.min(255, b + h.sparkle * 120 + prox * 30);
    const ri = r|0, gi = g|0, bi = b|0;

    const pts = hexPts(h.x, h.y, SIZE - 1);
    fillHex(pts, `rgb(${ri},${gi},${bi})`);
    fillHex(hexPts(h.x, h.y, (SIZE-1)*0.55), 'rgba(255,255,255,0.22)');
    strokeHex(pts, 'rgba(255,255,255,0.85)', 2);

    // Mouse ring
    if (prox > 0.3) {
      const ring = hexPts(h.x, h.y, SIZE + 5);
      ctx.beginPath();
      ring.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
      ctx.closePath();
      ctx.globalAlpha = (prox - 0.3) * 0.9;
      ctx.strokeStyle = `rgba(${ri},${gi},${bi},1)`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Sparkle burst
    if (h.sparkle > 0.5) {
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.globalAlpha = h.sparkle * 0.9;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI;
        const l = SIZE * h.sparkle;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*-l, Math.sin(a)*-l);
        ctx.lineTo(Math.cos(a)*l,  Math.sin(a)*l);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = h.sparkle * 2.5;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  // Draw splash rings on top
  for (const w of waves) {
    const age = w.r / MAX_WAVE_R;
    drawSplash(w.x, w.y, w.r, age);
  }
}

// ── Click: drop rock + open GitHub ──────────────────────────────
// Listen on window (canvas has pointer-events:none so it sits behind UI)
// Only trigger on background clicks — not on links, buttons, or nav elements
const INTERACTIVE = new Set(['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL']);
window.addEventListener('click', e => {
  // Walk up the DOM to check if any ancestor is interactive
  let node = e.target;
  while (node && node !== document.body) {
    if (INTERACTIVE.has(node.tagName)) return;
    node = node.parentElement;
  }

  // Rock-drop wave
  waves.push({ x: e.clientX, y: e.clientY, r: 0 });

  // Trigger sparkles at the drop point
  const near = hexes.filter(h => Math.hypot(h.bx - e.clientX, h.by - e.clientY) < 60);
  near.forEach(h => { h.sparkle = 1; });

  // Open GitHub in new tab
  window.open('https://github.com/Meellinaa', '_blank');
});

// Pointer cursor on the body background so it feels clickable
document.body.style.cursor = 'pointer';

window.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  if (Math.random() < 0.07) {
    const near = hexes.filter(h => Math.hypot(h.x-mouseX, h.y-mouseY) < PUSH_R * 0.7);
    if (near.length) near[Math.floor(Math.random()*near.length)].sparkle = 0.8;
  }
});
window.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });
window.addEventListener('scroll', () => {
  canvas.style.transform = `translateY(${window.scrollY * 0.04}px)`;
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.15 });
window.addEventListener('load', () => {
  document.querySelectorAll('.timeline-item, .surf-card, .skill-group').forEach(el => observer.observe(el));
});

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(animate);
