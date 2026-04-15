/* ============================================================
   app.js  —  Personal Notes Site
   ============================================================ */

const CONFIG = {
  indexUrl: 'notes/index.json',
  searchIndexUrl: 'notes/search-index.json',
  remoteBaseUrl: 'https://sfusong.github.io/notes-site/',
  siteName: '我的笔记',
};

const NOTE_PROGRESS_KEY = 'note-progress-v1';
const READING_DENSITY_KEY = 'reading-density-v1';
const LAST_OPEN_NOTE_KEY = 'last-open-note-v1';
const REMOTE_SYNC_META_KEY = 'remote-sync-meta-v1';
const REMOTE_NOTES_CACHE = 'notes-remote-v1';
const OPTIONAL_ASSETS = {
  hljsLightCss: 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github.min.css',
  hljsDarkCss: 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github-dark.min.css',
  hljsScript: 'https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/highlight.min.js',
  katexCss: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
  katexScript: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js',
  katexAutoRenderScript: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js',
};

const MERMAID_LANGS = new Set(['mermaid', 'flowchart', 'graph']);
const MERMAID_START_RE = /^\s*(flowchart|graph)\s+(TB|TD|BT|RL|LR)\b|^\s*(sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie|journey|mindmap|timeline|quadrantChart|requirementDiagram|gitGraph|C4Context)\b/i;

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
  currentCategoryKey: null,
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
  isNativeApp: false,
  syncInProgress: false,
  syncStatusText: '',
  mobileTransitionTimer: null,
  toastTimer: null,
  lastScrollTop: 0,
  navHidden: false,
  nativeBackCleanup: null,
  optionalAssetsBooted: false,
  categoryMap: {},
  expandedCategoryKeys: new Set(),
};

// ── DOM helpers ──────────────────────────────────────────────
const $ = id => document.getElementById(id);

function renderBootError(error) {
  const message = error instanceof Error ? error.message : String(error || '未知错误');
  document.title = CONFIG.siteName;
  $('noteArticle')?.classList.add('hidden');
  $('welcomeScreen')?.classList.remove('hidden');
  $('welcomeText').textContent = `应用启动失败：${message}`;
  $('categoryNav').innerHTML = `
    <div class="error-state">
      <strong>启动失败</strong>
      <small>${escHtml(message)}</small>
      <p>请先回到上一版 APK，或把这个错误发给我，我会继续修。</p>
    </div>`;
  if (isMobile()) switchMobilePanel('content');
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  try {
    state.isNativeApp = isNativeApp();
    if (state.isNativeApp) {
      document.documentElement.setAttribute('data-native-app', '');
    } else {
      document.documentElement.removeAttribute('data-native-app');
    }

    // Fail open on mobile: show a panel before any heavier init runs.
    if (isMobile()) switchMobilePanel('sidebar');

    // Resolve saved theme (remap old 'light'/'dark' values)
    const saved = localStorage.getItem('theme');
    const mapped = saved === 'light' ? 'claude' : saved === 'dark' ? 'linear' : saved;
    setTheme(mapped || 'claude', false);
    setReadingDensity(localStorage.getItem(READING_DENSITY_KEY) || 'standard');
    initThemePicker();
    setupEventListeners();

    configureMarkdownRenderer();

    await loadIndex();
    bootOptionalAssets();
  } catch (error) {
    console.error('App boot failed', error);
    renderBootError(error);
  }
});

function isNativeApp() {
  try {
    return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
  } catch {
    return false;
  }
}

function remoteUrl(path) {
  return new URL(path, CONFIG.remoteBaseUrl).toString();
}

async function openRemoteNotesCache() {
  if (!('caches' in window)) throw new Error('当前运行环境不支持离线缓存');
  return caches.open(REMOTE_NOTES_CACHE);
}

async function readCachedResponse(path) {
  const cache = await openRemoteNotesCache();
  return cache.match(remoteUrl(path));
}

async function readCachedJson(path) {
  const res = await readCachedResponse(path);
  return res ? res.json() : null;
}

async function readCachedText(path) {
  const res = await readCachedResponse(path);
  return res ? res.text() : null;
}

async function cacheRemoteText(path, text, contentType) {
  const cache = await openRemoteNotesCache();
  await cache.put(remoteUrl(path), new Response(text, {
    headers: { 'Content-Type': contentType },
  }));
}

