/* ═══════════════════════════════════════════════════════════════
   THEMES
═══════════════════════════════════════════════════════════════ */
const THEMES = [
  { name: 'Midnight',   bgColor: '#080c18', accentColor: '#1a3888', highlightColor: '#40d8ff', midColor: '#2060c0' },
  { name: 'Ember',      bgColor: '#0e0604', accentColor: '#8c1a00', highlightColor: '#ff6428', midColor: '#c03010' },
  { name: 'Forest',     bgColor: '#040e04', accentColor: '#0a4010', highlightColor: '#38e060', midColor: '#18a030' },
  { name: 'Neon',       bgColor: '#050508', accentColor: '#8800cc', highlightColor: '#00ffee', midColor: '#cc00ff' },
  { name: 'Monochrome', bgColor: '#080808', accentColor: '#303030', highlightColor: '#d8d8d8', midColor: '#808080' },
  { name: 'Sunrise',    bgColor: '#0c0608', accentColor: '#7a1040', highlightColor: '#ffd060', midColor: '#e04080' },
  { name: 'Arctic',     bgColor: '#04090f', accentColor: '#0a3050', highlightColor: '#a0f0ff', midColor: '#2090c8' },
  { name: 'Plasma',     bgColor: '#080410', accentColor: '#6000a0', highlightColor: '#ff40ff', midColor: '#a020e0' },
  { name: 'Toxic',      bgColor: '#050a02', accentColor: '#2a6000', highlightColor: '#c8ff00', midColor: '#60b000' },
  { name: 'Inferno',    bgColor: '#0c0400', accentColor: '#880000', highlightColor: '#ffee00', midColor: '#ff5500' },
  { name: 'Ocean',      bgColor: '#020810', accentColor: '#003060', highlightColor: '#00d8b0', midColor: '#0070a0' },
  { name: 'Rose',       bgColor: '#0e0408', accentColor: '#701040', highlightColor: '#ff90b0', midColor: '#d03070' },
  { name: 'Copper',     bgColor: '#080402', accentColor: '#603010', highlightColor: '#ffb860', midColor: '#c06020' },
  { name: 'Void',       bgColor: '#020204', accentColor: '#100830', highlightColor: '#9060ff', midColor: '#4020b0' },
  { name: 'Solar',      bgColor: '#0c0800', accentColor: '#804000', highlightColor: '#fff080', midColor: '#e09000' },
  { name: 'Glacier',    bgColor: '#060c10', accentColor: '#104060', highlightColor: '#c0f8ff', midColor: '#50b0d0' },
];

const THEME = {
  bgColor:   THEMES[0].bgColor,
  accent:    THEMES[0].accentColor,
  highlight: THEMES[0].highlightColor,
  mid:       THEMES[0].midColor,
  waveRGB:   [64, 216, 255],
};

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function hexToHue(hex) {
  const [rr, gg, bb] = hexToRgb(hex).map(v => v / 255);
  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d   = max - min;
  if (d === 0) return 0;
  let h;
  if (max === rr)      h = ((gg - bb) / d + 6) % 6;
  else if (max === gg) h = (bb - rr) / d + 2;
  else                 h = (rr - gg) / d + 4;
  return h * 60;
}

function hexToHsl(hex) {
  let [r, g2, b] = hexToRgb(hex);
  r /= 255; g2 /= 255; b /= 255;
  const max = Math.max(r, g2, b), min = Math.min(r, g2, b);
  const l   = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if      (max === r)  h = ((g2 - b) / d + (g2 < b ? 6 : 0)) / 6;
  else if (max === g2) h = ((b  - r) / d + 2) / 6;
  else                 h = ((r  - g2) / d + 4) / 6;
  return [h * 360, s * 100, l * 100];
}

/* Heat colour lookup tables */
const heatR = new Uint8Array(256);
const heatG = new Uint8Array(256);
const heatB = new Uint8Array(256);

function buildHeat(bgHex, accentHex, midHex, highlightHex) {
  const bg = hexToRgb(bgHex);
  const ac = hexToRgb(accentHex);
  const md = hexToRgb(midHex);
  const hi = hexToRgb(highlightHex);

  const stops = [
    [0,   bg[0], bg[1], bg[2]],
    [80,  ac[0], ac[1], ac[2]],
    [160, md[0], md[1], md[2]],
    [220, hi[0], hi[1], hi[2]],
    [255, 255,   255,   255  ],
  ];

  for (let v = 0; v < 256; v++) {
    let lo = stops[0], hi2 = stops[1];
    for (let s = 1; s < stops.length - 1; s++) {
      if (v >= stops[s][0]) { lo = stops[s]; hi2 = stops[s + 1]; }
    }
    const t = lo[0] === hi2[0] ? 1 : (v - lo[0]) / (hi2[0] - lo[0]);
    heatR[v] = Math.round(lo[1] + (hi2[1] - lo[1]) * t);
    heatG[v] = Math.round(lo[2] + (hi2[2] - lo[2]) * t);
    heatB[v] = Math.round(lo[3] + (hi2[3] - lo[3]) * t);
  }
}

