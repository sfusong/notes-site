/* ============================================================
   app.js  —  Personal Notes Site
   ============================================================ */

const CONFIG = {
  indexUrl: 'notes/index.json',
  siteName: '我的笔记',
};

const state = {
  categories: [],
  allNotes: [],
  currentCategory: null,   // null = show all
  currentNote: null,
  searchQuery: '',
  theme: localStorage.getItem('theme') || 'light',
  mobilePanel: 'sidebar',
};

// ── DOM helpers ──────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  applyTheme(state.theme);
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

  $('noteCards').innerHTML = notes.map(n => `
    <div class="note-card ${state.currentNote?.file === n.file ? 'active' : ''}"
         data-file="${escHtml(n.file)}"
         data-category="${escHtml(n.category)}"
         data-title="${escHtml(n.title)}">
      <div class="note-card-title">${hilite(escHtml(n.title))}</div>
      <div class="note-card-category">${escHtml(n.category)}</div>
      ${n.preview ? `<div class="note-card-preview">${hilite(escHtml(n.preview))}</div>` : ''}
    </div>`).join('');

  $('noteCards').querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('click', () => loadNote(card.dataset));
  });
}

function filteredNotes() {
  let notes = state.currentCategory
    ? state.allNotes.filter(n => n.category === state.currentCategory)
    : state.allNotes;

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    notes = notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      (n.preview && n.preview.toLowerCase().includes(q))
    );
  }
  return notes;
}

// ── Load & Render Note ────────────────────────────────────────
async function loadNote({ file, category, title }) {
  state.currentNote = { file, category, title };

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

// ── Theme ─────────────────────────────────────────────────────
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const light = $('hljs-light');
  const dark  = $('hljs-dark');
  if (light) light.disabled = (theme === 'dark');
  if (dark)  dark.disabled  = (theme === 'light');
}

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
  // Theme toggle
  $('themeToggle').addEventListener('click', () =>
    applyTheme(state.theme === 'light' ? 'dark' : 'light')
  );

  // Search
  const input = $('searchInput');
  const clear = $('searchClear');

  input.addEventListener('input', () => {
    state.searchQuery = input.value.trim();
    clear.style.display = state.searchQuery ? 'block' : 'none';
    // When searching, switch to "all" view if a category is selected
    if (state.searchQuery && state.currentCategory) {
      // Keep category filter — search within category
    }
    renderNoteList();
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

  // Keyboard shortcut: / to focus search
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      input.focus();
    }
  });
}

// ── Utilities ─────────────────────────────────────────────────
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
