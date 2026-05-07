import { shrinkCanvas } from "./canvas";

type GradientColorStop = { color: string, pos: number };
type CellAlign = "left" | "center" | "right" | "justify";
type CellWidthBasis = "line" | "global";
type OpaqueBounds = { left: number, top: number, right: number, bottom: number };

const resolveFont = (font: string, fontHeight: number): string => (
  font.replace(/([0-9.]+)em/, (_, emHeight) => `${fontHeight * emHeight}px`)
);

const createMeasureContext = (
  font: string,
  fontHeight: number,
): CanvasRenderingContext2D => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get rendering context.");
  }
  ctx.font = resolveFont(font, fontHeight);
  return ctx;
};

const measureCharWidths = (
  text: string,
  font: string,
  fontHeight: number,
): number[] => {
  const ctx = createMeasureContext(font, fontHeight);
  const chars = Array.from(text || " ");
  return chars.map((char) => {
    if (char === " " || char === "　") {
      return 1;
    }
    return Math.max(ctx.measureText(char).width, 1);
  });
};

const toLetterSpacingPixels = (
  letterSpacing: number | undefined,
  fontHeight: number,
): number => Math.round((letterSpacing ?? 0) * fontHeight);

const getGradientPoint = (
  width: number,
  height: number,
  gradientPos: number[] | undefined,
  index: number,
): number => {
  if (!gradientPos?.[index]) {
    return 0;
  }
  const base = index % 2 === 0 ? width : height;
  return base * gradientPos[index] / 100;
};

const findOpaqueBounds = (source: HTMLCanvasElement): OpaqueBounds | null => {
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
  if (top >= source.height) {
    return null;
  }

  let bottom = source.height - 1;
  bottomLoop: for (; bottom >= top; bottom -= 1) {
    for (let x = 0; x < source.width; x += 1) {
      if (data[(bottom * source.width + x) * 4 + 3]) {
        break bottomLoop;
      }
    }
  }

  let left = 0;
  leftLoop: for (; left < source.width; left += 1) {
    for (let y = top; y <= bottom; y += 1) {
      if (data[(y * source.width + left) * 4 + 3]) {
        break leftLoop;
      }
    }
  }

  let right = source.width - 1;
  rightLoop: for (; right >= left; right -= 1) {
    for (let y = top; y <= bottom; y += 1) {
      if (data[(y * source.width + right) * 4 + 3]) {
        break rightLoop;
      }
    }
  }

  return {
    left,
    top,
    right,
    bottom,
  };
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
  letterSpacingPx?: number,
  margin?: number,
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = fontHeight * (line.length || 1) * 2;
  canvas.height = fontHeight * 2;
  const resolvedLetterSpacingPx = letterSpacingPx ?? 0;
  canvas.style.letterSpacing = resolvedLetterSpacingPx ? `${resolvedLetterSpacingPx}px` : "";

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get rendering context.");
  }

  ctx.font = resolveFont(font, fontHeight);
  ctx.textBaseline = "top";
  ctx.lineJoin = "round";
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  ctx.letterSpacing = resolvedLetterSpacingPx ? `${resolvedLetterSpacingPx}px` : "";

  const marginPx = fontHeight * (margin ?? 0.025);

  for (let i = outlineColors.length - 1; i >= 0; i -= 1) {
    ctx.strokeStyle = outlineColors[i];
    ctx.lineWidth = (i + 1) * 16;
    ctx.strokeText(line, marginPx, marginPx);
  }

  if (gradient.length) {
    const x0 = gradientPos?.[0]
      ? (fontHeight * (line.length || 1) + marginPx * 2) * gradientPos[0] / 100
      : 0;
    const y0 = gradientPos?.[1]
      ? (fontHeight + marginPx * 2) * gradientPos[1] / 100
      : 0;
    const x1 = gradientPos?.[2]
      ? (fontHeight * (line.length || 1) + marginPx * 2) * gradientPos[2] / 100
      : 0;
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
  ctx.fillText(line, marginPx, marginPx);

  return shrinkCanvas(canvas);
};

