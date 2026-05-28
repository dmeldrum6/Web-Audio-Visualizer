/* ═══════════════════════════════════════════════════════════════
   PARAMS  — single source of truth for all control state
═══════════════════════════════════════════════════════════════ */
export const params = {
  mode:         'bars',
  fftSize:      8192,
  smoothing:    0.80,
  gain:         1.0,
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
};
