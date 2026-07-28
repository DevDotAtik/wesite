const API_STORAGE_KEY = "wesite_api_url";
const TOKEN_STORAGE_KEY = "wesite_token";
const RECENT_KEY = "wesite_recent";

function getApiBase() {
  return new Promise((resolve) => {
    chrome.storage.local.get(API_STORAGE_KEY, (result) => {
      resolve(result[API_STORAGE_KEY] || "http://localhost:3000");
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
  } catch (err) {
    return { ok: false, error: "Cannot reach server. Check the Wesite URL." };
  }
}

async function fetchFolders() {
  const result = await apiFetch("/api/folders");
  if (result.ok) {
    return result.data?.flatFolders || [];
  }
  return [];
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

async function checkAuth() {
  const token = await getToken();
  if (!token) return false;
  const result = await apiFetch("/api/auth/me");
  return result.ok;
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

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  // Check if first time - show login
  const token = await getToken();
  if (!token) {
    showLogin();
    return;
  }

  // Verify token still valid
  const valid = await checkAuth();
  if (!valid) {
    showLogin();
    return;
  }

  showMain();
});

function showLogin() {
  show($("#login-view"));
  hide($("#main-view"));

  const savedUrl = chrome.storage.local.get(API_STORAGE_KEY, (r) => {
    const url = r[API_STORAGE_KEY] || "http://localhost:3000";
    $("#api-url").value = url;
  });

  $("#open-register").addEventListener("click", () => {
    getApiBase().then((base) => chrome.tabs.create({ url: `${base}/register` }));
  });

  $("#login-btn").addEventListener("click", doLogin);
  $("#login-password").addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });
  $("#login-email").addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });
});

async function doLogin() {
  const email = $("#login-email").value.trim();
  const password = $("#login-password").value;
  const apiUrl = $("#api-url").value.trim().replace(/\/+$/, "");

  if (!email || !password) {
    hide($("#login-error"));
    show($("#login-error"));
    setText($("#login-error"), "Email and password are required");
    return;
  }

  if (apiUrl) {
    await new Promise((resolve) => chrome.storage.local.set({ [API_STORAGE_KEY]: apiUrl }, resolve));
  }

  setText($("#login-btn"), "Signing in...");
  $("#login-btn").disabled = true;

  const result = await login(email, password);

  setText($("#login-btn"), "Sign In");
  $("#login-btn").disabled = false;

  if (result.ok) {
    showMain();
  } else {
    show($("#login-error"));
    setText($("#login-error"), result.error);
  }
}

async function showMain() {
  hide($("#login-view"));
  show($("#main-view"));

  const user = await apiFetch("/api/auth/me");
  if (user.ok) {
    setText($("#header-user"), `Signed in as ${user.data?.user?.name || "User"}`);
  }

  loadFolders();
  loadCurrentPage();
  renderRecent();

  // Tab switching
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      $$(".tab-content").forEach((c) => c.classList.add("hidden"));
      $(`#tab-${tab.dataset.tab}`).classList.remove("hidden");
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

async function loadFolders() {
  currentFolders = await fetchFolders();
  const select = $("#folder-select");
  select.innerHTML = '<option value="">Unsorted</option>';
  currentFolders.forEach((folder) => {
    const opt = document.createElement("option");
    opt.value = folder._id;
    opt.textContent = folder.name;
    select.appendChild(opt);
  });
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
