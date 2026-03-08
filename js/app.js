/* ============================================================
   app.js  —  Personal Notes Site
   ============================================================ */

const CONFIG = {
  indexUrl: 'notes/index.json',
  siteName: '我的笔记',
};

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
  theme: 'claude',
  mobilePanel: 'sidebar',
  searchIndex: null,
  searchIndexLoading: false,
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

  if (notes.length === 0) {
    $('noteCards').innerHTML = `
      <div class="empty-state">
        ${state.searchQuery ? '没有找到匹配的笔记' : '该分类暂无笔记'}
      </div>`;
    return;
  }

  $('noteCards').innerHTML = notes.map(n => {
    const snippet = getSnippet(n);
    return `
    <div class="note-card ${state.currentNote?.file === n.file ? 'active' : ''}"
         data-file="${escHtml(n.file)}"
         data-category="${escHtml(n.category)}"
         data-title="${escHtml(n.title)}">
      <div class="note-card-title">${hilite(escHtml(n.title))}</div>
      <div class="note-card-category">${escHtml(n.category)}</div>
      ${snippet ? `<div class="note-card-preview">${hilite(escHtml(snippet))}</div>` : ''}
    </div>`;
  }).join('');

  $('noteCards').querySelectorAll('.note-card').forEach(card => {
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

  const q = state.searchQuery.toLowerCase();

  const titleMatches   = [];
  const contentMatches = [];

  for (const n of notes) {
    const inTitle   = n.title.toLowerCase().includes(q);
    const inPreview = n.preview && n.preview.toLowerCase().includes(q);
    const fullText  = state.searchIndex ? (state.searchIndex[n.file] || '') : '';
    const inContent = fullText.toLowerCase().includes(q);

    if (inTitle) {
      titleMatches.push(n);
    } else if (inPreview || inContent) {
      contentMatches.push(n);
    }
  }

  return [...titleMatches, ...contentMatches];
}

function getSnippet(note) {
  if (!state.searchQuery) return note.preview || '';

  const q = state.searchQuery.toLowerCase();
  const fullText = state.searchIndex ? (state.searchIndex[note.file] || '') : '';

  // Try full content first, fall back to preview
  const source = fullText || note.preview || '';
  const idx = source.toLowerCase().indexOf(q);
  if (idx === -1) return note.preview || '';

  const WINDOW = 65;
  const start = Math.max(0, idx - WINDOW);
  const end   = Math.min(source.length, idx + q.length + WINDOW);
  let snippet = source.slice(start, end).replace(/\n/g, ' ');
  if (start > 0) snippet = '…' + snippet;
  if (end < source.length) snippet = snippet + '…';
  return snippet;
}

// ── Load & Render Note ────────────────────────────────────────
async function loadNote({ file, category, title }) {
  state.currentNote = { file, category, title };
  history.replaceState(null, '', '#' + file);

  document.querySelectorAll('.note-card').forEach(c =>
    c.classList.toggle('active', c.dataset.file === file)
  );

  const article = $('noteArticle');
  const body    = $('articleBody');

  $('welcomeScreen').classList.add('hidden');
  article.classList.remove('hidden');

  $('articleTitle').textContent = title;
  $('breadcrumb').innerHTML =
    `<span class="breadcrumb-item">${escHtml(category)}</span>
     <span class="breadcrumb-sep">›</span>
     <span class="breadcrumb-item">${escHtml(title)}</span>`;
  $('articleMeta').textContent = '加载中…';

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

    body.innerHTML = marked.parse(md);

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

    // Meta
    const chars    = md.replace(/\s/g, '').length;
    const readMins = Math.max(1, Math.ceil(chars / 400));
    $('articleMeta').innerHTML =
      `<span>${escHtml(category)}</span>
       <span class="meta-sep">·</span>
       <span>${chars.toLocaleString()} 字</span>
       <span class="meta-sep">·</span>
       <span>约 ${readMins} 分钟</span>`;

    $('noteContent').scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    body.innerHTML = `<div class="error-state">笔记加载失败：${err.message}</div>`;
  }
}

function showWelcome() {
  $('welcomeScreen').classList.remove('hidden');
  $('noteArticle').classList.add('hidden');
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
    clear.style.display = 'none';
    renderNoteList();
    input.focus();
  });

  // Mobile nav
  document.querySelectorAll('.mobile-nav-btn').forEach(btn =>
    btn.addEventListener('click', () => switchMobilePanel(btn.dataset.panel))
  );

  // Reading progress bar
  $('noteContent').addEventListener('scroll', () => {
    const el = $('noteContent');
    const total = el.scrollHeight - el.clientHeight;
    const pct = total > 0 ? (el.scrollTop / total) * 100 : 0;
    $('readingProgress').style.width = pct + '%';
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
