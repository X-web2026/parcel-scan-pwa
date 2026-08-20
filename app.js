const STORAGE_KEYS = {
  records: "parcel-scan-records",
  settings: "parcel-scan-settings",
  profile: "parcel-scan-profile",
  language: "parcel-scan-language",
  cleanupDate: "parcel-scan-cleanup-date",
  lastScanStatus: "parcel-scan-last-status",
  pendingRecords: "parcel-scan-pending-records",
};

const RECORD_PAGE_SIZE = 500;
const EXPORT_BATCH_SIZE = 1000;
const RETENTION_DAYS = 365;
const OPERATORS = ["Agate", "Far", "Tam", "Gig"];

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
  apiAvailable: false,
  scanTimer: null,
  isSaving: false,
  lastSeenScanValue: "",
  stableScanValue: "",
  stableScanTicks: 0,
  latestScanStatus: loadJson(STORAGE_KEYS.lastScanStatus, null),
  pendingRecords: loadJson(STORAGE_KEYS.pendingRecords, []),
  recordPage: 0,
  hasNextPage: false,
  totalMatchingRecords: 0,
  summaryCounts: { today: 0, total: 0, duplicates: 0 },
};

const els = {
  tabs: document.querySelectorAll(".tab"),
  views: document.querySelectorAll(".view"),
  scanForm: document.querySelector("#scanForm"),
  trackingInput: document.querySelector("#trackingInput"),
  operatorInput: document.querySelector("#operatorInput"),
  todayCount: document.querySelector("#todayCount"),
  totalCount: document.querySelector("#totalCount"),
  duplicateCount: document.querySelector("#duplicateCount"),
  latestScanBanner: document.querySelector("#latestScanBanner"),
  latestTrackingValue: document.querySelector("#latestTrackingValue"),
  latestTimeValue: document.querySelector("#latestTimeValue"),
  latestStatusValue: document.querySelector("#latestStatusValue"),
  lastScan: document.querySelector("#lastScan"),
  recordsBody: document.querySelector("#recordsBody"),
  searchInput: document.querySelector("#searchInput"),
  dateInput: document.querySelector("#dateInput"),
  refreshButton: document.querySelector("#refreshButton"),
  resetFiltersButton: document.querySelector("#resetFiltersButton"),
  exportButton: document.querySelector("#exportButton"),
  prevPageButton: document.querySelector("#prevPageButton"),
  nextPageButton: document.querySelector("#nextPageButton"),
  pageInfo: document.querySelector("#pageInfo"),
  emptyState: document.querySelector("#emptyState"),
  toast: document.querySelector("#toast"),
  syncStatus: document.querySelector("#syncStatus"),
  supabaseUrlInput: document.querySelector("#supabaseUrlInput"),
  supabaseKeyInput: document.querySelector("#supabaseKeyInput"),
  saveSettingsButton: document.querySelector("#saveSettingsButton"),
  useLocalButton: document.querySelector("#useLocalButton"),
  testConnectionButton: document.querySelector("#testConnectionButton"),
  languageSelect: document.querySelector("#languageSelect"),
  versionText: document.querySelector("#versionText"),
};

