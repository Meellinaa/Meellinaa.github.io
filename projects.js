// Selected Work: the same six projects, photos and wording as the GitHub profile README.
const GH = 'https://github.com/Meellinaa/';

const PROJECTS = [
  { repo: 'StemSlice', title: 'StemSlice', photo: 'conch.jpg', pos: 'center 12%',
    desc: 'AI DJ engine that splits songs into vocals, drums, bass and melody, then blends them into seamless, beatmatched transitions.',
    tags: ['Python', 'Demucs', 'Librosa', 'FastAPI'] },
  { repo: 'omniprep-ai', title: 'OmniPrep AI', photo: 'sparkle-water.jpg', pos: 'center 45%',
    desc: 'Voice-driven mock interviews with live audio and vision feedback and an automatic STAR-method debrief. Built at Ignition Hacks.',
    tags: ['Python', 'ElevenLabs', 'Vision'] },
  { repo: 'TheGrindTracker', title: 'The Grind Tracker', photo: 'golden-wave.jpg', pos: 'center 55%',
    desc: 'A visual job-hunt dashboard: application stages, deadlines, timelines and the tailored résumé for every role.',
    tags: ['TypeScript', 'React', 'Tailwind'] },
  { repo: 'ai-beauty-consultant', title: 'AI Beauty Consultant', photo: 'pearl-shell.jpg', pos: 'center 40%',
    desc: 'Finds your foundation shade from a selfie and recommends skincare from real Sephora product data.',
    tags: ['Python', 'OpenCV', 'MediaPipe'] },
  { repo: 'llm-robustness-tester', title: 'LLM Robustness Tester', photo: 'arches.jpg', pos: 'center 25%',
    desc: "Rewrites a prompt five ways and scores how consistent an LLM's answers are, with a similarity heatmap.",
    tags: ['Python', 'FastAPI', 'NLP'] },
  { repo: 'SpendPal', title: 'SpendPal', photo: 'roses-fountain.jpg', pos: 'center 45%',
    desc: 'Scans grocery receipts with OCR, sorts every item into a category and tracks spending against a budget.',
    tags: ['Python', 'OCR', 'MongoDB'] },
];

function card(p, i) {
  const num = String(i + 1).padStart(2, '0');
  const tags = p.tags.map(t => `<span class="proj-chip">${t}</span>`).join('');
  return `
    <a class="proj-card" href="${GH}${p.repo}" target="_blank" rel="noopener">
      <div class="proj-photo" style="background-image:url('photos/${p.photo}');background-position:${p.pos}">
        <span class="proj-num">${num}</span>
        <span class="proj-go" aria-hidden="true">↗</span>
      </div>
      <div class="proj-body">
        <h3 class="proj-title">${p.title}</h3>
        <p class="proj-desc">${p.desc}</p>
        <div class="proj-chips">${tags}</div>
      </div>
    </a>`;
}

document.getElementById('projectsGrid').innerHTML = PROJECTS.map(card).join('');
window.dispatchEvent(new Event('projectsLoaded'));
