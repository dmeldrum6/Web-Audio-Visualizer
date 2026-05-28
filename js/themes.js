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