async function fetchRemoteText(path) {
  const res = await fetch(remoteUrl(path), { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
  return res.text();
}

async function fetchRemoteJson(path) {
  return JSON.parse(await fetchRemoteText(path));
}

function getRemoteSyncMeta() {
  try {
    return JSON.parse(localStorage.getItem(REMOTE_SYNC_META_KEY) || 'null');
  } catch {
    return null;
  }
}

function getStoredLastOpenNote() {
  try {
    return JSON.parse(localStorage.getItem(LAST_OPEN_NOTE_KEY) || 'null');
  } catch {
    return null;
  }
}

function getNoteProgressStore() {
  try {
    return JSON.parse(localStorage.getItem(NOTE_PROGRESS_KEY) || '{}');
  } catch {
    return {};
  }
}

function setRemoteSyncMeta(meta) {
  localStorage.setItem(REMOTE_SYNC_META_KEY, JSON.stringify(meta));
}

async function loadIndexData() {
  if (state.isNativeApp) {
    return readCachedJson(CONFIG.indexUrl);
  }

  const res = await fetch(CONFIG.indexUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
  return res.json();
}

function ensureStylesheet(id, href, disabled = false) {
  let link = document.getElementById(id);
  if (link) {
    link.disabled = disabled;
    return link;
  }

  link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  link.disabled = disabled;
  document.head.appendChild(link);
  return link;
}

function loadScriptOnce(id, src, onErrorFlag) {
  const existing = document.getElementById(id);
  if (existing?.dataset.loaded === 'true') return Promise.resolve();
  if (existing?.dataset.loading === 'true') {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
    });
  }

  const script = existing || document.createElement('script');
  script.id = id;
  script.src = src;
  script.async = true;
  script.dataset.loading = 'true';

  return new Promise((resolve, reject) => {
    script.addEventListener('load', () => {
      script.dataset.loading = 'false';
      script.dataset.loaded = 'true';
      resolve();
    }, { once: true });
    script.addEventListener('error', () => {
      script.dataset.loading = 'false';
      if (onErrorFlag) window[onErrorFlag] = true;
      reject(new Error(`Failed to load ${src}`));
    }, { once: true });
    if (!existing) document.head.appendChild(script);
  });
}

function enhanceArticleBody(body) {
  if (!body) return;

  wireArticleLinks(body);
  renderMermaidDiagrams(body);

  if (typeof hljs !== 'undefined') {
    body.querySelectorAll('pre code:not(.hljs):not(.language-mermaid):not(.language-flowchart)').forEach(el => {
      hljs.highlightElement(el);
    });
  }

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
}

function configureMarkdownRenderer() {
  if (!window.marked?.setOptions) return;

  const renderer = new marked.Renderer();
  renderer.code = (code, infostring = '') => {
    const lang = String(infostring || '').trim().split(/\s+/)[0].toLowerCase();
    const text = String(code || '').trim();
    const isMermaid = MERMAID_LANGS.has(lang) || MERMAID_START_RE.test(text);

    if (isMermaid) {
      return [
        '<figure class="mermaid-block">',
        `<pre class="mermaid-source" hidden>${escHtml(text)}</pre>`,
        `<div class="mermaid" role="img">${escHtml(text)}</div>`,
        '</figure>',
      ].join('');
    }

    const className = lang ? ` class="language-${escHtml(lang)}"` : '';
    return `<pre><code${className}>${escHtml(code)}</code></pre>`;
  };

  marked.setOptions({ gfm: true, breaks: true, renderer });
}

function renderMermaidDiagrams(body) {
  const nodes = [...body.querySelectorAll('.mermaid:not([data-processed])')];
  if (!nodes.length) return;

  if (!window.mermaid?.run) {
    nodes.forEach(node => {
      node.closest('.mermaid-block')?.classList.add('mermaid-block-unavailable');
      node.setAttribute('data-processed', 'unavailable');
    });
    return;
  }

  const currentTheme = THEMES.find(t => t.id === state.theme) || THEMES[0];
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: currentTheme.dark ? 'dark' : 'neutral',
    flowchart: {
      curve: 'basis',
      htmlLabels: false,
      useMaxWidth: true,
    },
    fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--font-sans') || 'sans-serif',
  });

  mermaid.run({ nodes, suppressErrors: true }).catch(error => {
    console.warn('Mermaid render failed', error);
  });
}

function normalizeNotePath(path) {
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/');
  const stack = [];

  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      stack.pop();
      continue;
    }
    stack.push(part);
  }

  return stack.join('/');
}

function mapLegacySourcePathToNoteFile(path) {
  const decoded = decodeURIComponent(path || '').replace(/\\/g, '/');
  const siteNotesPrefix = '/Users/shifusong/notes-site/notes/';
  if (decoded.startsWith(siteNotesPrefix)) {
    return `notes/${decoded.slice(siteNotesPrefix.length)}`;
  }

  const legacyRoot = '/Users/shifusong/Projects/找工作/面试学习/';
  if (!decoded.startsWith(legacyRoot)) return null;

  const relative = decoded.slice(legacyRoot.length);
  if (relative === 'README.md') return 'notes/面试学习/README.md';
  if (relative.startsWith('开发/')) {
    return `notes/面试学习/开发岗/开发课程/${relative.slice('开发/'.length)}`;
  }
  if (relative.startsWith('AI产品经理/')) {
    return `notes/面试学习/AI产品经理/${relative.slice('AI产品经理/'.length)}`;
  }
  if (relative.startsWith('项目管理产品经理/')) {
    return `notes/面试学习/产品经理_项目经理/${relative.slice('项目管理产品经理/'.length)}`;
  }
  return `notes/面试学习/${relative}`;
}

function resolveNoteHref(href) {
  const trimmed = (href || '').trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const [rawPath, rawFragment = ''] = trimmed.split('#');
  if (!rawPath) return null;

  const candidate = decodeURIComponent(rawPath);
  if (/^[a-z][a-z0-9+.-]*:/i.test(candidate)) return null;

  let noteFile = mapLegacySourcePathToNoteFile(candidate);
  if (!noteFile) {
    if (candidate.startsWith('/notes/')) {
      noteFile = candidate.slice(1);
    } else if (candidate.startsWith('notes/')) {
      noteFile = candidate;
    } else if (candidate.startsWith('/')) {
      return null;
    } else if (candidate.endsWith('.md') && state.currentNote?.file) {
      const baseDir = state.currentNote.file.split('/').slice(0, -1).join('/');
      noteFile = normalizeNotePath(`${baseDir}/${candidate}`);
    } else {
      return null;
    }
  }

  const note = state.allNotes.find(entry => entry.file === noteFile);
  if (!note) return null;
  return { note, fragment: decodeURIComponent(rawFragment) };
}

function focusArticleFragment(fragment, behavior = 'smooth') {
  if (!fragment) return;
  const escaped = window.CSS?.escape ? CSS.escape(fragment) : fragment.replace(/["\\]/g, '\\$&');
  const target = $('articleBody')?.querySelector(`#${escaped}`);
  if (!target) return;

  const container = $('noteContent');
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const top = container.scrollTop + (targetRect.top - containerRect.top) - container.clientHeight * 0.16;
  container.scrollTo({ top: Math.max(0, top), behavior });
}

function wireArticleLinks(body) {
  body.querySelectorAll('a[href]').forEach(anchor => {
    if (anchor.dataset.noteLinkResolved === 'true') return;

    const resolved = resolveNoteHref(anchor.getAttribute('href'));
    if (!resolved) return;

    anchor.dataset.noteLinkResolved = 'true';
    anchor.dataset.noteTarget = resolved.note.file;
    anchor.dataset.noteFragment = resolved.fragment || '';
    anchor.setAttribute('href', noteHash(resolved.note));

    anchor.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      event.preventDefault();
      loadNote(resolved.note, { historyMode: 'push' }).then(() => {
        if (resolved.fragment) {
          requestAnimationFrame(() => focusArticleFragment(resolved.fragment, 'smooth'));
        }
      });
    });
  });
}

function refreshCurrentArticleEnhancements() {
  const article = $('noteArticle');
  if (!article || article.classList.contains('hidden')) return;
  enhanceArticleBody($('articleBody'));
}

