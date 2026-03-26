import type { CanvasRatio, FrameStyleSettings } from "@/types/frameTemplate";

interface CanvasLayout {
  canvasWidth: number;
  canvasHeight: number;
  cardX: number;
  cardY: number;
  cardWidth: number;
  cardHeight: number;
  imageX: number;
  imageY: number;
  imageWidth: number;
  imageHeight: number;
}

function parseRatio(ratio: CanvasRatio): number | null {
  if (ratio === "origin") {
    return null;
  }

  const [w, h] = ratio.split(":").map(Number);
  if (!w || !h) {
    return null;
  }

  return w / h;
}

export function calculateCanvasLayout(
  sourceWidth: number,
  sourceHeight: number,
  settings: FrameStyleSettings
): CanvasLayout {
  const cardWidth = sourceWidth + (settings.innerPadding + settings.borderWidth) * 2;
  const cardHeight = sourceHeight + (settings.innerPadding + settings.borderWidth) * 2;

  const minCanvasWidth = cardWidth + settings.outerMargin * 2;
  const minCanvasHeight = cardHeight + settings.outerMargin * 2;

  const ratioValue = parseRatio(settings.ratio);

  let canvasWidth = minCanvasWidth;
  let canvasHeight = minCanvasHeight;

  if (ratioValue) {
    if (canvasWidth / canvasHeight > ratioValue) {
      canvasHeight = canvasWidth / ratioValue;
    } else {
      canvasWidth = canvasHeight * ratioValue;
    }
  }

  const cardX = (canvasWidth - cardWidth) / 2;
  const cardY = (canvasHeight - cardHeight) / 2;

  const imageX = cardX + settings.borderWidth + settings.innerPadding;
  const imageY = cardY + settings.borderWidth + settings.innerPadding;

  return {
    canvasWidth: Math.round(canvasWidth),
    canvasHeight: Math.round(canvasHeight),
    cardX,
    cardY,
    cardWidth,
    cardHeight,
    imageX,
    imageY,
    imageWidth: sourceWidth,
    imageHeight: sourceHeight
  };
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.max(0, Math.min(radius, Math.min(width, height) / 2));

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.arcTo(x + width, y, x + width, y + safeRadius, safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.arcTo(x + width, y + height, x + width - safeRadius, y + height, safeRadius);
  context.lineTo(x + safeRadius, y + height);
  context.arcTo(x, y + height, x, y + height - safeRadius, safeRadius);
  context.lineTo(x, y + safeRadius);
  context.arcTo(x, y, x + safeRadius, y, safeRadius);
  context.closePath();
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("无法加载页面图片"));
    image.src = dataUrl;
  });
}

export async function renderImageWithFrame(
  sourceDataUrl: string,
  settings: FrameStyleSettings
): Promise<string> {
  const image = await loadImage(sourceDataUrl);
  const layout = calculateCanvasLayout(image.width, image.height, settings);

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("无法创建画布上下文");
  }

  canvas.width = layout.canvasWidth;
  canvas.height = layout.canvasHeight;

  context.fillStyle = settings.backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = settings.borderColor;
  drawRoundedRect(
    context,
    layout.cardX,
    layout.cardY,
    layout.cardWidth,
    layout.cardHeight,
    settings.borderRadius
  );
  context.fill();

  context.fillStyle = "#ffffff";
  const innerX = layout.cardX + settings.borderWidth;
  const innerY = layout.cardY + settings.borderWidth;
  const innerWidth = layout.cardWidth - settings.borderWidth * 2;
  const innerHeight = layout.cardHeight - settings.borderWidth * 2;
  drawRoundedRect(
    context,
    innerX,
    innerY,
    innerWidth,
    innerHeight,
    Math.max(0, settings.borderRadius - settings.borderWidth)
  );
  context.fill();

  context.save();
  drawRoundedRect(
    context,
    layout.imageX,
    layout.imageY,
    layout.imageWidth,
    layout.imageHeight,
    Math.max(0, settings.borderRadius - settings.borderWidth - settings.innerPadding)
  );
  context.clip();
  context.drawImage(image, layout.imageX, layout.imageY, layout.imageWidth, layout.imageHeight);
  context.restore();

  return canvas.toDataURL("image/png");
}
