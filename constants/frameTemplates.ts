import type { FrameTemplate } from "@/types/frameTemplate";

export const FRAME_TEMPLATES: FrameTemplate[] = [
  {
    id: "minimal-white",
    name: "极简白边",
    settings: {
      ratio: "origin",
      backgroundColor: "#ffffff",
      borderColor: "#e5e7eb",
      borderWidth: 12,
      borderRadius: 20,
      outerMargin: 28,
      innerPadding: 16
    }
  },
  {
    id: "cream-card",
    name: "奶油卡片",
    settings: {
      ratio: "3:4",
      backgroundColor: "#f8f1e5",
      borderColor: "#e8d8bf",
      borderWidth: 14,
      borderRadius: 26,
      outerMargin: 28,
      innerPadding: 18
    }
  },
  {
    id: "pink-note",
    name: "浅粉笔记",
    settings: {
      ratio: "3:4",
      backgroundColor: "#fdecef",
      borderColor: "#f8c9d3",
      borderWidth: 10,
      borderRadius: 24,
      outerMargin: 30,
      innerPadding: 16
    }
  },
  {
    id: "beige-list",
    name: "米黄清单",
    settings: {
      ratio: "3:4",
      backgroundColor: "#f5edd8",
      borderColor: "#d7c59f",
      borderWidth: 12,
      borderRadius: 16,
      outerMargin: 30,
      innerPadding: 18
    }
  },
  {
    id: "gray-doc",
    name: "灰白资料风",
    settings: {
      ratio: "origin",
      backgroundColor: "#f3f4f6",
      borderColor: "#d1d5db",
      borderWidth: 10,
      borderRadius: 14,
      outerMargin: 24,
      innerPadding: 14
    }
  },
  {
    id: "mono-minimal",
    name: "黑白极简",
    settings: {
      ratio: "1:1",
      backgroundColor: "#111111",
      borderColor: "#ffffff",
      borderWidth: 8,
      borderRadius: 8,
      outerMargin: 24,
      innerPadding: 14
    }
  }
];

export const DEFAULT_TEMPLATE = FRAME_TEMPLATES[0];
