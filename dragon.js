/**
 * Bright Pastel Dragon Scales
 * Full-page animated hex tiles in pink, purple, blue, mint, yellow, peach.
 * Scales are opaque and clearly visible — bright pastel on white.
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

let hexes = [], W = 0, H = 0;
let mouseX = -9999, mouseY = -9999;
let t = 0;

function lerp(a, b, f) { return a + (b - a) * f; }

function getColor(nx, ny, time) {
  // Wave of color sweeping across grid
  const wave  = (Math.sin(nx * 5 - time * 0.7 + ny * 2) + 1) / 2;
  const idx   = (nx + ny * 0.6 + time * 0.05) % 1;
  const i0    = Math.floor(idx * COLORS.length) % COLORS.length;
  const i1    = (i0 + 1) % COLORS.length;
  const blend = (idx * COLORS.length) % 1;
  return [
    lerp(COLORS[i0][0], COLORS[i1][0], blend),
    lerp(COLORS[i0][1], COLORS[i1][1], blend),
    lerp(COLORS[i0][2], COLORS[i1][2], blend),
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

function animate(now) {
  requestAnimationFrame(animate);
  t = now * 0.001;

  // White background so scales read clearly
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Occasional sparkle
  if (Math.random() < 0.005) {
    hexes[Math.floor(Math.random() * hexes.length)].sparkle = 1;
  }

  for (const h of hexes) {
    const nx = h.bx / W;
    const ny = h.by / H;

    // Gentle bob
    const bobY = Math.sin(t * 0.9 + h.phase) * 4.5;
    const bobX = Math.cos(t * 0.6 + h.phase) * 1.5;

    // Mouse repulsion
    const dx = h.bx - mouseX, dy = h.by - mouseY;
    const d  = Math.hypot(dx, dy);
    let px = 0, py = 0, prox = 0;
    if (d < PUSH_R && d > 0) {
      prox = 1 - d / PUSH_R;
      const f = prox * prox;
      px = (dx / d) * f * MAX_PUSH;
      py = (dy / d) * f * MAX_PUSH;
    }

    // Spring
    h.vx = (h.vx + (h.bx + bobX + px - h.x) * SPRING) * DAMP;
    h.vy = (h.vy + (h.by + bobY + py - h.y) * SPRING) * DAMP;
    h.x += h.vx;
    h.y += h.vy;

    h.sparkle *= 0.87;

    // Color
    let [r, g, b] = getColor(nx, ny, t);
    // Sparkle brightens
    r = Math.min(255, r + h.sparkle * 120);
    g = Math.min(255, g + h.sparkle * 120);
    b = Math.min(255, b + h.sparkle * 120);
    // Mouse hover brightens slightly
    r = Math.min(255, r + prox * 30);
    g = Math.min(255, g + prox * 30);
    b = Math.min(255, b + prox * 30);

    const ri = r|0, gi = g|0, bi = b|0;
    const pts = hexPts(h.x, h.y, SIZE - 1);

    // Fill — fully opaque so scales are clearly visible
    fillHex(pts, `rgb(${ri},${gi},${bi})`);

    // Lighter inner glow highlight
    const shine = hexPts(h.x, h.y, (SIZE - 1) * 0.55);
    fillHex(shine, `rgba(255,255,255,0.22)`);

    // Crisp white gap between scales
    strokeHex(pts, 'rgba(255,255,255,0.85)', 2);

    // Mouse ring pulse
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
}

window.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  if (Math.random() < 0.07) {
    const near = hexes.filter(h => Math.hypot(h.x-mouseX, h.y-mouseY) < PUSH_R * 0.7);
    if (near.length) near[Math.floor(Math.random()*near.length)].sparkle = 0.8;
  }
});
window.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });
window.addEventListener('scroll',    () => { canvas.style.transform = `translateY(${window.scrollY * 0.04}px)`; });

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.15 });
window.addEventListener('load', () => {
  document.querySelectorAll('.timeline-item, .surf-card, .skill-group').forEach(el => observer.observe(el));
});

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(animate);
