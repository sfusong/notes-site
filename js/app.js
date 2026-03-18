/* ============================================================
   app.js  —  Personal Notes Site
   ============================================================ */

const CONFIG = {
  indexUrl: 'notes/index.json',
  siteName: '我的笔记',
};

const NOTE_PROGRESS_KEY = 'note-progress-v1';

// ── Theme Definitions ─────────────────────────────────────────
const THEMES = [
  // id, name, group, dark(hljs), swatch bg, accent color
  { id: 'claude',    name: 'Claude',   group: 'tool',  dark: false, bg: '#f9f7f4', ac: '#d97757' },
  { id: 'notion',    name: 'Notion',   group: 'tool',  dark: false, bg: '#ffffff', ac: '#2e75d0' },
  { id: 'vue',       name: 'Vue',      group: 'tool',  dark: true,  bg: '#1a1a2e', ac: '#42d392' },
  { id: 'apple',     name: 'Apple',    group: 'tool',  dark: false, bg: '#f5f5f7', ac: '#007AFF' },
  { id: 'linear',    name: 'Linear',   group: 'tool',  dark: true,  bg: '#0a0a0f', ac: '#7c3aed' },
  { id: 'obsidian',  name: 'Obsidian', group: 'tool',  dark: true,  bg: '#1e1e2e', ac: '#e0af68' },
  { id: 'github',    name: 'GitHub',   group: 'tool',  dark: false, bg: '#f6f8fa', ac: '#2da44e' },
  { id: 'bear',      name: 'Bear',     group: 'paper', dark: false, bg: '#fef6e9', ac: '#d73a49' },
  { id: 'kindle',    name: 'Kindle',   group: 'paper', dark: false, bg: '#f5f0e8', ac: '#8b4513' },
  { id: 'newspaper', name: '报纸',     group: 'paper', dark: false, bg: '#ffffff', ac: '#cc0000' },
  { id: 'cyberpunk', name: '赛博朋克', group: 'fun',   dark: true,  bg: '#0d0d1a', ac: '#ff2d78' },
  { id: 'terminal',  name: '绿色终端', group: 'fun',   dark: true,  bg: '#0d0d0d', ac: '#00ff41' },
  { id: 'chinese',   name: '国风',     group: 'fun',   dark: false, bg: '#f5f0e0', ac: '#c0392b' },
];

const GROUP_LABELS = { tool: '产品 / 工具', paper: '纸质 / 人文', fun: '个性 / 有趣' };

const state = {
  categories: [],
  allNotes: [],
  currentCategory: null,
  currentNote: null,
  searchQuery: '',
  searchSelection: -1,
  theme: 'claude',
  mobilePanel: 'sidebar',
  searchIndex: null,
  searchIndexLoading: false,
  noteRequestId: 0,
  hasToc: false,
  progressSaveTimer: null,
};

// ── DOM helpers ──────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Resolve saved theme (remap old 'light'/'dark' values)
  const saved = localStorage.getItem('theme');
  const mapped = saved === 'light' ? 'claude' : saved === 'dark' ? 'linear' : saved;
  setTheme(mapped || 'claude', false);  // false = no transition on init
  initThemePicker();
  setupEventListeners();

  // Configure marked
  marked.setOptions({ gfm: true, breaks: true });

  await loadIndex();
});

