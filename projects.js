/**
 * Fetch all public repos from Meellinaa's GitHub and render pastel project cards.
 * Curated descriptions + emojis for known projects; uses API description as fallback.
 */

const GH_USER = 'Meellinaa';

const CURATED = {
  'Code-Red': {
    emoji: '🚨',
    desc: 'Emergency-focused application for quickly accessing critical resources and real-time alerts in high-stakes situations.',
  },
  'ai-beauty-consultant': {
    emoji: '✨',
    desc: 'AI-powered beauty consultant that analyzes features and recommends personalized skincare and makeup routines.',
  },
  'SpendPal': {
    emoji: '💳',
    desc: 'Smart spending tracker that auto-categorizes transactions, visualizes habits, and keeps you on budget effortlessly.',
  },
  'PersonalFinanceManager': {
    emoji: '📊',
    desc: 'Comprehensive finance manager with income/expense tracking, trend analysis, and beautiful data visualizations.',
  },
  'Wordle': {
    emoji: '🟩',
    desc: 'Custom Wordle game with daily challenges, win streaks, and smooth keyboard animations — built in vanilla JS.',
  },
};

// ── Language → CSS class (pastel colors defined in CSS) ──
function langClass(lang) {
  const safe = (lang || 'default').replace(/[^a-zA-Z]/g, '');
  const known = ['Python','JavaScript','TypeScript','Java','HTML','CSS','C'];
  return known.includes(safe) ? `lang-${safe}` : 'lang-default';
}

// ── SVG icons ──
const GH_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
</svg>`;

const STAR_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
</svg>`;

function buildCard(repo, langs, index) {
  const meta  = CURATED[repo.name] || {};
  const emoji = meta.emoji || '📁';
  const desc  = meta.desc  || repo.description || 'No description provided.';
  const stars = repo.stargazers_count || 0;

  const badgeHTML = langs.length
    ? langs.map(l => `<span class="lang-badge ${langClass(l)}">${l}</span>`).join('')
    : '<span class="lang-badge lang-default">Code</span>';

  return `
    <div class="project-card" style="opacity:0;transform:translateY(20px);transition:opacity 0.45s ease ${index * 0.08}s,transform 0.45s ease ${index * 0.08}s">
      <div class="card-header">
        <span class="card-emoji">${emoji}</span>
        <a href="${repo.html_url}" target="_blank" class="card-gh-link" title="View on GitHub">${GH_ICON}</a>
      </div>
      <div class="card-name">${repo.name}</div>
      <div class="card-desc">${desc}</div>
      <div class="card-footer">
        <div class="lang-badges">${badgeHTML}</div>
        ${stars > 0 ? `<div class="card-stars">${STAR_ICON} ${stars}</div>` : ''}
      </div>
    </div>`;
}

// Offline fallback in case API is rate-limited
function fallbackRepos() {
  return [
    { name: 'Code-Red',               html_url: `https://github.com/${GH_USER}/Code-Red`,               stargazers_count: 0, description: '' },
    { name: 'ai-beauty-consultant',   html_url: `https://github.com/${GH_USER}/ai-beauty-consultant`,   stargazers_count: 0, description: '' },
    { name: 'SpendPal',               html_url: `https://github.com/${GH_USER}/SpendPal`,               stargazers_count: 0, description: '' },
    { name: 'PersonalFinanceManager', html_url: `https://github.com/${GH_USER}/PersonalFinanceManager`, stargazers_count: 0, description: '' },
    { name: 'Wordle',                 html_url: `https://github.com/${GH_USER}/Wordle`,                 stargazers_count: 0, description: '' },
  ].map(r => ({ ...r, languages: [] }));
}

async function fetchLanguages(url) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
    if (!r.ok) return [];
    return Object.keys(await r.json());
  } catch { return []; }
}

async function loadProjects() {
  const grid = document.getElementById('projectsGrid');

  let repos = [];
  try {
    const res = await fetch(
      `https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=updated`,
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );
    if (!res.ok) throw new Error(`${res.status}`);
    const all = await res.json();

    // Sort: curated repos first (in order), then remaining alphabetically
    const curated = Object.keys(CURATED);
    const curatedRepos = curated.map(n => all.find(r => r.name === n)).filter(Boolean);
    const rest = all
      .filter(r => !curated.includes(r.name) && !r.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count);

    repos = [...curatedRepos, ...rest];
  } catch (e) {
    console.warn('GitHub API unavailable — using fallback:', e.message);
    repos = fallbackRepos();
  }

  if (!repos.length) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#8A8A9A;padding:3rem">No public repos found.</p>';
    return;
  }

  // Fetch languages in parallel
  const withLangs = await Promise.all(
    repos.map(async repo => {
      const langs = repo.languages_url
        ? await fetchLanguages(repo.languages_url)
        : (repo.language ? [repo.language] : repo.languages || []);
      return { repo, langs };
    })
  );

  grid.innerHTML = withLangs
    .map(({ repo, langs }, i) => buildCard(repo, langs, i))
    .join('');

  // Trigger entrance animations
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      grid.querySelectorAll('.project-card').forEach(card => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      });
    });
  });
}

loadProjects();
