const API_STORAGE_KEY = "wesite_api_url";
const TOKEN_STORAGE_KEY = "wesite_token";
const RECENT_KEY = "wesite_recent";
const THEME_STORAGE_KEY = "wesite_theme";
const DEFAULT_API_BASE = "http://localhost:3000";
const LIBRARY_DEBOUNCE_MS = 220;

function getApiBase() {
  return new Promise((resolve) => {
    chrome.storage.local.get(API_STORAGE_KEY, (result) => {
      resolve((result[API_STORAGE_KEY] || DEFAULT_API_BASE).replace(/\/+$/, ""));
    });
  });
}

/* ---------- Theme ---------- */

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(preference) {
  const resolved = preference === "system" ? (systemPrefersDark() ? "dark" : "light") : preference;
  document.documentElement.dataset.theme = resolved;
  $("#theme-icon-light")?.classList.toggle("hidden", resolved === "dark");
  $("#theme-icon-dark")?.classList.toggle("hidden", resolved !== "dark");
}

async function initTheme() {
  const stored = await chrome.storage.local.get(THEME_STORAGE_KEY);
  const preference = ["light", "dark", "system"].includes(stored[THEME_STORAGE_KEY])
    ? stored[THEME_STORAGE_KEY]
    : "system";
  applyTheme(preference);

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    chrome.storage.local.get(THEME_STORAGE_KEY, (result) => {
      if (!result[THEME_STORAGE_KEY] || result[THEME_STORAGE_KEY] === "system") {
        applyTheme("system");
      }
    });
  });

  $("#theme-btn")?.addEventListener("click", () => {
    chrome.storage.local.get(THEME_STORAGE_KEY, (result) => {
      const current = result[THEME_STORAGE_KEY] || "system";
      const next = current === "dark" ? "light" : "dark";
      chrome.storage.local.set({ [THEME_STORAGE_KEY]: next }, () => applyTheme(next));
    });
  });
}

function getToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(TOKEN_STORAGE_KEY, (result) => {
      resolve(result[TOKEN_STORAGE_KEY] || null);
    });
  });
}

function setToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [TOKEN_STORAGE_KEY]: token }, resolve);
  });
}

function clearToken() {
  return new Promise((resolve) => {
    chrome.storage.local.remove([TOKEN_STORAGE_KEY], resolve);
  });
}

function getRecent() {
  return new Promise((resolve) => {
    chrome.storage.local.get(RECENT_KEY, (result) => {
      resolve(result[RECENT_KEY] || []);
    });
  });
}

function addRecent(item) {
  return new Promise((resolve) => {
    chrome.storage.local.get(RECENT_KEY, (result) => {
      const recent = result[RECENT_KEY] || [];
      recent.unshift(item);
      chrome.storage.local.set({ [RECENT_KEY]: recent.slice(0, 20) }, resolve);
    });
  });
}

function clearRecent() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [RECENT_KEY]: [] }, resolve);
  });
}

function getFoldersCache() {
  return new Promise((resolve) => {
    chrome.storage.local.get(FOLDERS_CACHE_KEY, (result) => {
      resolve(result[FOLDERS_CACHE_KEY] || null);
    });
  });
}

function setFoldersCache(folders) {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      { [FOLDERS_CACHE_KEY]: { at: Date.now(), folders } },
      resolve,
    );
  });
}

