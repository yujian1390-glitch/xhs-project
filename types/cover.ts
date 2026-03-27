export type CoverLayoutType =
  | "top-banner"
  | "corner-sticker"
  | "bottom-bar"
  | "center-focus";

export interface CoverDraft {
  title: string;
  subtitle: string;
  emoji: string;
  tags: string[];
  layout: CoverLayoutType;
}

export interface CoverElementBox {
  x: number;
  y: number;
  width: number;
  height?: number;
  // v2 预留：后续接入拖拽时可扩展 draggable/rotation 等信息
  draggable?: boolean;
}

export interface CoverLayoutConfig {
  id: CoverLayoutType;
  name: string;
  titleBox: CoverElementBox;
  subtitleBox: CoverElementBox;
  tagBox: CoverElementBox;
  style: {
    titleFontSize: number;
    subtitleFontSize: number;
    titleColor: string;
    subtitleColor: string;
    panelFill?: string;
    panelHeight?: number;
    panelY?: number;
    panelOpacity?: number;
    tagFill: string;
    tagTextColor: string;
  };
}