buildHeat(THEMES[0].bgColor, THEMES[0].accentColor, THEMES[0].midColor, THEMES[0].highlightColor);

/* gradHueBase is used by gradient background and applyTheme */
let gradHueBase = hexToHsl(THEMES[0].accentColor)[0];
function setGradHueBase(val) { gradHueBase = val; }

function buildSwatches(onThemeClick) {
  const grid = document.getElementById('swatch-grid');
  THEMES.forEach((t, i) => {
    const sw = document.createElement('div');
    sw.className = 'swatch' + (i === 0 ? ' active' : '');
    sw.style.background = `linear-gradient(145deg, ${t.bgColor} 0%, ${t.accentColor} 45%, ${t.highlightColor} 100%)`;
    sw.dataset.themeIndex = i;
    sw.innerHTML = `<span class="swatch-name">${t.name}</span>`;
    grid.appendChild(sw);
  });

  grid.addEventListener('click', e => {
    const sw = e.target.closest('.swatch');
    if (!sw) return;
    onThemeClick(parseInt(sw.dataset.themeIndex, 10));
  });
}

/* ── Per-theme cached data for layer-level theme overrides ── */
const _themeCache = new Map();

function _buildThemeData(index) {
  const t = THEMES[index];
  const r = new Uint8Array(256);
  const g = new Uint8Array(256);
  const b = new Uint8Array(256);
  const bg = hexToRgb(t.bgColor);
  const ac = hexToRgb(t.accentColor);
  const md = hexToRgb(t.midColor);
  const hi = hexToRgb(t.highlightColor);
  const stops = [
    [0,   bg[0], bg[1], bg[2]],
    [80,  ac[0], ac[1], ac[2]],
    [160, md[0], md[1], md[2]],
    [220, hi[0], hi[1], hi[2]],
    [255, 255,   255,   255  ],
  ];
  for (let v = 0; v < 256; v++) {
    let lo = stops[0], hi2 = stops[1];
    for (let s = 1; s < stops.length - 1; s++) {
      if (v >= stops[s][0]) { lo = stops[s]; hi2 = stops[s + 1]; }
    }
    const tt = lo[0] === hi2[0] ? 1 : (v - lo[0]) / (hi2[0] - lo[0]);
    r[v] = Math.round(lo[1] + (hi2[1] - lo[1]) * tt);
    g[v] = Math.round(lo[2] + (hi2[2] - lo[2]) * tt);
    b[v] = Math.round(lo[3] + (hi2[3] - lo[3]) * tt);
  }
  return {
    bgColor:   t.bgColor,
    accent:    t.accentColor,
    highlight: t.highlightColor,
    mid:       t.midColor,
    waveRGB:   hexToRgb(t.highlightColor),
    heatR: r, heatG: g, heatB: b,
  };
}

function getThemeData(index) {
  if (!_themeCache.has(index)) _themeCache.set(index, _buildThemeData(index));
  return _themeCache.get(index);
}

/* Temporarily override the global THEME + heat tables for a single layer render,
   then restore to globalThemeIndex. Returns a restore function. */
function pushLayerTheme(index) {
  const saved = {
    bgColor:   THEME.bgColor,
    accent:    THEME.accent,
    highlight: THEME.highlight,
    mid:       THEME.mid,
    waveRGB:   THEME.waveRGB,
    heatR: heatR.slice(), heatG: heatG.slice(), heatB: heatB.slice(),
  };
  const d = getThemeData(index);
  THEME.bgColor   = d.bgColor;
  THEME.accent    = d.accent;
  THEME.highlight = d.highlight;
  THEME.mid       = d.mid;
  THEME.waveRGB   = d.waveRGB;
  heatR.set(d.heatR); heatG.set(d.heatG); heatB.set(d.heatB);
  return function restoreTheme() {
    THEME.bgColor   = saved.bgColor;
    THEME.accent    = saved.accent;
    THEME.highlight = saved.highlight;
    THEME.mid       = saved.mid;
    THEME.waveRGB   = saved.waveRGB;
    heatR.set(saved.heatR); heatG.set(saved.heatG); heatB.set(saved.heatB);
  };
}
