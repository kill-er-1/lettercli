import * as gradientNS from 'gradient-string';

const gradient = gradientNS.default ?? gradientNS;

const presetFn = (name) => gradientNS[name] ?? gradient[name];

const PRESET_FUNCS = {
  atlas: presetFn('atlas'),
  cristal: presetFn('cristal'),
  fruit: presetFn('fruit'),
  instagram: presetFn('instagram'),
  mind: presetFn('mind'),
  morning: presetFn('morning'),
  pastel: presetFn('pastel'),
  passion: presetFn('passion'),
  rainbow: presetFn('rainbow'),
  retro: presetFn('retro'),
  summer: presetFn('summer'),
  teen: presetFn('teen'),
  vice: presetFn('vice'),
};

const PRESET_COLORS = {
  atlas: ['#FEAC5E', '#C779D0', '#4BC0C8'],
  cristal: ['#bdfff3', '#4ac29a'],
  fruit: ['#ff4e50', '#f9d423'],
  instagram: ['#833ab4', '#fd1d1d', '#fcb045'],
  mind: ['#473B7B', '#3584A7', '#30D2BE'],
  morning: ['#FF5F6D', '#FFC371'],
  pastel: ['#74ebd5', '#acb6e5'],
  passion: ['#f43b47', '#453a94'],
  rainbow: ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'],
  retro: ['#F7971E', '#FFD200'],
  summer: ['#22c1c3', '#fdbb2d'],
  teen: ['#77A1D3', '#79CBCA', '#E684AE'],
  vice: ['#5EE7DF', '#B490CA'],
};

function parseColorList(spec) {
  const parts = spec
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  return parts;
}

export function resolveGradient(spec) {
  if (!spec) return null;
  if (spec === 'none' || spec === 'off' || spec === 'false') return null;

  const lower = String(spec).toLowerCase();
  if (PRESET_FUNCS[lower]) {
    return {
      kind: 'preset',
      name: lower,
      fn: PRESET_FUNCS[lower],
      colors: PRESET_COLORS[lower] ?? null,
    };
  }

  const customColors = parseColorList(String(spec));
  if (customColors) {
    return {
      kind: 'custom',
      name: 'custom',
      fn: gradient(customColors),
      colors: customColors,
    };
  }

  return null;
}

export function listPresetNames() {
  return Object.keys(PRESET_FUNCS)
    .filter((k) => typeof PRESET_FUNCS[k] === 'function')
    .sort();
}
