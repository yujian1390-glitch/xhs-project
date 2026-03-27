import type { CoverLayoutConfig } from "@/types/cover";

export const COVER_LAYOUTS: CoverLayoutConfig[] = [
  {
    id: "top-banner",
    name: "顶部白条标题",
    titleBox: { x: 56, y: 36, width: 760 },
    subtitleBox: { x: 56, y: 98, width: 760 },
    tagBox: { x: 56, y: 140, width: 760 },
    style: {
      titleFontSize: 42,
      subtitleFontSize: 24,
      titleColor: "#111827",
      subtitleColor: "#334155",
      panelFill: "#ffffff",
      panelHeight: 168,
      panelY: 24,
      panelOpacity: 0.92,
      tagFill: "#f1f5f9",
      tagTextColor: "#1e293b"
    }
  },
  {
    id: "corner-sticker",
    name: "左上角贴纸标题",
    titleBox: { x: 48, y: 48, width: 520 },
    subtitleBox: { x: 48, y: 126, width: 520 },
    tagBox: { x: 48, y: 174, width: 520 },
    style: {
      titleFontSize: 40,
      subtitleFontSize: 22,
      titleColor: "#0f172a",
      subtitleColor: "#334155",
      panelFill: "#fef3c7",
      panelHeight: 198,
      panelY: 36,
      panelOpacity: 0.95,
      tagFill: "#fde68a",
      tagTextColor: "#92400e"
    }
  },
  {
    id: "bottom-bar",
    name: "底部说明条",
    titleBox: { x: 56, y: 500, width: 760 },
    subtitleBox: { x: 56, y: 558, width: 760 },
    tagBox: { x: 56, y: 608, width: 760 },
    style: {
      titleFontSize: 40,
      subtitleFontSize: 22,
      titleColor: "#ffffff",
      subtitleColor: "#e2e8f0",
      panelFill: "#020617",
      panelHeight: 244,
      panelY: 472,
      panelOpacity: 0.78,
      tagFill: "#1e293b",
      tagTextColor: "#f8fafc"
    }
  },
  {
    id: "center-focus",
    name: "中间大标题",
    titleBox: { x: 96, y: 280, width: 680 },
    subtitleBox: { x: 96, y: 396, width: 680 },
    tagBox: { x: 96, y: 446, width: 680 },
    style: {
      titleFontSize: 54,
      subtitleFontSize: 26,
      titleColor: "#ffffff",
      subtitleColor: "#e2e8f0",
      panelFill: "#0f172a",
      panelHeight: 280,
      panelY: 246,
      panelOpacity: 0.62,
      tagFill: "#334155",
      tagTextColor: "#f8fafc"
    }
  }
];

export const DEFAULT_COVER_LAYOUT = COVER_LAYOUTS[0];
export const TAG_PRESETS = ["干货", "教程", "效率", "避坑", "收藏", "必看", "实测", "模板"];
export const EMOJI_PRESETS = ["✨", "🔥", "📌", "✅", "💡", "📚", "🧠", "🎯", "📝", "🚀"];
