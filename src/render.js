import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import stringWidth from 'string-width';
import stripAnsi from 'strip-ansi';

import { resolveGradient } from './presets.js';

function isAsciiOnly(text) {
  return /^[\x00-\x7F]*$/.test(text);
}

function trimTrailingEmptyLines(lines) {
  let end = lines.length;
  while (end > 0 && lines[end - 1] === '') end -= 1;
  return lines.slice(0, end);
}

function rotateColors(colors, steps) {
  const normalized = ((steps % colors.length) + colors.length) % colors.length;
  return colors.slice(normalized).concat(colors.slice(0, normalized));
}

function applyVerticalGradient(lines, colors) {
  if (!colors || colors.length < 2) return lines;
  const total = lines.length;
  if (total <= 1) return lines.map((l) => gradient(colors)(l));

  return lines.map((line, index) => {
    const t = index / (total - 1);
    const steps = Math.round(t * (colors.length - 1));
    return gradient(rotateColors(colors, steps))(line);
  });
}

function parseRgbString(value) {
  const m = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.exec(String(value).trim());
  if (!m) return null;
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  if (![r, g, b].every((n) => Number.isFinite(n) && n >= 0 && n <= 255)) return null;
  return { r, g, b };
}

function parseHexColor(value) {
  const raw = String(value).trim();
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(raw);
  if (!m) return null;
  const hex = m[1].toLowerCase();
  const full =
    hex.length === 3 ? `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}` : hex;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return { r, g, b };
}

const NAMED_RGB = {
  black: { r: 0, g: 0, b: 0 },
  white: { r: 255, g: 255, b: 255 },
  gray: { r: 128, g: 128, b: 128 },
  grey: { r: 128, g: 128, b: 128 },
  red: { r: 255, g: 0, b: 0 },
  green: { r: 0, g: 255, b: 0 },
  blue: { r: 0, g: 0, b: 255 },
  cyan: { r: 0, g: 255, b: 255 },
  magenta: { r: 255, g: 0, b: 255 },
  purple: { r: 128, g: 0, b: 128 },
  pink: { r: 255, g: 105, b: 180 },
  yellow: { r: 255, g: 255, b: 0 },
  orange: { r: 255, g: 165, b: 0 },
};

