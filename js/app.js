/* ============================================================
   app.js  —  Personal Notes Site
   ============================================================ */

const CONFIG = {
  indexUrl: 'notes/index.json',
  siteName: '我的笔记',
};

const NOTE_PROGRESS_KEY = 'note-progress-v1';
const READING_DENSITY_KEY = 'reading-density-v1';
const LAST_OPEN_NOTE_KEY = 'last-open-note-v1';

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
  { id: 'chinese',   name: '国风',     group: 'paper', dark: false, bg: '#f5f0e0', ac: '#c0392b' },
];

const GROUP_LABELS = { tool: '产品 / 工具', paper: '纸质 / 人文', fun: '个性 / 有趣' };

const state = {
  categories: [],
  allNotes: [],
  currentCategory: null,
  currentNote: null,
  searchQuery: '',
  searchScope: 'context',
  searchSelection: -1,
  theme: 'claude',
  mobilePanel: 'sidebar',
  searchIndex: null,
  searchIndexLoading: false,
  noteRequestId: 0,
  hasToc: false,
  progressSaveTimer: null,
  readingDensity: 'standard',
  searchMatches: [],
  activeSearchMatchIndex: -1,
};

// ── DOM helpers ──────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Resolve saved theme (remap old 'light'/'dark' values)
  const saved = localStorage.getItem('theme');
  const mapped = saved === 'light' ? 'claude' : saved === 'dark' ? 'linear' : saved;
  setTheme(mapped || 'claude', false);  // false = no transition on init
  setReadingDensity(localStorage.getItem(READING_DENSITY_KEY) || 'standard');
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
  history.replaceState(null, '', '#');
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
  const baseNotes = scopedNotes();
  const results = state.searchQuery ? rankSearchResults(baseNotes) : baseNotes.map(note => ({ note, hitLabel: '', snippet: note.preview || '' }));
  const notes = results.map(entry => entry.note);
  $('panelTitle').textContent = state.searchQuery ? '搜索结果' : (state.currentCategory || '全部笔记');
  $('noteCount').textContent  = state.searchQuery ? `${notes.length} 条` : `${notes.length} 篇`;
  renderSearchStatus(notes, baseNotes.length);

  if (notes.length === 0) {
    state.searchSelection = -1;
    const inContextScope = state.searchScope === 'context';
    const canWidenScope = inContextScope && state.currentCategory;
    $('noteCards').innerHTML = `
      <div class="empty-state">
        <strong>${state.searchQuery ? '没有找到匹配的笔记' : '该分类暂无笔记'}</strong>
        ${state.searchQuery ? `
          <small>当前在 <strong>${escHtml(searchScopeLabel())}</strong> 中搜索。试试换个关键词，或按 <kbd>Esc</kbd> 清空搜索。</small>
          ${canWidenScope ? '<button class="empty-action-btn" id="expandSearchScopeBtn">改为搜索全部笔记</button>' : ''}
        ` : ''}
      </div>`;
    if (state.searchQuery && canWidenScope) {
      $('expandSearchScopeBtn')?.addEventListener('click', () => setSearchScope('all'));
    }
    return;
  }

  const selectedIndex = state.searchQuery
    ? Math.min(Math.max(state.searchSelection, 0), notes.length - 1)
    : -1;
  state.searchSelection = selectedIndex;

  $('noteCards').innerHTML = results.map(({ note: n, hitLabel, snippet }, index) => {
    return `
    <div class="note-card ${state.currentNote?.file === n.file ? 'active' : ''} ${selectedIndex === index ? 'search-selected' : ''}"
         data-file="${escHtml(n.file)}"
         data-slug="${escHtml(n.slug || '')}"
         data-category="${escHtml(n.category)}"
         data-title="${escHtml(n.title)}"
         data-index="${index}">
      <div class="note-card-title">${hilite(escHtml(n.title))}</div>
      <div class="note-card-meta-row">
        <div class="note-card-category">${hilite(escHtml(n.category))}</div>
        ${hitLabel ? `<span class="search-hit-badge">${escHtml(hitLabel)}</span>` : ''}
      </div>
      ${snippet ? `<div class="note-card-preview">${hilite(escHtml(snippet))}</div>` : ''}
    </div>`;
  }).join('');

  $('noteCards').querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (!state.searchQuery) return;
      updateSearchSelection(Number(card.dataset.index));
    });
    card.addEventListener('click', () => {
      if (state.currentNote?.file === card.dataset.file) {
        if (state.searchQuery) refreshOpenArticleSearchState('instant');
        return;
      }
      loadNote(card.dataset);
    });
  });
}

