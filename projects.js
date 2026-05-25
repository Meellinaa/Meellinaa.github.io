/**
 * Surfboard project cards — GitHub API + Gold Star Catering manual entry.
 * Each card has a surf-brand color accent and 3D tilt on hover.
 */

const GH_USER = 'Meellinaa';

// Card accent gradients — one per project (surf brand vibes)
const ACCENTS = [
  'linear-gradient(90deg,#FF6B6B,#FF8E53)',  // coral sunset
  'linear-gradient(90deg,#FFD93D,#FF8E53)',  // gold wave
  'linear-gradient(90deg,#48CAE4,#0077B6)',  // deep ocean
  'linear-gradient(90deg,#90E0EF,#48CAE4)',  // seafoam
  'linear-gradient(90deg,#FF6B6B,#FFD93D)',  // fire sunset
  'linear-gradient(90deg,#FFD93D,#B3FFE0)',  // gold mint
];

const CURATED = {
  'Code-Red': {
    emoji: '🚨',
    desc: 'Multi-module educational game with persistent data storage, user account management & real-time teacher dashboard. Built in Java with JavaFX & Maven.',
    accent: ACCENTS[0],
  },
  'ai-beauty-consultant': {
    emoji: '💄',
    desc: 'Computer vision pipeline that classifies skin tones from photos and recommends matching products from a 500+ product database using ML algorithms.',
    accent: ACCENTS[1],
  },
  'SpendPal': {
    emoji: '🧾',
    desc: 'OCR-based receipt analyzer that extracts and classifies expense data into categories with an analytics dashboard tracking spending patterns.',
    accent: ACCENTS[2],
  },
  'PersonalFinanceManager': {
    emoji: '📊',
    desc: 'Transaction logging system with budget management, interactive charts and financial data visualization built in Java.',
    accent: ACCENTS[3],
  },
  'Wordle': {
    emoji: '🟩',
    desc: 'Custom Wordle clone with daily challenges, win streaks, color-coded hints and smooth animations.',
    accent: ACCENTS[4],
  },
};

// Gold Star Catering — manual entry (not on GitHub as code project)
const GOLD_STAR = {
  name: 'Gold Star Catering',
  emoji: '⭐',
  desc: 'Co-founded a catering company — built Python & SQL data pipelines to analyze sales/expense data and identified pricing optimizations driving 30% month-over-month revenue growth.',
  html_url: 'https://github.com/Meellinaa',
  stargazers_count: 0,
  languages: ['Python', 'SQL'],
  accent: ACCENTS[5],
  manual: true,
};

const GH_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
</svg>`;

const STAR_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;

const LANG_CLASS = lang => {
  const map = { Python:'lang-Python', JavaScript:'lang-JavaScript', TypeScript:'lang-TypeScript',
                Java:'lang-Java', HTML:'lang-HTML', CSS:'lang-CSS', SQL:'lang-default' };
  return map[lang] || 'lang-default';
};

function makeCard(repo, langs, accentStyle, delay) {
  const m     = CURATED[repo.name] || {};
  const emoji = repo.emoji || m.emoji || '🏄';
  const desc  = repo.desc  || m.desc  || repo.description || 'No description.';
  const stars = repo.stargazers_count || 0;
  const accent = accentStyle || m.accent || ACCENTS[0];

  const badges = (langs.length ? langs : ['Code'])
    .map(l => `<span class="lang-badge ${LANG_CLASS(l)}">${l}</span>`).join('');

  return `
    <div class="surf-card"
         style="--card-accent:${accent};
                transition-delay:${delay}s">
      <div class="card-top">
        <span class="card-emoji">${emoji}</span>
        <a href="${repo.html_url}" target="_blank" class="card-gh-btn" title="View on GitHub">${GH_SVG}</a>
      </div>
      <div class="card-name">${repo.name}</div>
      <div class="card-desc">${desc}</div>
      <div class="card-footer">
        <div class="lang-badges">${badges}</div>
        ${stars > 0 ? `<div class="card-stars">${STAR_SVG} ${stars}</div>` : ''}
      </div>
    </div>`;
}

function attachTilt(card) {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transform = `perspective(900px) rotateX(${-y*7}deg) rotateY(${x*7}deg) translateY(-8px) scale(1.02)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
}

async function fetchLangs(url) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
    return r.ok ? Object.keys(await r.json()) : [];
  } catch { return []; }
}

function fallback() {
  return Object.keys(CURATED).map(name => ({
    name, html_url: `https://github.com/${GH_USER}/${name}`,
    stargazers_count: 0, description: '', languages: [],
  }));
}

async function init() {
  const grid = document.getElementById('projectsGrid');

  let repos = [];
  try {
    const res = await fetch(
      `https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=updated`,
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );
    if (!res.ok) throw new Error(res.status);
    const all = await res.json();
    const order = Object.keys(CURATED);
    const curatedRepos = order.map(n => all.find(r => r.name === n)).filter(Boolean);
    const rest = all.filter(r => !order.includes(r.name) && !r.fork)
                    .sort((a, b) => b.stargazers_count - a.stargazers_count);
    repos = [...curatedRepos, ...rest];
  } catch(e) {
    console.warn('GitHub API fallback:', e.message);
    repos = fallback();
  }

  // Add Gold Star Catering as last card
  const allCards = [...repos, GOLD_STAR];

  const withLangs = await Promise.all(allCards.map(async (repo, i) => {
    const langs = repo.manual
      ? (repo.languages || [])
      : (repo.languages_url
          ? await fetchLangs(repo.languages_url)
          : (repo.language ? [repo.language] : repo.languages || []));
    return { repo, langs, i };
  }));

  grid.innerHTML = withLangs
    .map(({ repo, langs, i }) => makeCard(repo, langs, CURATED[repo.name]?.accent || repo.accent, i * 0.07))
    .join('');

  // Entrance animation
  requestAnimationFrame(() => requestAnimationFrame(() => {
    grid.querySelectorAll('.surf-card').forEach(c => c.classList.add('visible'));
  }));

  // 3D tilt
  grid.querySelectorAll('.surf-card').forEach(attachTilt);
}

init();
