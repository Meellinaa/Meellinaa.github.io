const GH_USER = 'Meellinaa';

const CURATED = {
  'Code-Red': {
    emoji: '🎮',
    desc: 'Multi-module educational typing game with persistent data storage, user account management & real-time teacher dashboard. Built in Java with JavaFX & Maven.',
    langs: ['Java', 'JavaFX', 'Maven'],
  },
  'ai-beauty-consultant': {
    emoji: '🤖',
    desc: 'Computer vision pipeline that classifies skin tones from photos and recommends matching products from a 500+ product database using ML algorithms.',
    langs: ['Python', 'PyTorch', 'Computer Vision'],
  },
  'SpendPal': {
    emoji: '🧾',
    desc: 'OCR-based receipt analyzer that extracts and classifies expense data into categories, with an analytics dashboard tracking spending patterns.',
    langs: ['Python', 'OCR'],
  },
  'PersonalFinanceManager': {
    emoji: '📊',
    desc: 'Transaction logging system with budget management, interactive charts and financial data visualization.',
    langs: ['Java'],
  },
  'Wordle': {
    emoji: '🟩',
    desc: 'Custom Wordle clone with daily challenges, win streaks, color-coded hints and smooth animations.',
    langs: ['Java'],
  },
};

const GOLD_STAR = {
  name: 'Gold Star Catering',
  desc: 'Co-founded a catering company — built Python & SQL data pipelines to analyze sales/expense data and identified pricing optimizations driving 30% month-over-month revenue growth.',
  html_url: 'https://github.com/Meellinaa',
  stargazers_count: 0,
  langs: ['Python', 'SQL'],
  manual: true,
};

async function fetchLangs(url) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
    return r.ok ? Object.keys(await r.json()) : [];
  } catch { return []; }
}

function makeCard(repo, langs, idx) {
  const m    = CURATED[repo.name] || {};
  const desc = repo.desc || m.desc || repo.description || '';
  const tags = (langs.length ? langs : (m.langs || []));
  const stars = repo.stargazers_count || 0;
  const num  = String(idx + 1).padStart(2, '0');

  const chips = tags.map(t => `<span class="proj-chip">${t}</span>`).join('');
  const starsEl = stars > 0 ? `<span class="proj-stars">★ ${stars}</span>` : '';

  return `
    <a class="proj-row" href="${repo.html_url}" target="_blank" rel="noopener">
      <span class="proj-idx">${num}</span>
      <div>
        <div class="proj-name-text">${repo.name}</div>
        <div class="proj-desc-text">${desc}</div>
        <div class="proj-chips">${chips}</div>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-shrink:0;">
        ${starsEl}
        <span class="proj-arrow">↗</span>
      </div>
    </a>`;
}

function fallback() {
  return Object.keys(CURATED).map(name => ({
    name, html_url: `https://github.com/${GH_USER}/${name}`,
    stargazers_count: 0, description: '',
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
    const curated = order.map(n => all.find(r => r.name === n)).filter(Boolean);
    const rest = all
      .filter(r => !order.includes(r.name) && !r.fork && r.description)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 4);
    repos = [...curated, ...rest];
  } catch {
    repos = fallback();
  }

  const allCards = [...repos, GOLD_STAR];

  const withLangs = await Promise.all(allCards.map(async (repo, i) => {
    const langs = repo.manual
      ? repo.langs
      : (CURATED[repo.name]?.langs || (repo.languages_url ? await fetchLangs(repo.languages_url) : []));
    return { repo, langs, i };
  }));

  grid.innerHTML = withLangs
    .map(({ repo, langs, i }) => makeCard(repo, langs, i))
    .join('');

  window.dispatchEvent(new Event('projectsLoaded'));
}

init();