const makeTextImageSingleLineMonospace = (
  line: string,
  color: string,
  font: string,
  fontHeight: number,
  outlineColors: string[],
  gradient: GradientColorStop[],
  gradientPos?: number[],
  gradientMarker?: boolean,
  margin?: number,
  cellAlign?: CellAlign,
  forcedCellWidth?: number,
  letterSpacingPx?: number,
): HTMLCanvasElement => {
  const resolvedCellAlign = cellAlign || "center";
  const chars = Array.from(line || " ");
  const measuredCharWidths = measureCharWidths(chars.join(""), font, fontHeight);
  const maxMeasuredWidth = Math.max(...measuredCharWidths, fontHeight, 1);
  const cellWidth = Math.max(forcedCellWidth ?? maxMeasuredWidth, 1);
  const resolvedLetterSpacingPx = letterSpacingPx ?? 0;
  const cellAdvance = cellWidth + resolvedLetterSpacingPx;
  const marginPx = fontHeight * (margin ?? 0.025);
  const lineWidth = (cellWidth * chars.length) + (resolvedLetterSpacingPx * (chars.length - 1)) + marginPx * 2;

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(lineWidth + fontHeight);
  canvas.height = fontHeight * 2;
  canvas.style.letterSpacing = "";

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get rendering context.");
  }

  ctx.font = resolveFont(font, fontHeight);
  ctx.textBaseline = "top";
  ctx.lineJoin = "round";
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  ctx.letterSpacing = "";

  const x0 = getGradientPoint(lineWidth, canvas.height, gradientPos, 0);
  const y0 = getGradientPoint(lineWidth, canvas.height, gradientPos, 1);
  const x1 = getGradientPoint(lineWidth, canvas.height, gradientPos, 2);
  const y1 = getGradientPoint(lineWidth, canvas.height, gradientPos, 3);

  if (gradient.length) {
    const gradientObj = ctx.createLinearGradient(x0, y0, x1, y1);
    gradient.forEach((colorStop) => {
      gradientObj.addColorStop(colorStop.pos / 100, colorStop.color);
    });
    ctx.fillStyle = gradientObj;
  } else {
    ctx.fillStyle = color;
  }

  chars.forEach((char, index) => {
    const charWidth = measuredCharWidths[index] || 1;
    const cellStartX = marginPx + (index * cellAdvance);
    const offsetX = resolvedCellAlign === "left" ? 0
      : resolvedCellAlign === "right" ? cellWidth - charWidth
        : resolvedCellAlign === "justify" ? 0
          : (cellWidth - charWidth) / 2;
    const drawX = cellStartX + Math.max(offsetX, 0);

    for (let i = outlineColors.length - 1; i >= 0; i -= 1) {
      ctx.save();
      if (resolvedCellAlign === "justify" && charWidth > 0) {
        const scaleX = cellWidth / charWidth;
        ctx.translate(cellStartX, 0);
        ctx.scale(scaleX, 1);
        ctx.strokeStyle = outlineColors[i];
        ctx.lineWidth = (i + 1) * 16;
        ctx.strokeText(char, 0, marginPx);
      } else {
        ctx.strokeStyle = outlineColors[i];
        ctx.lineWidth = (i + 1) * 16;
        ctx.strokeText(char, drawX, marginPx);
      }
      ctx.restore();
    }

    ctx.save();
    if (resolvedCellAlign === "justify" && charWidth > 0) {
      const scaleX = cellWidth / charWidth;
      ctx.translate(cellStartX, 0);
      ctx.scale(scaleX, 1);
      ctx.fillText(char, 0, marginPx);
    } else {
      ctx.fillText(char, drawX, marginPx);
    }
    ctx.restore();
  });

  const opaqueBounds = findOpaqueBounds(canvas);
  const shrunk = shrinkCanvas(canvas);

  const theoreticalWidth = Math.max(Math.ceil(lineWidth), 1);
  const baseX = opaqueBounds?.left ?? 0;
  const finalWidth = Math.max(theoreticalWidth, baseX + shrunk.width);
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = finalWidth;
  finalCanvas.height = shrunk.height;

  const finalCtx = finalCanvas.getContext("2d");
  if (!finalCtx) {
    throw new Error("Failed to get rendering context.");
  }
  finalCtx.drawImage(shrunk, baseX, 0);

  if (gradientMarker) {
    const markerX0 = getGradientPoint(finalCanvas.width, finalCanvas.height, gradientPos, 0);
    const markerY0 = getGradientPoint(finalCanvas.width, finalCanvas.height, gradientPos, 1);
    const markerX1 = getGradientPoint(finalCanvas.width, finalCanvas.height, gradientPos, 2);
    const markerY1 = getGradientPoint(finalCanvas.width, finalCanvas.height, gradientPos, 3);
    finalCtx.fillStyle = "red";
    finalCtx.fillRect(markerX0, markerY0, 16, 16);
    finalCtx.fillStyle = "blue";
    finalCtx.fillRect(markerX1, markerY1, 16, 16);
  }

  return finalCanvas;
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
  monospaceLayoutEnabled = false,
  cellAlign: CellAlign = "center",
  cellWidthBasis: CellWidthBasis = "line",
): HTMLCanvasElement => {
  const lineSpacingPixels = Math.round(lineSpacing * fontHeight);
  const paddingPixels = Math.round(padding * fontHeight);
  const letterSpacingPx = toLetterSpacingPixels(letterSpacing, fontHeight);

  const lines = text.split("\n");
  let globalCellWidth: number | undefined;
  if (monospaceLayoutEnabled && cellWidthBasis === "global") {
    const globalChars = lines.reduce<string[]>((acc, line) => {
      acc.push(...Array.from(line || " "));
      return acc;
    }, []);
    const globalCharWidths = measureCharWidths(globalChars.join(""), font, fontHeight);
    globalCellWidth = Math.max(...globalCharWidths, fontHeight, 1);
  }

  const images = lines.map((line) => (
    monospaceLayoutEnabled
      ? makeTextImageSingleLineMonospace(
        line,
        color,
        font,
        fontHeight,
        outlineColors,
        gradient,
        gradientPos,
        gradientMarker,
        margin,
        cellAlign,
        globalCellWidth,
        letterSpacingPx,
      )
      : makeTextImageSingleLine(
        line,
        color,
        font,
        fontHeight,
        outlineColors,
        gradient,
        gradientPos,
        gradientMarker,
        letterSpacingPx,
        margin,
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
