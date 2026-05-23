/**
 * Fetch all public repos from GitHub and render glass project cards with 3D tilt.
 */

const GH_USER = 'Meellinaa';

const CURATED = {
  'Code-Red': {
    emoji: '🚨',
    desc: 'Emergency-focused application for quickly accessing critical resources and real-time alerts in high-stakes situations.',
  },
  'ai-beauty-consultant': {
    emoji: '✨',
    desc: 'AI-powered beauty consultant that analyzes facial features and recommends personalized skincare and makeup routines.',
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
    desc: 'Custom Wordle clone with daily challenges, win streaks, color-coded hints and smooth keyboard animations.',
  },
};

const LANG_CLASS = lang => {
  const map = { Python:'lang-Python', JavaScript:'lang-JavaScript', TypeScript:'lang-TypeScript',
                Java:'lang-Java', HTML:'lang-HTML', CSS:'lang-CSS', C:'lang-C' };
  return map[lang] || 'lang-default';
};

const GH_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
</svg>`;

const STAR_SVG = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
</svg>`;

function makeCard(repo, langs, i) {
  const m    = CURATED[repo.name] || {};
  const emoji = m.emoji || '📁';
  const desc  = m.desc || repo.description || 'No description provided.';
  const stars = repo.stargazers_count || 0;
  const badges = langs.length
    ? langs.map(l => `<span class="lang-badge ${LANG_CLASS(l)}">${l}</span>`).join('')
    : '<span class="lang-badge lang-default">Code</span>';

  return `
    <div class="project-card"
         style="opacity:0;transform:translateY(28px) rotateX(4deg);
                transition:opacity .5s ease ${i*0.07}s,transform .5s ease ${i*0.07}s">
      <div class="card-top">
        <span class="card-emoji">${emoji}</span>
        <a href="${repo.html_url}" target="_blank" class="card-gh-btn" title="GitHub">${GH_SVG}</a>
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
    card.style.transform = `perspective(900px) rotateX(${-y*8}deg) rotateY(${x*8}deg) translateY(-6px) scale(1.02)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
}

async function fetchLangs(url) {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/vnd.github.v3+json' } });
    return r.ok ? Object.keys(await r.json()) : [];
  } catch { return []; }
}

function fallback() {
  return ['Code-Red','ai-beauty-consultant','SpendPal','PersonalFinanceManager','Wordle']
    .map(name => ({ name, html_url:`https://github.com/${GH_USER}/${name}`,
                    stargazers_count:0, description:'', languages:[] }));
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
    const curatedOrder = Object.keys(CURATED);
    const curatedRepos = curatedOrder.map(n => all.find(r => r.name === n)).filter(Boolean);
    const rest = all.filter(r => !curatedOrder.includes(r.name) && !r.fork)
                    .sort((a,b) => b.stargazers_count - a.stargazers_count);
    repos = [...curatedRepos, ...rest];
  } catch (e) {
    console.warn('GitHub API fallback:', e.message);
    repos = fallback();
  }

  if (!repos.length) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#9A90B0;padding:3rem">No repos found.</p>';
    return;
  }

  const withLangs = await Promise.all(repos.map(async (repo, i) => {
    const langs = repo.languages_url
      ? await fetchLangs(repo.languages_url)
      : (repo.language ? [repo.language] : repo.languages || []);
    return { repo, langs, i };
  }));

  grid.innerHTML = withLangs.map(({ repo, langs, i }) => makeCard(repo, langs, i)).join('');

  // Entrance animation
  requestAnimationFrame(() => requestAnimationFrame(() => {
    grid.querySelectorAll('.project-card').forEach(c => {
      c.style.opacity   = '1';
      c.style.transform = 'translateY(0) rotateX(0)';
    });
  }));

  // Attach 3D tilt to each card
  grid.querySelectorAll('.project-card').forEach(attachTilt);
}

init();