async function apiFetch(path, options = {}) {
  const baseUrl = await getApiBase();
  const token = await getToken();
  const headers = { ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

async function login(email, password) {
  const baseUrl = await getApiBase();
  try {
    const response = await fetch(`${baseUrl}/api/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => null);
    if (response.ok && data?.token) {
      await setToken(data.token);
      return { ok: true, user: data.user };
    }
    return { ok: false, error: data?.error || "Login failed" };
  } catch {
    return { ok: false, error: "Cannot reach the Wesite server. Is it running?" };
  }
}

async function fetchFolders() {
  const result = await apiFetch("/api/folders");
  if (result.ok) {
    const folders = result.data?.flatFolders || [];
    void setFoldersCache(folders);
    return folders;
  }
  return [];
}

/* ---------- Library (folders + website shortcuts) ---------- */

let libraryFolders = [];
let libraryFolderId = "";
let librarySearch = "";
let libraryTimer = null;
let libraryBound = false;

function folderLabel(folder) {
  return folder?.name || "Untitled";
}

function folderDepth(folder, folders) {
  let depth = 0;
  let parentId = folder?.parentFolderId;
  const seen = new Set();

  while (parentId && !seen.has(parentId) && depth < 8) {
    seen.add(parentId);
    const parent = folders.find((item) => item._id === parentId);
    if (!parent) break;
    depth += 1;
    parentId = parent.parentFolderId;
  }

  return depth;
}

function renderLibraryFolders() {
  const wrap = $("#library-folders");
  wrap.innerHTML = "";

  const chips = [
    { id: "", name: "All sites", count: null, depth: 0 },
    { id: "unsorted", name: "Unsorted", count: null, depth: 0 },
  ];

  for (const folder of libraryFolders) {
    chips.push({
      id: folder._id,
      name: folderLabel(folder),
      count: folder.count,
      depth: folderDepth(folder, libraryFolders),
    });
  }

  for (const chip of chips) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = chip.id === libraryFolderId ? "chip active" : "chip";
    button.style.paddingLeft = `${8 + chip.depth * 10}px`;
    if (chip.id && chip.id !== "unsorted") {
      // Folder chips keep their own color swatch for quick recognition.
      const folder = libraryFolders.find((item) => item._id === chip.id);
      const dot = document.createElement("span");
      dot.className = "chip-count";
      dot.style.cssText = `width:8px;height:8px;border-radius:2px;flex-shrink:0;background:${folder?.color || "var(--muted)"}`;
      button.appendChild(dot);
    }
    button.appendChild(document.createTextNode(chip.name));
    if (typeof chip.count === "number") {
      const count = document.createElement("span");
      count.className = "chip-count";
      count.textContent = String(chip.count);
      button.appendChild(count);
    }
    button.addEventListener("click", () => {
      libraryFolderId = chip.id;
      renderLibraryFolders();
      void loadLibrarySites();
    });
    wrap.appendChild(button);
  }
}

function siteRow(website) {
  const item = document.createElement("button");
  item.type = "button";
  item.className = "site-item";
  item.title = website.url || website.title || "";

  const favicon = document.createElement("img");
  favicon.className = "favicon";
  favicon.alt = "";
  favicon.loading = "lazy";
  const domain = website.domain || "example.com";
  favicon.src = website.customIconUrl || website.faviconUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  favicon.addEventListener("error", () => {
    favicon.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  });
  item.appendChild(favicon);

  const info = document.createElement("div");
  info.className = "site-info";

  const title = document.createElement("div");
  title.className = "site-title";
  title.textContent = website.title || website.url || domain;
  info.appendChild(title);

  const subtitle = document.createElement("div");
  subtitle.className = "site-domain";
  const tags = Array.isArray(website.tags) && website.tags.length ? ` · ${website.tags.join(", ")}` : "";
  subtitle.textContent = `${domain}${tags}`;
  info.appendChild(subtitle);

  item.appendChild(info);

  if (website.isFavorite) {
    const star = document.createElement("span");
    star.className = "star";
    star.textContent = "★";
    star.setAttribute("aria-label", "Favorite");
    item.appendChild(star);
  }

  item.addEventListener("click", () => openWebsite(website));
  return item;
}

function renderLibrarySites(websites, total) {
  const list = $("#library-list");
  list.innerHTML = "";

  const count = $("#library-count");
  count.textContent = total > websites.length ? `Sites (${websites.length} of ${total})` : `Sites (${websites.length})`;

  if (!websites.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = librarySearch
      ? `No sites match "${librarySearch}".`
      : "Nothing saved here yet.";
    list.appendChild(empty);
    return;
  }

  for (const website of websites) {
    list.appendChild(siteRow(website));
  }
}

async function loadLibrarySites() {
  const params = new URLSearchParams({ limit: "50", sort: "recent" });
  if (libraryFolderId) params.set("folderId", libraryFolderId);
  if (librarySearch) params.set("search", librarySearch);

  const result = await apiFetch(`/api/websites?${params.toString()}`);
  const errorBox = $("#library-error");
  hide(errorBox);

  if (!result.ok) {
    if (result.status === 401) {
      showLogin();
      return;
    }
    errorBox.textContent = result.data?.error || "Could not load your library.";
    show(errorBox);
    return;
  }

  renderLibrarySites(result.data?.websites || [], result.data?.pagination?.total || 0);
}

function scheduleLibraryLoad() {
  if (libraryTimer) clearTimeout(libraryTimer);
  libraryTimer = setTimeout(() => {
    void loadLibrarySites();
  }, LIBRARY_DEBOUNCE_MS);
}

async function loadLibrary() {
  libraryFolders = await fetchFolders();
  renderLibraryFolders();
  await loadLibrarySites();
}

function bindLibrary() {
  if (libraryBound) return;
  libraryBound = true;

  const search = $("#library-search");
  search.addEventListener("input", () => {
    librarySearch = search.value.trim();
    scheduleLibraryLoad();
  });
  // Enter should feel instant rather than waiting out the debounce.
  search.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    librarySearch = search.value.trim();
    if (libraryTimer) clearTimeout(libraryTimer);
    void loadLibrarySites();
  });
}

async function openWebsite(website) {
  const url = website.url;
  if (!url) return;

  if (website._id) {
    void apiFetch(`/api/websites/${website._id}/visit`, { method: "POST" });
  }

  await addRecent({
    title: website.title || url,
    domain: website.domain || "",
    url,
    faviconUrl: website.faviconUrl || "",
    savedAt: new Date().toISOString(),
  });

  await chrome.tabs.create({ url });
  window.close();
}

function openWesiteSite() {
  getApiBase().then((base) => {
    chrome.tabs.create({ url: base });
    window.close();
  });
}

/**
 * Google sign-in for the extension.
 *
 * Extensions cannot render Google's button (it requires a real web origin),
 * so we sign in on the Wesite website and adopt its httpOnly session cookie
 * (readable here via the "cookies" permission) as our Bearer token.
 */
async function adoptGoogleSession() {
  const baseUrl = (await getApiBase()).replace(/\/+$/, "");

  let cookie = null;
  try {
    cookie = await chrome.cookies.get({ url: baseUrl, name: "wesite_token" });
  } catch {
    return { ok: false, error: "Cookie access was denied by the browser." };
  }

  if (!cookie?.value) {
    return { ok: false, error: "No Wesite session found yet." };
  }

  await setToken(cookie.value);
  const me = await apiFetch("/api/auth/me");
  if (!me.ok) {
    await clearToken();
    return { ok: false, error: "That session is no longer valid." };
  }
  return { ok: true, user: me.data?.user };
}

async function saveWebsite({ url, folderId, tags, notes, isFavorite }) {
  const result = await apiFetch("/api/websites", {
    method: "POST",
    body: JSON.stringify({ url, folderId: folderId || null, tags, notes, isFavorite }),
  });
  if (result.ok) {
    const website = result.data?.website;
    await addRecent({
      title: website?.title || url,
      domain: website?.domain || "",
      url: url,
      faviconUrl: website?.faviconUrl || "",
      savedAt: new Date().toISOString(),
    });
    return { ok: true, website };
  }
  return { ok: false, error: result.data?.error || "Save failed" };
}

async function logout() {
  await clearToken();
  await clearRecent();
}

// DOM helpers
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }
function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }
function setText(el, text) { el.textContent = text; }

let currentTags = [];
let currentFolders = [];
let listenersBound = false;
let loginBound = false;

// Initialize — optimized for instant paint:
// 1. If a token exists, show the main shell immediately (folders from cache).
// 2. Revalidate auth + folders in parallel in the background.
// 3. Only fall back to login when the session is actually rejected.
document.addEventListener("DOMContentLoaded", async () => {
  await initTheme();
  $$("#logo-link").forEach((logo) => logo.addEventListener("click", openWesiteSite));

  const token = await getToken();
  if (!token) {
    // Maybe signed in on the website but never connected the extension.
    const adopted = await adoptGoogleSession().catch(() => ({ ok: false }));
    if (adopted.ok) {
      showMain(adopted.user);
      return;
    }
    showLogin();
    return;
  }

  // Optimistic shell: instant UI, network fills in behind it.
  showMain(null);
});

function showLogin() {
  show($("#login-view"));
  hide($("#main-view"));

  if (loginBound) return;
  loginBound = true;

  $("#open-register").addEventListener("click", () => {
    getApiBase().then((base) => chrome.tabs.create({ url: `${base}/register` }));
  });

  $("#login-btn").addEventListener("click", doLogin);
  $("#login-password").addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });
  $("#login-email").addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });
  $("#google-btn").addEventListener("click", doGoogleLogin);
  bindLibrary();
}

async function doGoogleLogin() {
  const btn = $("#google-btn");
  const hint = $("#google-hint");
  hide($("#login-error"));

  // Second press (or an existing website session): try adopting the cookie.
  setText(btn, "Checking for session...");
  btn.disabled = true;
  const adopted = await adoptGoogleSession().catch(() => ({ ok: false }));

  if (adopted.ok) {
    showMain(adopted.user);
    return;
  }

  // No session yet — open the website login and wait for the user.
  const baseUrl = (await getApiBase()).replace(/\/+$/, "");
  chrome.tabs.create({ url: `${baseUrl}/login` });
  setText(btn, "I've signed in — connect");
  btn.disabled = false;
  show(hint);
}

async function doLogin() {
  const email = $("#login-email").value.trim();
  const password = $("#login-password").value;

  if (!email || !password) {
    hide($("#login-error"));
    show($("#login-error"));
    setText($("#login-error"), "Email and password are required");
    return;
  }

  setText($("#login-btn"), "Signing in...");
  $("#login-btn").disabled = true;

  const result = await login(email, password);

  setText($("#login-btn"), "Sign In");
  $("#login-btn").disabled = false;

  if (result.ok) {
    showMain(result.user || null);
  } else {
    show($("#login-error"));
    setText($("#login-error"), result.error);
  }
}

async function showMain(initialUser) {
  hide($("#login-view"));
  show($("#main-view"));

  // Instant, network-free paint: current tab + recent saves + cached folders.
  loadCurrentPage();
  renderRecent();
  paintCachedFolders();

  // Single parallel round-trip: verify session AND refresh folders together.
  const [me, folders] = await Promise.all([
    initialUser ? { ok: true, user: initialUser } : apiFetch("/api/auth/me"),
    fetchFolders().catch(() => []),
  ]);

  if (!me.ok) {
    showLogin();
    return;
  }

  const user = me.data?.user || me.user;
  if (user) {
    setText($("#header-user"), `Signed in as ${user.name || "User"}`);
  }
  currentFolders = folders;
  paintFolderOptions();

  if (!listenersBound) {
    listenersBound = true;

    // Tab switching
    $$(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        $$(".tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        $$(".tab-content").forEach((c) => c.classList.add("hidden"));
        $(`#tab-${tab.dataset.tab}`).classList.remove("hidden");

        // Library loads on first visit, then refetches so a just-saved
        // bookmark shows up without reopening the popup.
        if (tab.dataset.tab === "library") {
          bindLibrary();
          void loadLibrary();
        }
      });
    });

    // Tag input
    const tagInput = $("#tag-input");
    tagInput.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === ",") && tagInput.value.trim()) {
        e.preventDefault();
        addTag(tagInput.value.trim().replace(/,/g, ""));
        tagInput.value = "";
      }
      if (e.key === "Backspace" && !tagInput.value && currentTags.length) {
        removeTag(currentTags.length - 1);
      }
    });

    // Save
    $("#save-btn").addEventListener("click", doSave);

    // Logout
    $("#logout-btn").addEventListener("click", async () => {
      await logout();
      showLogin();
    });

    // Refresh
    $("#refresh-btn").addEventListener("click", async () => {
      await loadFolders();
      await loadCurrentPage();
    });
  }
}

