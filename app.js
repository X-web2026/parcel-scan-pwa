const STORAGE_KEYS = {
  records: "parcel-scan-records",
  settings: "parcel-scan-settings",
  profile: "parcel-scan-profile",
};

const DEFAULT_SUPABASE_SETTINGS = {
  mode: "supabase",
  supabaseUrl: "https://xwmlfvzdtwcdfrasmvkv.supabase.co",
  supabaseKey: "sb_publishable_CWpneJ0Z6wCgPqn1uyfa4w_3KyZ8abU",
};

const state = {
  records: [],
  settings: loadJson(STORAGE_KEYS.settings, DEFAULT_SUPABASE_SETTINGS),
  profile: loadJson(STORAGE_KEYS.profile, { operator: "", site: "" }),
  deferredPrompt: null,
  apiAvailable: false,
  scanTimer: null,
  isSaving: false,
  lastSeenScanValue: "",
  stableScanValue: "",
  stableScanTicks: 0,
};

const els = {
  tabs: document.querySelectorAll(".tab"),
  views: document.querySelectorAll(".view"),
  scanForm: document.querySelector("#scanForm"),
  trackingInput: document.querySelector("#trackingInput"),
  operatorInput: document.querySelector("#operatorInput"),
  siteInput: document.querySelector("#siteInput"),
  noteInput: document.querySelector("#noteInput"),
  clearScanButton: document.querySelector("#clearScanButton"),
  todayCount: document.querySelector("#todayCount"),
  totalCount: document.querySelector("#totalCount"),
  duplicateCount: document.querySelector("#duplicateCount"),
  lastScan: document.querySelector("#lastScan"),
  recordsBody: document.querySelector("#recordsBody"),
  searchInput: document.querySelector("#searchInput"),
  dateInput: document.querySelector("#dateInput"),
  refreshButton: document.querySelector("#refreshButton"),
  resetFiltersButton: document.querySelector("#resetFiltersButton"),
  exportButton: document.querySelector("#exportButton"),
  emptyState: document.querySelector("#emptyState"),
  toast: document.querySelector("#toast"),
  syncStatus: document.querySelector("#syncStatus"),
  supabaseUrlInput: document.querySelector("#supabaseUrlInput"),
  supabaseKeyInput: document.querySelector("#supabaseKeyInput"),
  saveSettingsButton: document.querySelector("#saveSettingsButton"),
  useLocalButton: document.querySelector("#useLocalButton"),
  testConnectionButton: document.querySelector("#testConnectionButton"),
  installButton: document.querySelector("#installButton"),
};

init();

async function init() {
  bindEvents();
  loadProfile();
  loadSettingsForm();
  state.apiAvailable = await detectLocalApi();
  updateStatus();
  await loadRecords();
  render();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

function bindEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener("click", async () => {
      setActiveView(tab.dataset.view);
      if (tab.dataset.view === "recordsView") {
        await refreshRecords();
      }
    });
  });

  els.scanForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveScan();
  });

  els.trackingInput.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      clearTimeout(state.scanTimer);
      await saveScan();
    }
  });
  els.trackingInput.addEventListener("input", scheduleAutoSave);

  els.clearScanButton.addEventListener("click", () => {
    els.trackingInput.value = "";
    els.noteInput.value = "";
    els.trackingInput.focus();
  });

  [els.searchInput, els.dateInput].forEach((input) => input.addEventListener("input", renderRecords));
  els.refreshButton.addEventListener("click", refreshRecords);
  els.resetFiltersButton.addEventListener("click", () => {
    els.searchInput.value = "";
    els.dateInput.value = "";
    renderRecords();
  });
  els.exportButton.addEventListener("click", exportCsv);
  els.saveSettingsButton.addEventListener("click", saveSettings);
  els.useLocalButton.addEventListener("click", useLocalMode);
  els.testConnectionButton.addEventListener("click", testConnection);
  els.installButton.addEventListener("click", installPwa);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredPrompt = event;
  });

  window.setInterval(() => {
    if (document.querySelector("#recordsView").classList.contains("is-active")) {
      refreshRecords({ silent: true });
    }
  }, 4000);

  window.setInterval(checkScannerInput, 250);
}