const translations = {
  zh: {
    htmlLang: "zh-CN",
    title: "快递扫描记录",
    eyebrow: "PDA + Web",
    appTitle: "快递扫描记录",
    starting: "启动中",
    lanSync: "局域网",
    cloudSync: "云端",
    localMode: "本地",
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
    scanHelper: "PDA 扫码头输入后会自动保存；如果设备发送回车，也会立即保存。",
    todayCount: "今日扫描",
    totalCount: "总记录",
    duplicateCount: "重复提醒",
    noRecords: "暂无扫描记录",
    latestScanTitle: "最近扫描",
    latestTimeLabel: "时间",
    latestStatusLabel: "状态",
    latestScanIdle: "等待扫描",
    scanStatusCloudSaved: "云端已保存",
    scanStatusLocalSaved: "本地已保存",
    scanStatusDuplicateSaved: "重复，已保存",
    scanStatusFailed: "保存失败",
    scanStatusPendingUpload: "待上传",
    pendingUpload: "待上传 {count}",
    pendingSaved: "已保存本机，等待上传",
    pendingUploaded: "已上传 {count} 条待传记录",
    pendingUploadFailed: "还有 {count} 条待上传",
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
    version: "版本：Cloud v13",
    scanFirst: "请先扫描或输入运单号",
    chooseOperator: "请先选择扫描人员",
    saved: "已保存",
    saveFailed: "保存失败",
    localApiFallback: "局域网同步暂不可用，正在尝试云端同步",
    cloudFallback: "云端同步暂不可用，已显示本地缓存",
    refreshed: "已刷新，本页 {count} 条记录",
    prevPage: "上一页",
    nextPage: "下一页",
    pageInfo: "第 {page} / {pages} 页，共 {total} 条",
    settingsMissing: "请填写 Supabase URL 和 Anon Key",
    settingsSaved: "已保存 Supabase 设置",
    switchedLocal: "已切换到本地模式",
    connected: "连接成功",
    connectFailed: "连接失败",
    installHint: "浏览器菜单里也可以选择添加到主屏幕",
    csvHeaders: ["运单号", "时间", "扫描人员", "状态"],
  },
  en: {
    htmlLang: "en",
    title: "Parcel Scan Records",
    eyebrow: "PDA + Web",
    appTitle: "Parcel Scan Records",
    starting: "Starting",
    lanSync: "LAN",
    cloudSync: "Cloud",
    localMode: "Local",
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
    scanHelper: "The PDA scanner saves automatically after input. If it sends Enter, it saves immediately.",
    todayCount: "Today",
    totalCount: "Total",
    duplicateCount: "Duplicates",
    noRecords: "No scan records yet",
    latestScanTitle: "Latest Scan",
    latestTimeLabel: "Time",
    latestStatusLabel: "Status",
    latestScanIdle: "Waiting",
    scanStatusCloudSaved: "Saved to cloud",
    scanStatusLocalSaved: "Saved locally",
    scanStatusDuplicateSaved: "Duplicate saved",
    scanStatusFailed: "Save failed",
    scanStatusPendingUpload: "Pending upload",
    pendingUpload: "Pending {count}",
    pendingSaved: "Saved on this device, waiting to upload",
    pendingUploaded: "Uploaded {count} pending records",
    pendingUploadFailed: "{count} records still pending",
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
    version: "Version: Cloud v13",
    scanFirst: "Scan or enter a tracking number first",
    chooseOperator: "Select a scanner first",
    saved: "Saved",
    saveFailed: "Save failed",
    localApiFallback: "LAN sync unavailable. Trying cloud sync.",
    cloudFallback: "Cloud sync unavailable. Showing local cache.",
    refreshed: "Refreshed, {count} records on this page",
    prevPage: "Previous",
    nextPage: "Next",
    pageInfo: "Page {page} of {pages}, {total} records",
    settingsMissing: "Enter Supabase URL and Anon Key",
    settingsSaved: "Supabase settings saved",
    switchedLocal: "Switched to local mode",
    connected: "Connected",
    connectFailed: "Connection failed",
    installHint: "You can also add it to home screen from the browser menu",
    csvHeaders: ["Tracking Number", "Time", "Scanner", "Status"],
  },
  th: {
    htmlLang: "th",
    title: "บันทึกสแกนพัสดุ",
    eyebrow: "PDA + Web",
    appTitle: "บันทึกสแกนพัสดุ",
    starting: "กำลังเริ่ม",
    lanSync: "LAN",
    cloudSync: "คลาวด์",
    localMode: "ในเครื่อง",
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
    scanHelper: "เมื่อ PDA ใส่ข้อมูลแล้ว ระบบจะบันทึกอัตโนมัติ หากเครื่องส่ง Enter จะบันทึกทันที",
    todayCount: "วันนี้",
    totalCount: "ทั้งหมด",
    duplicateCount: "ซ้ำ",
    noRecords: "ยังไม่มีรายการสแกน",
    latestScanTitle: "สแกนล่าสุด",
    latestTimeLabel: "เวลา",
    latestStatusLabel: "สถานะ",
    latestScanIdle: "รอสแกน",
    scanStatusCloudSaved: "บันทึกขึ้นคลาวด์แล้ว",
    scanStatusLocalSaved: "บันทึกในเครื่องแล้ว",
    scanStatusDuplicateSaved: "บันทึกรายการซ้ำแล้ว",
    scanStatusFailed: "บันทึกไม่สำเร็จ",
    scanStatusPendingUpload: "รออัปโหลด",
    pendingUpload: "รอ {count}",
    pendingSaved: "บันทึกในเครื่องแล้ว รออัปโหลด",
    pendingUploaded: "อัปโหลดรายการค้างแล้ว {count} รายการ",
    pendingUploadFailed: "ยังค้างอัปโหลด {count} รายการ",
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
    version: "เวอร์ชัน: Cloud v13",
    scanFirst: "กรุณาสแกนหรือกรอกเลขพัสดุก่อน",
    chooseOperator: "กรุณาเลือกผู้สแกนก่อน",
    saved: "บันทึกแล้ว",
    saveFailed: "บันทึกไม่สำเร็จ",
    localApiFallback: "ซิงก์ LAN ใช้ไม่ได้ กำลังลองซิงก์คลาวด์",
    cloudFallback: "ซิงก์คลาวด์ใช้ไม่ได้ แสดงข้อมูลแคช",
    refreshed: "รีเฟรชแล้ว หน้านี้ {count} รายการ",
    prevPage: "ก่อนหน้า",
    nextPage: "ถัดไป",
    pageInfo: "หน้า {page} / {pages}, ทั้งหมด {total} รายการ",
    settingsMissing: "กรุณากรอก Supabase URL และ Anon Key",
    settingsSaved: "บันทึกการตั้งค่า Supabase แล้ว",
    switchedLocal: "เปลี่ยนเป็นโหมดในเครื่องแล้ว",
    connected: "เชื่อมต่อสำเร็จ",
    connectFailed: "เชื่อมต่อไม่สำเร็จ",
    installHint: "สามารถเพิ่มไปยังหน้าจอหลักจากเมนูเบราว์เซอร์ได้",
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
  await cleanupExpiredCloudRecords();
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

  const refreshFromFirstPage = debounce(() => {
    state.recordPage = 0;
    refreshRecords({ silent: true });
  }, 300);
  [els.searchInput, els.dateInput].forEach((input) => input.addEventListener("input", refreshFromFirstPage));
  els.refreshButton.addEventListener("click", refreshRecords);
  els.resetFiltersButton.addEventListener("click", () => {
    els.searchInput.value = "";
    els.dateInput.value = "";
    state.recordPage = 0;
    refreshRecords({ silent: true });
  });
  els.prevPageButton.addEventListener("click", () => {
    if (state.recordPage === 0) return;
    state.recordPage -= 1;
    refreshRecords({ silent: true });
  });
  els.nextPageButton.addEventListener("click", () => {
    if (!state.hasNextPage) return;
    state.recordPage += 1;
    refreshRecords({ silent: true });
  });
  els.exportButton.addEventListener("click", exportCsv);
  els.saveSettingsButton.addEventListener("click", saveSettings);
  els.useLocalButton.addEventListener("click", useLocalMode);
  els.testConnectionButton.addEventListener("click", testConnection);
  els.syncStatus.addEventListener("click", syncNow);
  els.languageSelect.addEventListener("change", () => {
    state.language = els.languageSelect.value;
    localStorage.setItem(STORAGE_KEYS.language, state.language);
    applyLanguage();
    render();
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
  els.versionText.textContent = t("version");
  renderLatestScanStatus();
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

  const duplicate = await isDuplicateTrackingNumber(trackingNumber);
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
    setLatestScanStatus(record, duplicate ? "scanStatusDuplicateSaved" : getSavedStatusKey());
    playFeedbackSound("success");
    render();
    showToast(duplicate ? `${t("duplicate")}：${trackingNumber}` : `${t("saved")}：${trackingNumber}`);
    els.trackingInput.value = "";
    els.trackingInput.focus();
  } catch (error) {
    state.records.unshift(record);
    enqueuePendingRecord(record);
    saveLocalRecords();
    setLatestScanStatus(record, "scanStatusPendingUpload");
    playFeedbackSound("error");
    render();
    showToast(`${t("pendingSaved")}：${trackingNumber}`);
    els.trackingInput.value = "";
    els.trackingInput.focus();
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
  const offset = state.recordPage * RECORD_PAGE_SIZE;

  if (state.apiAvailable) {
    try {
      const localRecords = await apiRequest("/api/scans");
      const filtered = filterRecords(localRecords);
      state.totalMatchingRecords = filtered.length;
      state.records = mergePendingRecords(filtered.slice(offset, offset + RECORD_PAGE_SIZE));
      state.hasNextPage = offset + RECORD_PAGE_SIZE < filtered.length;
      state.summaryCounts = addPendingSummaryCounts(getSummaryCounts(localRecords));
      saveLocalRecords();
      return;
    } catch (error) {
      state.apiAvailable = false;
      updateStatus();
      showToast(t("localApiFallback"));
    }
  }

  if (!isSupabaseMode()) {
    const cachedRecords = loadJson(STORAGE_KEYS.records, []);
    const filtered = filterRecords(cachedRecords);
    state.totalMatchingRecords = filtered.length;
    state.records = mergePendingRecords(filtered.slice(offset, offset + RECORD_PAGE_SIZE));
    state.hasNextPage = offset + RECORD_PAGE_SIZE < filtered.length;
    state.summaryCounts = addPendingSummaryCounts(getSummaryCounts(cachedRecords));
    return;
  }

  try {
    const result = await fetchSupabaseRecordsPage({ limit: RECORD_PAGE_SIZE, offset });
    state.records = mergePendingRecords(result.records);
    state.totalMatchingRecords = result.total + filterRecords(state.pendingRecords).length;
    state.hasNextPage = offset + RECORD_PAGE_SIZE < result.total;
    await refreshSummaryCounts();
    state.summaryCounts = addPendingSummaryCounts(state.summaryCounts);
    saveLocalRecords();
  } catch (error) {
    const cachedRecords = loadJson(STORAGE_KEYS.records, []);
    const filtered = filterRecords(cachedRecords);
    state.totalMatchingRecords = filtered.length;
    state.records = mergePendingRecords(filtered.slice(offset, offset + RECORD_PAGE_SIZE));
    state.hasNextPage = offset + RECORD_PAGE_SIZE < filtered.length;
    state.summaryCounts = addPendingSummaryCounts(getSummaryCounts(cachedRecords));
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

function render() {
  renderStats();
  renderLatestScanStatus();
  renderRecords();
  renderPager();
  updateStatus();
}

function renderStats() {
  els.todayCount.textContent = state.summaryCounts.today;
  els.totalCount.textContent = state.summaryCounts.total;
  els.duplicateCount.textContent = state.summaryCounts.duplicates;

  const latest = state.records[0];
  els.lastScan.textContent = latest
    ? `${t("latestPrefix")}：${latest.tracking_number}，${formatDate(latest.created_at)}`
    : t("noRecords");
}

function getSavedStatusKey() {
  return state.apiAvailable || isSupabaseMode() ? "scanStatusCloudSaved" : "scanStatusLocalSaved";
}

function enqueuePendingRecord(record) {
  const alreadyQueued = state.pendingRecords.some((pending) => pending.id === record.id);
  if (!alreadyQueued) {
    state.pendingRecords.push(record);
    savePendingRecords();
  }
}

function savePendingRecords() {
  localStorage.setItem(STORAGE_KEYS.pendingRecords, JSON.stringify(state.pendingRecords));
}

function setLatestScanStatus(record, statusKey) {
  state.latestScanStatus = {
    trackingNumber: record.tracking_number,
    createdAt: record.created_at || new Date().toISOString(),
    statusKey,
  };
  localStorage.setItem(STORAGE_KEYS.lastScanStatus, JSON.stringify(state.latestScanStatus));
  renderLatestScanStatus();
}

function renderLatestScanStatus() {
  const latestRecord = state.records[0];
  const latestFromRecord = latestRecord ? {
    trackingNumber: latestRecord.tracking_number,
    createdAt: latestRecord.created_at,
    statusKey: latestRecord.is_duplicate ? "scanStatusDuplicateSaved" : "scanStatusCloudSaved",
  } : null;
  const latest = getMoreRecentScanStatus(state.latestScanStatus, latestFromRecord);

  if (!latest) {
    els.latestScanBanner.classList.remove("is-success", "is-error", "is-pending");
    els.latestTrackingValue.textContent = "-";
    els.latestTimeValue.textContent = "-";
    els.latestStatusValue.textContent = t("latestScanIdle");
    return;
  }

  const isError = latest.statusKey === "scanStatusFailed";
  const isPending = latest.statusKey === "scanStatusPendingUpload";
  els.latestScanBanner.classList.toggle("is-success", !isError && !isPending);
  els.latestScanBanner.classList.toggle("is-error", isError);
  els.latestScanBanner.classList.toggle("is-pending", isPending);
  els.latestTrackingValue.textContent = latest.trackingNumber || "-";
  els.latestTimeValue.textContent = formatDate(latest.createdAt);
  els.latestStatusValue.textContent = t(latest.statusKey);
}

function getMoreRecentScanStatus(primary, fallback) {
  if (!primary) return fallback;
  if (!fallback) return primary;
  const primaryTime = new Date(primary.createdAt).getTime();
  const fallbackTime = new Date(fallback.createdAt).getTime();
  return fallbackTime > primaryTime ? fallback : primary;
}

function renderRecords() {
  const records = state.records;

  els.recordsBody.innerHTML = records
    .map((record) => {
      const pending = isPendingRecord(record);
      const statusClass = pending ? "pending" : record.is_duplicate ? "duplicate" : "ok";
      const statusText = pending ? t("scanStatusPendingUpload") : record.is_duplicate ? t("duplicate") : t("ok");
      return `
        <tr>
      <td><strong>${escapeHtml(record.tracking_number)}</strong></td>
      <td>${escapeHtml(formatDate(record.created_at))}</td>
      <td>${escapeHtml(record.operator || "-")}</td>
      <td><span class="badge ${statusClass}">${statusText}</span></td>
    </tr>
  `;
    })
    .join("");
  els.emptyState.classList.toggle("is-visible", records.length === 0);
}

function isPendingRecord(record) {
  return state.pendingRecords.some((pending) => pending.id === record.id);
}

async function exportCsv() {
  const records = await loadRecordsForExport();
  const header = t("csvHeaders");
  const rows = records.map((record) => [
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

function loadProfile() {
  els.operatorInput.value = OPERATORS.includes(state.profile.operator) ? state.profile.operator : "";
}

function loadSettingsForm() {
  els.supabaseUrlInput.value = state.settings.supabaseUrl || "";
  els.supabaseKeyInput.value = state.settings.supabaseKey || "";
}

function updateStatus() {
  const pendingCount = state.pendingRecords.length;
  const suffix = pendingCount > 0 ? ` ${pendingCount}` : "";
  if (state.apiAvailable) {
    els.syncStatus.textContent = `${t("lanSync")}${suffix}`;
    els.syncStatus.title = t("refreshButton");
    return;
  }
  els.syncStatus.textContent = `${isSupabaseMode() ? t("cloudSync") : t("localMode")}${suffix}`;
  els.syncStatus.title = t("refreshButton");
}

async function syncNow() {
  els.syncStatus.disabled = true;
  try {
    state.apiAvailable = await detectLocalApi();
    updateStatus();
    await cleanupExpiredCloudRecords();
    const uploaded = await uploadPendingRecords();
    await loadRecords();
    render();
    showToast(uploaded > 0 ? t("pendingUploaded", { count: uploaded }) : t("refreshed", { count: state.records.length }));
  } catch (error) {
    showToast(`${t("connectFailed")}：${error.message}`);
  } finally {
    els.syncStatus.disabled = false;
    updateStatus();
  }
}

async function uploadPendingRecords() {
  if (state.pendingRecords.length === 0) return 0;
  if (!state.apiAvailable && !isSupabaseMode()) return 0;

  const remaining = [];
  let uploaded = 0;

  for (const record of state.pendingRecords) {
    try {
      await uploadRecord(record);
      uploaded += 1;
    } catch (error) {
      if (isDuplicateIdError(error)) {
        uploaded += 1;
      } else {
        remaining.push(record);
      }
    }
  }

  state.pendingRecords = remaining;
  savePendingRecords();
  updateStatus();

  if (remaining.length > 0) {
    showToast(t("pendingUploadFailed", { count: remaining.length }));
  }

  return uploaded;
}

async function uploadRecord(record) {
  if (state.apiAvailable) {
    await apiRequest("/api/scans", {
      method: "POST",
      body: JSON.stringify(record),
    });
    return;
  }

  await supabaseRequest("/rest/v1/parcel_scans", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(record),
  });
}

function isDuplicateIdError(error) {
  return /duplicate key|23505|already exists/i.test(error.message || "");
}

function isSupabaseMode() {
  return state.settings.mode === "supabase" && state.settings.supabaseUrl && state.settings.supabaseKey;
}

async function isDuplicateTrackingNumber(trackingNumber) {
  if (isSupabaseMode()) {
    try {
      const params = new URLSearchParams({ select: "id", limit: "1" });
      params.set("tracking_number", `eq.${trackingNumber}`);
      params.set("created_at", `gte.${getRetentionCutoffIso()}`);
      const records = await supabaseRequest(`/rest/v1/parcel_scans?${params.toString()}`);
      return records.length > 0;
    } catch {
      // Fall back to the loaded page if the duplicate check cannot reach the cloud.
    }
  }
  return state.records.some((record) => normalizeTrackingNumber(record.tracking_number) === trackingNumber);
}

async function fetchSupabaseRecordsPage({ limit, offset }) {
  const response = await supabaseFetch(buildSupabaseRecordsPath({ limit, offset }), {
    headers: { Prefer: "count=exact" },
  });
  const records = await response.json();
  return {
    records,
    total: parseContentRangeTotal(response.headers.get("content-range"), offset + records.length),
  };
}

function buildSupabaseRecordsPath({ limit, offset }) {
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("order", "created_at.desc");
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  appendFilterParams(params);
  return `/rest/v1/parcel_scans?${params.toString()}`;
}

function appendFilterParams(params) {
  params.append("created_at", `gte.${getRetentionCutoffIso()}`);

  const keyword = cleanSearchKeyword(els.searchInput.value);
  if (keyword) {
    params.set("or", `(tracking_number.ilike.*${keyword}*,operator.ilike.*${keyword}*)`);
  }

  const range = getDateRange(els.dateInput.value);
  if (range) {
    params.append("created_at", `gte.${range.start}`);
    params.append("created_at", `lt.${range.end}`);
  }
}

function cleanSearchKeyword(value) {
  return value.trim().replace(/[*,()]/g, " ").replace(/\s+/g, " ");
}

function getDateRange(dateValue) {
  if (!dateValue) return null;
  const start = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

async function loadRecordsForExport() {
  if (state.apiAvailable || !isSupabaseMode()) {
    return filterRecords(loadJson(STORAGE_KEYS.records, state.records));
  }

  const records = [];
  let offset = 0;
  while (true) {
    const page = await fetchSupabaseRecordsPage({ limit: EXPORT_BATCH_SIZE, offset });
    records.push(...page.records);
    offset += EXPORT_BATCH_SIZE;
    if (offset >= page.total || page.records.length === 0) break;
  }
  return records;
}

async function refreshSummaryCounts() {
  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const range = getDateRange(todayValue);
  const [total, todayCount, duplicates] = await Promise.all([
    fetchSupabaseCount(countParams(() => {})),
    fetchSupabaseCount(countParams((params) => {
      params.append("created_at", `gte.${range.start}`);
      params.append("created_at", `lt.${range.end}`);
    })),
    fetchSupabaseCount(countParams((params) => params.set("is_duplicate", "eq.true"))),
  ]);
  state.summaryCounts = { today: todayCount, total, duplicates };
}

function countParams(configure) {
  const params = new URLSearchParams({ select: "id", limit: "1" });
  params.append("created_at", `gte.${getRetentionCutoffIso()}`);
  configure(params);
  return params;
}

async function fetchSupabaseCount(params) {
  const response = await supabaseFetch(`/rest/v1/parcel_scans?${params.toString()}`, {
    headers: { Prefer: "count=exact" },
  });
  return parseContentRangeTotal(response.headers.get("content-range"), 0);
}

function parseContentRangeTotal(value, fallback) {
  const total = value?.split("/")[1];
  const parsed = total && total !== "*" ? Number(total) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getSummaryCounts(records) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    today: records.filter((record) => record.created_at?.slice(0, 10) === today).length,
    total: records.length,
    duplicates: records.filter((record) => record.is_duplicate).length,
  };
}

function addPendingSummaryCounts(counts) {
  const pendingCounts = getSummaryCounts(state.pendingRecords);
  return {
    today: counts.today + pendingCounts.today,
    total: counts.total + pendingCounts.total,
    duplicates: counts.duplicates + pendingCounts.duplicates,
  };
}

function mergePendingRecords(records) {
  const ids = new Set(records.map((record) => record.id));
  const pending = filterRecords(state.pendingRecords).filter((record) => !ids.has(record.id));
  return [...pending, ...records].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function filterRecords(records) {
  const keyword = els.searchInput.value.trim().toLowerCase();
  const date = els.dateInput.value;
  const cutoff = getRetentionCutoffIso();
  return records.filter((record) => {
    const haystack = [record.tracking_number, record.operator].join(" ").toLowerCase();
    const matchesKeyword = !keyword || haystack.includes(keyword);
    const matchesDate = !date || record.created_at?.slice(0, 10) === date;
    const withinRetention = !record.created_at || record.created_at >= cutoff;
    return withinRetention && matchesKeyword && matchesDate;
  });
}

async function cleanupExpiredCloudRecords() {
  if (!isSupabaseMode()) return;

  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem(STORAGE_KEYS.cleanupDate) === today) return;

  try {
    await supabaseRequest("/rest/v1/rpc/cleanup_old_parcel_scans", {
      method: "POST",
      body: "{}",
    });
    localStorage.setItem(STORAGE_KEYS.cleanupDate, today);
  } catch (error) {
    // The app still filters old records if the DB cleanup function has not been installed yet.
    console.warn("Cloud cleanup skipped:", error.message);
  }
}

function getRetentionCutoffIso() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  return cutoff.toISOString();
}

function renderPager() {
  const totalPages = Math.max(1, Math.ceil(state.totalMatchingRecords / RECORD_PAGE_SIZE));
  const page = Math.min(state.recordPage + 1, totalPages);
  els.pageInfo.textContent = t("pageInfo", { page, pages: totalPages, total: state.totalMatchingRecords });
  els.prevPageButton.disabled = state.recordPage === 0;
  els.nextPageButton.disabled = !state.hasNextPage;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
async function supabaseRequest(path, options = {}) {
  const response = await supabaseFetch(path, options);
  if (response.status === 204) return null;
  return response.json();
}

async function supabaseFetch(path, options = {}) {
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

  return response;
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

function playFeedbackSound(type) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    playFeedbackSound.context ||= new AudioContextClass();
    const context = playFeedbackSound.context;
    if (context.state === "suspended") {
      context.resume();
    }

    if (type === "error") {
      playTone(context, 260, 0, 0.18, 0.18);
      playTone(context, 190, 0.2, 0.2, 0.16);
      return;
    }

    playTone(context, 880, 0, 0.08, 0.12);
    playTone(context, 1180, 0.09, 0.1, 0.11);
  } catch {
    // Audio feedback is best-effort; saving must never depend on sound playback.
  }
}

function playTone(context, frequency, delay, duration, volume) {
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
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
