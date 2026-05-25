/**
 * Soft Pastel Floating Orbs
 * Gentle glowing circles drift across the page like light through water.
 * - Mouse gently pushes orbs away
 * - Orbs pulse/breathe softly
 * - Pastel rainbow palette
 */

const canvas = document.getElementById('dragonCanvas');
const ctx    = canvas.getContext('2d');

const PASTEL = [
  [255, 154, 196],  // pink
  [200, 160, 255],  // purple
  [126, 200, 255],  // sky blue
  [123, 255, 218],  // mint
  [255, 229, 102],  // yellow
  [255, 177, 153],  // peach
];

let orbs = [], W = 0, H = 0;
let mouseX = -9999, mouseY = -9999;
let time = 0;

function randBetween(a, b) { return a + Math.random() * (b - a); }

function createOrb(forceOnScreen) {
  const col = PASTEL[Math.floor(Math.random() * PASTEL.length)];
  return {
    x:     forceOnScreen ? randBetween(0, W) : randBetween(-100, W + 100),
    y:     forceOnScreen ? randBetween(0, H) : randBetween(-100, H + 100),
    vx:    (Math.random() - 0.5) * 0.4,
    vy:    (Math.random() - 0.5) * 0.4,
    r:     randBetween(55, 140),
    col,
    phase: Math.random() * Math.PI * 2,
    alpha: randBetween(0.13, 0.28),
  };
}

function buildOrbs() {
  orbs = [];
  // ~1 orb per 18 000 px² — looks lush without being heavy
  const count = Math.max(18, Math.round((W * H) / 18000));
  for (let i = 0; i < count; i++) orbs.push(createOrb(true));
}

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  buildOrbs();
}

function animate(now) {
  requestAnimationFrame(animate);
  time = now * 0.001;
  ctx.clearRect(0, 0, W, H);

  for (const o of orbs) {
    // Drift
    o.x += o.vx;
    o.y += o.vy;

    // Wrap
    const pad = o.r + 10;
    if (o.x < -pad)    o.x = W + pad;
    if (o.x > W + pad) o.x = -pad;
    if (o.y < -pad)    o.y = H + pad;
    if (o.y > H + pad) o.y = -pad;

    // Mouse repulsion — soft push
    const dx = o.x - mouseX, dy = o.y - mouseY;
    const d  = Math.hypot(dx, dy);
    const pushR = 180;
    if (d < pushR && d > 1) {
      const f = (1 - d / pushR) * 0.6;
      o.vx += (dx / d) * f;
      o.vy += (dy / d) * f;
    }

    // Gentle damping keeps speed in check
    o.vx *= 0.978;
    o.vy *= 0.978;

    // Breathing pulse
    const pulse = 1 + Math.sin(time * 0.7 + o.phase) * 0.08;
    const r = o.r * pulse;

    // Radial gradient — soft glow, hard centre fades to transparent edge
    const [R, G, B] = o.col;
    const grd = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
    grd.addColorStop(0,    `rgba(${R},${G},${B},${(o.alpha * 1.6).toFixed(2)})`);
    grd.addColorStop(0.45, `rgba(${R},${G},${B},${o.alpha.toFixed(2)})`);
    grd.addColorStop(1,    `rgba(${R},${G},${B},0)`);

    ctx.beginPath();
    ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
  }
}

// ── Scroll parallax ──
window.addEventListener('scroll', () => {
  canvas.style.transform = `translateY(${window.scrollY * 0.04}px)`;
});

window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
window.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });

// ── Scroll-in animations ──
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.15 });

window.addEventListener('load', () => {
  document.querySelectorAll('.timeline-item, .surf-card, .skill-group').forEach(el => observer.observe(el));
});

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(animate);
