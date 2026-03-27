"use client";

import { DEFAULT_TEMPLATE, FRAME_TEMPLATES } from "@/constants/frameTemplates";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApplyTarget, FrameStyleSettings } from "@/types/frameTemplate";
import type { ExportFormat } from "@/utils/exportHelpers";
import {
  buildPageFileName,
  convertDataUrlFormat,
  dataUrlToBlob,
  sanitizeDocName,
  triggerBlobDownload
} from "@/utils/exportHelpers";
import { renderImageWithFrame } from "@/utils/canvasFrame";
import JSZip from "jszip";

type ParseStatus = "idle" | "parsing" | "ready" | "error";

interface RenderPageLike {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
}

interface PdfDocumentLike {
  numPages: number;
  getPage: (pageNumber: number) => Promise<RenderPageLike>;
}

interface UsePdfUploadResult {
  status: ParseStatus;
  progress: number;
  error: string | null;
  fileName: string;
  totalPages: number;
  currentPage: number;
  selectedPages: Set<number>;
  thumbnails: string[];
  currentPreview: string | null;
  isRenderingPreview: boolean;
  activeTemplateId: string;
  frameSettings: FrameStyleSettings;
  isApplyingTemplate: boolean;
  coverBaseImage: string | null;
  isExporting: boolean;
  exportProgress: number;
  exportSuccessMessage: string;
  handleFileSelect: (file: File) => Promise<void>;
  setCurrentPage: (page: number) => Promise<void>;
  togglePageSelected: (page: number) => void;
  setTemplate: (templateId: string) => Promise<void>;
  updateFrameSetting: <K extends keyof FrameStyleSettings>(
    key: K,
    value: FrameStyleSettings[K]
  ) => Promise<void>;
  applyTemplateToTarget: (target: ApplyTarget) => Promise<void>;
  exportPages: (options: {
    target: "current" | "selected" | "all";
    format: ExportFormat;
    zip: boolean;
  }) => Promise<void>;
  clearExportSuccess: () => void;
  reset: () => void;
}

const PRESELECT_COUNT = 9;
const THUMBNAIL_SOURCE_WIDTH = 320;
const PREVIEW_SOURCE_WIDTH = 1200;
const RENDER_CONCURRENCY = 2;

function styleSignature(style: FrameStyleSettings): string {
  return [
    style.ratio,
    style.backgroundColor,
    style.borderColor,
    style.borderWidth,
    style.borderRadius,
    style.outerMargin,
    style.innerPadding
  ].join("|");
}