// ── Load Notes Index ─────────────────────────────────────────
async function loadIndex() {
  try {
    const res = await fetch(CONFIG.indexUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
    const data = await res.json();

    state.categories = data.categories || [];
    state.allNotes   = state.categories.flatMap(cat =>
      cat.notes.map(n => ({ ...n, category: cat.name }))
    );

    renderSidebar();
    renderNoteList();
    restoreFromHash();
  } catch (err) {
    $('categoryNav').innerHTML = `
      <div class="error-state">
        <strong>加载失败</strong>
        <small>${err.message}</small>
        <p>请先运行 <code>python3 scripts/generate-index.py</code><br>生成索引文件，然后刷新页面</p>
      </div>`;
  }
}

// ── Sidebar ───────────────────────────────────────────────────
function renderSidebar() {
  const total = state.allNotes.length;
  let html = '';

  html += `
    <div class="cat-item ${state.currentCategory === null ? 'active' : ''}" data-cat="">
      <span class="cat-name">全部笔记</span>
      <span class="cat-count">${total}</span>
    </div>`;

  if (state.categories.length > 0) {
    html += `<div class="cat-section-label">分类</div>`;
    for (const cat of state.categories) {
      const active = state.currentCategory === cat.name ? 'active' : '';
      html += `
        <div class="cat-item ${active}" data-cat="${escHtml(cat.name)}">
          <span class="cat-name">${escHtml(cat.name)}</span>
          <span class="cat-count">${cat.notes.length}</span>
        </div>`;
    }
  }

  const nav = $('categoryNav');
  nav.innerHTML = html;

  nav.querySelectorAll('.cat-item').forEach(el => {
    el.addEventListener('click', () => selectCategory(el.dataset.cat || null));
  });
}

function selectCategory(category) {
  state.currentCategory = category;
  state.currentNote = null;
  setReadingState(false);
  setNoteListCollapsed(false);

  // Update active class
  document.querySelectorAll('.cat-item').forEach(el => {
    const elCat = el.dataset.cat || null;
    el.classList.toggle('active', elCat === category);
  });

  renderNoteList();
  showWelcome();

  if (isMobile()) switchMobilePanel('list');
}

// ── Note List ─────────────────────────────────────────────────
function renderNoteList() {
  const notes = filteredNotes();
  $('panelTitle').textContent = state.currentCategory || '全部笔记';
  $('noteCount').textContent  = `${notes.length} 篇`;
  renderSearchStatus(notes);

  if (notes.length === 0) {
    state.searchSelection = -1;
    $('noteCards').innerHTML = `
      <div class="empty-state">
        <strong>${state.searchQuery ? '没有找到匹配的笔记' : '该分类暂无笔记'}</strong>
        ${state.searchQuery ? '<small>试试换个关键词，或按 <kbd>Esc</kbd> 清空搜索。</small>' : ''}
      </div>`;
    return;
  }

  const selectedIndex = state.searchQuery
    ? Math.min(Math.max(state.searchSelection, 0), notes.length - 1)
    : -1;
  state.searchSelection = selectedIndex;

  $('noteCards').innerHTML = notes.map((n, index) => {
    const snippet = getSnippet(n);
    return `
    <div class="note-card ${state.currentNote?.file === n.file ? 'active' : ''} ${selectedIndex === index ? 'search-selected' : ''}"
         data-file="${escHtml(n.file)}"
         data-category="${escHtml(n.category)}"
         data-title="${escHtml(n.title)}"
         data-index="${index}">
      <div class="note-card-title">${hilite(escHtml(n.title))}</div>
      <div class="note-card-category">${hilite(escHtml(n.category))}</div>
      ${snippet ? `<div class="note-card-preview">${hilite(escHtml(snippet))}</div>` : ''}
    </div>`;
  }).join('');

  $('noteCards').querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (!state.searchQuery) return;
      updateSearchSelection(Number(card.dataset.index));
    });
    card.addEventListener('click', () => loadNote(card.dataset));
  });
}

