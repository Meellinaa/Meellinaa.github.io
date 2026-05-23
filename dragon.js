/**
 * Full-page iridescent dragon scale effect.
 * Features: color-wave iridescence, roving specular highlight,
 * mouse ripple/push, random sparkles, idle float.
 */

const canvas = document.getElementById('dragonCanvas');
const ctx    = canvas.getContext('2d');

// ── Palette (pastel, blends between these) ──
const PAL = [
  [255, 179, 217],  // pink
  [212, 165, 255],  // purple
  [168, 216, 255],  // blue
  [179, 255, 224],  // mint
  [255, 212, 179],  // peach
  [255, 250, 180],  // yellow
];

// ── Geometry ──
const SIZE     = 30;
const GAP      = 4;
const EFF      = SIZE + GAP;
const HEX_W    = EFF * 2;
const HEX_H    = Math.sqrt(3) * EFF;
const COL_STEP = HEX_W * 0.75;
const ROW_STEP = HEX_H;

// ── Physics ──
const PUSH_R   = 110;
const MAX_PUSH = 30;
const SPRING   = 0.09;
const DAMP     = 0.80;

// ── State ──
let hexes = [], W = 0, H = 0;
let mouseX = -9999, mouseY = -9999;
let time = 0;

// Sparkle pool
const sparkles = [];

function lerp(a, b, t) { return a + (b - a) * t; }

function blend(t) {
  // Returns [r,g,b] blended across PAL
  const scaled = ((t % 1) + 1) % 1 * PAL.length;
  const i = Math.floor(scaled);
  const f = scaled - i;
  const c0 = PAL[i % PAL.length];
  const c1 = PAL[(i + 1) % PAL.length];
  return [lerp(c0[0], c1[0], f), lerp(c0[1], c1[1], f), lerp(c0[2], c1[2], f)];
}

function hexPts(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

function drawPoly(pts, fill, stroke, lw = 0.8) {
  ctx.beginPath();
  pts.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.closePath();
  if (fill)   { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}

function buildGrid() {
  hexes = [];
  const cols = Math.ceil(W / COL_STEP) + 3;
  const rows = Math.ceil(H / ROW_STEP) + 3;
  for (let c = -1; c < cols; c++) {
    for (let r = -1; r < rows; r++) {
      const bx = c * COL_STEP;
      const by = r * ROW_STEP + (c % 2 === 0 ? 0 : ROW_STEP / 2);
      hexes.push({
        bx, by, x: bx, y: by, vx: 0, vy: 0,
        colorOffset: (bx * 0.003 + by * 0.002),
        floatPhase: Math.random() * Math.PI * 2,
        floatAmp: 2.5 + Math.random() * 2,
        floatSpeed: 0.0005 + Math.random() * 0.0008,
        baseAlpha: 0.42 + Math.random() * 0.25,
        // sparkle state
        sparkBright: 0,
      });
    }
  }
}

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  buildGrid();
}

function maybeSparkle() {
  // Randomly light up a hex for a moment
  if (Math.random() < 0.006) {
    const h = hexes[Math.floor(Math.random() * hexes.length)];
    h.sparkBright = 1.0;
  }
}

function animate(now) {
  requestAnimationFrame(animate);
  time = now * 0.001;
  ctx.clearRect(0, 0, W, H);

  // Roving specular light source
  const lightX = W * 0.5 + Math.cos(time * 0.07) * W * 0.42;
  const lightY = H * 0.5 + Math.sin(time * 0.055) * H * 0.42;
  const lightR  = Math.min(W, H) * 0.55;

  maybeSparkle();

  for (const h of hexes) {
    // ── Idle float ──
    const fx = Math.cos(time * h.floatSpeed * 0.8 + h.floatPhase) * h.floatAmp * 0.5;
    const fy = Math.sin(time * h.floatSpeed + h.floatPhase) * h.floatAmp;

    // ── Mouse repulsion ──
    const dxM = h.bx - mouseX;
    const dyM = h.by - mouseY;
    const dM  = Math.hypot(dxM, dyM);
    let pushX = 0, pushY = 0, proximity = 0;
    if (dM < PUSH_R && dM > 0) {
      proximity = 1 - dM / PUSH_R;
      const f = proximity * proximity;
      pushX = (dxM / dM) * f * MAX_PUSH;
      pushY = (dyM / dM) * f * MAX_PUSH;
    }

    // ── Spring ──
    const targetX = h.bx + fx + pushX;
    const targetY = h.by + fy + pushY;
    h.vx = (h.vx + (targetX - h.x) * SPRING) * DAMP;
    h.vy = (h.vy + (targetY - h.y) * SPRING) * DAMP;
    h.x += h.vx;
    h.y += h.vy;

    // ── Iridescent color wave ──
    const wave = Math.sin(h.bx * 0.004 + time * 0.22) * 0.5
               + Math.cos(h.by * 0.004 + time * 0.16) * 0.5;
    const t = ((h.colorOffset + wave * 0.5 + time * 0.04) % 1 + 1) % 1;
    const [r, g, b] = blend(t);

    // ── Specular highlight ──
    const dxL = h.x - lightX;
    const dyL = h.y - lightY;
    const dL  = Math.hypot(dxL, dyL);
    const spec = Math.max(0, 1 - dL / lightR) ** 2.2;

    // ── Sparkle decay ──
    h.sparkBright *= 0.88;

    // ── Alpha ──
    const glowBoost = proximity * 0.35 + spec * 0.22 + h.sparkBright * 0.55;
    const alpha = Math.min(0.9, h.baseAlpha + glowBoost);

    const pts     = hexPts(h.x, h.y, SIZE - 1);
    const innerPts = hexPts(h.x, h.y, (SIZE - 1) * 0.6);

    // Main scale fill
    const fillA = alpha;
    drawPoly(pts,
      `rgba(${r|0},${g|0},${b|0},${fillA})`,
      `rgba(${r|0},${g|0},${b|0},${0.12 + glowBoost * 0.5})`,
      1
    );

    // Specular inner highlight
    if (spec > 0.04 || h.sparkBright > 0.05) {
      const highlightA = spec * 0.45 + h.sparkBright * 0.7;
      drawPoly(innerPts, `rgba(255,255,255,${highlightA})`, null);
    }

    // Mouse proximity glow ring
    if (proximity > 0.15) {
      const ringPts = hexPts(h.x, h.y, SIZE + 3);
      ctx.beginPath();
      ringPts.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
      ctx.closePath();
      ctx.globalAlpha = (proximity - 0.15) * 0.6;
      ctx.strokeStyle = `rgba(${r|0},${g|0},${b|0},1)`;
      ctx.lineWidth   = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Sparkle star burst at peak
    if (h.sparkBright > 0.6) {
      const sc = h.sparkBright;
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.globalAlpha = sc * 0.9;
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI;
        const len   = SIZE * sc * 1.1;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * -len, Math.sin(angle) * -len);
        ctx.lineTo(Math.cos(angle) * len,  Math.sin(angle) * len);
        ctx.strokeStyle = 'white';
        ctx.lineWidth   = sc * 2;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
}

// ── Mouse ──
window.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  // Occasionally trigger sparkles near cursor
  if (Math.random() < 0.08) {
    const near = hexes.filter(h => Math.hypot(h.x - mouseX, h.y - mouseY) < PUSH_R);
    if (near.length) {
      const h = near[Math.floor(Math.random() * near.length)];
      h.sparkBright = 0.7;
    }
  }
});

window.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });
window.addEventListener('resize', resize);
resize();
requestAnimationFrame(animate);
