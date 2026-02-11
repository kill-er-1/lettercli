function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasAnsiCodes(text) {
  return /\x1b\[[0-9;]*m/.test(text);
}

export function normalizeSpeedMs(speed) {
  if (typeof speed === 'number' && Number.isFinite(speed)) return Math.max(0, speed);
  if (!speed) return 0;

  const raw = String(speed).trim().toLowerCase();
  if (/^\d+$/.test(raw)) return Math.max(0, Number(raw));

  if (raw === 'fast') return 15;
  if (raw === 'medium') return 50;
  if (raw === 'slow') return 120;

  return 0;
}

export async function printAnimated(text, mode, speedMs) {
  const resolvedMode = (mode || 'none').toLowerCase();
  const delay = normalizeSpeedMs(speedMs);

  if (resolvedMode === 'none' || delay <= 0) {
    process.stdout.write(text.endsWith('\n') ? text : `${text}\n`);
    return;
  }

  if (resolvedMode === 'char') {
    if (hasAnsiCodes(text)) {
      await printAnimated(text, 'line', delay);
      return;
    }
    for (const ch of text) {
      process.stdout.write(ch);
      await sleep(delay);
    }
    if (!text.endsWith('\n')) process.stdout.write('\n');
    return;
  }

  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    process.stdout.write(`${lines[i]}\n`);
    if (i !== lines.length - 1) await sleep(delay);
  }
}

