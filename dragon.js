// ── Scroll progress bar ──
const sp = document.getElementById('sp');
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  if (sp) sp.style.width = Math.min(pct, 100) + '%';
}, { passive: true });

// ── Custom cursor ──
const dot  = document.getElementById('cur-dot');
const ring = document.getElementById('cur-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

(function moveCursor() {
  rx += (mx - rx) * 0.13;
  ry += (my - ry) * 0.13;
  if (dot)  { dot.style.left  = mx + 'px'; dot.style.top  = my + 'px'; }
  if (ring) { ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; }
  requestAnimationFrame(moveCursor);
})();

document.addEventListener('mouseover', e => {
  if (e.target.closest('a, button, .proj-row, .about-card, .cl')) {
    ring?.classList.add('big');
  } else {
    ring?.classList.remove('big');
  }
});

// ── Nav scroll class ──
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ── Scroll-in animations ──
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('vis');
    const rule = e.target.querySelector('.sec-rule');
    if (rule) setTimeout(() => rule.classList.add('lit'), 100);
    obs.unobserve(e.target);
  });
}, { threshold: 0.1 });

document.querySelectorAll('[data-a], .sec-head').forEach(el => obs.observe(el));

// ── Skill bars ──
const skillObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.querySelectorAll('.skill-fill').forEach((bar, i) => {
      setTimeout(() => { bar.style.width = bar.dataset.pct + '%'; }, i * 80);
    });
    skillObs.unobserve(e.target);
  });
}, { threshold: 0.25 });

document.querySelectorAll('.skill-cat').forEach(el => skillObs.observe(el));

// ── Counter animation ──
function countUp(el) {
  const target = +el.dataset.target;
  const dur = 1600;
  const t0  = performance.now();
  (function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = Math.round(Math.sqrt(p) * target);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target;
  })(performance.now());
}

const countObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.querySelectorAll('.count').forEach(countUp);
    countObs.unobserve(e.target);
  });
}, { threshold: 0.4 });

document.querySelectorAll('.about-cards').forEach(el => countObs.observe(el));

// ── Observe project rows after projects.js loads them ──
window.addEventListener('projectsLoaded', () => {
  document.querySelectorAll('.proj-row').forEach((el, i) => {
    el.style.transitionDelay = (i * 0.05) + 's';
    el.setAttribute('data-a', '');
    obs.observe(el);
  });
});
