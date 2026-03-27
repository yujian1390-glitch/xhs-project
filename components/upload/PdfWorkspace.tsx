"use client";

import { PageList } from "@/components/upload/PageList";
import { PdfDropzone } from "@/components/upload/PdfDropzone";
import { PdfPreview } from "@/components/upload/PdfPreview";
import { TemplatePanel } from "@/components/upload/TemplatePanel";
import { CoverPanel } from "@/components/cover/CoverPanel";
import { CoverRenderer } from "@/components/cover/CoverRenderer";
import { COVER_LAYOUTS, DEFAULT_COVER_LAYOUT } from "@/constants/coverLayouts";
import { ExportPanel } from "@/components/export/ExportPanel";
import { ExportSuccessModal } from "@/components/export/ExportSuccessModal";
import { usePdfUpload } from "@/hooks/usePdfUpload";
import type { CoverDraft } from "@/types/cover";
import type { ExportFormat } from "@/utils/exportHelpers";
import {
  buildPageFileName,
  dataUrlToBlob,
  sanitizeDocName,
  triggerBlobDownload
} from "@/utils/exportHelpers";
import JSZip from "jszip";
import { useMemo, useState } from "react";

export function PdfWorkspace() {
  const [coverDraft, setCoverDraft] = useState<CoverDraft>({
    title: "3 分钟看懂这份 PDF",
    subtitle: "提炼重点 + 可直接复用",
    emoji: "✨",
    tags: ["干货"],
    layout: DEFAULT_COVER_LAYOUT.id
  });
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [exportAsZip, setExportAsZip] = useState(true);
  const [coverExporter, setCoverExporter] = useState<((format: ExportFormat) => string | null) | null>(
    null
  );
  const [coverExportSuccessMessage, setCoverExportSuccessMessage] = useState("");

  const {
    status,
    progress,
    error,
    fileName,
    totalPages,
    currentPage,
    selectedPages,
    thumbnails,
    currentPreview,
    isRenderingPreview,
    activeTemplateId,
    frameSettings,
    isApplyingTemplate,
    coverBaseImage,
    isExporting,
    exportProgress,
    exportSuccessMessage,
    handleFileSelect,
    setCurrentPage,
    togglePageSelected,
    setTemplate,
    updateFrameSetting,
    applyTemplateToTarget,
    exportPages,
    clearExportSuccess,
    reset
  } = usePdfUpload();

  const docName = useMemo(() => sanitizeDocName(fileName), [fileName]);

  const exportCover = async () => {
    if (!coverExporter) {
      return;
    }

    const dataUrl = coverExporter(exportFormat);
    if (!dataUrl) {
      return;
    }

    const coverName = buildPageFileName(docName, 1, exportFormat);
    if (exportAsZip) {
      const zip = new JSZip();
      zip.file(coverName, dataUrlToBlob(dataUrl));
      const blob = await zip.generateAsync({ type: "blob" });
      triggerBlobDownload(blob, `${docName}_cover.zip`);
    } else {
      triggerBlobDownload(dataUrlToBlob(dataUrl), coverName);
    }
    setCoverExportSuccessMessage("首图导出完成。");
  };

  return (
    <div className="space-y-4">
      <PdfDropzone disabled={status === "parsing"} onFileSelect={handleFileSelect} />

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p>文件：{fileName || "未上传"}</p>
            <p>总页数：{totalPages || "-"}</p>
            <p>已勾选：{selectedPages.size || 0}</p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
          >
            清空
          </button>
        </div>

        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>处理进度</span>
            <span>
              {progress}%
              {isApplyingTemplate ? "（模板应用中）" : ""}
            </span>
          </div>
          <div className="h-2 w-full rounded bg-slate-100">
            <div
              className="h-2 rounded bg-rose-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[260px_1fr_320px]">
        <PageList
          totalPages={totalPages}
          currentPage={currentPage}
          selectedPages={selectedPages}
          thumbnails={thumbnails}
          onSelectPage={setCurrentPage}
          onTogglePage={togglePageSelected}
        />
        <PdfPreview
          status={status}
          currentPage={currentPage}
          previewImage={currentPreview}
          isRenderingPreview={isRenderingPreview}
        />
        <TemplatePanel
          activeTemplateId={activeTemplateId}
          settings={frameSettings}
          isApplying={isApplyingTemplate}
          onTemplateChange={setTemplate}
          onSettingChange={updateFrameSetting}
          onApply={applyTemplateToTarget}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <CoverPanel
          draft={coverDraft}
          layoutOptions={COVER_LAYOUTS.map((layout) => ({ id: layout.id, name: layout.name }))}
          onDraftChange={setCoverDraft}
        />
        <CoverRenderer baseImage={coverBaseImage} draft={coverDraft} onExportReady={setCoverExporter} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          <h3 className="text-base font-semibold text-slate-900">导出说明</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>支持导出当前页 / 首图 / 已勾选页面 / 全部页面。</li>
            <li>支持 PNG 与 JPG。</li>
            <li>多图可打包 ZIP。</li>
            <li>命名格式：文档名_01_首图.png、文档名_02_第2页.png。</li>
          </ul>
        </div>
        <ExportPanel
          format={exportFormat}
          asZip={exportAsZip}
          isExporting={isExporting}
          progress={exportProgress}
          onFormatChange={setExportFormat}
          onZipChange={setExportAsZip}
          onExportCurrent={async () =>
            exportPages({ target: "current", format: exportFormat, zip: exportAsZip })
          }
          onExportCover={exportCover}
          onExportSelected={async () =>
            exportPages({ target: "selected", format: exportFormat, zip: exportAsZip })
          }
          onExportAll={async () => exportPages({ target: "all", format: exportFormat, zip: exportAsZip })}
        />
      </div>

      <ExportSuccessModal
        open={exportSuccessMessage.length > 0 || coverExportSuccessMessage.length > 0}
        message={exportSuccessMessage || coverExportSuccessMessage}
        onClose={() => {
          clearExportSuccess();
          setCoverExportSuccessMessage("");
        }}
      />
    </div>
  );
}