async function ensureSearchIndex() {
  if (state.searchIndex !== null || state.searchIndexLoading) return;
  state.searchIndexLoading = true;
  try {
    const res = await fetch('notes/search-index.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Map file → content for quick lookup
    state.searchIndex = {};
    for (const entry of data) {
      state.searchIndex[entry.file] = entry.content;
    }
  } catch (e) {
    state.searchIndex = {};  // empty fallback, graceful degradation
  }
  state.searchIndexLoading = false;
}

function filteredNotes() {
  let notes = state.currentCategory
    ? state.allNotes.filter(n => n.category === state.currentCategory)
    : state.allNotes;

  if (!state.searchQuery) return notes;

  const tokens = searchTokens(state.searchQuery);

  return notes
    .map(note => ({ note, score: searchScore(note, tokens) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.note.title.localeCompare(b.note.title, 'zh-CN'))
    .map(entry => entry.note);
}

function getSnippet(note) {
  if (!state.searchQuery) return note.preview || '';

  const tokens = searchTokens(state.searchQuery);
  const fullText = state.searchIndex ? (state.searchIndex[note.file] || '') : '';

  // Try full content first, fall back to preview
  const source = fullText || note.preview || '';
  const lower = source.toLowerCase();
  const idx = tokens.reduce((best, token) => {
    const current = lower.indexOf(token);
    return current !== -1 && (best === -1 || current < best) ? current : best;
  }, -1);
  if (idx === -1) return note.preview || '';

  const WINDOW = 65;
  const start = Math.max(0, idx - WINDOW);
  const tokenLength = tokens[0]?.length || 0;
  const end   = Math.min(source.length, idx + tokenLength + WINDOW);
  let snippet = source.slice(start, end).replace(/\n/g, ' ');
  if (start > 0) snippet = '…' + snippet;
  if (end < source.length) snippet = snippet + '…';
  return snippet;
}

function searchTokens(query) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean);
}

function searchScore(note, tokens) {
  if (!tokens.length) return 0;

  const title = note.title.toLowerCase();
  const category = note.category.toLowerCase();
  const preview = (note.preview || '').toLowerCase();
  const fullText = state.searchIndex ? (state.searchIndex[note.file] || '').toLowerCase() : '';
  const corpus = `${title}\n${category}\n${preview}\n${fullText}`;

  let score = 0;
  for (const token of tokens) {
    if (!corpus.includes(token)) return 0;
    if (title.includes(token)) score += title.startsWith(token) ? 90 : 54;
    if (category.includes(token)) score += 26;
    if (preview.includes(token)) score += 20;
    if (fullText.includes(token)) score += 14;
  }

  if (tokens.length > 1) score += 12;
  if (title.includes(state.searchQuery.toLowerCase())) score += 36;
  return score;
}

function renderSearchStatus(notes) {
  const el = $('searchStatus');
  if (!state.searchQuery) {
    el.innerHTML = `<span>按 <kbd>/</kbd> 快速搜索</span>`;
    el.classList.remove('active');
    return;
  }

  const scope = state.currentCategory || '全部笔记';
  const loading = state.searchIndexLoading && state.searchIndex === null;
  el.classList.add('active');
  el.innerHTML = `
    <span>在 <strong>${escHtml(scope)}</strong> 中找到 <strong>${notes.length}</strong> 篇</span>
    <span class="search-status-hint">${loading ? '正在载入全文索引…' : '↑ ↓ 选择，Enter 打开，Esc 清空'}</span>`;
}

function updateSearchSelection(nextIndex) {
  const cards = [...$('noteCards').querySelectorAll('.note-card')];
  if (!cards.length) {
    state.searchSelection = -1;
    return;
  }

  const clamped = Math.min(Math.max(nextIndex, 0), cards.length - 1);
  state.searchSelection = clamped;
  cards.forEach((card, index) => card.classList.toggle('search-selected', index === clamped));
  cards[clamped].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function openSelectedSearchResult() {
  const cards = [...$('noteCards').querySelectorAll('.note-card')];
  if (!cards.length) return;

  const target = cards[Math.min(Math.max(state.searchSelection, 0), cards.length - 1)] || cards[0];
  target?.click();
}

// ── Load & Render Note ────────────────────────────────────────
async function loadNote({ file, category, title }) {
  const requestId = ++state.noteRequestId;
  state.currentNote = { file, category, title };
  setReadingState(true);
  history.replaceState(null, '', '#' + file);

  document.querySelectorAll('.note-card').forEach(c =>
    c.classList.toggle('active', c.dataset.file === file)
  );

  const article = $('noteArticle');
  const body    = $('articleBody');

  $('welcomeScreen').classList.add('hidden');
  article.classList.remove('hidden');

  closeToc();
  $('tocToggle').classList.add('hidden');
  $('tocFab').classList.add('hidden');
  $('scrollTopBtn').classList.add('hidden');

  $('articleTitle').textContent = title;
  $('breadcrumb').innerHTML =
    `<span class="breadcrumb-item">${escHtml(category)}</span>
     <span class="breadcrumb-sep">›</span>
     <span class="breadcrumb-item">${escHtml(title)}</span>`;
  $('articleMeta').textContent = '加载中…';
  $('articleNav').classList.add('hidden');
  $('articleNav').innerHTML = '';

  body.innerHTML = `
    <div class="loading-placeholder">
      <div class="skeleton"></div>
      <div class="skeleton medium"></div>
      <div class="skeleton short"></div>
      <div class="skeleton"></div>
      <div class="skeleton medium"></div>
    </div>`;

  if (isMobile()) switchMobilePanel('content');

  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const md = await res.text();
    if (requestId !== state.noteRequestId) return;

    body.innerHTML = sanitizeRenderedHtml(marked.parse(md));

    // Remove leading H1 — it's already shown in the article header
    const firstH1 = body.querySelector('h1:first-child');
    if (firstH1) firstH1.remove();

    // Fade-in animation
    body.classList.remove('fade-in');
    void body.offsetWidth;
    body.classList.add('fade-in');

    // Syntax highlight — only if hljs loaded successfully
    if (typeof hljs !== 'undefined') {
      body.querySelectorAll('pre code:not(.hljs)').forEach(el => {
        hljs.highlightElement(el);
      });
    }

    // Render math — only if KaTeX loaded successfully
    if (!window._katexFailed && typeof renderMathInElement !== 'undefined') {
      renderMathInElement(body, {
        delimiters: [
          { left: '$$', right: '$$', display: true  },
          { left: '$',  right: '$',  display: false },
          { left: '\\[', right: '\\]', display: true  },
          { left: '\\(', right: '\\)', display: false },
        ],
        throwOnError: false,
      });
    }

    // TOC
    buildToc();

    // Meta
    const chars    = md.replace(/\s/g, '').length;
    const readMins = Math.max(1, Math.ceil(chars / 400));
    $('articleMeta').innerHTML =
      `<span>${escHtml(category)}</span>
       <span class="meta-sep">·</span>
       <span>${chars.toLocaleString()} 字</span>
       <span class="meta-sep">·</span>
       <span>约 ${readMins} 分钟</span>`;

    renderArticleNav(file);
    restoreNoteProgress(file);
    updateReadingProgress();
  } catch (err) {
    if (requestId !== state.noteRequestId) return;
    body.innerHTML = `<div class="error-state">笔记加载失败：${err.message}</div>`;
  }
}

function showWelcome() {
  $('welcomeScreen').classList.remove('hidden');
  $('noteArticle').classList.add('hidden');
  closeToc();
  $('tocToggle').classList.add('hidden');
  $('tocFab').classList.add('hidden');
  $('scrollTopBtn').classList.add('hidden');
  state.hasToc = false;
  updateReadingProgress();
}

// ── Table of Contents ────────────────────────────────────────
let _tocObserver = null;

function buildToc() {
  const body    = $('articleBody');
  const panel   = $('tocPanel');
  const nav     = $('tocNav');
  const toggle  = $('tocToggle');
  const fab     = $('tocFab');

  const headings = [...body.querySelectorAll('h2, h3')];

  if (headings.length < 2) {
    state.hasToc = false;
    nav.innerHTML = '';
    closeToc();
    toggle.classList.add('hidden');
    fab.classList.add('hidden');
    if (_tocObserver) _tocObserver.disconnect();
    return;
  }

  state.hasToc = true;

  // Assign IDs
  headings.forEach((h, i) => { if (!h.id) h.id = 'toc-h-' + i; });

  // Build links
  nav.innerHTML = headings.map(h => {
    const cls = h.tagName === 'H3' ? ' toc-h3' : '';
    return `<a href="#${h.id}" class="${cls}" data-id="${h.id}">${escHtml(h.textContent)}</a>`;
  }).join('');

  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById(a.dataset.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      closeToc();
    });
  });

  toggle.classList.remove('hidden');
  updateTocEntryPoints();

  // IntersectionObserver: highlight current section
  if (_tocObserver) _tocObserver.disconnect();
  _tocObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        nav.querySelectorAll('a').forEach(a => a.classList.remove('toc-active'));
        nav.querySelector(`a[data-id="${entry.target.id}"]`)?.classList.add('toc-active');
      }
    }
  }, { root: $('noteContent'), rootMargin: '-10% 0px -75% 0px' });

  headings.forEach(h => _tocObserver.observe(h));
}

