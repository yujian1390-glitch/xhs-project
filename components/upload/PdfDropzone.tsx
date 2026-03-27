"use client";

import { useRef, useState } from "react";

interface PdfDropzoneProps {
  disabled?: boolean;
  onFileSelect: (file: File) => Promise<void>;
}

export function PdfDropzone({ disabled = false, onFileSelect }: PdfDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const pickFile = () => {
    if (disabled) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    await onFileSelect(fileList[0]);
  };

  return (
    <section
      className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
        isDragging
          ? "border-rose-400 bg-rose-50"
          : "border-slate-300 bg-white hover:border-rose-300"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={async (event) => {
        event.preventDefault();
        setIsDragging(false);
        await handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="application/pdf,.pdf"
        onChange={async (event) => {
          await handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <p className="text-sm text-slate-600">拖拽 PDF 到这里，或点击按钮选择文件</p>
      <button
        type="button"
        onClick={pickFile}
        disabled={disabled}
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        选择 PDF
      </button>
    </section>
  );
}