export function usePdfUpload(): UsePdfUploadResult {
  const [status, setStatus] = useState<ParseStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPageState] = useState(1);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [currentPreview, setCurrentPreview] = useState<string | null>(null);
  const [isRenderingPreview, setIsRenderingPreview] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState(DEFAULT_TEMPLATE.id);
  const [frameSettings, setFrameSettings] = useState<FrameStyleSettings>(DEFAULT_TEMPLATE.settings);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [coverBaseImage, setCoverBaseImage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSuccessMessage, setExportSuccessMessage] = useState("");

  const mountedRef = useRef(true);
  const pdfRef = useRef<PdfDocumentLike | null>(null);
  const appliedPageStyleRef = useRef<Map<number, FrameStyleSettings>>(new Map());
  const renderCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    pdfRef.current = null;
    appliedPageStyleRef.current = new Map();
    renderCacheRef.current = new Map();
    setStatus("idle");
    setProgress(0);
    setError(null);
    setFileName("");
    setTotalPages(0);
    setCurrentPageState(1);
    setSelectedPages(new Set());
    setThumbnails([]);
    setCurrentPreview(null);
    setIsRenderingPreview(false);
    setActiveTemplateId(DEFAULT_TEMPLATE.id);
    setFrameSettings(DEFAULT_TEMPLATE.settings);
    setIsApplyingTemplate(false);
    setCoverBaseImage(null);
    setIsExporting(false);
    setExportProgress(0);
    setExportSuccessMessage("");
  }, []);

  const validatePdf = useCallback((file: File): string | null => {
    const isPdfType = file.type === "application/pdf";
    const isPdfExt = file.name.toLowerCase().endsWith(".pdf");

    if (!isPdfType && !isPdfExt) {
      return "仅支持 PDF 文件，请重新上传。";
    }

    return null;
  }, []);

  const renderPdfPageImage = useCallback(
    async (pdf: PdfDocumentLike, pageNumber: number, targetWidth: number): Promise<string> => {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const scale = targetWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("无法初始化 Canvas 上下文。");
      }

      canvas.width = Math.floor(scaledViewport.width);
      canvas.height = Math.floor(scaledViewport.height);
      await page.render({ canvasContext: context, viewport: scaledViewport }).promise;

      return canvas.toDataURL("image/png");
    },
    []
  );

  const getEffectiveStyle = useCallback(
    (page: number): FrameStyleSettings => {
      return appliedPageStyleRef.current.get(page) ?? frameSettings;
    },
    [frameSettings]
  );

  const renderFramedPage = useCallback(
    async (page: number, sourceWidth: number, style: FrameStyleSettings): Promise<string> => {
      if (!pdfRef.current) {
        throw new Error("PDF 尚未加载");
      }

      const cacheKey = `${page}-${sourceWidth}-${styleSignature(style)}`;
      const cached = renderCacheRef.current.get(cacheKey);
      if (cached) {
        return cached;
      }

      const source = await renderPdfPageImage(pdfRef.current, page, sourceWidth);
      const framed = await renderImageWithFrame(source, style);
      renderCacheRef.current.set(cacheKey, framed);
      return framed;
    },
    [renderPdfPageImage]
  );

  const refreshPreview = useCallback(
    async (page: number, styleOverride?: FrameStyleSettings) => {
      if (!pdfRef.current) {
        return;
      }
      const maxPages = pdfRef.current.numPages;
      if (page < 1 || page > maxPages) {
        return;
      }

      setCurrentPageState(page);

      try {
        setIsRenderingPreview(true);
        const style = styleOverride ?? getEffectiveStyle(page);
        const preview = await renderFramedPage(page, PREVIEW_SOURCE_WIDTH, style);
        if (mountedRef.current) {
          setCurrentPreview(preview);
        }
      } catch (previewError) {
        const message = previewError instanceof Error ? previewError.message : "预览渲染失败。";
        if (mountedRef.current) {
          setError(message);
        }
      } finally {
        if (mountedRef.current) {
          setIsRenderingPreview(false);
        }
      }
    },
    [getEffectiveStyle, renderFramedPage]
  );

  const refreshCoverBaseImage = useCallback(async () => {
    if (!pdfRef.current || pdfRef.current.numPages < 1) {
      if (mountedRef.current) {
        setCoverBaseImage(null);
      }
      return;
    }

    const coverStyle = getEffectiveStyle(1);
    const coverImage = await renderFramedPage(1, PREVIEW_SOURCE_WIDTH, coverStyle);
    if (mountedRef.current) {
      setCoverBaseImage(coverImage);
    }
  }, [getEffectiveStyle, renderFramedPage]);

  const renderThumbnailsForPages = useCallback(
    async (pages: number[]) => {
      if (!pdfRef.current || pages.length === 0) {
        return;
      }

      let done = 0;
      const queue = [...pages];

      const worker = async () => {
        while (queue.length > 0) {
          const page = queue.shift();
          if (!page) {
            return;
          }

          const style = getEffectiveStyle(page);
          const image = await renderFramedPage(page, THUMBNAIL_SOURCE_WIDTH, style);

          if (!mountedRef.current) {
            return;
          }

          setThumbnails((prev) => {
            const next = [...prev];
            next[page - 1] = image;
            return next;
          });

          done += 1;
          setProgress((prev) => Math.max(prev, Math.min(99, Math.round((done / pages.length) * 100))));

          if (done % 2 === 0) {
            await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
          }
        }
      };

      await Promise.all(Array.from({ length: Math.min(RENDER_CONCURRENCY, pages.length) }, worker));
    },
    [getEffectiveStyle, renderFramedPage]
  );

  const setCurrentPage = useCallback(
    async (page: number) => {
      await refreshPreview(page);
    },
    [refreshPreview]
  );

  const togglePageSelected = useCallback((page: number) => {
    setSelectedPages((previous) => {
      const next = new Set(previous);
      if (next.has(page)) {
        next.delete(page);
      } else {
        next.add(page);
      }
      return next;
    });
  }, []);

  const setTemplate = useCallback(
    async (templateId: string) => {
      const template = FRAME_TEMPLATES.find((item) => item.id === templateId);
      if (!template) {
        return;
      }

      setActiveTemplateId(templateId);
      setFrameSettings(template.settings);
      renderCacheRef.current.clear();

      if (!pdfRef.current) {
        return;
      }

      if (currentPage === 1) {
        try {
          setIsRenderingPreview(true);
          const cover = await renderFramedPage(1, PREVIEW_SOURCE_WIDTH, template.settings);
          if (mountedRef.current) {
            setCurrentPageState(1);
            setCurrentPreview(cover);
            setCoverBaseImage(cover);
          }
        } finally {
          if (mountedRef.current) {
            setIsRenderingPreview(false);
          }
        }
      } else {
        await Promise.all([refreshPreview(currentPage, template.settings), refreshCoverBaseImage()]);
      }
    },
    [currentPage, refreshCoverBaseImage, refreshPreview, renderFramedPage]
  );

  const updateFrameSetting = useCallback(
    async <K extends keyof FrameStyleSettings>(key: K, value: FrameStyleSettings[K]) => {
      const next = {
        ...frameSettings,
        [key]: value
      };
      setFrameSettings(next);
      setActiveTemplateId("custom");
      renderCacheRef.current.clear();

      if (!pdfRef.current) {
        return;
      }

      if (currentPage === 1) {
        try {
          setIsRenderingPreview(true);
          const cover = await renderFramedPage(1, PREVIEW_SOURCE_WIDTH, next);
          if (mountedRef.current) {
            setCurrentPageState(1);
            setCurrentPreview(cover);
            setCoverBaseImage(cover);
          }
        } finally {
          if (mountedRef.current) {
            setIsRenderingPreview(false);
          }
        }
      } else {
        await Promise.all([refreshPreview(currentPage, next), refreshCoverBaseImage()]);
      }
    },
    [currentPage, frameSettings, refreshCoverBaseImage, refreshPreview, renderFramedPage]
  );

  const applyTemplateToTarget = useCallback(
    async (target: ApplyTarget) => {
      if (!pdfRef.current) {
        return;
      }

      setIsApplyingTemplate(true);
      try {
        let pages: number[] = [];
        if (target === "current") {
          pages = [currentPage];
        } else if (target === "selected") {
          pages = Array.from(selectedPages.values()).sort((a, b) => a - b);
        } else {
          pages = Array.from({ length: totalPages }, (_, index) => index + 1);
        }

        if (pages.length === 0) {
          return;
        }

        pages.forEach((page) => {
          appliedPageStyleRef.current.set(page, frameSettings);
        });

        renderCacheRef.current.clear();
        await renderThumbnailsForPages(pages);

        if (pages.includes(currentPage)) {
          await refreshPreview(currentPage);
        }
        if (pages.includes(1)) {
          await refreshCoverBaseImage();
        }
      } catch (applyError) {
        const message = applyError instanceof Error ? applyError.message : "模板应用失败";
        if (mountedRef.current) {
          setError(message);
        }
      } finally {
        if (mountedRef.current) {
          setIsApplyingTemplate(false);
        }
      }
    },
    [
      currentPage,
      frameSettings,
      refreshCoverBaseImage,
      refreshPreview,
      renderThumbnailsForPages,
      selectedPages,
      totalPages
    ]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validationError = validatePdf(file);
      if (validationError) {
        reset();
        setStatus("error");
        setError(validationError);
        return;
      }

      try {
        setStatus("parsing");
        setProgress(0);
        setError(null);
        setFileName(file.name);

        const buffer = await file.arrayBuffer();
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

        const loadingTask = pdfjs.getDocument({ data: buffer });
        loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
          if (!progressData.total || !mountedRef.current) {
            return;
          }

          const nextProgress = Math.min(
            90,
            Math.floor((progressData.loaded / progressData.total) * 100)
          );
          setProgress(nextProgress);
        };

        const pdf = (await loadingTask.promise) as PdfDocumentLike;
        pdfRef.current = pdf;
        appliedPageStyleRef.current = new Map();
        renderCacheRef.current.clear();

        const pages = pdf.numPages;
        setTotalPages(pages);

        const defaultSelected = new Set<number>();
        for (let page = 1; page <= Math.min(PRESELECT_COUNT, pages); page += 1) {
          defaultSelected.add(page);
        }
        setSelectedPages(defaultSelected);

        setThumbnails(new Array<string>(pages).fill(""));

        await renderThumbnailsForPages(Array.from({ length: pages }, (_, idx) => idx + 1));

        if (!mountedRef.current) {
          return;
        }

        setProgress(100);
        setStatus("ready");

        await refreshPreview(1);
        await refreshCoverBaseImage();
      } catch (parseError) {
        reset();
        setStatus("error");
        const message = parseError instanceof Error ? parseError.message : "PDF 解析失败，请重试。";
        setError(message);
      }
    },
    [refreshCoverBaseImage, refreshPreview, renderThumbnailsForPages, reset, validatePdf]
  );

  const clearExportSuccess = useCallback(() => {
    setExportSuccessMessage("");
  }, []);

  const exportPages = useCallback(
    async (options: { target: "current" | "selected" | "all"; format: ExportFormat; zip: boolean }) => {
      if (!pdfRef.current || totalPages === 0) {
        return;
      }

      setIsExporting(true);
      setExportProgress(0);
      setExportSuccessMessage("");

      try {
        let pages: number[] = [];
        if (options.target === "current") {
          pages = [currentPage];
        } else if (options.target === "selected") {
          pages = Array.from(selectedPages.values()).sort((a, b) => a - b);
        } else {
          pages = Array.from({ length: totalPages }, (_, index) => index + 1);
        }

        if (pages.length === 0) {
          return;
        }

        const docName = sanitizeDocName(fileName);

        const rendered = await Promise.all(
          pages.map(async (page, index) => {
            const image = await renderFramedPage(page, PREVIEW_SOURCE_WIDTH, getEffectiveStyle(page));
            const converted = await convertDataUrlFormat(image, options.format);
            if (mountedRef.current) {
              setExportProgress(Math.round(((index + 1) / pages.length) * 80));
            }
            return {
              page,
              fileNameOnly: buildPageFileName(docName, page, options.format),
              dataUrl: converted
            };
          })
        );

        rendered.sort((a, b) => a.page - b.page);

        if (rendered.length === 1 || !options.zip) {
          rendered.forEach((item) => {
            triggerBlobDownload(dataUrlToBlob(item.dataUrl), item.fileNameOnly);
          });
        } else {
          const zip = new JSZip();
          rendered.forEach((item) => {
            zip.file(item.fileNameOnly, dataUrlToBlob(item.dataUrl));
          });

          const zipBlob = await zip.generateAsync(
            { type: "blob" },
            (metadata) => {
              if (mountedRef.current) {
                setExportProgress(80 + Math.round(metadata.percent * 0.2));
              }
            }
          );

          triggerBlobDownload(zipBlob, `${docName}_${options.target}.zip`);
        }

        if (mountedRef.current) {
          setExportProgress(100);
          setExportSuccessMessage(`已完成导出，共 ${pages.length} 张图片。`);
        }
      } finally {
        if (mountedRef.current) {
          setIsExporting(false);
        }
      }
    },
    [currentPage, fileName, getEffectiveStyle, renderFramedPage, selectedPages, totalPages]
  );

  return useMemo(
    () => ({
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
    }),
    [
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
    ]
  );
}