function bootOptionalAssets() {
  if (state.optionalAssetsBooted) return;
  state.optionalAssetsBooted = true;

  const boot = async () => {
    try {
      const currentTheme = THEMES.find(t => t.id === state.theme) || THEMES[0];
      ensureStylesheet('hljs-light', OPTIONAL_ASSETS.hljsLightCss, currentTheme.dark);
      ensureStylesheet('hljs-dark', OPTIONAL_ASSETS.hljsDarkCss, !currentTheme.dark);
      ensureStylesheet('katex-css', OPTIONAL_ASSETS.katexCss, false);

      await Promise.allSettled([
        loadScriptOnce('hljs-script', OPTIONAL_ASSETS.hljsScript, '_hljsFailed'),
        loadScriptOnce('katex-script', OPTIONAL_ASSETS.katexScript, '_katexFailed'),
      ]);

      if (!window._katexFailed) {
        await loadScriptOnce('katex-auto-render-script', OPTIONAL_ASSETS.katexAutoRenderScript, '_katexFailed');
      }
    } catch (error) {
      console.warn('Optional asset boot failed', error);
    } finally {
      refreshCurrentArticleEnhancements();
    }
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => { void boot(); }, { timeout: 1800 });
  } else {
    window.setTimeout(() => { void boot(); }, 0);
  }
}

// ── Load Notes Index ─────────────────────────────────────────
async function loadIndex() {
  try {
    const data = await loadIndexData();
    if (!data) {
      applyIndexData({ categories: [] });
      renderSidebar();
      renderNoteList();
      updateAppSyncUi();
      showWelcome();
      if (state.isNativeApp && isMobile()) switchMobilePanel('content');
      return;
    }

    applyIndexData(data);
    renderSidebar();
    renderNoteList();
    updateAppSyncUi();
    restoreFromHash();
  } catch (err) {
    $('categoryNav').innerHTML = `
      <div class="error-state">
        <strong>加载失败</strong>
        <small>${err.message}</small>
        <p>${state.isNativeApp ? '请先联网后点击“同步我的笔记”，然后重试' : '请先运行 <code>python3 scripts/generate-index.py</code><br>生成索引文件，然后刷新页面'}</p>
      </div>`;
    updateAppSyncUi(err.message);
  }
}

function applyIndexData(data) {
  state.categories = data.categoryTree || data.categories || [];
  state.allNotes = data.allNotes || flattenCategoryTreeNotes(state.categories);
  state.categoryMap = buildCategoryMap(state.categories);

  if (state.currentCategoryKey && !state.categoryMap[state.currentCategoryKey]) {
    state.currentCategoryKey = null;
  }

  const expanded = new Set();
  state.categories.forEach(node => expanded.add(node.key));
  for (const key of state.expandedCategoryKeys) {
    if (state.categoryMap[key]) expanded.add(key);
  }
  if (state.currentCategoryKey) addExpandedPathKeys(expanded, state.currentCategoryKey);
  state.expandedCategoryKeys = expanded;
}

function flattenCategoryTreeNotes(nodes) {
  const notes = [];
  for (const node of nodes || []) {
    if (node.notes?.length) notes.push(...node.notes);
    if (node.children?.length) notes.push(...flattenCategoryTreeNotes(node.children));
  }
  return notes;
}

function buildCategoryMap(nodes, map = {}) {
  for (const node of nodes || []) {
    map[node.key] = node;
    if (node.children?.length) buildCategoryMap(node.children, map);
  }
  return map;
}

function addExpandedPathKeys(target, categoryKey) {
  const parts = (categoryKey || '').split('/').filter(Boolean);
  const acc = [];
  for (const part of parts) {
    acc.push(part);
    target.add(acc.join('/'));
  }
}

function getCurrentCategoryNode() {
  return state.currentCategoryKey ? state.categoryMap[state.currentCategoryKey] || null : null;
}

function getCategoryGuideNote(categoryKey = state.currentCategoryKey) {
  if (!categoryKey) return null;
  return state.allNotes.find(note =>
    note.categoryKey === categoryKey && String(note.filename || '').toLowerCase() === 'readme.md'
  ) || null;
}

function currentCategoryLabel() {
  return getCurrentCategoryNode()?.pathLabel || null;
}

function categoryGuideSummary(node) {
  if (!node) return '';
  const childCount = (node.children || []).length;
  const parts = [];
  if (childCount) parts.push(`${childCount} 个子分类`);
  if (node.directNoteCount) parts.push(`${node.directNoteCount} 篇直属笔记`);
  if (!parts.length && node.totalNoteCount) parts.push(`${node.totalNoteCount} 篇笔记`);
  return parts.join(' · ');
}

function isCurrentCategoryAncestor(key) {
  return !!state.currentCategoryKey && state.currentCategoryKey !== key && state.currentCategoryKey.startsWith(`${key}/`);
}

function toggleCategoryExpanded(categoryKey) {
  if (!categoryKey) return;
  if (state.expandedCategoryKeys.has(categoryKey)) {
    state.expandedCategoryKeys.delete(categoryKey);
  } else {
    state.expandedCategoryKeys.add(categoryKey);
  }
  if (state.currentCategoryKey) addExpandedPathKeys(state.expandedCategoryKeys, state.currentCategoryKey);
  renderSidebar();
}

// ── Sidebar ───────────────────────────────────────────────────
function renderSidebar() {
  const total = state.allNotes.length;
  let html = '';

  html += `
    <div class="cat-item ${state.currentCategoryKey === null ? 'active' : ''}" style="--cat-depth:0">
      <span class="cat-item-spacer" aria-hidden="true"></span>
      <button class="cat-item-main" data-key="">
        <span class="cat-name">全部笔记</span>
        <span class="cat-count">${total}</span>
      </button>
    </div>`;

  if (state.categories.length > 0) {
    html += `<div class="cat-section-label">分类</div>`;
    html += state.categories.map(renderCategoryNode).join('');
  }

  const nav = $('categoryNav');
  nav.innerHTML = html;

  nav.querySelectorAll('.cat-item-main').forEach(el => {
    el.addEventListener('click', () => selectCategory(el.dataset.key || null));
  });
  nav.querySelectorAll('.cat-item-toggle').forEach(el => {
    el.addEventListener('click', event => {
      event.stopPropagation();
      toggleCategoryExpanded(el.dataset.key || '');
    });
  });
}

