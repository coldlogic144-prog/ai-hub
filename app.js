const state = {
  workbook: null,
  sheetName: "",
  rows: [],
  columns: [],
  search: "",
  filters: {},
  sort: { column: "", direction: "asc" },
  page: 1,
  rowsPerPage: 25,
};

const elements = {
  loading: document.getElementById("loadingScreen"),
  errorState: document.getElementById("errorState"),
  errorMessage: document.getElementById("errorMessage"),
  emptyState: document.getElementById("emptyState"),
  worksheetSelector: document.getElementById("worksheetSelector"),
  globalSearch: document.getElementById("globalSearch"),
  rowsPerPage: document.getElementById("rowsPerPage"),
  tableHead: document.getElementById("tableHead"),
  tableBody: document.getElementById("tableBody"),
  totalRows: document.getElementById("totalRows"),
  totalColumns: document.getElementById("totalColumns"),
  filteredRows: document.getElementById("filteredRows"),
  currentWorksheet: document.getElementById("currentWorksheet"),
  lastUpdated: document.getElementById("lastUpdated"),
  prevPage: document.getElementById("prevPage"),
  nextPage: document.getElementById("nextPage"),
  pageInfo: document.getElementById("pageInfo"),
  themeToggle: document.getElementById("themeToggle"),
  themeIcon: document.getElementById("themeIcon"),
  fontSelector: document.getElementById("fontSelector"),
  exportCsv: document.getElementById("exportCsv"),
  exportExcel: document.getElementById("exportExcel"),
  printView: document.getElementById("printView"),
};

document.addEventListener("DOMContentLoaded", initialize);

