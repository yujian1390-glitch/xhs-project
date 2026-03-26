import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

const templates = [
  { id: "minimal-white", name: "极简白边", settings: { ratio: "origin", backgroundColor: "#ffffff", borderColor: "#e5e7eb", borderWidth: 12, borderRadius: 20, outerMargin: 28, innerPadding: 16 } },
  { id: "cream-card", name: "奶油卡片", settings: { ratio: "3:4", backgroundColor: "#f8f1e5", borderColor: "#e8d8bf", borderWidth: 14, borderRadius: 26, outerMargin: 28, innerPadding: 18 } },
  { id: "pink-note", name: "浅粉笔记", settings: { ratio: "3:4", backgroundColor: "#fdecef", borderColor: "#f8c9d3", borderWidth: 10, borderRadius: 24, outerMargin: 30, innerPadding: 16 } },
  { id: "beige-list", name: "米黄清单", settings: { ratio: "3:4", backgroundColor: "#f5edd8", borderColor: "#d7c59f", borderWidth: 12, borderRadius: 16, outerMargin: 30, innerPadding: 18 } },
  { id: "gray-doc", name: "灰白资料风", settings: { ratio: "origin", backgroundColor: "#f3f4f6", borderColor: "#d1d5db", borderWidth: 10, borderRadius: 14, outerMargin: 24, innerPadding: 14 } },
  { id: "mono-minimal", name: "黑白极简", settings: { ratio: "1:1", backgroundColor: "#111111", borderColor: "#ffffff", borderWidth: 8, borderRadius: 8, outerMargin: 24, innerPadding: 14 } }
];

const state = {
  pdf: null,
  totalPages: 0,
  currentPage: 1,
  selectedPages: new Set(),
  activeTemplateId: templates[0].id,
  settings: { ...templates[0].settings },
  pageStyles: new Map(),
  thumbs: []
};

const els = {
  input: document.getElementById("pdfInput"),
  pickBtn: document.getElementById("pickFileBtn"),
  dropzone: document.getElementById("dropzone"),
  status: document.getElementById("statusText"),
  progress: document.getElementById("progressBar"),
  error: document.getElementById("errorText"),
  thumbList: document.getElementById("thumbList"),
  previewImage: document.getElementById("previewImage"),
  previewEmpty: document.getElementById("previewEmpty"),
  previewTitle: document.getElementById("previewTitle"),
  templateButtons: document.getElementById("templateButtons"),
  ratioSelect: document.getElementById("ratioSelect"),
  bgColor: document.getElementById("bgColor"),
  borderColor: document.getElementById("borderColor"),
  borderWidth: document.getElementById("borderWidth"),
  borderRadius: document.getElementById("borderRadius"),
  outerMargin: document.getElementById("outerMargin"),
  innerPadding: document.getElementById("innerPadding")
};

function setProgress(v) { els.progress.style.width = `${v}%`; }
function setError(msg = "") { els.error.textContent = msg; }

function bindControls() {
  els.pickBtn.onclick = () => els.input.click();
  els.input.onchange = async (e) => { const f = e.target.files?.[0]; if (f) await loadPdf(f); e.target.value = ""; };

  els.dropzone.addEventListener("dragover", (e) => { e.preventDefault(); });
  els.dropzone.addEventListener("drop", async (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f) await loadPdf(f);
  });

  templates.forEach((tpl) => {
    const btn = document.createElement("button");
    btn.textContent = tpl.name;
    btn.onclick = async () => {
      state.activeTemplateId = tpl.id;
      state.settings = { ...tpl.settings };
      syncSettingsUI();
      renderTemplateButtons();
      await renderCurrentPreview();
    };
    btn.dataset.id = tpl.id;
    els.templateButtons.appendChild(btn);
  });

  renderTemplateButtons();
  syncSettingsUI();

  const bindSetting = (el, key, parse = Number) => {
    el.addEventListener("input", async () => {
      state.activeTemplateId = "custom";
      state.settings[key] = parse(el.value);
      renderTemplateButtons();
      await renderCurrentPreview();
    });
  };

  bindSetting(els.ratioSelect, "ratio", (v) => v);
  bindSetting(els.bgColor, "backgroundColor", (v) => v);
  bindSetting(els.borderColor, "borderColor", (v) => v);
  bindSetting(els.borderWidth, "borderWidth");
  bindSetting(els.borderRadius, "borderRadius");
  bindSetting(els.outerMargin, "outerMargin");
  bindSetting(els.innerPadding, "innerPadding");

  document.querySelectorAll(".apply-buttons button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await applyTo(btn.dataset.target);
    });
  });
}

function renderTemplateButtons() {
  els.templateButtons.querySelectorAll("button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.id === state.activeTemplateId);
  });
}

function syncSettingsUI() {
  els.ratioSelect.value = state.settings.ratio;
  els.bgColor.value = state.settings.backgroundColor;
  els.borderColor.value = state.settings.borderColor;
  els.borderWidth.value = state.settings.borderWidth;
  els.borderRadius.value = state.settings.borderRadius;
  els.outerMargin.value = state.settings.outerMargin;
  els.innerPadding.value = state.settings.innerPadding;
}

