"use client";

import { DEFAULT_TEMPLATE, FRAME_TEMPLATES } from "@/constants/frameTemplates";
import { useCallback, useMemo, useRef, useState } from "react";
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

  const pdfRef = useRef<any>(null);
  const appliedPageStyleRef = useRef<Map<number, FrameStyleSettings>>(new Map());

  const reset = useCallback(() => {
    pdfRef.current = null;
    appliedPageStyleRef.current = new Map();
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
    async (pdf: any, pageNumber: number, targetWidth: number): Promise<string> => {
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

      const source = await renderPdfPageImage(pdfRef.current, page, sourceWidth);
      return renderImageWithFrame(source, style);
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
        setCurrentPreview(preview);
      } catch (previewError) {
        const message = previewError instanceof Error ? previewError.message : "预览渲染失败。";
        setError(message);
      } finally {
        setIsRenderingPreview(false);
      }
    },
    [getEffectiveStyle, renderFramedPage]
  );

  const refreshThumbnails = useCallback(
    async (pages: number[]) => {
      if (!pdfRef.current || pages.length === 0) {
        return;
      }

      setThumbnails((prev) => {
        const next = [...prev];
        pages.forEach((page) => {
          if (!next[page - 1]) {
            next[page - 1] = "";
          }
        });
        return next;
      });

      for (const page of pages) {
        const style = getEffectiveStyle(page);
        const image = await renderFramedPage(page, THUMBNAIL_SOURCE_WIDTH, style);

        setThumbnails((prev) => {
          const next = [...prev];
          next[page - 1] = image;
          return next;
        });
      }
    },
    [getEffectiveStyle, renderFramedPage]
  );

  const refreshCoverBaseImage = useCallback(async () => {
    if (!pdfRef.current || pdfRef.current.numPages < 1) {
      setCoverBaseImage(null);
      return;
    }

    const coverStyle = getEffectiveStyle(1);
    const coverImage = await renderFramedPage(1, PREVIEW_SOURCE_WIDTH, coverStyle);
    setCoverBaseImage(coverImage);
  }, [getEffectiveStyle, renderFramedPage]);

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

      if (pdfRef.current) {
        await refreshPreview(currentPage, template.settings);
        await refreshCoverBaseImage();
      }
    },
    [currentPage, refreshCoverBaseImage, refreshPreview]
  );

  const updateFrameSetting = useCallback(
    async <K extends keyof FrameStyleSettings>(key: K, value: FrameStyleSettings[K]) => {
      const next = {
        ...frameSettings,
        [key]: value
      };
      setFrameSettings(next);
      setActiveTemplateId("custom");

      if (pdfRef.current) {
        await refreshPreview(currentPage, next);
        await refreshCoverBaseImage();
      }
    },
    [currentPage, frameSettings, refreshCoverBaseImage, refreshPreview]
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

        await refreshThumbnails(pages);

        if (pages.includes(currentPage)) {
          await refreshPreview(currentPage);
        }
        if (pages.includes(1)) {
          await refreshCoverBaseImage();
        }
      } catch (applyError) {
        const message = applyError instanceof Error ? applyError.message : "模板应用失败";
        setError(message);
      } finally {
        setIsApplyingTemplate(false);
      }
    },
    [
      currentPage,
      frameSettings,
      refreshCoverBaseImage,
      refreshPreview,
      refreshThumbnails,
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
        loadingTask.onProgress = (progressData) => {
          if (!progressData.total) {
            return;
          }

          const nextProgress = Math.min(
            90,
            Math.floor((progressData.loaded / progressData.total) * 100)
          );
          setProgress(nextProgress);
        };

        const pdf = await loadingTask.promise;
        pdfRef.current = pdf;
        appliedPageStyleRef.current = new Map();

        const pages = pdf.numPages;
        setTotalPages(pages);

        const defaultSelected = new Set<number>();
        for (let page = 1; page <= Math.min(PRESELECT_COUNT, pages); page += 1) {
          defaultSelected.add(page);
        }
        setSelectedPages(defaultSelected);

        const nextThumbnails = new Array<string>(pages).fill("");
        setThumbnails(nextThumbnails);

        for (let page = 1; page <= pages; page += 1) {
          const framed = await renderFramedPage(page, THUMBNAIL_SOURCE_WIDTH, frameSettings);
          nextThumbnails[page - 1] = framed;
          setThumbnails([...nextThumbnails]);
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
    [frameSettings, refreshCoverBaseImage, refreshPreview, renderFramedPage, reset, validatePdf]
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
          setIsExporting(false);
          return;
        }

        const docName = sanitizeDocName(fileName);

        if (pages.length === 1 || !options.zip) {
          if (pages.length === 1) {
            const page = pages[0];
            const image = await renderFramedPage(page, PREVIEW_SOURCE_WIDTH, getEffectiveStyle(page));
            const converted = await convertDataUrlFormat(image, options.format);
            const fileNameOnly = buildPageFileName(docName, page, options.format);
            triggerBlobDownload(dataUrlToBlob(converted), fileNameOnly);
          } else {
            for (let index = 0; index < pages.length; index += 1) {
              const page = pages[index];
              const image = await renderFramedPage(page, PREVIEW_SOURCE_WIDTH, getEffectiveStyle(page));
              const converted = await convertDataUrlFormat(image, options.format);
              const fileNameOnly = buildPageFileName(docName, page, options.format);
              triggerBlobDownload(dataUrlToBlob(converted), fileNameOnly);
              setExportProgress(Math.round(((index + 1) / pages.length) * 100));
            }
          }
        } else {
          const zip = new JSZip();

          for (let index = 0; index < pages.length; index += 1) {
            const page = pages[index];
            const image = await renderFramedPage(page, PREVIEW_SOURCE_WIDTH, getEffectiveStyle(page));
            const converted = await convertDataUrlFormat(image, options.format);
            const fileNameOnly = buildPageFileName(docName, page, options.format);
            zip.file(fileNameOnly, dataUrlToBlob(converted));
            setExportProgress(Math.round(((index + 1) / pages.length) * 85));
          }

          const zipBlob = await zip.generateAsync(
            { type: "blob" },
            (metadata) => setExportProgress(85 + Math.round(metadata.percent * 0.15))
          );
          triggerBlobDownload(zipBlob, `${docName}_${options.target}.zip`);
        }

        setExportProgress(100);
        setExportSuccessMessage(`已完成导出，共 ${pages.length} 张图片。`);
      } finally {
        setIsExporting(false);
      }
    },
    [currentPage, fileName, getEffectiveStyle, selectedPages, totalPages, renderFramedPage]
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