function toggleToc() {
  const panel  = $('tocPanel');
  const open = panel.classList.contains('open');
  if (open) {
    closeToc();
    return;
  }

  panel.classList.remove('hidden');
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  $('tocToggle').setAttribute('aria-expanded', 'true');
  $('tocFab').setAttribute('aria-expanded', 'true');
}

function closeToc() {
  const panel = $('tocPanel');
  panel.classList.remove('open');
  panel.classList.add('hidden');
  panel.setAttribute('aria-hidden', 'true');
  $('tocToggle').setAttribute('aria-expanded', 'false');
  $('tocFab').setAttribute('aria-expanded', 'false');
}

// ── URL Routing ───────────────────────────────────────────────
function restoreFromHash() {
  const file = decodeURIComponent(location.hash.slice(1));
  if (!file) return;
  const note = state.allNotes.find(n => n.file === file);
  if (note) loadNote(note);
}

window.addEventListener('hashchange', () => {
  const file = decodeURIComponent(location.hash.slice(1));
  if (!file) { showWelcome(); return; }
  const note = state.allNotes.find(n => n.file === file);
  if (note && note.file !== state.currentNote?.file) loadNote(note);
});

// ── Theme ─────────────────────────────────────────────────────
function setTheme(id, animate = true) {
  const theme = THEMES.find(t => t.id === id) || THEMES[0];
  state.theme = theme.id;

  if (animate) {
    document.documentElement.classList.add('theme-switching');
    setTimeout(() => document.documentElement.classList.remove('theme-switching'), 350);
  }

  document.documentElement.setAttribute('data-theme', theme.id);
  localStorage.setItem('theme', theme.id);

  // Sync hljs stylesheet
  const hljsLight = $('hljs-light');
  const hljsDark  = $('hljs-dark');
  if (hljsLight) hljsLight.disabled = theme.dark;
  if (hljsDark)  hljsDark.disabled  = !theme.dark;

  // Update active marker in picker
  document.querySelectorAll('.theme-option').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.theme === theme.id)
  );
}