async function initialize() {
  applySavedPreferences();
  bindEvents();

  try {
    const response = await fetch(`data.json?cache=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`data.json returned ${response.status}`);
    }
    state.workbook = await response.json();
    loadWorkbook();
  } catch (error) {
    showError(error);
  } finally {
    elements.loading.classList.add("hidden");
  }
}

function applySavedPreferences() {
  const theme = localStorage.getItem("excelDashboardTheme") || "light";
  const font = localStorage.getItem("excelDashboardFont") || "default";
  document.documentElement.dataset.theme = theme;
  document.body.classList.toggle("font-kruti", font === "kruti");
  elements.themeIcon.textContent = theme === "dark" ? "☀" : "☾";
  elements.fontSelector.value = font;
}

function bindEvents() {
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.fontSelector.addEventListener("change", changeFont);
  elements.worksheetSelector.addEventListener("change", (event) => selectWorksheet(event.target.value));
  elements.globalSearch.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    state.page = 1;
    render({ includeHeader: false });
  });
  elements.rowsPerPage.addEventListener("change", (event) => {
    state.rowsPerPage = Number(event.target.value);
    state.page = 1;
    render({ includeHeader: false });
  });
  elements.prevPage.addEventListener("click", () => changePage(-1));
  elements.nextPage.addEventListener("click", () => changePage(1));
  elements.exportCsv.addEventListener("click", () => exportDelimited("csv"));
  elements.exportExcel.addEventListener("click", exportExcelCompatible);
  elements.printView.addEventListener("click", () => window.print());
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  elements.themeIcon.textContent = nextTheme === "dark" ? "☀" : "☾";
  localStorage.setItem("excelDashboardTheme", nextTheme);
}

function changeFont(event) {
  const font = event.target.value;
  document.body.classList.toggle("font-kruti", font === "kruti");
  localStorage.setItem("excelDashboardFont", font);
}

function loadWorkbook() {
  const names = state.workbook?.metadata?.worksheet_names || Object.keys(state.workbook?.worksheets || {});
  elements.worksheetSelector.innerHTML = names
    .map((name) => `<option value="${escapeAttribute(name)}">${escapeHtml(name)}</option>`)
    .join("");

  if (!names.length) {
    throw new Error("No worksheets were found in data.json.");
  }

  selectWorksheet(names[0]);
}

function selectWorksheet(sheetName) {
  const worksheet = state.workbook.worksheets[sheetName];
  state.sheetName = sheetName;
  state.columns = worksheet.columns || inferColumns(worksheet.rows || []);
  state.rows = worksheet.rows || [];
  state.filters = {};
  state.sort = { column: "", direction: "asc" };
  state.search = "";
  state.page = 1;
  elements.globalSearch.value = "";
  elements.worksheetSelector.value = sheetName;
  render();
}

function inferColumns(rows) {
  return [...rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set())];
}

function render(options = {}) {
  const { includeHeader = true } = options;
  const filteredRows = getFilteredRows();
  const sortedRows = sortRows(filteredRows);
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / state.rowsPerPage));
  state.page = Math.min(state.page, pageCount);
  const start = (state.page - 1) * state.rowsPerPage;
  const visibleRows = sortedRows.slice(start, start + state.rowsPerPage);

  if (includeHeader) {
    renderHeader();
  }
  renderBody(visibleRows);
  renderStats(filteredRows.length);
  renderPagination(pageCount);
  elements.emptyState.classList.toggle("hidden", filteredRows.length > 0);
}

function renderHeader() {
  const headerRow = document.createElement("tr");
  const filterRow = document.createElement("tr");

  state.columns.forEach((column) => {
    const sortGlyph = state.sort.column === column ? (state.sort.direction === "asc" ? "▲" : "▼") : "↕";
    const th = document.createElement("th");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "th-button";
    button.innerHTML = `<span>${escapeHtml(column)}</span><span>${sortGlyph}</span>`;
    button.addEventListener("click", () => toggleSort(column));
    th.appendChild(button);
    headerRow.appendChild(th);

    const filterTh = document.createElement("th");
    const input = document.createElement("input");
    input.className = "control filter-input";
    input.type = "search";
    input.placeholder = `Filter ${column}`;
    input.value = state.filters[column] || "";
    input.addEventListener("input", (event) => {
      state.filters[column] = event.target.value.trim().toLowerCase();
      state.page = 1;
      render({ includeHeader: false });
    });
    filterTh.appendChild(input);
    filterRow.appendChild(filterTh);
  });

  elements.tableHead.replaceChildren(headerRow, filterRow);
}

function renderBody(rows) {
  const fragment = document.createDocumentFragment();

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    state.columns.forEach((column) => {
      const td = document.createElement("td");
      td.textContent = formatCell(row[column]);
      tr.appendChild(td);
    });
    fragment.appendChild(tr);
  });

  elements.tableBody.replaceChildren(fragment);
}

function renderStats(filteredCount) {
  const generatedAt = state.workbook?.metadata?.generated_at;
  elements.totalRows.textContent = state.rows.length.toLocaleString();
  elements.totalColumns.textContent = state.columns.length.toLocaleString();
  elements.filteredRows.textContent = filteredCount.toLocaleString();
  elements.currentWorksheet.textContent = state.sheetName || "-";
  elements.lastUpdated.textContent = generatedAt ? new Date(generatedAt).toLocaleString() : "-";
}

function renderPagination(pageCount) {
  elements.pageInfo.textContent = `Page ${state.page} of ${pageCount}`;
  elements.prevPage.disabled = state.page <= 1;
  elements.nextPage.disabled = state.page >= pageCount;
}

function getFilteredRows() {
  return state.rows.filter((row) => {
    const matchesGlobal = !state.search || state.columns.some((column) =>
      formatCell(row[column]).toLowerCase().includes(state.search)
    );

    const matchesColumns = Object.entries(state.filters).every(([column, value]) =>
      !value || formatCell(row[column]).toLowerCase().includes(value)
    );

    return matchesGlobal && matchesColumns;
  });
}

function sortRows(rows) {
  if (!state.sort.column) {
    return [...rows];
  }

  const direction = state.sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const left = normalizeForSort(a[state.sort.column]);
    const right = normalizeForSort(b[state.sort.column]);
    if (left > right) return direction;
    if (left < right) return -direction;
    return 0;
  });
}

function normalizeForSort(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  if (typeof value === "number") {
    return value;
  }
  const date = Date.parse(value);
  if (!Number.isNaN(date) && /\d{4}-\d{2}-\d{2}|T\d{2}:\d{2}/.test(String(value))) {
    return date;
  }
  return String(value).toLowerCase();
}

function toggleSort(column) {
  if (state.sort.column === column) {
    state.sort.direction = state.sort.direction === "asc" ? "desc" : "asc";
  } else {
    state.sort = { column, direction: "asc" };
  }
  render();
}

function changePage(delta) {
  state.page += delta;
  render();
}

function exportDelimited(type) {
  const rows = getCurrentExportRows();
  const csv = [state.columns, ...rows.map((row) => state.columns.map((column) => formatCell(row[column])))]
    .map((line) => line.map(escapeCsv).join(","))
    .join("\r\n");
  downloadFile(`${safeFileName(state.sheetName)}.${type}`, csv, "text/csv;charset=utf-8");
}

function exportExcelCompatible() {
  const rows = getCurrentExportRows();
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table>${rowsToHtml(rows)}</table></body></html>`;
  downloadFile(`${safeFileName(state.sheetName)}.xls`, html, "application/vnd.ms-excel;charset=utf-8");
}

function getCurrentExportRows() {
  return sortRows(getFilteredRows());
}

function rowsToHtml(rows) {
  const head = `<tr>${state.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>`;
  const body = rows.map((row) =>
    `<tr>${state.columns.map((column) => `<td>${escapeHtml(formatCell(row[column]))}</td>`).join("")}</tr>`
  ).join("");
  return `${head}${body}`;
}

function downloadFile(fileName, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatCell(value) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object" && value.value !== undefined) {
    return formatCell(value.value);
  }
  return String(value);
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function safeFileName(value) {
  return String(value || "worksheet").replace(/[\\/:*?"<>|]+/g, "-").trim();
}

function showError(error) {
  elements.errorState.classList.remove("hidden");
  elements.errorMessage.textContent = `${error.message}. Run excel_to_json.py or update_website.bat, then refresh.`;
  console.error(error);
}
