"use client";

import { COVER_LAYOUTS } from "@/constants/coverLayouts";
import type { CoverDraft } from "@/types/cover";
import { useEffect, useMemo, useState } from "react";
import { Image as KonvaImage, Layer, Rect, Stage, Tag, Text, Label } from "react-konva";
import type { ExportFormat } from "@/utils/exportHelpers";
import { useRef } from "react";
import type Konva from "konva";

interface CoverRendererProps {
  baseImage: string | null;
  draft: CoverDraft;
  onExportReady?: (exporter: ((format: ExportFormat) => string | null) | null) => void;
}

const CANVAS_WIDTH = 864;
const CANVAS_HEIGHT = 1152;

export function CoverRenderer({ baseImage, draft, onExportReady }: CoverRendererProps) {
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  useEffect(() => {
    if (!baseImage) {
      setImageObj(null);
      return;
    }

    let cancelled = false;
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = baseImage;
    image.onload = () => {
      if (!cancelled) {
        setImageObj(image);
      }
    };
    image.onerror = () => {
      if (!cancelled) {
        setImageObj(null);
      }
    };

    return () => {
      cancelled = true;
    };
  }, [baseImage]);

  const layout = useMemo(
    () => COVER_LAYOUTS.find((item) => item.id === draft.layout) ?? COVER_LAYOUTS[0],
    [draft.layout]
  );

  useEffect(() => {
    if (!onExportReady) {
      return;
    }

    onExportReady((format) => {
      if (!stageRef.current) {
        return null;
      }

      if (format === "jpg") {
        return stageRef.current.toDataURL({ mimeType: "image/jpeg", quality: 0.92, pixelRatio: 2 });
      }

      return stageRef.current.toDataURL({ mimeType: "image/png", pixelRatio: 2 });
    });

    return () => onExportReady(null);
  }, [onExportReady]);

  if (!baseImage || !imageObj) {
    return (
      <section className="flex h-[520px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-sm text-slate-500">
        先上传 PDF，并等待首图生成
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3">
      <h3 className="mb-3 text-base font-semibold">首图实时预览（Konva）</h3>
      <div className="overflow-auto rounded border border-slate-200">
        <Stage ref={stageRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
          <Layer>
            <KonvaImage image={imageObj} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />

            {layout.style.panelFill ? (
              <Rect
                x={24}
                y={layout.style.panelY ?? 24}
                width={CANVAS_WIDTH - 48}
                height={layout.style.panelHeight ?? 180}
                cornerRadius={18}
                fill={layout.style.panelFill}
                opacity={layout.style.panelOpacity ?? 0.8}
              />
            ) : null}

            <Text
              x={layout.titleBox.x}
              y={layout.titleBox.y}
              width={layout.titleBox.width}
              text={`${draft.emoji} ${draft.title}`.trim()}
              fontSize={layout.style.titleFontSize}
              lineHeight={1.2}
              fill={layout.style.titleColor}
              fontStyle="bold"
              wrap="word"
              // v2 预留：下一版支持 draggable + transform
              draggable={layout.titleBox.draggable ?? false}
            />

            <Text
              x={layout.subtitleBox.x}
              y={layout.subtitleBox.y}
              width={layout.subtitleBox.width}
              text={draft.subtitle}
              fontSize={layout.style.subtitleFontSize}
              lineHeight={1.35}
              fill={layout.style.subtitleColor}
              wrap="word"
              draggable={layout.subtitleBox.draggable ?? false}
            />

            <Label x={layout.tagBox.x} y={layout.tagBox.y}>
              <Tag fill={layout.style.tagFill} cornerRadius={999} />
              <Text
                text={draft.tags.length > 0 ? draft.tags.map((tag) => `#${tag}`).join(" ") : "#标签"}
                fontSize={18}
                padding={10}
                fill={layout.style.tagTextColor}
              />
            </Label>
          </Layer>
        </Stage>
      </div>
    </section>
  );
}