function renderCategoryNode(node) {
  const hasChildren = (node.children || []).length > 0;
  const expanded = state.expandedCategoryKeys.has(node.key);
  const isActive = state.currentCategoryKey === node.key;
  const isAncestor = isCurrentCategoryAncestor(node.key);

  return `
    <div class="cat-tree-node">
      <div class="cat-item ${isActive ? 'active' : ''} ${isAncestor ? 'ancestor' : ''}" style="--cat-depth:${node.depth}">
        ${hasChildren ? `
          <button class="cat-item-toggle ${expanded ? 'expanded' : ''}" data-key="${escHtml(node.key)}" aria-label="${expanded ? '收起子分类' : '展开子分类'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polyline points="9 6 15 12 9 18"/>
            </svg>
          </button>
        ` : '<span class="cat-item-spacer" aria-hidden="true"></span>'}
        <button class="cat-item-main" data-key="${escHtml(node.key)}" title="${escHtml(node.pathLabel)}">
          <span class="cat-name">${escHtml(node.name)}</span>
          <span class="cat-count">${node.totalNoteCount}</span>
        </button>
      </div>
      ${hasChildren && expanded ? `
        <div class="cat-children">
          ${node.children.map(renderCategoryNode).join('')}
        </div>
      ` : ''}
    </div>`;
}

function selectCategory(categoryKey) {
  syncCurrentCategory(categoryKey);
  state.currentNote = null;
  history.replaceState(null, '', '#');
  setReadingState(false);
  setNoteListCollapsed(false);

  renderNoteList();
  showWelcome();

  if (isMobile()) switchMobilePanel('list');
}

function syncCurrentCategory(categoryKey) {
  state.currentCategoryKey = categoryKey || null;
  if (state.currentCategoryKey) addExpandedPathKeys(state.expandedCategoryKeys, state.currentCategoryKey);
  renderSidebar();
}

// ── Note List ─────────────────────────────────────────────────
function renderNoteList() {
  const baseNotes = scopedNotes();
  const currentNode = getCurrentCategoryNode();
  const guideNote = !state.searchQuery ? getCategoryGuideNote() : null;
  const rawResults = state.searchQuery ? rankSearchResults(baseNotes) : baseNotes.map(note => ({ note, hitLabel: '', snippet: note.preview || '' }));
  const results = guideNote
    ? rawResults.filter(entry => entry.note.file !== guideNote.file)
    : rawResults;
  const notes = rawResults.map(entry => entry.note);
  $('panelTitle').textContent = state.searchQuery ? '搜索结果' : (currentCategoryLabel() || '全部笔记');
  $('noteCount').textContent  = state.searchQuery ? `${notes.length} 条` : `${notes.length} 篇`;
  renderSearchStatus(notes, baseNotes.length);

  if (notes.length === 0) {
    state.searchSelection = -1;
    const inContextScope = state.searchScope === 'context';
    const canWidenScope = inContextScope && state.currentCategoryKey;
    const needsFirstSync = state.isNativeApp && !state.allNotes.length && !state.searchQuery;
    $('noteCards').innerHTML = `
      <div class="empty-state">
        <strong>${state.searchQuery ? '没有找到匹配的笔记' : (needsFirstSync ? '还没有本地笔记' : '该节点暂无笔记')}</strong>
        ${state.searchQuery ? `
          <small>当前在 <strong>${escHtml(searchScopeLabel())}</strong> 中搜索。试试换个关键词，或按 <kbd>Esc</kbd> 清空搜索。</small>
          ${canWidenScope ? '<button class="empty-action-btn" id="expandSearchScopeBtn">改为搜索全部笔记</button>' : ''}
        ` : (needsFirstSync ? `
          <small>这是 Android 空壳模式。先同步一次线上笔记，后续就会优先读取本地缓存。</small>
          <button class="empty-action-btn" id="syncEmptyNotesBtn">同步我的笔记</button>
        ` : '')}
      </div>`;
    if (state.searchQuery && canWidenScope) {
      $('expandSearchScopeBtn')?.addEventListener('click', () => setSearchScope('all'));
    }
    if (needsFirstSync) {
      $('syncEmptyNotesBtn')?.addEventListener('click', () => syncRemoteNotes());
    }
    return;
  }

  const selectedIndex = state.searchQuery
    ? Math.min(Math.max(state.searchSelection, 0), notes.length - 1)
    : -1;
  state.searchSelection = selectedIndex;

  const guideCardHtml = guideNote ? `
    <button class="note-guide-card" id="categoryGuideCard"
            data-file="${escHtml(guideNote.file)}"
            data-slug="${escHtml(guideNote.slug || '')}">
      <div class="note-guide-pill">本节点导航页</div>
      <strong>${escHtml(guideNote.title)}</strong>
      ${categoryGuideSummary(currentNode) ? `<div class="note-guide-meta">${escHtml(categoryGuideSummary(currentNode))}</div>` : ''}
      <p>${escHtml(guideNote.preview || '先从这页开始，看当前分类的结构、课程总纲和推荐阅读顺序。')}</p>
      <span class="note-guide-link">打开导航页</span>
    </button>
  ` : '';

  $('noteCards').innerHTML = `${guideCardHtml}${results.map(({ note: n, hitLabel, snippet }, index) => {
    return `
    <div class="note-card ${state.currentNote?.file === n.file ? 'active' : ''} ${selectedIndex === index ? 'search-selected' : ''}"
         data-file="${escHtml(n.file)}"
         data-slug="${escHtml(n.slug || '')}"
         data-category="${escHtml(n.categoryPathLabel || n.category)}"
         data-category-key="${escHtml(n.categoryKey || '')}"
         data-title="${escHtml(n.title)}"
         data-index="${index}">
      <div class="note-card-title">${hilite(escHtml(n.title))}</div>
      <div class="note-card-meta-row">
        <div class="note-card-category">${hilite(escHtml(n.categoryPathLabel || n.category))}</div>
        ${hitLabel ? `<span class="search-hit-badge">${escHtml(hitLabel)}</span>` : ''}
      </div>
      ${snippet ? `<div class="note-card-preview">${hilite(escHtml(snippet))}</div>` : ''}
    </div>`;
  }).join('')}`;

  $('categoryGuideCard')?.addEventListener('click', () => {
    loadNote(guideNote, { historyMode: 'push' });
  });

  $('noteCards').querySelectorAll('.note-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (!state.searchQuery) return;
      updateSearchSelection(Number(card.dataset.index));
    });
    card.addEventListener('click', () => {
      const note = state.allNotes.find(item => item.file === card.dataset.file) || card.dataset;
      if (state.currentNote?.file === card.dataset.file) {
        if (state.searchQuery) refreshOpenArticleSearchState('instant');
        return;
      }
      loadNote(note, { historyMode: 'push' });
    });
  });
}

