import { cropCanvas, shrinkCanvas } from "./canvas";

type GradientColorStop = { color: string, pos: number };

const shrinkCanvasVertically = (source: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = source.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get rendering context.");
  }

  const { data } = ctx.getImageData(0, 0, source.width, source.height);

  let top = 0;
  topLoop: for (; top < source.height; top += 1) {
    for (let x = 0; x < source.width; x += 1) {
      if (data[(top * source.width + x) * 4 + 3]) {
        break topLoop;
      }
    }
  }

  let bottom = source.height - 1;
  bottomLoop: for (; bottom >= top; bottom -= 1) {
    for (let x = 0; x < source.width; x += 1) {
      if (data[(bottom * source.width + x) * 4 + 3]) {
        break bottomLoop;
      }
    }
  }

  return cropCanvas(source, 0, top, source.width, (bottom - top + 1) || 1);
};

const drawFixedWidthText = (
  ctx: CanvasRenderingContext2D,
  line: string,
  x: number,
  y: number,
  cellWidth: number,
  stroke: boolean,
): void => {
  Array.from(line).forEach((char, ix) => {
    if (!char.trim()) {
      return;
    }
    const { width } = ctx.measureText(char);
    const left = x + ix * cellWidth + (cellWidth - width) / 2;
    if (stroke) {
      ctx.strokeText(char, left, y);
    } else {
      ctx.fillText(char, left, y);
    }
  });
};

/* Create a new canvas and render a single-line text. Returns the cropped canvas object. */
const makeTextImageSingleLine = (
  line: string,
  color: string,
  font: string,
  fontHeight: number,
  outlineColors: string[],
  gradient: GradientColorStop[],
  gradientPos?: number[],
  gradientMarker?: boolean,
  letterSpacing?: number,
  margin?: number,
  fixedCharacterWidth?: boolean,
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  const marginPx = fontHeight * (margin ?? 0.025);
  const letterSpacingPx = letterSpacing ? Math.round(letterSpacing * fontHeight) : 0;
  const fixedCharacterCellWidth = Math.max(1, fontHeight + letterSpacingPx);
  const fixedCharacterCount = Math.max(1, Array.from(line).length);
  const fixedCharacterBuffer = fixedCharacterWidth ? fontHeight : 0;
  const renderWidth = fixedCharacterWidth
    ? fixedCharacterCellWidth * fixedCharacterCount + marginPx * 2 + fixedCharacterBuffer * 2
    : fontHeight * (line.length || 1) * 2;
  canvas.width = renderWidth;
  canvas.height = fontHeight * 2;
  canvas.style.letterSpacing = !fixedCharacterWidth && letterSpacing ? `${letterSpacingPx}px` : "";

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get rendering context.");
  }

  ctx.font = font.replace(/([0-9.]+)em/, (_, emHeight) => `${fontHeight * emHeight}px`);
  ctx.textBaseline = "top";
  ctx.lineJoin = "round";
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  ctx.letterSpacing = !fixedCharacterWidth && letterSpacing ? `${letterSpacingPx}px` : "";

  const textLeft = fixedCharacterBuffer + marginPx;
  const gradientWidth = fixedCharacterWidth
    ? fixedCharacterCellWidth * fixedCharacterCount + marginPx * 2
    : fontHeight * (line.length || 1) + marginPx * 2;

  for (let i = outlineColors.length - 1; i >= 0; i -= 1) {
    ctx.strokeStyle = outlineColors[i];
    ctx.lineWidth = (i + 1) * 16;
    if (fixedCharacterWidth) {
      drawFixedWidthText(ctx, line, textLeft, marginPx, fixedCharacterCellWidth, true);
    } else {
      ctx.strokeText(line, marginPx, marginPx);
    }
  }

  if (gradient.length) {
    const x0 = gradientPos?.[0]
      ? fixedCharacterBuffer + gradientWidth * gradientPos[0] / 100
      : fixedCharacterBuffer;
    const y0 = gradientPos?.[1]
      ? (fontHeight + marginPx * 2) * gradientPos[1] / 100
      : 0;
    const x1 = gradientPos?.[2]
      ? fixedCharacterBuffer + gradientWidth * gradientPos[2] / 100
      : fixedCharacterBuffer;
    const y1 = gradientPos?.[3]
      ? (fontHeight + marginPx * 2) * gradientPos[3] / 100
      : 0;
    if (gradientMarker) {
      ctx.fillStyle = "red";
      ctx.fillRect(x0, y0, 16, 16);
      ctx.fillStyle = "blue";
      ctx.fillRect(x1, y1, 16, 16);
    }
    const gradientObj = ctx.createLinearGradient(x0, y0, x1, y1);
    gradient.forEach((colorStop) => {
      gradientObj.addColorStop(colorStop.pos / 100, colorStop.color);
    });
    ctx.fillStyle = gradientObj;
  } else {
    ctx.fillStyle = color;
  }
  if (fixedCharacterWidth) {
    drawFixedWidthText(ctx, line, textLeft, marginPx, fixedCharacterCellWidth, false);
    return shrinkCanvasVertically(canvas);
  }
  ctx.fillText(line, marginPx, marginPx);

  return shrinkCanvas(canvas);
};

/* Create an image from a (possibly) multi-line text and return as a BlobURL. */
export const makeTextImage = (
  text: string,
  color: string,
  font: string,
  fontHeight: number,
  align: string,
  lineSpacing: number,
  outlineColors: string[],
  gradient: GradientColorStop[],
  padding: number,
  gradientPos?: number[],
  gradientMarker?: boolean,
  letterSpacing?: number,
  margin?: number,
  fixedCharacterWidth?: boolean,
): HTMLCanvasElement => {
  const lineSpacingPixels = Math.round(lineSpacing * fontHeight);
  const paddingPixels = Math.round(padding * fontHeight);

  const images = text.split("\n").map((line) => (
    makeTextImageSingleLine(
      line,
      color,
      font,
      fontHeight,
      outlineColors,
      gradient,
      gradientPos,
      gradientMarker,
      letterSpacing,
      margin,
      fixedCharacterWidth,
    )
  ));
  const lineWidths = images.map((canvas) => canvas.width);
  const maxWidth = Math.max.apply(null, lineWidths);
  const totalHeight = lineSpacingPixels * (images.length - 1) + images.reduce((l, r) => (
    l + r.height
  ), 0);

  const canvas = document.createElement("canvas");
  canvas.width = maxWidth + (paddingPixels * 2);
  canvas.height = totalHeight + (paddingPixels * 2);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get rendering context.");
  }

  let currentHeight = paddingPixels;
  images.forEach((image, ix) => {
    ctx.save();

    if (align === "right") {
      ctx.translate(maxWidth - lineWidths[ix], 0);
    } else if (align === "center") {
      ctx.translate((maxWidth - lineWidths[ix]) / 2, 0);
    } else if (align === "stretch") {
      ctx.transform(maxWidth / lineWidths[ix], 0, 0, 1, 0, 0);
    }

    ctx.drawImage(image, paddingPixels, currentHeight);
    currentHeight += image.height + lineSpacingPixels;

    ctx.restore();
  });

  return canvas;
};