function paintFolderOptions() {
  const select = $("#folder-select");
  select.innerHTML = '<option value="">Unsorted</option>';
  currentFolders.forEach((folder) => {
    const opt = document.createElement("option");
    opt.value = folder._id;
    opt.textContent = folder.name;
    select.appendChild(opt);
  });
}

async function paintCachedFolders() {
  const cached = await getFoldersCache();
  if (cached && Array.isArray(cached.folders)) {
    currentFolders = cached.folders;
    paintFolderOptions();
  }
}

async function loadFolders() {
  currentFolders = await fetchFolders();
  paintFolderOptions();
}

async function loadCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      $("#page-title").textContent = tab.title || "Untitled";
      $("#page-url").textContent = tab.url || "";
      const favicon = tab.favIconUrl || `https://www.google.com/s2/favicons?domain=${new URL(tab.url || "https://example.com").hostname}&sz=32`;
      $("#page-favicon").src = favicon;
    }
  } catch {
    setText($("#page-title"), "Unable to get page info");
  }
}

function addTag(tag) {
  if (currentTags.includes(tag)) return;
  currentTags.push(tag);
  renderTags();
}

function removeTag(index) {
  currentTags.splice(index, 1);
  renderTags();
}

function renderTags() {
  const wrap = $("#tag-wrap");
  wrap.querySelectorAll(".tag").forEach((t) => t.remove());
  const input = $("#tag-input");
  currentTags.forEach((tag, i) => {
    const el = document.createElement("span");
    el.className = "tag";
    el.innerHTML = `${tag}<button type="button">&times;</button>`;
    el.querySelector("button").addEventListener("click", () => removeTag(i));
    wrap.insertBefore(el, input);
  });
}