function scopedNotes() {
  if (!state.currentCategoryKey) return state.allNotes;
  if (state.searchQuery && state.searchScope === 'all') return state.allNotes;
  return state.allNotes.filter(note => note.categoryKey === state.currentCategoryKey || note.categoryKey.startsWith(`${state.currentCategoryKey}/`));
}

async function ensureSearchIndex() {
  if (state.searchIndex !== null || state.searchIndexLoading) return;
  state.searchIndexLoading = true;
  try {
    const data = state.isNativeApp
      ? await readCachedJson(CONFIG.searchIndexUrl)
      : await fetch(CONFIG.searchIndexUrl).then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        });

    if (!data) throw new Error('未找到已同步的全文索引');
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
  const category = (note.categoryPathLabel || note.category || '').toLowerCase();
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
  if (state.searchScope === 'all' || !state.currentCategoryKey) return '全部笔记';
  return currentCategoryLabel() || '全部笔记';
}

function renderSearchStatus(notes, poolSize = notes.length) {
  const el = $('searchStatus');
  if (!state.searchQuery) {
    if (state.isNativeApp) {
      const meta = getRemoteSyncMeta();
      const hint = state.syncInProgress
        ? state.syncStatusText || '正在同步…'
        : meta?.updatedAt
          ? `上次同步：${new Date(meta.updatedAt).toLocaleString('zh-CN')}`
          : '首次使用请先同步笔记';
      el.innerHTML = `<span>${escHtml(hint)}</span>`;
    } else {
      el.innerHTML = `<span>按 <kbd>/</kbd> 快速搜索</span>`;
    }
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
    return state.allNotes.find(n => n.slug === slug || n.legacySlugs?.includes(slug)) || null;
  }
  return state.allNotes.find(n => n.file === target) || null;
}