function initThemePicker() {
  const groups = {};
  THEMES.forEach(t => {
    if (!groups[t.group]) groups[t.group] = [];
    groups[t.group].push(t);
  });

  let html = '';
  for (const [gid, themes] of Object.entries(groups)) {
    html += `<div class="theme-group-label">${GROUP_LABELS[gid]}</div>`;
    for (const t of themes) {
      html += `
        <button class="theme-option ${state.theme === t.id ? 'active' : ''}" data-theme="${t.id}">
          <span class="theme-swatch" style="background:${t.bg};outline:2px solid ${t.ac}40"></span>
          <span class="theme-label">${t.name}</span>
          <svg class="theme-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>`;
    }
  }

  const picker = $('themePicker');
  picker.innerHTML = html;
  picker.querySelectorAll('.theme-option').forEach(btn =>
    btn.addEventListener('click', () => { setTheme(btn.dataset.theme); closePicker(); })
  );
}

function togglePicker() { $('themePicker').classList.toggle('open'); }
function closePicker()  { $('themePicker').classList.remove('open'); }

// ── Mobile ────────────────────────────────────────────────────
function isMobile() { return window.innerWidth <= 860; }

function switchMobilePanel(panel) {
  state.mobilePanel = panel;
  const sidebar  = $('sidebar');
  const listPanel = $('noteListPanel');
  const content  = $('noteContent');

  [sidebar, listPanel, content].forEach(el => el.classList.remove('mobile-active'));

  if (panel === 'sidebar') sidebar.classList.add('mobile-active');
  if (panel === 'list')    listPanel.classList.add('mobile-active');
  if (panel === 'content') content.classList.add('mobile-active');

  document.querySelectorAll('.mobile-nav-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.panel === panel)
  );
}

