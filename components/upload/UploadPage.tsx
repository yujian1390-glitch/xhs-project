import { PdfWorkspace } from "@/components/upload/PdfWorkspace";

export function UploadPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">PDF 上传与分页预览</h1>
      <p className="text-sm text-slate-600">
        支持 PDF 拖拽/点击上传，解析页数并展示缩略图与大图预览。
      </p>
      <PdfWorkspace />
    </section>
  );
}