function setActiveView(viewId) {
  els.tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.view === viewId));
  els.views.forEach((view) => view.classList.toggle("is-active", view.id === viewId));
  if (viewId === "scanView") {
    setTimeout(() => els.trackingInput.focus(), 40);
  }
}

async function saveScan() {
  if (state.isSaving) return;
  const trackingNumber = normalizeTrackingNumber(els.trackingInput.value);
  const operator = els.operatorInput.value.trim();
  const site = els.siteInput.value.trim();
  const note = els.noteInput.value.trim();

  if (!trackingNumber) {
    showToast("请先扫描或输入运单号");
    els.trackingInput.focus();
    return;
  }

  state.profile = { operator, site };
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(state.profile));

  const duplicate = state.records.some((record) => normalizeTrackingNumber(record.tracking_number) === trackingNumber);
  const record = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    tracking_number: trackingNumber,
    operator,
    site,
    note,
    is_duplicate: duplicate,
    created_at: new Date().toISOString(),
  };

  try {
    state.isSaving = true;
    if (state.apiAvailable) {
      await apiRequest("/api/scans", {
        method: "POST",
        body: JSON.stringify(record),
      });
    } else if (isSupabaseMode()) {
      await supabaseRequest("/rest/v1/parcel_scans", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(record),
      });
    }
    state.records.unshift(record);
    saveLocalRecords();
    render();
    showToast(duplicate ? `重复运单号：${trackingNumber}` : `已保存：${trackingNumber}`);
    els.trackingInput.value = "";
    els.noteInput.value = "";
    els.trackingInput.focus();
  } catch (error) {
    showToast(`保存失败：${error.message}`);
  } finally {
    state.isSaving = false;
  }
}

function scheduleAutoSave() {
  clearTimeout(state.scanTimer);
  const value = normalizeTrackingNumber(els.trackingInput.value);
  if (value.length < 6) return;
  state.scanTimer = setTimeout(() => {
    saveScan();
  }, 650);
}

function checkScannerInput() {
  if (document.activeElement !== els.trackingInput || state.isSaving) return;

  const value = normalizeTrackingNumber(els.trackingInput.value);
  if (value.length < 6) {
    state.lastSeenScanValue = value;
    state.stableScanValue = value;
    state.stableScanTicks = 0;
    return;
  }

  if (value !== state.lastSeenScanValue) {
    state.lastSeenScanValue = value;
    state.stableScanValue = value;
    state.stableScanTicks = 0;
    return;
  }

  if (value === state.stableScanValue) {
    state.stableScanTicks += 1;
  } else {
    state.stableScanValue = value;
    state.stableScanTicks = 0;
  }

  if (state.stableScanTicks >= 3) {
    clearTimeout(state.scanTimer);
    state.stableScanTicks = 0;
    saveScan();
  }
}

async function loadRecords() {
  state.records = loadJson(STORAGE_KEYS.records, []);
  if (state.apiAvailable) {
    try {
      state.records = await apiRequest("/api/scans");
      saveLocalRecords();
      return;
    } catch (error) {
      state.apiAvailable = false;
      updateStatus();
      showToast("局域网同步暂不可用，正在尝试云端同步");
    }
  }

  if (!isSupabaseMode()) return;

  try {
    const remoteRecords = await supabaseRequest("/rest/v1/parcel_scans?select=*&order=created_at.desc&limit=1000");
    state.records = remoteRecords;
    saveLocalRecords();
  } catch (error) {
      showToast("云端同步暂不可用，已显示本地缓存");
  }
}

async function refreshRecords(options = {}) {
  await loadRecords();
  render();
  if (!options.silent) {
    showToast(`已刷新，共 ${state.records.length} 条记录`);
  }
}

function render() {
  renderStats();
  renderRecords();
}

function renderStats() {
  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = state.records.filter((record) => record.created_at?.slice(0, 10) === today);
  const duplicates = state.records.filter((record) => record.is_duplicate);
  els.todayCount.textContent = todayRecords.length;
  els.totalCount.textContent = state.records.length;
  els.duplicateCount.textContent = duplicates.length;

  const latest = state.records[0];
  els.lastScan.textContent = latest
    ? `最近：${latest.tracking_number}，${formatDate(latest.created_at)}`
    : "暂无扫描记录";
}