function setReadingState(active) {
  document.querySelector('.app').classList.toggle('reading-state', active);
}

function setNoteListCollapsed(collapsed) {
  $('noteListPanel').classList.toggle('collapsed', collapsed);
  $('noteListCollapseBtn').setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  $('listToggle').setAttribute('aria-expanded', collapsed ? 'false' : 'true');
}

function updateReadingProgress() {
  const el = $('noteContent');
  const total = el.scrollHeight - el.clientHeight;
  const progress = total > 0 ? el.scrollTop / total : 0;
  $('readingProgress').style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
  updateTocEntryPoints();
  updateScrollTopEntry();
  queueSaveNoteProgress();
}

function queueSaveNoteProgress() {
  if (!state.currentNote?.file) return;
  clearTimeout(state.progressSaveTimer);
  state.progressSaveTimer = setTimeout(() => {
    saveNoteProgress(state.currentNote.file);
  }, 120);
}

function saveNoteProgress(file) {
  const el = $('noteContent');
  const total = el.scrollHeight - el.clientHeight;
  const ratio = total > 0 ? el.scrollTop / total : 0;
  let store = {};
  try {
    store = JSON.parse(localStorage.getItem(NOTE_PROGRESS_KEY) || '{}');
  } catch {}
  store[file] = { ratio, updatedAt: Date.now() };
  localStorage.setItem(NOTE_PROGRESS_KEY, JSON.stringify(store));
}

function restoreNoteProgress(file) {
  let store = {};
  try {
    store = JSON.parse(localStorage.getItem(NOTE_PROGRESS_KEY) || '{}');
  } catch {}

  const ratio = store[file]?.ratio;
  const target = Number.isFinite(ratio) ? Math.max(0, Math.min(1, ratio)) : 0;

  requestAnimationFrame(() => {
    const el = $('noteContent');
    const total = el.scrollHeight - el.clientHeight;
    el.scrollTop = total > 0 ? total * target : 0;
    updateReadingProgress();
  });
}

function readingSequence() {
  const notes = filteredNotes();
  return notes.length ? notes : state.allNotes;
}

function renderArticleNav(file) {
  const nav = $('articleNav');
  const sequence = readingSequence();
  const index = sequence.findIndex(n => n.file === file);
  if (index === -1) {
    nav.classList.add('hidden');
    nav.innerHTML = '';
    return;
  }

  const prev = sequence[index - 1] || null;
  const next = sequence[index + 1] || null;

  if (!prev && !next) {
    nav.classList.add('hidden');
    nav.innerHTML = '';
    return;
  }

  nav.innerHTML = `
    ${renderArticleNavCard(prev, '上一篇')}
    ${renderArticleNavCard(next, '下一篇')}`;
  nav.classList.remove('hidden');

  nav.querySelectorAll('.article-nav-card[data-file]').forEach(card => {
    card.addEventListener('click', () => loadNote({
      file: card.dataset.file,
      category: card.dataset.category,
      title: card.dataset.title,
    }));
  });
}

function renderArticleNavCard(note, label) {
  if (!note) {
    return `<div class="article-nav-card ghost"><span class="article-nav-label">${label}</span><strong>没有了</strong></div>`;
  }

  return `
    <button class="article-nav-card"
            data-file="${escHtml(note.file)}"
            data-category="${escHtml(note.category)}"
            data-title="${escHtml(note.title)}">
      <span class="article-nav-label">${label}</span>
      <strong>${escHtml(note.title)}</strong>
      <small>${escHtml(note.category)}</small>
    </button>`;
}