async function loadNote(noteLike, options = {}) {
  const historyMode = options.historyMode || 'push';
  const resolved = state.allNotes.find(note =>
    note.file === noteLike.file || (noteLike.slug && note.slug === noteLike.slug)
  ) || noteLike;
  const {
    file,
    category,
    categoryKey,
    categoryPath,
    categoryPathLabel,
    title,
    slug,
  } = resolved;
  const requestId = ++state.noteRequestId;
  state.currentNote = resolved;
  if (!state.searchQuery && categoryKey) {
    syncCurrentCategory(categoryKey);
  }
  setReadingState(true);
  const nextHash = noteHash({ file, slug });
  if (historyMode === 'push') {
    if (location.hash !== nextHash) history.pushState(null, '', nextHash);
  } else if (historyMode === 'replace') {
    if (location.hash !== nextHash) history.replaceState(null, '', nextHash);
  }
  localStorage.setItem(LAST_OPEN_NOTE_KEY, JSON.stringify({ file, slug }));
  state.hasToc = false;
  state.lastScrollTop = 0;
  setMobileNavHidden(false);

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
  const breadcrumbParts = categoryPath?.length ? categoryPath : (category ? [category] : []);
  const breadcrumbHtml = breadcrumbParts.map((part, index) => {
    const sep = index === 0 ? '' : '<span class="breadcrumb-sep">›</span>';
    return `${sep}<span class="breadcrumb-item">${escHtml(part)}</span>`;
  }).join('');
  $('breadcrumb').innerHTML = `${breadcrumbHtml ? `${breadcrumbHtml}<span class="breadcrumb-sep">›</span>` : ''}<span class="breadcrumb-item">${escHtml(title)}</span>`;
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
    const md = state.isNativeApp
      ? await readCachedText(file)
      : await fetch(file).then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        });

    if (!md) throw new Error(state.isNativeApp ? '这篇笔记还没有同步到本地，请先同步最新笔记' : '笔记内容为空');
    if (requestId !== state.noteRequestId) return;

    body.innerHTML = sanitizeRenderedHtml(marked.parse(md));

    // Remove leading H1 — it's already shown in the article header
    const firstH1 = body.querySelector('h1:first-child');
    if (firstH1) firstH1.remove();

    // Fade-in animation
    body.classList.remove('fade-in');
    void body.offsetWidth;
    body.classList.add('fade-in');

    enhanceArticleBody(body);

    // TOC
    buildToc();

    // Meta
    const chars    = md.replace(/\s/g, '').length;
    const readMins = Math.max(1, Math.ceil(chars / 400));
    $('articleMeta').innerHTML =
      `<span>${escHtml(categoryPathLabel || category || '')}</span>
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
  updateWelcomeState();
  setMobileNavHidden(false);
  if (state.isNativeApp && !state.allNotes.length && isMobile()) {
    switchMobilePanel('content');
  }
}

function renderWelcomeHome() {
  const home = $('welcomeHome');
  const recentSection = $('welcomeRecentSection');
  const recentList = $('welcomeRecentList');
  const recentMoreBtn = $('welcomeRecentMoreBtn');
  const freshSection = $('welcomeFreshSection');
  const freshList = $('welcomeFreshList');
  const categorySection = $('welcomeCategorySection');
  const categoryGrid = $('welcomeCategoryGrid');

  if (!state.isNativeApp || !state.allNotes.length || state.currentCategoryKey) {
    home.classList.add('hidden');
    recentSection.classList.add('hidden');
    freshSection.classList.add('hidden');
    categorySection.classList.add('hidden');
    return;
  }

  const progress = getNoteProgressStore();
  const recentNotes = Object.entries(progress)
    .map(([file, meta]) => {
      const note = state.allNotes.find(item => item.file === file);
      return note && meta?.updatedAt ? { note, meta } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.meta.updatedAt - a.meta.updatedAt)
    .slice(0, 4);

  recentList.innerHTML = recentNotes.map(({ note, meta }) => `
    <button class="welcome-home-card" data-file="${escHtml(note.file)}" data-slug="${escHtml(note.slug || '')}">
      <strong>${escHtml(note.title)}</strong>
      <small>${escHtml(note.categoryPathLabel || note.category)}</small>
      <div class="welcome-card-meta">上次阅读：${new Date(meta.updatedAt).toLocaleDateString('zh-CN')}</div>
    </button>
  `).join('');
  recentSection.classList.toggle('hidden', recentNotes.length === 0);
  recentMoreBtn.classList.toggle('hidden', recentNotes.length === 0);

  const recentCourseNotes = state.allNotes
    .filter(note => Number.isFinite(note.order))
    .sort((a, b) => (b.order ?? -Infinity) - (a.order ?? -Infinity) || a.category.localeCompare(b.category, 'zh-CN'))
    .slice(0, 6);

  freshList.innerHTML = recentCourseNotes.map(note => `
    <button class="welcome-home-card" data-file="${escHtml(note.file)}" data-slug="${escHtml(note.slug || '')}">
      <strong>${escHtml(note.title)}</strong>
      <small>${escHtml(note.categoryPathLabel || note.category)}</small>
    </button>
  `).join('');
  freshSection.classList.toggle('hidden', recentCourseNotes.length === 0);

  categoryGrid.innerHTML = state.categories.map(category => `
    <button class="welcome-category-card" data-category-key="${escHtml(category.key)}">
      <strong>${escHtml(category.name)}</strong>
      <small>${category.totalNoteCount} 篇笔记</small>
    </button>
  `).join('');
  categorySection.classList.toggle('hidden', !state.categories.length);
  home.classList.remove('hidden');

  home.querySelectorAll('.welcome-home-card').forEach(card => {
    card.addEventListener('click', () => {
      const note = state.allNotes.find(item =>
        item.file === card.dataset.file || (card.dataset.slug && item.slug === card.dataset.slug)
      );
      if (note) loadNote(note, { historyMode: 'push' });
    });
  });

  categoryGrid.querySelectorAll('.welcome-category-card').forEach(card => {
    card.addEventListener('click', () => {
      selectCategory(card.dataset.categoryKey || null);
    });
  });

  recentMoreBtn.onclick = () => switchMobilePanel('list');
}

function updateWelcomeState() {
  const titleEl = $('welcomeScreen').querySelector('h2');
  const textEl = $('welcomeText');
  const actionsEl = $('welcomeActions');
  const noteEl = $('welcomeSyncNote');
  const buttonEl = $('welcomeSyncBtn');
  const guideBtn = $('welcomeGuideBtn');
  const continueBtn = $('welcomeContinueBtn');
  const libraryBtn = $('welcomeLibraryBtn');
  const meta = getRemoteSyncMeta();
  const stored = getStoredLastOpenNote();
  const resumeNote = stored
    ? state.allNotes.find(note => (stored.slug && note.slug === stored.slug) || note.file === stored.file)
    : null;
  const currentNode = getCurrentCategoryNode();
  const guideNote = getCategoryGuideNote();
  const hasCategoryContext = !!currentNode;
  const canReturnToReading = !!resumeNote && hasCategoryContext;
  const structureHint = currentNode
    ? `当前节点：${currentNode.pathLabel} · ${categoryGuideSummary(currentNode) || `${currentNode.totalNoteCount} 篇笔记`}`
    : '';

  if (!state.isNativeApp) {
    continueBtn.textContent = '返回刚才阅读';
    continueBtn.classList.toggle('hidden', !canReturnToReading);
    if (currentNode && guideNote) {
      titleEl.textContent = `${currentNode.name} 导航页`;
      textEl.textContent = `这个节点有一页整理好的导航说明。先从导航页进入，会比直接在列表里找更高效。`;
      actionsEl.classList.remove('hidden');
      guideBtn.classList.remove('hidden');
    } else {
      titleEl.textContent = currentNode ? `进入 ${currentNode.name}` : '选择一篇笔记开始阅读';
      textEl.textContent = currentNode
        ? `这个节点下共有 ${currentNode.totalNoteCount} 篇笔记。从左侧列表选择一篇，或先打开它的导航页。`
        : '从左侧选择分类，点击笔记卡片即可阅读';
      actionsEl.classList.toggle('hidden', !currentNode || (!guideNote && !canReturnToReading));
      guideBtn.classList.toggle('hidden', !guideNote);
    }
    buttonEl.classList.add('hidden');
    libraryBtn.classList.add('hidden');
    $('welcomeHome').classList.add('hidden');
    noteEl.textContent = structureHint;
    return;
  }

  actionsEl.classList.remove('hidden');
  continueBtn.textContent = hasCategoryContext ? '返回刚才阅读' : '继续阅读';
  guideBtn.classList.toggle('hidden', !guideNote);
  buttonEl.disabled = state.syncInProgress;
  buttonEl.textContent = state.syncInProgress ? '同步中…' : (state.allNotes.length ? '同步最新笔记' : '同步我的笔记');
  continueBtn.classList.toggle('hidden', hasCategoryContext ? !canReturnToReading : !resumeNote);
  libraryBtn.classList.toggle('hidden', !state.allNotes.length);
  libraryBtn.textContent = hasCategoryContext ? '查看本节点笔记' : '进入书库';
  buttonEl.classList.remove('hidden');

  if (currentNode && guideNote) {
    titleEl.textContent = `${currentNode.name} 导航页`;
    textEl.textContent = `先从这页整理好的导航说明进入，再按课程结构继续阅读，会比直接在当前节点里逐篇翻找更顺。`;
    libraryBtn.classList.remove('hidden');
    noteEl.textContent = structureHint;
  } else if (!state.allNotes.length) {
    titleEl.textContent = '先把线上笔记同步到本地';
    textEl.textContent = '这个 Android 版默认不内置书库。首次同步后，你的笔记会缓存到本地，之后离线也能阅读。';
    guideBtn.classList.add('hidden');
    continueBtn.classList.add('hidden');
    libraryBtn.classList.add('hidden');
    noteEl.textContent = state.syncStatusText || '首次同步需要联网，完成后会优先读取本地缓存。';
  } else if (currentNode) {
    titleEl.textContent = `进入 ${currentNode.name}`;
    textEl.textContent = guideNote
      ? `先看导航页，再按当前节点的课程结构继续阅读。`
      : `这个节点下共有 ${currentNode.totalNoteCount} 篇笔记。你可以先浏览列表，或返回刚才阅读的笔记继续看。`;
    noteEl.textContent = structureHint;
  } else if (resumeNote) {
    titleEl.textContent = '继续上次的阅读';
    textEl.textContent = `你上次停留在《${resumeNote.title}》。继续阅读，或者先进入书库看看最近同步的内容。`;
    noteEl.textContent = '';
  } else {
    titleEl.textContent = '本地书库已准备好';
    textEl.textContent = '先进入书库挑一篇笔记开始阅读，或者先同步一下线上最新内容。';
    noteEl.textContent = '';
  }

  if (!hasCategoryContext && state.syncStatusText) {
    noteEl.textContent = state.syncStatusText;
  } else if (!hasCategoryContext && meta?.updatedAt) {
    noteEl.textContent = `上次同步：${new Date(meta.updatedAt).toLocaleString('zh-CN')} · ${meta.noteCount || state.allNotes.length} 篇`;
  } else if (!hasCategoryContext) {
    noteEl.textContent = '首次同步需要联网，完成后会优先读取本地缓存。';
  }

  renderWelcomeHome();
}

function updateAppSyncUi(message = '') {
  const syncBtn = $('syncNotesBtn');
  const meta = getRemoteSyncMeta();
  const label = state.syncInProgress ? '同步中…' : '同步最新笔记';

  syncBtn.classList.toggle('hidden', !state.isNativeApp);
  syncBtn.disabled = state.syncInProgress;
  syncBtn.setAttribute('title', label);
  syncBtn.setAttribute('aria-label', label);
  syncBtn.classList.toggle('is-syncing', state.syncInProgress);

  if (message) {
    state.syncStatusText = message;
  }

  updateWelcomeState();
  renderSearchStatus(filteredNotes(), scopedNotes().length);
}

async function syncRemoteNotes() {
  if (state.syncInProgress) return;

  state.syncInProgress = true;
  updateAppSyncUi('正在获取线上索引…');

  try {
    const indexData = await fetchRemoteJson(CONFIG.indexUrl);
    const searchData = await fetchRemoteJson(CONFIG.searchIndexUrl);
    const remoteNotes = indexData.allNotes
      || flattenCategoryTreeNotes(indexData.categoryTree || indexData.categories || []);
    const noteFiles = [...new Set(remoteNotes.map(note => note.file).filter(Boolean))];

    await cacheRemoteText(CONFIG.indexUrl, JSON.stringify(indexData), 'application/json; charset=utf-8');
    await cacheRemoteText(CONFIG.searchIndexUrl, JSON.stringify(searchData), 'application/json; charset=utf-8');

    let completed = 0;
    const total = noteFiles.length;
    const concurrency = 4;
    let cursor = 0;

    const worker = async () => {
      while (cursor < noteFiles.length) {
        const file = noteFiles[cursor++];
        const text = await fetchRemoteText(file);
        await cacheRemoteText(file, text, 'text/markdown; charset=utf-8');
        completed += 1;
        updateAppSyncUi(`正在同步笔记… ${completed}/${total}`);
      }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, total || 1) }, () => worker()));

    setRemoteSyncMeta({
      updatedAt: Date.now(),
      noteCount: total,
    });

    state.searchIndex = Object.fromEntries(searchData.map(entry => [entry.file, entry.content]));
    applyIndexData(indexData);
    renderSidebar();
    renderNoteList();

    if (state.currentNote) {
      const refreshed = state.allNotes.find(note =>
        note.file === state.currentNote.file || (state.currentNote.slug && note.slug === state.currentNote.slug)
      );
      if (refreshed) {
        await loadNote(refreshed, { historyMode: 'none' });
      } else {
        if (isMobile()) switchMobilePanel('list');
        showWelcome();
      }
    } else {
      restoreFromHash();
      if (!$('noteArticle').classList.contains('hidden')) {
        // restoreFromHash may have opened the last note; nothing else to do.
      } else {
        if (isMobile()) switchMobilePanel('list');
        showWelcome();
      }
    }

    state.syncStatusText = `同步完成：已更新 ${total} 篇笔记`;
    showToast(state.syncStatusText);
  } catch (err) {
    state.syncStatusText = `同步失败：${err.message}`;
    showToast(state.syncStatusText, 2800);
    if (!state.allNotes.length) showWelcome();
  } finally {
    state.syncInProgress = false;
    updateAppSyncUi();
  }
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
    const stored = getStoredLastOpenNote();
    if (stored?.slug) {
      note = state.allNotes.find(n => n.slug === stored.slug) || null;
    }
    if (!note && stored?.file) {
      note = state.allNotes.find(n => n.file === stored.file) || null;
    }
  }
  if (note) {
    loadNote(note, { historyMode: location.hash ? 'none' : 'replace' });
    return;
  }

  if (state.isNativeApp && state.allNotes.length) {
    if (isMobile()) switchMobilePanel('list');
    showWelcome();
  }
}

window.addEventListener('hashchange', () => {
  if (!location.hash) { showWelcome(); return; }
  const note = resolveHashNote(location.hash);
  if (note && note.file !== state.currentNote?.file) loadNote(note, { historyMode: 'none' });
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

  rerenderMermaidForTheme();

  // Update active marker in picker
  document.querySelectorAll('.theme-option').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.theme === theme.id)
  );
}

function rerenderMermaidForTheme() {
  const body = $('articleBody');
  if (!body || !window.mermaid?.run) return;

  body.querySelectorAll('.mermaid-block').forEach(block => {
    const source = block.querySelector('.mermaid-source')?.textContent;
    const diagram = block.querySelector('.mermaid');
    if (!source || !diagram) return;
    diagram.removeAttribute('data-processed');
    diagram.textContent = source;
  });

  renderMermaidDiagrams(body);
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
  document.body.classList.add('mobile-js-ready');
  if (state.mobilePanel === panel) {
    document.querySelectorAll('.mobile-nav-btn').forEach(btn =>
      btn.classList.toggle('active', btn.dataset.panel === panel)
    );
    $('sidebar')?.classList.toggle('mobile-active', panel === 'sidebar');
    $('noteListPanel')?.classList.toggle('mobile-active', panel === 'list');
    $('noteContent')?.classList.toggle('mobile-active', panel === 'content');
    if (panel !== 'content') setMobileNavHidden(false);
    return;
  }
  state.mobilePanel = panel;
  const sidebar  = $('sidebar');
  const listPanel = $('noteListPanel');
  const content  = $('noteContent');

  clearTimeout(state.mobileTransitionTimer);
  [sidebar, listPanel, content].forEach(el => el.classList.remove('mobile-active', 'mobile-before'));

  if (panel === 'sidebar') sidebar.classList.add('mobile-active');
  if (panel === 'list')    listPanel.classList.add('mobile-active');
  if (panel === 'content') content.classList.add('mobile-active');

  document.querySelectorAll('.mobile-nav-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.panel === panel)
  );
  if (panel !== 'content') setMobileNavHidden(false);
}

function setReadingState(active) {
  document.querySelector('.app').classList.toggle('reading-state', active);
  if (!active) setMobileNavHidden(false);
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
  updateMobileChrome(el.scrollTop);
  queueSaveNoteProgress();
}

function setMobileNavHidden(hidden) {
  state.navHidden = hidden;
  $('mobileNav')?.classList.toggle('mobile-hidden', hidden);
  document.body.classList.toggle('mobile-nav-hidden', hidden);
}

function updateMobileChrome(scrollTop) {
  if (!isMobile()) return;
  const isReading = state.mobilePanel === 'content' && !$('noteArticle').classList.contains('hidden');
  if (!isReading) {
    state.lastScrollTop = scrollTop;
    setMobileNavHidden(false);
    return;
  }

  const delta = scrollTop - state.lastScrollTop;
  if (scrollTop < 48 || delta < -10) {
    setMobileNavHidden(false);
  } else if (delta > 14) {
    setMobileNavHidden(true);
  }
  state.lastScrollTop = scrollTop;
}

function setupNativeBackHandler() {
  if (!state.isNativeApp) return;
  const handleBack = () => {
    if ($('tocPanel').classList.contains('open')) {
      closeToc();
      return true;
    }
    if (document.querySelector('.app').classList.contains('focus-mode')) {
      exitFocusMode();
      return true;
    }
    if (isMobile()) {
      if (state.mobilePanel === 'content' && !$('noteArticle').classList.contains('hidden')) {
        switchMobilePanel('list');
        return true;
      }
      if (state.mobilePanel === 'list') {
        switchMobilePanel('sidebar');
        return true;
      }
    }
    if (state.currentNote) {
      showWelcome();
      return true;
    }
    return false;
  };

  const appPlugin = window.Capacitor?.Plugins?.App;
  if (appPlugin?.addListener) {
    state.nativeBackCleanup = appPlugin.addListener('backButton', () => {
      if (!handleBack()) appPlugin.exitApp?.();
    });
    return;
  }

  document.addEventListener('backbutton', e => {
    if (handleBack()) e.preventDefault?.();
  });
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
    }, { historyMode: 'push' }));
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
            data-category="${escHtml(note.categoryPathLabel || note.category)}"
            data-title="${escHtml(note.title)}">
      <span class="article-nav-label">${label}</span>
      <strong>${escHtml(note.title)}</strong>
      <small>${escHtml(note.categoryPathLabel || note.category)}</small>
    </button>`;
}

