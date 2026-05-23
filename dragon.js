/**
 * Pastel Dragon-Scale Effect
 * Hex scales fill the hero header with soft spring-physics push-away on hover.
 * Idle scales float gently with a sin-wave wobble.
 */

const canvas = document.getElementById('dragonCanvas');
const ctx    = canvas.getContext('2d');

// ── Pastel scale colors ──
const COLORS = [
  { r: 255, g: 179, b: 217 },  // pastel pink  #FFB3D9
  { r: 212, g: 165, b: 255 },  // pastel purple #D4A5FF
  { r: 168, g: 216, b: 255 },  // pastel blue   #A8D8FF
  { r: 179, g: 255, b: 224 },  // pastel mint   #B3FFE0
  { r: 255, g: 212, b: 179 },  // pastel peach  #FFD4B3
];

// ── Hex geometry ──
const SIZE      = 32;   // hex radius
const GAP       = 3;    // gap between scales
const EFFECTIVE = SIZE + GAP;
const HEX_W     = EFFECTIVE * 2;
const HEX_H     = Math.sqrt(3) * EFFECTIVE;
const COL_STEP  = HEX_W * 0.75;
const ROW_STEP  = HEX_H;

// ── Physics ──
const PUSH_RADIUS  = 90;   // px — mouse influence radius
const MAX_PUSH     = 28;   // px — max displacement
const SPRING       = 0.10; // spring back strength
const DAMPING      = 0.82; // velocity damping (< 1 = friction)
const FLOAT_SPEED  = 0.0008;
const FLOAT_AMP    = 3.5;  // px — idle float amplitude

let hexes = [];
let W = 0, H = 0;
let mouseX = -9999, mouseY = -9999;
let mouseInCanvas = false;
let raf;

function hexCorner(cx, cy, r, i) {
  const angle = (Math.PI / 180) * (60 * i - 30);
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function buildGrid() {
  hexes = [];
  const cols = Math.ceil(W / COL_STEP) + 2;
  const rows = Math.ceil(H / ROW_STEP) + 2;

  for (let col = -1; col < cols; col++) {
    for (let row = -1; row < rows; row++) {
      const bx = col * COL_STEP;
      const by = row * ROW_STEP + (col % 2 === 0 ? 0 : ROW_STEP / 2);

      hexes.push({
        bx, by,           // base position (never changes)
        x: bx, y: by,    // current position (springs around base)
        vx: 0, vy: 0,    // velocity

        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        floatPhase: Math.random() * Math.PI * 2,
        floatSpeed: FLOAT_SPEED * (0.6 + Math.random() * 0.8),
        // slight alpha variance for depth
        baseAlpha: 0.32 + Math.random() * 0.28,
      });
    }
  }
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  W = canvas.width  = rect.width;
  H = canvas.height = rect.height;
  buildGrid();
}

function drawHex(cx, cy, r, fillStyle, strokeStyle) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const [x, y] = hexCorner(cx, cy, r, i);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle   = fillStyle;
  ctx.fill();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth   = 1;
  ctx.stroke();
}

function tick(now) {
  raf = requestAnimationFrame(tick);
  ctx.clearRect(0, 0, W, H);

  for (const h of hexes) {
    // ── Idle float ──
    const floatY = Math.sin(now * h.floatSpeed + h.floatPhase) * FLOAT_AMP;
    const floatX = Math.cos(now * h.floatSpeed * 0.7 + h.floatPhase) * (FLOAT_AMP * 0.4);

    // ── Mouse repulsion ──
    let targetX = h.bx + floatX;
    let targetY = h.by + floatY;

    if (mouseInCanvas) {
      const dx = h.bx - mouseX;
      const dy = h.by - mouseY;
      const d  = Math.sqrt(dx * dx + dy * dy);

      if (d < PUSH_RADIUS && d > 0) {
        const force  = (1 - d / PUSH_RADIUS);         // 0→1 as we get closer
        const smooth = force * force;                   // ease-in curve (gentler near edge)
        const pushX  = (dx / d) * smooth * MAX_PUSH;
        const pushY  = (dy / d) * smooth * MAX_PUSH;
        targetX += pushX;
        targetY += pushY;
      }
    }

    // ── Spring physics ──
    const fx = (targetX - h.x) * SPRING;
    const fy = (targetY - h.y) * SPRING;
    h.vx = (h.vx + fx) * DAMPING;
    h.vy = (h.vy + fy) * DAMPING;
    h.x += h.vx;
    h.y += h.vy;

    // ── Proximity glow ──
    const dx   = h.x - mouseX;
    const dy   = h.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const glow = mouseInCanvas ? Math.max(0, 1 - dist / PUSH_RADIUS) : 0;

    const { r, g, b } = h.color;
    const alpha = h.baseAlpha + glow * 0.35;

    // Main fill
    const fill   = `rgba(${r},${g},${b},${alpha})`;
    const stroke = `rgba(${r},${g},${b},${0.18 + glow * 0.45})`;
    drawHex(h.x, h.y, SIZE, fill, stroke);

    // Inner highlight (brighter center when hovered)
    if (glow > 0.05) {
      const innerFill = `rgba(255,255,255,${glow * 0.22})`;
      drawHex(h.x, h.y, SIZE * 0.5, innerFill, 'transparent');
    }
  }
}

// ── Mouse tracking (relative to canvas) ──
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
  mouseInCanvas = true;
});

canvas.addEventListener('mouseleave', () => {
  mouseInCanvas = false;
});

// Also track from the hero element so the whole header responds
const hero = document.querySelector('.hero');
hero.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
  mouseInCanvas = true;
});
hero.addEventListener('mouseleave', () => { mouseInCanvas = false; });

// ── Init ──
const ro = new ResizeObserver(resize);
ro.observe(canvas);
resize();
requestAnimationFrame(tick);
