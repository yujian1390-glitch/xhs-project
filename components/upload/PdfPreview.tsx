"use client";

interface PdfPreviewProps {
  status: "idle" | "parsing" | "ready" | "error";
  currentPage: number;
  previewImage: string | null;
  isRenderingPreview: boolean;
}

export function PdfPreview({
  status,
  currentPage,
  previewImage,
  isRenderingPreview
}: PdfPreviewProps) {
  if (status === "idle") {
    return (
      <section className="flex h-[70vh] items-center justify-center rounded-lg border border-slate-200 bg-white text-sm text-slate-500">
        上传 PDF 后显示大图预览
      </section>
    );
  }

  return (
    <section className="h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 text-sm font-medium text-slate-700">当前预览：第 {currentPage} 页</div>
      {isRenderingPreview ? (
        <div className="flex h-[60vh] items-center justify-center rounded border border-dashed border-slate-300 text-sm text-slate-500">
          正在渲染大图预览...
        </div>
      ) : previewImage ? (
        <img src={previewImage} alt={`第 ${currentPage} 页预览`} className="mx-auto h-auto max-w-full rounded" />
      ) : (
        <div className="flex h-[60vh] items-center justify-center rounded border border-dashed border-slate-300 text-sm text-slate-500">
          暂无可展示的预览
        </div>
      )}
    </section>
  );
}