function updateTocEntryPoints() {
  const articleVisible = !$('noteArticle').classList.contains('hidden');
  const searchOwnsTools = state.searchMatches.length > 1;
  const showFab = state.hasToc
    && articleVisible
    && !searchOwnsTools
    && (isMobile() || $('noteContent').scrollTop > 220);
  $('tocFab').classList.toggle('hidden', !showFab);
}

function updateScrollTopEntry() {
  const articleVisible = !$('noteArticle').classList.contains('hidden');
  const searchOwnsTools = state.searchMatches.length > 1;
  const threshold = isMobile() ? 160 : window.innerHeight * 1.2;
  const show = articleVisible
    && $('noteContent').scrollTop > threshold
    && !searchOwnsTools;
  $('scrollTopBtn').classList.toggle('hidden', !show);
}

// ── Event Listeners ───────────────────────────────────────────
function setupEventListeners() {
  // Theme picker
  $('themePickerBtn').addEventListener('click', e => { e.stopPropagation(); togglePicker(); });
  $('syncNotesBtn').addEventListener('click', () => syncRemoteNotes());
  $('welcomeSyncBtn').addEventListener('click', () => syncRemoteNotes());
  $('welcomeGuideBtn').addEventListener('click', () => {
    const guideNote = getCategoryGuideNote();
    if (guideNote) loadNote(guideNote, { historyMode: 'push' });
  });
  $('welcomeLibraryBtn').addEventListener('click', () => switchMobilePanel('list'));
  $('welcomeContinueBtn').addEventListener('click', () => {
    const stored = getStoredLastOpenNote();
    const note = stored
      ? state.allNotes.find(n => (stored.slug && n.slug === stored.slug) || n.file === stored.file)
      : null;
    if (note) loadNote(note, { historyMode: 'push' });
  });
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
  setupNativeBackHandler();

  // Reading progress bar
  $('noteContent').addEventListener('scroll', updateReadingProgress);

  // TOC toggle
  $('tocToggle').addEventListener('click', toggleToc);
  $('tocFab').addEventListener('click', toggleToc);
  $('tocCloseBtn').addEventListener('click', closeToc);
  document.addEventListener('click', e => {
    if (!isMobile()) return;
    if (!$('tocPanel').classList.contains('open')) return;
    if (e.target.closest('#tocPanel, #tocFab, #tocToggle')) return;
    closeToc();
  });
  $('scrollTopBtn').addEventListener('click', () => {
    $('noteContent').scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('searchMatchPrev').addEventListener('click', () => focusAdjacentSearchMatch(-1));
  $('searchMatchNext').addEventListener('click', () => focusAdjacentSearchMatch(1));

  // Focus mode
  if (!state.isNativeApp) {
    $('focusBtn').addEventListener('click', toggleFocusMode);
  }

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
  updateTocEntryPoints();
  updateScrollTopEntry();
}

function showToast(message, duration = 2200) {
  const toast = $('toast');
  if (!toast || !message) return;

  clearTimeout(state.toastTimer);
  toast.textContent = message;
  toast.classList.remove('hidden');

  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  state.toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.classList.add('hidden'), 220);
  }, duration);
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