function scopedNotes() {
  if (state.searchScope === 'all' || !state.currentCategory) return state.allNotes;
  return state.allNotes.filter(n => n.category === state.currentCategory);
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

function rankSearchResults(notes) {
  const tokens = searchTokens(state.searchQuery);
  return notes
    .map(note => searchScore(note, tokens))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.note.title.localeCompare(b.note.title, 'zh-CN'))
}

function filteredNotes() {
  const notes = scopedNotes();
  if (!state.searchQuery) return notes;
  return rankSearchResults(notes).map(entry => entry.note);
}

function getSnippetFromSource(source, tokens) {
  const lower = source.toLowerCase();
  let matchedToken = tokens[0] || '';
  const idx = tokens.reduce((best, token) => {
    const current = lower.indexOf(token);
    if (current !== -1 && (best === -1 || current < best)) matchedToken = token;
    return current !== -1 && (best === -1 || current < best) ? current : best;
  }, -1);
  if (idx === -1) return '';

  const WINDOW_BEFORE = 2;
  const WINDOW_AFTER = 72;
  const start = Math.max(0, idx - WINDOW_BEFORE);
  const tokenLength = matchedToken.length || 0;
  const end   = Math.min(source.length, idx + tokenLength + WINDOW_AFTER);
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
  const previewRaw = note.preview || '';
  const preview = previewRaw.toLowerCase();
  const fullText = state.searchIndex ? (state.searchIndex[note.file] || '').toLowerCase() : '';
  const corpus = `${title}\n${category}\n${preview}\n${fullText}`;

  let score = 0;
  let hitLabel = '';
  for (const token of tokens) {
    if (!corpus.includes(token)) return 0;
    if (title.includes(token)) {
      score += title.startsWith(token) ? 90 : 54;
      hitLabel ||= '标题命中';
    }
    if (category.includes(token)) {
      score += 26;
      hitLabel ||= '分类命中';
    }
    if (preview.includes(token)) {
      score += 20;
      hitLabel ||= '摘要命中';
    }
    if (fullText.includes(token)) {
      score += 14;
      hitLabel ||= '正文命中';
    }
  }

  if (tokens.length > 1) score += 12;
  if (title.includes(state.searchQuery.toLowerCase())) score += 36;

  const source = (state.searchIndex ? (state.searchIndex[note.file] || '') : '') || previewRaw;
  const snippet = source ? getSnippetFromSource(source, tokens) || previewRaw : previewRaw;

  return { note, score, hitLabel, snippet };
}

function searchScopeLabel() {
  if (state.searchScope === 'all' || !state.currentCategory) return '全部笔记';
  return state.currentCategory;
}

function renderSearchStatus(notes, poolSize = notes.length) {
  const el = $('searchStatus');
  if (!state.searchQuery) {
    el.innerHTML = `<span>按 <kbd>/</kbd> 快速搜索</span>`;
    el.classList.remove('active');
    return;
  }

  const scope = searchScopeLabel();
  const loading = state.searchIndexLoading && state.searchIndex === null;
  el.classList.add('active');
  el.innerHTML = `
    <span>在 <strong>${escHtml(scope)}</strong> 中找到 <strong>${notes.length}</strong> 条，已检索 <strong>${poolSize}</strong> 篇</span>
    <span class="search-status-hint">${loading ? '正在载入全文索引…' : '结果已按相关度排序'}</span>`;
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
function noteHash(note) {
  return note?.slug ? `#note/${encodeURIComponent(note.slug)}` : `#${note.file}`;
}

function resolveHashNote(hash) {
  const target = decodeURIComponent(hash.slice(1));
  if (!target) return null;
  if (target.startsWith('note/')) {
    const slug = target.slice(5);
    return state.allNotes.find(n => n.slug === slug) || null;
  }
  return state.allNotes.find(n => n.file === target) || null;
}

async function loadNote({ file, category, title, slug }) {
  const requestId = ++state.noteRequestId;
  state.currentNote = { file, category, title, slug };
  setReadingState(true);
  history.replaceState(null, '', noteHash({ file, slug }));
  localStorage.setItem(LAST_OPEN_NOTE_KEY, JSON.stringify({ file, slug }));
  state.hasToc = false;

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
  document.title = `${title} · ${CONFIG.siteName}`;
  $('breadcrumb').innerHTML =
    `<span class="breadcrumb-item">${escHtml(category)}</span>
     <span class="breadcrumb-sep">›</span>
     <span class="breadcrumb-item">${escHtml(title)}</span>`;
  $('articleMeta').textContent = '加载中…';
  $('articleNav').classList.add('hidden');
  $('articleNav').innerHTML = '';
  resetSearchMatches();

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
    const focusedSearchHit = refreshOpenArticleSearchState(state.searchQuery ? 'instant' : 'none');
    if (!focusedSearchHit) restoreNoteProgress(file);
    updateReadingProgress();
  } catch (err) {
    if (requestId !== state.noteRequestId) return;
    state.hasToc = false;
    closeToc();
    $('tocFab').classList.add('hidden');
    $('scrollTopBtn').classList.add('hidden');
    resetSearchMatches();
    body.innerHTML = `<div class="error-state">笔记加载失败：${err.message}</div>`;
  }
}

