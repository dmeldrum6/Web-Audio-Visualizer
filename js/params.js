/* ═══════════════════════════════════════════════════════════════
   PARAMS  — single source of truth for all control state
═══════════════════════════════════════════════════════════════ */
const params = {
  mode:         'bars',
  fftSize:      8192,
  smoothing:    0.80,
  gain:         1.0,
  freqScale:    'log',   /* 'log' (musical) | 'linear' */
  motionAmount: 0.5,
  trailAlpha:   0.0,
  mirror:       false,
  fill:         true,
  barCount:     128,
  theme:        0,
  themeName:    'Midnight',
  /* text overlay */
  overlayEnabled:    false,
  overlayText:       '',
  overlayFontSize:   48,
  overlayFontFamily: 'sans-serif',
  overlayColor:      '#ffffff',
  overlayOpacity:    1.0,
  overlayStyle:      'scroll',
  overlaySubtext:    '',
  overlayDuration:   0,
  /* background image */
  bgOpacity:  1.0,
  bgBlend:    'normal',
  bgFit:      'cover',
  bgGradient: false,
  /* radial center image */
  radialImgOpacity: 1.0,
  /* radial center shape: 'circle' | 'square' | 'triangle' */
  radialShape: 'circle',
  /* bloom/glow */
  bloomIntensity: 0,
  /* particles */
  particleDensity: 200,
  /* scope */
  scopeMonoDelay: false,
  /* terrain */
  terrainSpeed: 1,
  /* progress bar */
  progressBar: false,
  /* elapsed timer */
  showTimer: false,
  /* artist card */
  artistCardEnabled:       false,
  artistCardName:          '',
  artistCardTitle:         '',
  artistCardOpacity:       1.0,
  artistCardTimerEnabled:  false,
  artistCardTimerDuration: 5,
  /* FX post-processing */
  fxMode:      'none',
  fxIntensity: 0.5,
  /* BPM clock */
  bpmEnabled:      false,
  bpm:             120,
  bpmSubdivision:  1,
  /* recording resolution */
  recordResolution: '1080p',
  recordFps:        30,
  /* layer compositor — layer data lives in LayerManager, this flag enables it */
  layersEnabled: false,
  /* per-element bindings — populated by bindings.js */
  bindings: null,
};
