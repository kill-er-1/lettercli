import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import chalk from 'chalk';
import gradient from 'gradient-string';

import { printAnimated } from './animate.js';
import { buildOutput } from './render.js';

function clearScreen() {
  output.write('\x1b[2J\x1b[H');
}

function normalizeGradientMode(mode) {
  if (!mode) return 'horizontal';
  const raw = String(mode).trim().toLowerCase();
  if (raw === 'h' || raw === 'horizontal') return 'horizontal';
  if (raw === 'v' || raw === 'vertical') return 'vertical';
  return raw;
}

function header(state) {
  return [
    `${gradient(['#7F7FD5', '#86A8E7', '#91EAE4'])('lettercli')} ${chalk.dim('interactive')}`,
    chalk.dim('回车渲染；:help 查看命令；:q 退出'),
    '',
  ].join('\n');
}

function styleLine(state) {
  const kv = (k, v) => `${chalk.dim(k)}=${chalk.white(v)}`;
  const gradientValue = state.gradient ? String(state.gradient) : 'none';
  const shadowValue = state.shadow ? `on(x=${state.shadowX},y=${state.shadowY})` : 'off';
  const centerValue = state.center ? 'on' : 'off';
  return [
    kv('font', state.font),
    kv('layout', `${state.horizontalLayout}/${state.verticalLayout}`),
    kv('gradient', `${gradientValue}(${state.gradientMode})`),
    kv('shadow', shadowValue),
    kv('center', centerValue),
    kv('animate', state.animateMode),
    kv('speed', state.speed),
  ].join('  ');
}

function helpText() {
  return [
    chalk.dim('命令（以 : 开头）：'),
    '  :q / :quit / :exit           退出',
    '  :help                       显示帮助',
    '  :clear                      清屏',
    '  :style                      显示当前样式',
    '',
    chalk.dim('快捷开关（单字母）：'),
    '  :s                          切换 shadow',
    '  :c                          切换 center',
    '',
    chalk.dim('设置参数：'),
    '  :g <preset|c1,c2|none>      设置 gradient（例如 :g mind 或 :g blue,purple）',
    '  :m <h|v>                    设置 gradient-mode（h=horizontal, v=vertical）',
    '  :f <font>                   设置 FIGlet font（例如 :f Slant）',
    '  :H <mode>                   设置 h-layout（例如 :H full）',
    '  :V <mode>                   设置 v-layout（例如 :V default）',
    '  :a <none|line|char>         设置动画模式',
    '  :p <slow|medium|fast|ms>    设置速度',
    '  :x <n>                      设置 shadow-x',
    '  :y <n>                      设置 shadow-y',
    '',
  ].join('\n');
}

function parseCmd(line) {
  const trimmed = String(line ?? '').trim();
  if (!trimmed.startsWith(':')) return null;
  const [head, ...rest] = trimmed.slice(1).trim().split(/\s+/);
  return { name: (head || '').toLowerCase(), args: rest.join(' ') };
}

export async function runInteractive(options) {
  const rl = readline.createInterface({ input, output, terminal: true });
  rl.on('SIGINT', () => {
    rl.close();
  });

  const state = {
    font: options.font ?? 'Slant',
    horizontalLayout: options.horizontalLayout ?? 'default',
    verticalLayout: options.verticalLayout ?? 'default',
    gradient: options.gradient,
    gradientMode: normalizeGradientMode(options.gradientMode),
    shadow: Boolean(options.shadow),
    shadowX: Number(options.shadowX ?? 3),
    shadowY: Number(options.shadowY ?? 1),
    center: Boolean(options.center),
    columns: Number(options.columns ?? 80),
    figletEnabled: options.figletEnabled !== false,
    animateMode: options.animateMode ?? 'none',
    speed: options.speed ?? 'medium',
  };

  clearScreen();
  output.write(`${header(state)}${styleLine(state)}\n\n`);

  while (true) {
    let line;
    try {
      line = await rl.question(`${chalk.cyan('lettercli')} ${chalk.dim('›')} `);
    } catch {
      break;
    }

    const trimmed = String(line ?? '').trim();
    if (!trimmed) continue;

    const cmd = parseCmd(trimmed);
    if (cmd) {
      if (cmd.name === 'q' || cmd.name === 'quit' || cmd.name === 'exit') break;
      if (cmd.name === 'help') {
        output.write(`${helpText()}`);
        continue;
      }
      if (cmd.name === 'clear') {
        clearScreen();
        output.write(`${header(state)}${styleLine(state)}\n\n`);
        continue;
      }
      if (cmd.name === 'style') {
        output.write(`${styleLine(state)}\n`);
        continue;
      }
      if (cmd.name === 's') {
        state.shadow = !state.shadow;
        output.write(`${styleLine(state)}\n`);
        continue;
      }
      if (cmd.name === 'c') {
        state.center = !state.center;
        output.write(`${styleLine(state)}\n`);
        continue;
      }
      if (cmd.name === 'g') {
        state.gradient = cmd.args || undefined;
        output.write(`${styleLine(state)}\n`);
        continue;
      }
      if (cmd.name === 'm') {
        state.gradientMode = normalizeGradientMode(cmd.args);
        output.write(`${styleLine(state)}\n`);
        continue;
      }
      if (cmd.name === 'f') {
        state.font = cmd.args || state.font;
        output.write(`${styleLine(state)}\n`);
        continue;
      }
      if (cmd.name === 'h') {
        state.horizontalLayout = cmd.args || state.horizontalLayout;
        output.write(`${styleLine(state)}\n`);
        continue;
      }
      if (cmd.name === 'v') {
        state.verticalLayout = cmd.args || state.verticalLayout;
        output.write(`${styleLine(state)}\n`);
        continue;
      }
      if (cmd.name === 'a') {
        state.animateMode = cmd.args || state.animateMode;
        output.write(`${styleLine(state)}\n`);
        continue;
      }
      if (cmd.name === 'p') {
        state.speed = cmd.args || state.speed;
        output.write(`${styleLine(state)}\n`);
        continue;
      }
      if (cmd.name === 'x') {
        const n = Number(cmd.args);
        if (Number.isFinite(n)) state.shadowX = n;
        output.write(`${styleLine(state)}\n`);
        continue;
      }
      if (cmd.name === 'y') {
        const n = Number(cmd.args);
        if (Number.isFinite(n)) state.shadowY = n;
        output.write(`${styleLine(state)}\n`);
        continue;
      }

      output.write(`${chalk.red('未知命令：')}${trimmed}\n`);
      continue;
    }

    const columns = Number.isFinite(output.columns) ? output.columns : state.columns;
    const { text: rendered } = buildOutput(trimmed, {
      font: state.font,
      horizontalLayout: state.horizontalLayout,
      verticalLayout: state.verticalLayout,
      gradient: state.gradient,
      gradientMode: state.gradientMode,
      shadow: state.shadow,
      shadowX: state.shadowX,
      shadowY: state.shadowY,
      center: state.center,
      columns,
      figletEnabled: state.figletEnabled,
    });

    clearScreen();
    output.write(`${header(state)}${styleLine(state)}\n\n`);
    await printAnimated(rendered, state.animateMode, state.speed);
    output.write(`\n${chalk.dim('提示：输入 :help 查看交互命令')}\n`);
  }

  rl.close();
}