function showWelcome() {
  state.currentNote = null;
  setReadingState(false);
  document.title = CONFIG.siteName;
  $('welcomeScreen').classList.remove('hidden');
  $('noteArticle').classList.add('hidden');
  closeToc();
  $('tocToggle').classList.add('hidden');
  $('tocFab').classList.add('hidden');
  $('scrollTopBtn').classList.add('hidden');
  resetSearchMatches();
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
  let note = resolveHashNote(location.hash);
  if (!note && !location.hash) {
    try {
      const stored = JSON.parse(localStorage.getItem(LAST_OPEN_NOTE_KEY) || 'null');
      if (stored?.slug) {
        note = state.allNotes.find(n => n.slug === stored.slug) || null;
      }
      if (!note && stored?.file) {
        note = state.allNotes.find(n => n.file === stored.file) || null;
      }
    } catch {}
  }
  if (note) loadNote(note);
}

window.addEventListener('hashchange', () => {
  if (!location.hash) { showWelcome(); return; }
  const note = resolveHashNote(location.hash);
  if (note && note.file !== state.currentNote?.file) loadNote(note);
  if (!note) showWelcome();
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

function setReadingDensity(density) {
  const next = ['compact', 'standard', 'comfortable'].includes(density) ? density : 'standard';
  state.readingDensity = next;
  document.documentElement.setAttribute('data-density', next);
  localStorage.setItem(READING_DENSITY_KEY, next);

  document.querySelectorAll('.density-btn').forEach(btn => {
    const active = btn.dataset.density === next;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function setSearchScope(scope) {
  const next = scope === 'all' ? 'all' : 'context';
  state.searchScope = next;
  document.querySelectorAll('.search-scope-btn').forEach(btn => {
    const active = btn.dataset.scope === next;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  state.searchSelection = state.searchQuery ? 0 : -1;
  refreshOpenArticleSearchState('none');
  renderNoteList();
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
      slug: card.dataset.slug,
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
            data-slug="${escHtml(note.slug || '')}"
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
  $('densityControl').addEventListener('click', e => {
    const btn = e.target.closest('.density-btn');
    if (!btn) return;
    setReadingDensity(btn.dataset.density);
  });
  $('searchScope').addEventListener('click', e => {
    const btn = e.target.closest('.search-scope-btn');
    if (!btn) return;
    setSearchScope(btn.dataset.scope);
  });

  // Search
  const input = $('searchInput');
  const clear = $('searchClear');

  input.addEventListener('input', () => {
    state.searchQuery = input.value.trim();
    state.searchSelection = state.searchQuery ? 0 : -1;
    clear.style.display = state.searchQuery ? 'block' : 'none';
    refreshOpenArticleSearchState('none');
    renderNoteList();

    if (state.searchQuery && state.searchIndex === null && !state.searchIndexLoading) {
      ensureSearchIndex().then(() => {
        if (state.searchQuery) {
          refreshOpenArticleSearchState('none');
          renderNoteList();
        }
      });
    }
  });

  clear.addEventListener('click', () => {
    input.value = '';
    state.searchQuery = '';
    state.searchSelection = -1;
    clear.style.display = 'none';
    refreshOpenArticleSearchState('none');
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
  $('searchMatchPrev').addEventListener('click', () => focusAdjacentSearchMatch(-1));
  $('searchMatchNext').addEventListener('click', () => focusAdjacentSearchMatch(1));

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
  const app = document.querySelector('.app');
  const entering = !app.classList.contains('focus-mode');
  app.classList.toggle('focus-mode');
  if (entering) {
    closeToc();
    $('tocFab').classList.add('hidden');
    $('scrollTopBtn').classList.add('hidden');
  } else {
    updateTocEntryPoints();
    updateScrollTopEntry();
  }
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
  const tokens = [...new Set(searchTokens(state.searchQuery))]
    .sort((a, b) => b.length - a.length)
    .map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (!tokens.length) return text;
  return text.replace(new RegExp(`(${tokens.join('|')})`, 'gi'), '<mark class="search-hit">$1</mark>');
}

function resetSearchMatches() {
  state.searchMatches = [];
  state.activeSearchMatchIndex = -1;
  $('searchMatchNav').classList.add('hidden');
  $('searchMatchStatus').textContent = '0 / 0';
  $('searchMatchPrev').disabled = true;
  $('searchMatchNext').disabled = true;
}

function setSearchMatches(matches) {
  state.searchMatches = matches;
  state.activeSearchMatchIndex = matches.length ? 0 : -1;
  updateSearchMatchNav();
}

function updateSearchMatchNav() {
  const total = state.searchMatches.length;
  const nav = $('searchMatchNav');
  const status = $('searchMatchStatus');
  const prev = $('searchMatchPrev');
  const next = $('searchMatchNext');

  nav.classList.toggle('hidden', total <= 1);

  if (!total) {
    status.textContent = '0 / 0';
    prev.disabled = true;
    next.disabled = true;
    return;
  }

  const index = Math.min(Math.max(state.activeSearchMatchIndex, 0), total - 1);
  state.activeSearchMatchIndex = index;
  status.textContent = `${index + 1} / ${total}`;
  prev.disabled = total <= 1;
  next.disabled = total <= 1;
}

function highlightSearchInContent(root) {
  if (!state.searchQuery) return [];

  const tokens = [...new Set(searchTokens(state.searchQuery))]
    .sort((a, b) => b.length - a.length)
    .map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (!tokens.length) return [];

  const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
  const testRegex = new RegExp(`(${tokens.join('|')})`, 'i');
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest('pre, code, mark, .katex, .katex-display')) return NodeFilter.FILTER_REJECT;
      return testRegex.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const textNodes = [];
  let current;
  while ((current = walker.nextNode())) textNodes.push(current);

  const marks = [];

  textNodes.forEach(node => {
    const text = node.nodeValue;
    if (!text) return;
    regex.lastIndex = 0;
    if (!regex.test(text)) return;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    text.replace(regex, (match, _group, offset) => {
      if (offset > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
      }
      const mark = document.createElement('mark');
      mark.className = 'search-hit';
      mark.textContent = match;
      marks.push(mark);
      frag.appendChild(mark);
      lastIndex = offset + match.length;
      return match;
    });

    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
    node.parentNode.replaceChild(frag, node);
  });

  return marks;
}

function clearSearchHighlights(root) {
  root.querySelectorAll('mark.search-hit').forEach(mark => {
    mark.replaceWith(document.createTextNode(mark.textContent || ''));
  });
  root.normalize();
}

function focusSearchMatch(match, behavior = 'smooth') {
  $('articleBody').querySelectorAll('mark.search-target').forEach(el => el.classList.remove('search-target'));
  requestAnimationFrame(() => {
    match.classList.add('search-target');
    const container = $('noteContent');
    const containerRect = container.getBoundingClientRect();
    const matchRect = match.getBoundingClientRect();
    const targetTop = container.scrollTop + (matchRect.top - containerRect.top) - container.clientHeight * 0.28;
    container.scrollTo({ top: Math.max(0, targetTop), behavior });
  });
}

function focusSearchMatchAt(index, mode = 'smooth') {
  const total = state.searchMatches.length;
  if (!total) return false;

  const normalized = ((index % total) + total) % total;
  state.activeSearchMatchIndex = normalized;
  updateSearchMatchNav();

  const match = state.searchMatches[normalized];
  if (!match?.isConnected) return false;

  $('articleBody').querySelectorAll('mark.search-target').forEach(el => el.classList.remove('search-target'));
  if (mode === 'smooth' || mode === 'instant') {
    focusSearchMatch(match, mode === 'instant' ? 'auto' : 'smooth');
  } else {
    match.classList.add('search-target');
  }
  return true;
}

function focusAdjacentSearchMatch(step) {
  if (!state.searchMatches.length) return;
  focusSearchMatchAt(state.activeSearchMatchIndex + step, 'smooth');
}

function refreshOpenArticleSearchState(mode = 'none') {
  const article = $('noteArticle');
  const body = $('articleBody');
  if (article.classList.contains('hidden')) return false;

  clearSearchHighlights(body);
  resetSearchMatches();
  if (!state.searchQuery) return false;

  const matches = highlightSearchInContent(body);
  if (!matches.length) return false;

  setSearchMatches(matches);
  focusSearchMatchAt(0, mode);
  return true;
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
