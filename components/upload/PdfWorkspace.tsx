"use client";

import { PageList } from "@/components/upload/PageList";
import { PdfDropzone } from "@/components/upload/PdfDropzone";
import { PdfPreview } from "@/components/upload/PdfPreview";
import { TemplatePanel } from "@/components/upload/TemplatePanel";
import { usePdfUpload } from "@/hooks/usePdfUpload";

export function PdfWorkspace() {
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
    handleFileSelect,
    setCurrentPage,
    togglePageSelected,
    setTemplate,
    updateFrameSetting,
    applyTemplateToTarget,
    reset
  } = usePdfUpload();

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
    </div>
  );
}
