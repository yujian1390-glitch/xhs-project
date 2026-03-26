export type CanvasRatio = "origin" | "3:4" | "1:1";

export type ApplyTarget = "current" | "selected" | "all";

export interface FrameStyleSettings {
  ratio: CanvasRatio;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  outerMargin: number;
  innerPadding: number;
}

export interface FrameTemplate {
  id: string;
  name: string;
  settings: FrameStyleSettings;
}
