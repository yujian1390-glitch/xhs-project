"use client";

interface ExportSuccessModalProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

export function ExportSuccessModal({ open, message, onClose }: ExportSuccessModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
        <h4 className="text-lg font-semibold text-slate-900">导出成功</h4>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <button
          type="button"
          className="mt-4 w-full rounded bg-slate-900 px-4 py-2 text-sm text-white"
          onClick={onClose}
        >
          确定
        </button>
      </div>
    </div>
  );
}
