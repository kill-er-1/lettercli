#!/usr/bin/env node
import minimist from 'minimist';

import { printAnimated } from '../src/animate.js';
import { runInteractive } from '../src/interactive.js';
import { listPresetNames } from '../src/presets.js';
import { buildOutput } from '../src/render.js';

function readStdinIfPiped() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve(null);
      return;
    }
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
  });
}

function toBool(v, defaultValue) {
  if (v === undefined) return defaultValue;
  if (v === true || v === false) return v;
  const s = String(v).toLowerCase();
  if (s === '1' || s === 'true' || s === 'yes' || s === 'on') return true;
  if (s === '0' || s === 'false' || s === 'no' || s === 'off') return false;
  return defaultValue;
}

function normalizeGradientMode(mode) {
  if (!mode) return 'horizontal';
  const raw = String(mode).trim().toLowerCase();
  if (raw === 'h' || raw === 'horizontal') return 'horizontal';
  if (raw === 'v' || raw === 'vertical') return 'vertical';
  return raw;
}

function usage() {
  const presets = listPresetNames().join(', ');
  return [
    'lettercli <text> [options]',
    '',
    'Options:',
    '  --interactive, -i              交互输入循环（无 text 时默认进入）',
    '  --font, -f <name>              FIGlet 字体（默认 Slant）',
    '  --h-layout, -H <mode>          FIGlet 横向布局（影响字距）',
    '  --v-layout, -V <mode>          FIGlet 纵向布局（影响行距）',
    `  --gradient, -g <name|c1,c2>     渐变预设或颜色列表（预设：${presets}）`,
    '  --gradient-mode, -m <h|v>       渐变方向（horizontal/vertical）',
    '  --shadow, -s / --no-shadow      阴影开关（默认关）',
    '  --shadow-x, -x <n>              阴影右偏移（默认 3）',
    '  --shadow-y, -y <n>              阴影下偏移（默认 1）',
    '  --center, -c / --no-center      居中开关（TTY 默认开）',
    '  --clear, -C                     渲染前清屏',
    '  --animate, -a <none|line|char>  动画模式（默认 none）',
    '  --speed, -p <slow|medium|fast|ms> 动画速度（默认 medium）',
    '  --help                         Show help',
    '',
    'Examples:',
    '  lettercli cdx --gradient mind --shadow --center --animate line --speed fast',
    '  echo "cdx" | lettercli --gradient retro',
    '  lettercli "中文名" --gradient vice --center',
    '  lettercli -i -g mind -s -c',
    '',
  ].join('\n');
}

async function main() {
  const argv = minimist(process.argv.slice(2), {
    string: ['font', 'h-layout', 'v-layout', 'gradient', 'gradient-mode', 'animate', 'speed'],
    boolean: ['interactive', 'shadow', 'center', 'clear', 'help'],
    default: {},
    alias: {
      h: 'help',
      i: 'interactive',
      f: 'font',
      g: 'gradient',
      m: 'gradient-mode',
      s: 'shadow',
      c: 'center',
      C: 'clear',
      a: 'animate',
      p: 'speed',
      x: 'shadow-x',
      y: 'shadow-y',
      H: 'h-layout',
      V: 'v-layout',
    },
  });

  if (argv.help) {
    process.stdout.write(`${usage()}\n`);
    process.exitCode = 0;
    return;
  }

  const stdinText = await readStdinIfPiped();
  const positionalText = argv._.join(' ');
  const text = positionalText || (stdinText ? stdinText.trimEnd() : '');

  const isTty = Boolean(process.stdout.isTTY);
  const columns = Number.isFinite(process.stdout.columns) ? process.stdout.columns : 80;

  const center = toBool(argv.center, isTty);
  const shadow = toBool(argv.shadow, false);
  const clear = toBool(argv.clear, false);
  const interactive = toBool(argv.interactive, false);

  const animateMode = argv.animate || 'none';
  const speed = argv.speed || 'medium';

  if (interactive || (!text && isTty)) {
    await runInteractive({
      font: argv.font || 'Slant',
      horizontalLayout: argv['h-layout'] || 'default',
      verticalLayout: argv['v-layout'] || 'default',
      gradient: argv.gradient,
      gradientMode: normalizeGradientMode(argv['gradient-mode']),
      shadow,
      shadowX: Number(argv['shadow-x'] ?? 3),
      shadowY: Number(argv['shadow-y'] ?? 1),
      center,
      columns,
      figletEnabled: true,
      animateMode,
      speed,
    });
    return;
  }

  if (!text) {
    process.stdout.write(`${usage()}\n`);
    process.exitCode = 1;
    return;
  }

  const { text: output } = buildOutput(text, {
    font: argv.font || 'Slant',
    horizontalLayout: argv['h-layout'] || 'default',
    verticalLayout: argv['v-layout'] || 'default',
    gradient: argv.gradient,
    gradientMode: normalizeGradientMode(argv['gradient-mode']),
    shadow,
    shadowX: Number(argv['shadow-x'] ?? 3),
    shadowY: Number(argv['shadow-y'] ?? 1),
    center,
    columns,
    figletEnabled: true,
  });

  if (clear) process.stdout.write('\x1b[2J\x1b[H');

  await printAnimated(output, animateMode, speed);
}

main().catch((err) => {
  process.stderr.write(`${String(err?.stack || err)}\n`);
  process.exitCode = 1;
});
