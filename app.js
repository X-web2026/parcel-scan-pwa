const STORAGE_KEYS = {
  records: "parcel-scan-records",
  settings: "parcel-scan-settings",
  profile: "parcel-scan-profile",
  language: "parcel-scan-language",
  cleanupDate: "parcel-scan-cleanup-date",
};

const RETENTION_DAYS = 365;

const DEFAULT_SUPABASE_SETTINGS = {
  mode: "supabase",
  supabaseUrl: "https://xwmlfvzdtwcdfrasmvkv.supabase.co",
  supabaseKey: "sb_publishable_CWpneJ0Z6wCgPqn1uyfa4w_3KyZ8abU",
};

const state = {
  records: [],
  settings: loadJson(STORAGE_KEYS.settings, DEFAULT_SUPABASE_SETTINGS),
  profile: loadJson(STORAGE_KEYS.profile, { operator: "" }),
  language: localStorage.getItem(STORAGE_KEYS.language) || "zh",
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
  languageSelect: document.querySelector("#languageSelect"),
  retentionNote: document.querySelector("#retentionNote"),
  versionText: document.querySelector("#versionText"),
};

const translations = {
  zh: {
    htmlLang: "zh-CN",
    title: "快递扫描记录",
    eyebrow: "PDA + Web",
    appTitle: "快递扫描记录",
    starting: "启动中",
    lanSync: "局域网同步",
    cloudSync: "云端同步",
    localMode: "本地模式",
    scanTab: "扫描",
    recordsTab: "记录",
    scanEyebrow: "连续扫描",
    scanTitle: "PDA 扫码录入",
    installTitle: "安装到桌面",
    trackingLabel: "运单号",
    trackingPlaceholder: "请扫描或输入运单号",
    operatorLabel: "扫描人员",
    operatorPlaceholder: "请选择扫描人员",
    saveButton: "保存记录",
    clearButton: "清空",
    scanHelper: "PDA 扫码头输入后会自动保存；如果设备发送回车，也会立即保存。",
    todayCount: "今日扫描",
    totalCount: "总记录",
    duplicateCount: "重复提醒",
    retentionNote: "仅保留最近 365 天数据",
    noRecords: "暂无扫描记录",
    latestPrefix: "最近",
    recordsEyebrow: "Web 后台",
    recordsTitle: "记录查询",
    refreshButton: "刷新记录",
    exportButton: "导出 CSV",
    searchPlaceholder: "搜索运单号、扫描人员",
    resetButton: "重置",
    trackingHeader: "运单号",
    timeHeader: "时间",
    operatorHeader: "扫描人员",
    statusHeader: "状态",
    emptyState: "暂无记录",
    ok: "正常",
    duplicate: "重复",
    settingsTitle: "连接设置",
    testConnectionButton: "测试连接",
    saveSettingsButton: "保存设置",
    localModeButton: "使用本地模式",
    settingsHelper: "日常使用不需要进入设置；只有更换 Supabase 项目或临时切回本地模式时才需要修改这里。",
    version: "版本：Cloud v3",
    scanFirst: "请先扫描或输入运单号",
    chooseOperator: "请先选择扫描人员",
    saved: "已保存",
    saveFailed: "保存失败",
    localApiFallback: "局域网同步暂不可用，正在尝试云端同步",
    cloudFallback: "云端同步暂不可用，已显示本地缓存",
    refreshed: "已刷新，共 {count} 条记录",
    settingsMissing: "请填写 Supabase URL 和 Anon Key",
    settingsSaved: "已保存 Supabase 设置",
    switchedLocal: "已切换到本地模式",
    connected: "连接成功",
    connectFailed: "连接失败",
    installHint: "浏览器菜单里也可以选择添加到主屏幕",
    cleanupDone: "已清理 {count} 条超过 365 天的记录",
    csvHeaders: ["运单号", "时间", "扫描人员", "状态"],
  },
  en: {
    htmlLang: "en",
    title: "Parcel Scan Records",
    eyebrow: "PDA + Web",
    appTitle: "Parcel Scan Records",
    starting: "Starting",
    lanSync: "LAN Sync",
    cloudSync: "Cloud Sync",
    localMode: "Local Mode",
    scanTab: "Scan",
    recordsTab: "Records",
    scanEyebrow: "Continuous Scan",
    scanTitle: "PDA Scan Entry",
    installTitle: "Install app",
    trackingLabel: "Tracking Number",
    trackingPlaceholder: "Scan or enter tracking number",
    operatorLabel: "Scanner",
    operatorPlaceholder: "Select scanner",
    saveButton: "Save",
    clearButton: "Clear",
    scanHelper: "The PDA scanner saves automatically after input. If it sends Enter, it saves immediately.",
    todayCount: "Today",
    totalCount: "Total",
    duplicateCount: "Duplicates",
    retentionNote: "Only the latest 365 days are kept",
    noRecords: "No scan records yet",
    latestPrefix: "Latest",
    recordsEyebrow: "Web Console",
    recordsTitle: "Record Search",
    refreshButton: "Refresh",
    exportButton: "Export CSV",
    searchPlaceholder: "Search tracking number or scanner",
    resetButton: "Reset",
    trackingHeader: "Tracking Number",
    timeHeader: "Time",
    operatorHeader: "Scanner",
    statusHeader: "Status",
    emptyState: "No records",
    ok: "OK",
    duplicate: "Duplicate",
    settingsTitle: "Connection Settings",
    testConnectionButton: "Test",
    saveSettingsButton: "Save Settings",
    localModeButton: "Use Local Mode",
    settingsHelper: "Daily scanning does not need settings. Change this only when switching Supabase or local mode.",
    version: "Version: Cloud v3",
    scanFirst: "Scan or enter a tracking number first",
    chooseOperator: "Select a scanner first",
    saved: "Saved",
    saveFailed: "Save failed",
    localApiFallback: "LAN sync unavailable. Trying cloud sync.",
    cloudFallback: "Cloud sync unavailable. Showing local cache.",
    refreshed: "Refreshed, {count} records",
    settingsMissing: "Enter Supabase URL and Anon Key",
    settingsSaved: "Supabase settings saved",
    switchedLocal: "Switched to local mode",
    connected: "Connected",
    connectFailed: "Connection failed",
    installHint: "You can also add it to home screen from the browser menu",
    cleanupDone: "Cleaned {count} records older than 365 days",
    csvHeaders: ["Tracking Number", "Time", "Scanner", "Status"],
  },
  th: {
    htmlLang: "th",
    title: "บันทึกสแกนพัสดุ",
    eyebrow: "PDA + Web",
    appTitle: "บันทึกสแกนพัสดุ",
    starting: "กำลังเริ่ม",
    lanSync: "ซิงก์ LAN",
    cloudSync: "ซิงก์คลาวด์",
    localMode: "โหมดในเครื่อง",
    scanTab: "สแกน",
    recordsTab: "รายการ",
    scanEyebrow: "สแกนต่อเนื่อง",
    scanTitle: "บันทึกจาก PDA",
    installTitle: "ติดตั้ง",
    trackingLabel: "เลขพัสดุ",
    trackingPlaceholder: "สแกนหรือกรอกเลขพัสดุ",
    operatorLabel: "ผู้สแกน",
    operatorPlaceholder: "เลือกผู้สแกน",
    saveButton: "บันทึก",
    clearButton: "ล้าง",
    scanHelper: "เมื่อ PDA ใส่ข้อมูลแล้ว ระบบจะบันทึกอัตโนมัติ หากเครื่องส่ง Enter จะบันทึกทันที",
    todayCount: "วันนี้",
    totalCount: "ทั้งหมด",
    duplicateCount: "ซ้ำ",
    retentionNote: "เก็บเฉพาะข้อมูล 365 วันล่าสุด",
    noRecords: "ยังไม่มีรายการสแกน",
    latestPrefix: "ล่าสุด",
    recordsEyebrow: "เว็บจัดการ",
    recordsTitle: "ค้นหารายการ",
    refreshButton: "รีเฟรช",
    exportButton: "ส่งออก CSV",
    searchPlaceholder: "ค้นหาเลขพัสดุหรือผู้สแกน",
    resetButton: "รีเซ็ต",
    trackingHeader: "เลขพัสดุ",
    timeHeader: "เวลา",
    operatorHeader: "ผู้สแกน",
    statusHeader: "สถานะ",
    emptyState: "ไม่มีรายการ",
    ok: "ปกติ",
    duplicate: "ซ้ำ",
    settingsTitle: "ตั้งค่าการเชื่อมต่อ",
    testConnectionButton: "ทดสอบ",
    saveSettingsButton: "บันทึกตั้งค่า",
    localModeButton: "ใช้โหมดในเครื่อง",
    settingsHelper: "การใช้งานทั่วไปไม่ต้องเข้าเมนูตั้งค่า ใช้เมื่อเปลี่ยน Supabase หรือโหมดในเครื่องเท่านั้น",
    version: "เวอร์ชัน: Cloud v3",
    scanFirst: "กรุณาสแกนหรือกรอกเลขพัสดุก่อน",
    chooseOperator: "กรุณาเลือกผู้สแกนก่อน",
    saved: "บันทึกแล้ว",
    saveFailed: "บันทึกไม่สำเร็จ",
    localApiFallback: "ซิงก์ LAN ใช้ไม่ได้ กำลังลองซิงก์คลาวด์",
    cloudFallback: "ซิงก์คลาวด์ใช้ไม่ได้ แสดงข้อมูลแคช",
    refreshed: "รีเฟรชแล้ว ทั้งหมด {count} รายการ",
    settingsMissing: "กรุณากรอก Supabase URL และ Anon Key",
    settingsSaved: "บันทึกการตั้งค่า Supabase แล้ว",
    switchedLocal: "เปลี่ยนเป็นโหมดในเครื่องแล้ว",
    connected: "เชื่อมต่อสำเร็จ",
    connectFailed: "เชื่อมต่อไม่สำเร็จ",
    installHint: "สามารถเพิ่มไปยังหน้าจอหลักจากเมนูเบราว์เซอร์ได้",
    cleanupDone: "ลบข้อมูลเก่ากว่า 365 วันแล้ว {count} รายการ",
    csvHeaders: ["เลขพัสดุ", "เวลา", "ผู้สแกน", "สถานะ"],
  },
};

