"use client";

import type { ExportFormat } from "@/utils/exportHelpers";

interface ExportPanelProps {
  format: ExportFormat;
  asZip: boolean;
  isExporting: boolean;
  progress: number;
  onFormatChange: (format: ExportFormat) => void;
  onZipChange: (checked: boolean) => void;
  onExportCurrent: () => Promise<void>;
  onExportCover: () => Promise<void>;
  onExportSelected: () => Promise<void>;
  onExportAll: () => Promise<void>;
}

export function ExportPanel({
  format,
  asZip,
  isExporting,
  progress,
  onFormatChange,
  onZipChange,
  onExportCurrent,
  onExportCover,
  onExportSelected,
  onExportAll
}: ExportPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold">导出</h3>

      <div className="mt-3 grid gap-3 text-sm">
        <label className="block">
          <span className="mb-1 block text-slate-600">图片格式</span>
          <select
            value={format}
            onChange={(event) => onFormatChange(event.target.value as ExportFormat)}
            className="w-full rounded border border-slate-300 px-2 py-1"
          >
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={asZip}
            onChange={(event) => onZipChange(event.target.checked)}
          />
          多图导出时打包为 zip
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isExporting}
            className="rounded border border-slate-300 px-3 py-2 text-xs disabled:text-slate-400"
            onClick={onExportCurrent}
          >
            导出当前页
          </button>
          <button
            type="button"
            disabled={isExporting}
            className="rounded border border-slate-300 px-3 py-2 text-xs disabled:text-slate-400"
            onClick={onExportCover}
          >
            导出首图
          </button>
          <button
            type="button"
            disabled={isExporting}
            className="rounded border border-slate-300 px-3 py-2 text-xs disabled:text-slate-400"
            onClick={onExportSelected}
          >
            导出已勾选
          </button>
          <button
            type="button"
            disabled={isExporting}
            className="rounded border border-slate-300 px-3 py-2 text-xs disabled:text-slate-400"
            onClick={onExportAll}
          >
            导出全部
          </button>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>导出进度</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded bg-slate-100">
            <div className="h-2 rounded bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