function parseColorToRgb(value) {
  return parseHexColor(value) ?? parseRgbString(value) ?? NAMED_RGB[String(value).trim().toLowerCase()] ?? null;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpRgb(c1, c2, t) {
  return {
    r: Math.round(lerp(c1.r, c2.r, t)),
    g: Math.round(lerp(c1.g, c2.g, t)),
    b: Math.round(lerp(c1.b, c2.b, t)),
  };
}

function colorAt(colors, t) {
  if (colors.length === 1) return colors[0];
  const scaled = t * (colors.length - 1);
  const i = Math.min(colors.length - 2, Math.max(0, Math.floor(scaled)));
  const localT = scaled - i;
  return lerpRgb(colors[i], colors[i + 1], localT);
}

function measureMaxWidth(lines) {
  let max = 0;
  for (const line of lines) {
    const w = stringWidth(stripAnsi(line));
    if (w > max) max = w;
  }
  return max;
}

function padLeft(lines, spaces) {
  if (spaces <= 0) return lines;
  const pad = ' '.repeat(spaces);
  return lines.map((l) => (l.length === 0 ? '' : pad + l));
}

function rtrimSpaces(text) {
  return text.replace(/[ \t]+$/g, '');
}

function buildShadowComposite(baseLines, options) {
  const {
    shadowX = 3,
    shadowY = 1,
    shadowLevels = 1,
    shadowChar = '░',
  } = options ?? {};

  const levels = Math.max(1, Math.min(2, Number(shadowLevels) || 1));
  const height = baseLines.length;
  const width = Math.max(0, ...baseLines.map((l) => l.length));

  const outHeight = height + shadowY + (levels - 1);
  const outWidth = width + shadowX + (levels - 1);

  const grid = Array.from({ length: outHeight }, () => Array.from({ length: outWidth }, () => ' '));

  for (let level = 0; level < levels; level += 1) {
    const dx = shadowX + level;
    const dy = shadowY + level;
    for (let r = 0; r < height; r += 1) {
      const line = baseLines[r] ?? '';
      for (let c = 0; c < line.length; c += 1) {
        const ch = line[c];
        if (ch === ' ') continue;
        const tr = r + dy;
        const tc = c + dx;
        if (tr < 0 || tr >= outHeight) continue;
        if (tc < 0 || tc >= outWidth) continue;
        if (grid[tr][tc] === ' ') grid[tr][tc] = shadowChar;
      }
    }
  }

  for (let r = 0; r < height; r += 1) {
    const line = baseLines[r] ?? '';
    for (let c = 0; c < line.length; c += 1) {
      grid[r][c] = line[c];
    }
  }

  return grid.map((row) => rtrimSpaces(row.join('')));
}

function styleShadowGlyph(ch, shadowChar) {
  return ch === shadowChar ? chalk.dim(chalk.gray(ch)) : ch;
}

function applyManualGradient(lines, colors, mode, shadowChar) {
  const rgbColors = colors.map(parseColorToRgb);
  if (rgbColors.some((c) => !c)) return null;

  const maxLen = Math.max(0, ...lines.map((l) => l.length));
  const total = lines.length;

  const normalizedMode = String(mode || 'horizontal').toLowerCase();
  const vertical = normalizedMode === 'vertical';

  return lines.map((line, rowIndex) => {
    const rowT = total <= 1 ? 0 : rowIndex / (total - 1);
    const rowSteps = Math.round(rowT * (rgbColors.length - 1));
    const rowPalette = vertical ? rotateColors(rgbColors, rowSteps) : rgbColors;

    let out = '';
    for (let col = 0; col < maxLen; col += 1) {
      const ch = line[col] ?? ' ';
      if (ch === ' ') {
        out += ' ';
        continue;
      }
      if (ch === shadowChar) {
        out += styleShadowGlyph(ch, shadowChar);
        continue;
      }
      const t = maxLen <= 1 ? 0 : col / (maxLen - 1);
      const { r, g, b } = colorAt(rowPalette, t);
      out += chalk.rgb(r, g, b)(ch);
    }
    return rtrimSpaces(out);
  });
}

export function buildOutput(text, options = {}) {
  const {
    font = 'Slant',
    horizontalLayout = 'default',
    verticalLayout = 'default',
    gradient: gradientSpec,
    gradientMode = 'horizontal',
    shadow = false,
    shadowX = 3,
    shadowY = 1,
    shadowLevels = 1,
    shadowChar = '░',
    center = false,
    columns = 80,
    figletEnabled = true,
  } = options;

  const inputText = String(text ?? '').trimEnd();
  if (!inputText) return { text: '' };

  let baseBlock = inputText;
  if (figletEnabled && isAsciiOnly(inputText)) {
    try {
      baseBlock = figlet.textSync(inputText, {
        font,
        horizontalLayout,
        verticalLayout,
        width: columns,
        whitespaceBreak: true,
      });
    } catch {
      baseBlock = inputText;
    }
  }

  const baseLines = trimTrailingEmptyLines(baseBlock.split('\n'));
  const composedLines = shadow
    ? buildShadowComposite(baseLines, { shadowX, shadowY, shadowLevels, shadowChar })
    : baseLines;
  const composedText = composedLines.join('\n');

  const gradientInfo = resolveGradient(gradientSpec);
  let mainLines = composedLines;

  if (gradientInfo) {
    const mode = String(gradientMode).toLowerCase();
    if (gradientInfo.colors) {
      const manual = applyManualGradient(composedLines, gradientInfo.colors, mode, shadowChar);
      if (manual) {
        mainLines = manual;
      } else if (mode === 'vertical') {
        mainLines = applyVerticalGradient(composedLines, gradientInfo.colors);
      } else {
        mainLines = trimTrailingEmptyLines(gradientInfo.fn.multiline(composedText).split('\n'));
      }
    } else {
      mainLines = trimTrailingEmptyLines(gradientInfo.fn.multiline(composedText).split('\n'));
    }
  } else if (shadow) {
    mainLines = mainLines.map((line) => {
      let out = '';
      for (const ch of line) out += styleShadowGlyph(ch, shadowChar);
      return out;
    });
  }

  const parts = [];

  const centerWidth = measureMaxWidth(composedLines);
  const leftPad = center ? Math.max(0, Math.floor((columns - centerWidth) / 2)) : 0;
  parts.push(padLeft(mainLines, leftPad));

  const outLines = parts.flat();
  return { text: outLines.join('\n') };
}