init();

async function init() {
  bindEvents();
  loadProfile();
  loadSettingsForm();
  applyLanguage();
  state.apiAvailable = await detectLocalApi();
  updateStatus();
  await loadRecords();
  render();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((trigger) => {
    trigger.addEventListener("click", async () => {
      setActiveView(trigger.dataset.view);
      if (trigger.dataset.view === "recordsView") {
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
  els.languageSelect.addEventListener("change", () => {
    state.language = els.languageSelect.value;
    localStorage.setItem(STORAGE_KEYS.language, state.language);
    applyLanguage();
    render();
  });

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

function t(key, params = {}) {
  const value = translations[state.language]?.[key] ?? translations.zh[key] ?? key;
  if (typeof value !== "string") return value;
  return Object.entries(params).reduce((text, [name, replacement]) => {
    return text.replace(`{${name}}`, String(replacement));
  }, value);
}

function applyLanguage() {
  const dictionary = translations[state.language] || translations.zh;
  document.documentElement.lang = dictionary.htmlLang;
  document.title = dictionary.title;
  els.languageSelect.value = state.language;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = t(key);
  });
  els.trackingInput.placeholder = t("trackingPlaceholder");
  els.searchInput.placeholder = t("searchPlaceholder");
  els.installButton.title = t("installTitle");
  els.installButton.setAttribute("aria-label", t("installTitle"));
  els.versionText.textContent = t("version");
  els.retentionNote.textContent = t("retentionNote");
  updateStatus();
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

  if (!trackingNumber) {
    showToast(t("scanFirst"));
    els.trackingInput.focus();
    return;
  }

  if (!operator) {
    showToast(t("chooseOperator"));
    els.operatorInput.focus();
    return;
  }

  state.profile = { operator };
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(state.profile));

  const duplicate = state.records.some((record) => normalizeTrackingNumber(record.tracking_number) === trackingNumber);
  const record = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    tracking_number: trackingNumber,
    operator,
    site: "",
    note: "",
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
    showToast(duplicate ? `${t("duplicate")}：${trackingNumber}` : `${t("saved")}：${trackingNumber}`);
    els.trackingInput.value = "";
    els.trackingInput.focus();
  } catch (error) {
    showToast(`${t("saveFailed")}：${error.message}`);
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
  await cleanupExpiredRecords();
  state.records = loadJson(STORAGE_KEYS.records, []);
  if (state.apiAvailable) {
    try {
      state.records = await apiRequest("/api/scans");
      saveLocalRecords();
      return;
    } catch (error) {
      state.apiAvailable = false;
      updateStatus();
      showToast(t("localApiFallback"));
    }
  }

  if (!isSupabaseMode()) return;

  try {
    const remoteRecords = await supabaseRequest("/rest/v1/parcel_scans?select=*&order=created_at.desc&limit=1000");
    state.records = remoteRecords;
    saveLocalRecords();
  } catch (error) {
    showToast(t("cloudFallback"));
  }
}

async function refreshRecords(options = {}) {
  await loadRecords();
  render();
  if (!options.silent) {
    showToast(t("refreshed", { count: state.records.length }));
  }
}

async function cleanupExpiredRecords() {
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem(STORAGE_KEYS.cleanupDate) === today) return;

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  if (state.apiAvailable) {
    return;
  }

  if (isSupabaseMode()) {
    try {
      const removed = await supabaseRequest(
        `/rest/v1/parcel_scans?created_at=lt.${encodeURIComponent(cutoff)}&select=id`,
        { method: "DELETE", headers: { Prefer: "return=representation" } },
      );
      if (removed?.length) {
        showToast(t("cleanupDone", { count: removed.length }));
      }
      localStorage.setItem(STORAGE_KEYS.cleanupDate, today);
    } catch {
      // Cleanup is best-effort; lack of delete permission should not block scanning.
    }
    return;
  }

  const localRecords = loadJson(STORAGE_KEYS.records, []);
  const freshRecords = localRecords.filter((record) => !record.created_at || record.created_at >= cutoff);
  if (freshRecords.length !== localRecords.length) {
    localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(freshRecords));
  }
  localStorage.setItem(STORAGE_KEYS.cleanupDate, today);
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
    ? `${t("latestPrefix")}：${latest.tracking_number}，${formatDate(latest.created_at)}`
    : t("noRecords");
}

function renderRecords() {
  const keyword = els.searchInput.value.trim().toLowerCase();
  const date = els.dateInput.value;
  const records = state.records.filter((record) => {
    const haystack = [record.tracking_number, record.operator].join(" ").toLowerCase();
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
      <td><span class="badge ${record.is_duplicate ? "duplicate" : "ok"}">${record.is_duplicate ? t("duplicate") : t("ok")}</span></td>
    </tr>
  `,
    )
    .join("");
  els.emptyState.classList.toggle("is-visible", records.length === 0);
}

function exportCsv() {
  const header = t("csvHeaders");
  const rows = state.records.map((record) => [
    record.tracking_number,
    formatDate(record.created_at),
    record.operator || "",
    record.is_duplicate ? t("duplicate") : t("ok"),
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
    showToast(t("settingsMissing"));
    return;
  }
  state.settings = { mode: "supabase", supabaseUrl, supabaseKey };
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
  updateStatus();
  showToast(t("settingsSaved"));
  loadRecords().then(render);
}

function useLocalMode() {
  state.settings = { mode: "local", supabaseUrl: "", supabaseKey: "" };
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
  loadSettingsForm();
  updateStatus();
  showToast(t("switchedLocal"));
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
    showToast(t("connected"));
  } catch (error) {
    showToast(`${t("connectFailed")}：${error.message}`);
  } finally {
    state.settings = previous;
  }
}

async function installPwa() {
  if (!state.deferredPrompt) {
    showToast(t("installHint"));
    return;
  }
  state.deferredPrompt.prompt();
  await state.deferredPrompt.userChoice;
  state.deferredPrompt = null;
}

function loadProfile() {
  els.operatorInput.value = state.profile.operator || "";
}

function loadSettingsForm() {
  els.supabaseUrlInput.value = state.settings.supabaseUrl || "";
  els.supabaseKeyInput.value = state.settings.supabaseKey || "";
}

function updateStatus() {
  if (state.apiAvailable) {
    els.syncStatus.textContent = t("lanSync");
    return;
  }
  els.syncStatus.textContent = isSupabaseMode() ? t("cloudSync") : t("localMode");
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
  const locale = { zh: "zh-CN", en: "en-US", th: "th-TH" }[state.language] || "zh-CN";
  return new Intl.DateTimeFormat(locale, {
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