async function doSave() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  hide($("#save-success"));
  hide($("#save-error"));

  setText($("#save-btn"), "Saving...");
  $("#save-btn").disabled = true;

  const result = await saveWebsite({
    url: tab.url,
    folderId: $("#folder-select").value || null,
    tags: currentTags,
    notes: $("#save-notes").value.trim(),
    isFavorite: $("#save-favorite").checked,
  });

  setText($("#save-btn"), "Save to Wesite");
  $("#save-btn").disabled = false;

  if (result.ok) {
    show($("#save-success"));
    setText($("#save-success"), `"${result.website?.title || tab.url}" saved!`);
    currentTags = [];
    renderTags();
    $("#save-notes").value = "";
    $("#save-favorite").checked = false;
    renderRecent();
  } else {
    show($("#save-error"));
    setText($("#save-error"), result.error);
  }
}

async function renderRecent() {
  const recent = await getRecent();
  const list = $("#recent-list");

  if (!recent.length) {
    list.innerHTML = '<div class="empty-state">No recent saves yet.</div>';
    return;
  }

  list.innerHTML = recent.map((item) => `
    <a href="${item.url}" target="_blank" class="recent-item" style="text-decoration:none;color:inherit;">
      <img class="favicon" src="${item.faviconUrl || `https://www.google.com/s2/favicons?domain=${item.domain}&sz=16`}" alt="" onerror="this.style.display='none'" />
      <div class="recent-info">
        <div class="recent-title">${escapeHtml(item.title || item.domain || item.url)}</div>
        <div class="recent-domain">${escapeHtml(item.domain || item.url)}</div>
      </div>
    </a>
  `).join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