function renderRecords() {
  const keyword = els.searchInput.value.trim().toLowerCase();
  const date = els.dateInput.value;
  const records = state.records.filter((record) => {
    const haystack = [record.tracking_number, record.operator, record.site, record.note].join(" ").toLowerCase();
    const matchesKeyword = !keyword || haystack.includes(keyword);
    const matchesDate = !date || record.created_at?.slice(0, 10) === date;
    return matchesKeyword && matchesDate;
  });

  els.recordsBody.innerHTML = records
    .map(
      (record) => `
        <tr>
          <td><strong>${escapeHtml(record.tracking_number)}</strong></td>
          <td>${escapeHtml(formatDate(record.created_at))}</td>
          <td>${escapeHtml(record.operator || "-")}</td>
          <td>${escapeHtml(record.site || "-")}</td>
          <td><span class="badge ${record.is_duplicate ? "duplicate" : "ok"}">${record.is_duplicate ? "重复" : "正常"}</span></td>
          <td>${escapeHtml(record.note || "-")}</td>
        </tr>
      `,
    )
    .join("");
  els.emptyState.classList.toggle("is-visible", records.length === 0);
}

function exportCsv() {
  const header = ["运单号", "时间", "操作人", "站点", "状态", "备注"];
  const rows = state.records.map((record) => [
    record.tracking_number,
    formatDate(record.created_at),
    record.operator || "",
    record.site || "",
    record.is_duplicate ? "重复" : "正常",
    record.note || "",
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `parcel-scans-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function saveSettings() {
  const supabaseUrl = els.supabaseUrlInput.value.trim().replace(/\/$/, "");
  const supabaseKey = els.supabaseKeyInput.value.trim();
  if (!supabaseUrl || !supabaseKey) {
    showToast("请填写 Supabase URL 和 Anon Key");
    return;
  }
  state.settings = { mode: "supabase", supabaseUrl, supabaseKey };
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
  updateStatus();
  showToast("已保存 Supabase 设置");
  loadRecords().then(render);
}

function useLocalMode() {
  state.settings = { mode: "local", supabaseUrl: "", supabaseKey: "" };
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
  loadSettingsForm();
  updateStatus();
  showToast("已切换到本地模式");
}

async function testConnection() {
  const previous = state.settings;
  state.settings = {
    mode: "supabase",
    supabaseUrl: els.supabaseUrlInput.value.trim().replace(/\/$/, ""),
    supabaseKey: els.supabaseKeyInput.value.trim(),
  };
  try {
    await supabaseRequest("/rest/v1/parcel_scans?select=id&limit=1");
    showToast("连接成功");
  } catch (error) {
    showToast(`连接失败：${error.message}`);
  } finally {
    state.settings = previous;
  }
}

async function installPwa() {
  if (!state.deferredPrompt) {
    showToast("浏览器菜单里也可以选择添加到主屏幕");
    return;
  }
  state.deferredPrompt.prompt();
  await state.deferredPrompt.userChoice;
  state.deferredPrompt = null;
}

function loadProfile() {
  els.operatorInput.value = state.profile.operator || "";
  els.siteInput.value = state.profile.site || "";
}

function loadSettingsForm() {
  els.supabaseUrlInput.value = state.settings.supabaseUrl || "";
  els.supabaseKeyInput.value = state.settings.supabaseKey || "";
}

function updateStatus() {
  if (state.apiAvailable) {
    els.syncStatus.textContent = "局域网同步";
    return;
  }
  els.syncStatus.textContent = isSupabaseMode() ? "云端同步" : "本地模式";
}

function isSupabaseMode() {
  return state.settings.mode === "supabase" && state.settings.supabaseUrl && state.settings.supabaseKey;
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${state.settings.supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: state.settings.supabaseKey,
      Authorization: `Bearer ${state.settings.supabaseKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }

  if (response.status === 204) return null;
  return response.json();
}

async function detectLocalApi() {
  try {
    const health = await apiRequest("/api/health");
    return health?.ok === true;
  } catch {
    return false;
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }

  return response.json();
}

function saveLocalRecords() {
  localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(state.records));
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function normalizeTrackingNumber(value) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("is-visible"), 2600);
}

function csvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