function updateTocEntryPoints() {
  const showFab = state.hasToc && !$('noteArticle').classList.contains('hidden') && $('noteContent').scrollTop > 220;
  $('tocFab').classList.toggle('hidden', !showFab);
}

function updateScrollTopEntry() {
  const show = !$('noteArticle').classList.contains('hidden') && $('noteContent').scrollTop > window.innerHeight * 1.2;
  $('scrollTopBtn').classList.toggle('hidden', !show);
}

// ── Event Listeners ───────────────────────────────────────────
function setupEventListeners() {
  // Theme picker
  $('themePickerBtn').addEventListener('click', e => { e.stopPropagation(); togglePicker(); });
  document.addEventListener('click', () => closePicker());
  $('themePicker').addEventListener('click', e => e.stopPropagation());

  // Search
  const input = $('searchInput');
  const clear = $('searchClear');

  input.addEventListener('input', () => {
    state.searchQuery = input.value.trim();
    state.searchSelection = state.searchQuery ? 0 : -1;
    clear.style.display = state.searchQuery ? 'block' : 'none';
    renderNoteList();

    if (state.searchQuery && state.searchIndex === null && !state.searchIndexLoading) {
      ensureSearchIndex().then(() => {
        if (state.searchQuery) renderNoteList();
      });
    }
  });

  clear.addEventListener('click', () => {
    input.value = '';
    state.searchQuery = '';
    state.searchSelection = -1;
    clear.style.display = 'none';
    renderNoteList();
    input.focus();
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      updateSearchSelection(state.searchSelection + 1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      updateSearchSelection(state.searchSelection - 1);
      return;
    }
    if (e.key === 'Enter' && state.searchQuery) {
      e.preventDefault();
      openSelectedSearchResult();
      return;
    }
    if (e.key === 'Escape' && state.searchQuery) {
      e.preventDefault();
      clear.click();
    }
  });

  $('noteListCollapseBtn').addEventListener('click', e => {
    e.preventDefault();
    const collapsed = $('noteListPanel').classList.contains('collapsed');
    setNoteListCollapsed(!collapsed);
  });

  $('listToggle').addEventListener('click', e => {
    e.preventDefault();
    const collapsed = $('noteListPanel').classList.contains('collapsed');
    setNoteListCollapsed(!collapsed);
  });

  // Mobile nav
  document.querySelectorAll('.mobile-nav-btn').forEach(btn =>
    btn.addEventListener('click', () => switchMobilePanel(btn.dataset.panel))
  );

  // Reading progress bar
  $('noteContent').addEventListener('scroll', updateReadingProgress);

  // TOC toggle
  $('tocToggle').addEventListener('click', toggleToc);
  $('tocFab').addEventListener('click', toggleToc);
  $('tocCloseBtn').addEventListener('click', closeToc);
  $('scrollTopBtn').addEventListener('click', () => {
    $('noteContent').scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Focus mode
  $('focusBtn').addEventListener('click', toggleFocusMode);

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') exitFocusMode();
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      input.focus();
    }
  });
}

// ── Utilities ─────────────────────────────────────────────────
// ── Focus Mode ────────────────────────────────────────────────
function toggleFocusMode() {
  document.querySelector('.app').classList.toggle('focus-mode');
}

function exitFocusMode() {
  document.querySelector('.app').classList.remove('focus-mode');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hilite(text) {
  if (!state.searchQuery) return text;
  const escaped = state.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

function sanitizeRenderedHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blockedTags = ['script', 'iframe', 'object', 'embed', 'link', 'meta'];

  blockedTags.forEach(tag => {
    doc.querySelectorAll(tag).forEach(el => el.remove());
  });

  doc.querySelectorAll('*').forEach(el => {
    [...el.attributes].forEach(attr => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        return;
      }
      if ((name === 'href' || name === 'src' || name === 'xlink:href') && value.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}
