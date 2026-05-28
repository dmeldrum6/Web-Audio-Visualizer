import { params } from '../params.js';
import { THEMES, THEME, buildHeat, gradHueBase, setGradHueBase, hexToHsl, hexToRgb } from '../themes.js';
import { AudioEngine } from '../audio/engine.js';
import { barHeights } from '../renderers/bars.js';
import {
  bgState, radialImageState,
  loadBackgroundFromDataUrl, loadRadialImageFromDataUrl,
  clearBackground, clearRadialImage, imageToDataUrl,
} from '../overlays/background.js';
import { resetOverlayTimer, triggerLowerThird } from '../overlays/text.js';
import { showToast } from '../ui/toast.js';

export const BUILT_IN_PRESETS = [
  { version:1, name:'Classic Bars',  mode:'bars',        fftSize:8192,  smoothing:0.80, gain:1.0, motionAmount:0.5, mirror:false, fill:true,  barCount:128, theme:0, themeName:'Midnight'  },
  { version:1, name:'Deep Waveform', mode:'waveform',    fftSize:4096,  smoothing:0.85, gain:1.0, motionAmount:0.5, mirror:false, fill:true,  barCount:128, theme:3, themeName:'Neon'       },
  { version:1, name:'Heat Map',      mode:'spectrogram', fftSize:16384, smoothing:0.80, gain:1.0, motionAmount:0.5, mirror:false, fill:true,  barCount:128, theme:1, themeName:'Ember'      },
  { version:1, name:'Mirror Dance',  mode:'bars',        fftSize:8192,  smoothing:0.80, gain:1.0, motionAmount:0.8, mirror:true,  fill:true,  barCount:64,  theme:5, themeName:'Sunrise'    },
  { version:1, name:'Forensic',      mode:'spectrogram', fftSize:32768, smoothing:0.50, gain:1.0, motionAmount:0.5, mirror:false, fill:true,  barCount:128, theme:4, themeName:'Monochrome' },
  { version:1, name:'Minimal Wave',  mode:'waveform',    fftSize:8192,  smoothing:0.80, gain:1.0, motionAmount:0.3, mirror:false, fill:false, barCount:128, theme:4, themeName:'Monochrome' },
  { version:1, name:'Forest Pulse',  mode:'bars',        fftSize:8192,  smoothing:0.80, gain:1.0, motionAmount:0.5, mirror:true,  fill:true,  barCount:128, theme:2, themeName:'Forest'     },
  { version:1, name:'Neon Storm',    mode:'bars',        fftSize:8192,  smoothing:0.65, gain:1.0, motionAmount:1.0, mirror:false, fill:true,  barCount:256, theme:3, themeName:'Neon'       },
  { version:1, name:'Radial Pulse',  mode:'radial',      fftSize:8192,  smoothing:0.80, gain:1.0, motionAmount:0.5, mirror:false, fill:true,  barCount:128, theme:0, themeName:'Midnight'  },
  { version:1, name:'Radial Mirror', mode:'radial',      fftSize:8192,  smoothing:0.80, gain:1.0, motionAmount:0.6, mirror:true,  fill:true,  barCount:128, theme:3, themeName:'Neon'      },
];

export function encodePreset(p) {
  try {
    const json = JSON.stringify(p);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (_) { return ''; }
}

export function decodePreset(s) {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64 + '=='.slice(0, (4 - b64.length % 4) % 4);
    const json = decodeURIComponent(escape(atob(pad)));
    const obj = JSON.parse(json);
    if (obj && obj.version === 1) return obj;
  } catch (_) {}
  return null;
}

export let activePresetName = null;
export function clearActivePresetName() { activePresetName = null; }

const LS_KEY = 'audio-viz-presets-v1';

export function loadSavedPresets() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

export function persistSavedPresets(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (_) {}
}

/* These callbacks are set by main.js to avoid circular imports */
let _applyThemeCb   = null;
let _switchModeCb   = null;
let _syncControlsCb = null;
let _markModifiedCb = null;

export function initPresets({ applyTheme, switchMode, syncControlsToParams, markModified }) {
  _applyThemeCb   = applyTheme;
  _switchModeCb   = switchMode;
  _syncControlsCb = syncControlsToParams;
  _markModifiedCb = markModified;
}