function parseRatio(ratio) {
  if (ratio === "origin") return null;
  const [w, h] = ratio.split(":").map(Number);
  return w / h;
}

function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

async function renderPdfPageImage(pageNum, width = 1000) {
  const page = await state.pdf.getPage(pageNum);
  const v = page.getViewport({ scale: 1 });
  const scale = width / v.width;
  const sv = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = sv.width;
  canvas.height = sv.height;
  await page.render({ canvasContext: ctx, viewport: sv }).promise;
  return canvas.toDataURL("image/png");
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = src;
  });
}

async function frameImage(dataUrl, settings) {
  const img = await loadImage(dataUrl);
  const cardW = img.width + (settings.innerPadding + settings.borderWidth) * 2;
  const cardH = img.height + (settings.innerPadding + settings.borderWidth) * 2;
  let cw = cardW + settings.outerMargin * 2;
  let ch = cardH + settings.outerMargin * 2;
  const ratio = parseRatio(settings.ratio);
  if (ratio) {
    if (cw / ch > ratio) ch = cw / ratio;
    else cw = ch * ratio;
  }
  const cx = (cw - cardW) / 2;
  const cy = (ch - cardH) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cw);
  canvas.height = Math.round(ch);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = settings.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = settings.borderColor;
  roundedRect(ctx, cx, cy, cardW, cardH, settings.borderRadius);
  ctx.fill();

  const ix = cx + settings.borderWidth + settings.innerPadding;
  const iy = cy + settings.borderWidth + settings.innerPadding;

  ctx.save();
  roundedRect(ctx, ix, iy, img.width, img.height, Math.max(0, settings.borderRadius - settings.borderWidth - settings.innerPadding));
  ctx.clip();
  ctx.drawImage(img, ix, iy, img.width, img.height);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

function effectiveStyle(page) {
  return state.pageStyles.get(page) || state.settings;
}

async function renderThumbList() {
  els.thumbList.innerHTML = "";
  for (let p = 1; p <= state.totalPages; p++) {
    const item = document.createElement("div");
    item.className = `thumb-item ${p === state.currentPage ? "active" : ""}`;
    const checked = state.selectedPages.has(p) ? "checked" : "";
    item.innerHTML = `<label><input type="checkbox" data-page="${p}" ${checked}/> 第 ${p} 页</label><img alt="第${p}页缩略图"/>`;
    const img = item.querySelector("img");
    img.src = state.thumbs[p - 1] || "";

    item.addEventListener("click", async () => {
      state.currentPage = p;
      await renderCurrentPreview();
      await renderThumbList();
    });

    item.querySelector("input").addEventListener("click", (e) => e.stopPropagation());
    item.querySelector("input").addEventListener("change", (e) => {
      if (e.target.checked) state.selectedPages.add(p);
      else state.selectedPages.delete(p);
    });

    els.thumbList.appendChild(item);
  }
}

async function renderCurrentPreview() {
  if (!state.pdf) return;
  els.previewTitle.textContent = `当前页预览 - 第 ${state.currentPage} 页`;
  const source = await renderPdfPageImage(state.currentPage, 1100);
  const framed = await frameImage(source, effectiveStyle(state.currentPage));
  els.previewImage.src = framed;
  els.previewImage.style.display = "block";
  els.previewEmpty.style.display = "none";
}

async function applyTo(target) {
  if (!state.pdf) return;
  let pages = [];
  if (target === "current") pages = [state.currentPage];
  else if (target === "selected") pages = Array.from(state.selectedPages);
  else pages = Array.from({ length: state.totalPages }, (_, i) => i + 1);

  for (const p of pages) state.pageStyles.set(p, { ...state.settings });

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const source = await renderPdfPageImage(p, 320);
    state.thumbs[p - 1] = await frameImage(source, effectiveStyle(p));
    setProgress(Math.round(((i + 1) / pages.length) * 100));
  }

  await renderCurrentPreview();
  await renderThumbList();
}

async function loadPdf(file) {
  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    setError("仅支持 PDF 文件");
    return;
  }
  setError("");
  setProgress(0);

  try {
    const data = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data });
    loadingTask.onProgress = (progress) => {
      if (!progress.total) return;
      setProgress(Math.floor((progress.loaded / progress.total) * 90));
    };

    state.pdf = await loadingTask.promise;
    state.totalPages = state.pdf.numPages;
    state.currentPage = 1;
    state.pageStyles = new Map();
    state.selectedPages = new Set(Array.from({ length: Math.min(9, state.totalPages) }, (_, i) => i + 1));
    state.thumbs = new Array(state.totalPages).fill("");

    for (let p = 1; p <= state.totalPages; p++) {
      const source = await renderPdfPageImage(p, 320);
      state.thumbs[p - 1] = await frameImage(source, effectiveStyle(p));
      setProgress(Math.floor(90 + (p / state.totalPages) * 10));
    }

    els.status.textContent = `已加载：${file.name}（${state.totalPages} 页）`;
    await renderThumbList();
    await renderCurrentPreview();
  } catch (err) {
    console.error(err);
    setError("PDF 解析失败，请检查文件后重试。");
  }
}

bindControls();
