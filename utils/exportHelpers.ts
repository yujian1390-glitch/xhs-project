export type ExportFormat = "png" | "jpg";

export function sanitizeDocName(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, "").trim();
  return base.length > 0 ? base.replace(/[\\/:*?"<>|]/g, "_") : "文档";
}

export function buildPageFileName(docName: string, page: number, format: ExportFormat): string {
  const index = String(page).padStart(2, "0");
  const label = page === 1 ? "首图" : `第${page}页`;
  return `${docName}_${index}_${label}.${format}`;
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, payload] = dataUrl.split(",");
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mime = mimeMatch?.[1] ?? "image/png";
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });
}

export async function convertDataUrlFormat(
  dataUrl: string,
  format: ExportFormat
): Promise<string> {
  if (format === "png") {
    return dataUrl;
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片格式转换失败"));
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("无法创建转换画布");
  }

  canvas.width = image.width;
  canvas.height = image.height;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.92);
}