export function refreshPresetGrid() {
  const grid = document.getElementById('preset-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const saved = loadSavedPresets();
  const all = [
    ...BUILT_IN_PRESETS.map(p => ({ ...p, _saved: false })),
    ...saved.map(p => ({ ...p, _saved: true })),
  ];

  all.forEach(preset => {
    const themeColor = (THEMES[preset.theme] || THEMES[0]).highlightColor;
    const isActive   = preset.name === activePresetName;

    const card = document.createElement('div');
    card.className = 'preset-card' + (isActive ? ' active' : '');
    card.innerHTML =
      `<span class="preset-dot" style="background:${themeColor}"></span>` +
      `<span class="preset-name">${preset.name}</span>` +
      (preset._saved ? `<button class="preset-delete" title="Delete">&#x2715;</button>` : '');

    card.addEventListener('click', e => {
      if (e.target.closest('.preset-delete')) return;
      applyPreset(preset);
    });

    if (preset._saved) {
      card.querySelector('.preset-delete').addEventListener('click', e => {
        e.stopPropagation();
        const updated = loadSavedPresets().filter(p => p.name !== preset.name);
        persistSavedPresets(updated);
        localStorage.removeItem(`audio-viz-bg-${preset.name}`);
        localStorage.removeItem(`audio-viz-radial-img-${preset.name}`);
        if (activePresetName === preset.name) activePresetName = null;
        refreshPresetGrid();
      });
    }

    grid.appendChild(card);
  });
}

export function applyPreset(preset, writeToHash = true) {
  AudioEngine.setFftSize(preset.fftSize);
  AudioEngine.setSmoothing(preset.smoothing);
  AudioEngine.setGain(preset.gain);
  params.motionAmount = preset.motionAmount;
  params.trailAlpha   = preset.trailAlpha   ?? 0.0;
  params.mirror       = preset.mirror;
  params.fill         = preset.fill;
  params.barCount     = preset.barCount;
  barHeights.fill(0);

  params.overlayEnabled    = preset.overlayEnabled    ?? false;
  params.overlayText       = preset.overlayText       ?? '';
  params.overlayFontSize   = preset.overlayFontSize   ?? 48;
  params.overlayFontFamily = preset.overlayFontFamily ?? 'sans-serif';
  params.overlayColor      = preset.overlayColor      ?? '#ffffff';
  params.overlayOpacity    = preset.overlayOpacity    ?? 1.0;
  params.overlayStyle      = preset.overlayStyle      ?? 'scroll';
  params.overlaySubtext    = preset.overlaySubtext    ?? '';
  params.overlayDuration   = preset.overlayDuration   ?? 0;
  resetOverlayTimer();
  if (params.overlayEnabled && params.overlayStyle === 'lower-third') triggerLowerThird();

  /* background */
  params.bgOpacity  = preset.bgOpacity  ?? 1.0;
  params.bgBlend    = preset.bgBlend    ?? 'normal';
  params.bgFit      = preset.bgFit      ?? 'cover';
  params.bgGradient = preset.bgGradient ?? false;
  params.radialImgOpacity = preset.radialImgOpacity ?? 1.0;
  params.radialShape      = preset.radialShape      ?? 'circle';

  /* bloom */
  params.bloomIntensity = preset.bloomIntensity ?? 0;

  /* particles */
  params.particleDensity = preset.particleDensity ?? 200;

  /* terrain */
  params.terrainSpeed = preset.terrainSpeed ?? 1;

  /* progress bar */
  params.progressBar = preset.progressBar ?? false;

  /* elapsed timer */
  params.showTimer = preset.showTimer ?? false;

  /* artist card (image is not serialized — loaded separately by user) */
  params.artistCardEnabled  = preset.artistCard?.enabled  ?? false;
  params.artistCardName     = preset.artistCard?.artistName ?? '';
  params.artistCardTitle    = preset.artistCard?.trackTitle  ?? '';
  params.artistCardOpacity  = preset.artistCard?.opacity   ?? 1.0;

  if (preset.name) {
    const storedImg = localStorage.getItem(`audio-viz-bg-${preset.name}`);
    if (storedImg) {
      loadBackgroundFromDataUrl(storedImg);
    } else {
      clearBackground();
      /* Restore params that clearBackground reset */
      params.bgOpacity = preset.bgOpacity ?? 1.0;
      params.bgBlend   = preset.bgBlend   ?? 'normal';
      params.bgFit     = preset.bgFit     ?? 'cover';
    }

    const storedRadialImg = localStorage.getItem(`audio-viz-radial-img-${preset.name}`);
    if (storedRadialImg) {
      loadRadialImageFromDataUrl(storedRadialImg);
    } else {
      clearRadialImage();
      params.radialImgOpacity = preset.radialImgOpacity ?? 1.0;
    }
  } else {
    clearBackground();
    clearRadialImage();
  }

  _applyThemeCb(preset.theme);
  _switchModeCb(preset.mode);
  _syncControlsCb();

  activePresetName = preset.name || null;

  if (writeToHash && preset.name) {
    const encoded = encodePreset(preset);
    if (encoded) history.replaceState(null, '', '#' + encoded);
  }

  refreshPresetGrid();
}

export function initSavePresetButton(getCurrentMode) {
  document.getElementById('btn-save-preset').addEventListener('click', () => {
    const raw = prompt('Preset name:');
    if (!raw || !raw.trim()) return;
    const name = raw.trim();

    const preset = {
      version: 1, name,
      mode:         getCurrentMode(),
      fftSize:      params.fftSize,
      smoothing:    params.smoothing,
      gain:         params.gain,
      motionAmount: params.motionAmount,
      trailAlpha:   params.trailAlpha,
      mirror:       params.mirror,
      fill:         params.fill,
      barCount:     params.barCount,
      theme:        params.theme,
      themeName:    params.themeName,
      overlayEnabled:    params.overlayEnabled,
      overlayText:       params.overlayText,
      overlayFontSize:   params.overlayFontSize,
      overlayFontFamily: params.overlayFontFamily,
      overlayColor:      params.overlayColor,
      overlayOpacity:    params.overlayOpacity,
      overlayStyle:      params.overlayStyle,
      overlaySubtext:    params.overlaySubtext,
      overlayDuration:   params.overlayDuration,
      bgOpacity:  params.bgOpacity,
      bgBlend:    params.bgBlend,
      bgFit:      params.bgFit,
      bgGradient: params.bgGradient,
      radialImgOpacity: params.radialImgOpacity,
      bloomIntensity:  params.bloomIntensity,
      particleDensity: params.particleDensity,
      terrainSpeed:    params.terrainSpeed,
      progressBar:     params.progressBar,
      showTimer:       params.showTimer,
      /* image cannot be serialized — only text/opacity fields are saved */
      artistCard: {
        enabled:    params.artistCardEnabled,
        artistName: params.artistCardName,
        trackTitle: params.artistCardTitle,
        opacity:    params.artistCardOpacity,
      },
    };

    const updated = loadSavedPresets().filter(p => p.name !== name);
    updated.push(preset);
    persistSavedPresets(updated);

    /* Optionally save background image to localStorage */
    const bgImgKey = `audio-viz-bg-${name}`;
    if (bgState.image) {
      if (confirm('Include background image in this preset?\n(Stored locally only — not in shared links)')) {
        try {
          localStorage.setItem(bgImgKey, imageToDataUrl(bgState.image));
        } catch (_) {
          showToast('Could not save image — local storage may be full', 'warn');
          localStorage.removeItem(bgImgKey);
        }
      } else {
        localStorage.removeItem(bgImgKey);
      }
    } else {
      localStorage.removeItem(bgImgKey);
    }

    /* Optionally save radial center image to localStorage */
    const radialImgKey = `audio-viz-radial-img-${name}`;
    if (radialImageState.image) {
      if (confirm('Include radial center image in this preset?\n(Stored locally only — not in shared links)')) {
        try {
          localStorage.setItem(radialImgKey, imageToDataUrl(radialImageState.image));
        } catch (_) {
          showToast('Could not save radial image — local storage may be full', 'warn');
          localStorage.removeItem(radialImgKey);
        }
      } else {
        localStorage.removeItem(radialImgKey);
      }
    } else {
      localStorage.removeItem(radialImgKey);
    }

    activePresetName = name;
    const encoded = encodePreset(preset);
    if (encoded) history.replaceState(null, '', '#' + encoded);
    refreshPresetGrid();
  });
}
