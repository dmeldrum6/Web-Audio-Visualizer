
let modeTransition = null; // { target, startTime }
function clearModeTransition() { modeTransition = null; }

/* These are set by main.js to avoid circular imports */
let _getCurrentMode     = null;
let _setCurrentMode     = null;
let _getLogicalW        = null;
let _getLogicalH        = null;
let _getBarsGradH       = null;
let _setBarsGradH       = null;
let _getVignetteW       = null;
let _setVignetteW       = null;
let _getVignetteH       = null;
let _setVignetteH       = null;
let _getCanvasWrap      = null;
let _applyThemeFn       = null;
let _markModifiedFn     = null;
let _toggleRecordFn     = null;
let _cycleModeFn        = null;
let _getLayerManagerFn  = null;
let _enableYtModeFn_ctrl  = null;
let _disableYtModeFn_ctrl = null;
let _updateYtLabelFn      = null;

function initControls({
  getCurrentMode, setCurrentMode,
  getLogicalW, getLogicalH,
  getCanvasWrap,
  applyTheme, markModified,
  toggleRecording, cycleMode,
  getLayerManager,
  enableYtMode, disableYtMode, updateYtModeLabel,
}) {
  _getCurrentMode    = getCurrentMode;
  _setCurrentMode    = setCurrentMode;
  _getLogicalW       = getLogicalW;
  _getLogicalH       = getLogicalH;
  _getCanvasWrap     = getCanvasWrap;
  _applyThemeFn      = applyTheme;
  _markModifiedFn    = markModified;
  _toggleRecordFn    = toggleRecording;
  _cycleModeFn       = cycleMode;
  _getLayerManagerFn = getLayerManager;
  _enableYtModeFn_ctrl  = enableYtMode;
  _disableYtModeFn_ctrl = disableYtMode;
  _updateYtLabelFn   = updateYtModeLabel;
}

function markModified() {
  if (_markModifiedFn) _markModifiedFn();
}

function switchModeAnimated(mode) {
  if (mode === _getCurrentMode()) return;
  modeTransition = { target: mode, startTime: performance.now() };
}

function switchMode(mode, g, spectroCtx2, spectroSW, spectroSH) {
  _setCurrentMode(mode);
  params.mode = mode;

  const logicalW = _getLogicalW();
  const logicalH = _getLogicalH();

  g.fillStyle = THEME.bgColor;
  g.fillRect(0, 0, logicalW, logicalH);

  if (mode === 'spectrogram') {
    clearSpectrogramCanvas();
  }

  document.getElementById('btn-mode-bars').classList.toggle('active',        mode === 'bars');
  document.getElementById('btn-mode-waveform').classList.toggle('active',    mode === 'waveform');
  document.getElementById('btn-mode-spectrogram').classList.toggle('active', mode === 'spectrogram');
  document.getElementById('btn-mode-radial').classList.toggle('active',      mode === 'radial');
  document.getElementById('btn-mode-particles').classList.toggle('active',   mode === 'particles');
  document.getElementById('btn-mode-rings').classList.toggle('active',       mode === 'rings');
  document.getElementById('btn-mode-scope').classList.toggle('active',       mode === 'scope');
  document.getElementById('btn-mode-terrain').classList.toggle('active',     mode === 'terrain');
  document.getElementById('row-density').style.display        = mode === 'particles' ? '' : 'none';
  document.getElementById('row-scope-mode').style.display     = mode === 'scope'     ? '' : 'none';
  document.getElementById('row-terrain-speed').style.display  = mode === 'terrain'   ? '' : 'none';
  if (mode !== 'scope') scopeTrail.length = 0;
}

function syncControlsToParams(currentMode) {
  document.getElementById('ctrl-fft-size').value = params.fftSize;
  document.getElementById('ctrl-smoothing').value = params.smoothing;
  document.getElementById('val-smoothing').textContent = params.smoothing.toFixed(2);
  document.getElementById('ctrl-gain').value = params.gain;
  document.getElementById('val-gain').textContent = params.gain.toFixed(1);
  document.getElementById('ctrl-motion').value = params.motionAmount;
  document.getElementById('val-motion').textContent = params.motionAmount.toFixed(2);
  document.getElementById('ctrl-trail').value = params.trailAlpha;
  document.getElementById('val-trail').textContent = params.trailAlpha.toFixed(2);
  document.getElementById('ctrl-mirror').classList.toggle('active', params.mirror);
  document.getElementById('ctrl-fill').classList.toggle('active', params.fill);
  document.getElementById('ctrl-barcount').value = params.barCount;
  document.getElementById('val-barcount').textContent = params.barCount;

  /* overlay */
  document.getElementById('ctrl-overlay-enabled').classList.toggle('active', params.overlayEnabled);
  document.getElementById('ctrl-overlay-text').value = params.overlayText;
  document.getElementById('ctrl-overlay-fontsize').value = params.overlayFontSize;
  document.getElementById('val-overlay-fontsize').textContent = params.overlayFontSize + 'px';
  document.getElementById('ctrl-overlay-fontfamily').value = params.overlayFontFamily;
  document.getElementById('ctrl-overlay-color').value = params.overlayColor;
  document.getElementById('ctrl-overlay-opacity').value = params.overlayOpacity;
  document.getElementById('val-overlay-opacity').textContent = params.overlayOpacity.toFixed(1);
  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.style === params.overlayStyle);
  });
  document.getElementById('ctrl-overlay-subtext').value = params.overlaySubtext;
  document.getElementById('ctrl-overlay-duration').value = params.overlayDuration;
  document.getElementById('val-overlay-duration').textContent =
    params.overlayDuration === 0 ? 'Always' : params.overlayDuration + 's';
  document.getElementById('lower-third-controls').style.display =
    params.overlayStyle === 'lower-third' ? '' : 'none';

  /* background */
  document.getElementById('ctrl-bg-opacity').value = params.bgOpacity;
  document.getElementById('val-bg-opacity').textContent = params.bgOpacity.toFixed(1);
  document.getElementById('ctrl-bg-blend').value = params.bgBlend;
  updateFitButtons(params.bgFit);
  document.getElementById('ctrl-radial-img-opacity').value = params.radialImgOpacity;
  document.getElementById('val-radial-img-opacity').textContent = params.radialImgOpacity.toFixed(1);
  document.querySelectorAll('#shape-btn-grid .fit-btn[data-shape]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.shape === params.radialShape);
  });

  /* bloom */
  document.getElementById('ctrl-bloom').value = params.bloomIntensity;
  document.getElementById('val-bloom').textContent = params.bloomIntensity === 0 ? 'Off' : params.bloomIntensity;
  document.getElementById('ctrl-progress-bar').classList.toggle('active', params.progressBar);
  document.getElementById('ctrl-show-timer').classList.toggle('active', params.showTimer);

  /* particles */
  document.getElementById('ctrl-density').value = params.particleDensity;
  document.getElementById('val-density').textContent = params.particleDensity;
  document.getElementById('row-density').style.display = currentMode === 'particles' ? '' : 'none';

  /* scope */
  document.getElementById('ctrl-scope-mono-delay').classList.toggle('active', params.scopeMonoDelay);
  document.getElementById('row-scope-mode').style.display = currentMode === 'scope' ? '' : 'none';

  /* terrain */
  document.getElementById('ctrl-terrain-speed').value = params.terrainSpeed;
  document.getElementById('val-terrain-speed').textContent = params.terrainSpeed;
  document.getElementById('row-terrain-speed').style.display = currentMode === 'terrain' ? '' : 'none';

  /* BPM */
  const bpmEnabledBtn = document.getElementById('ctrl-bpm-enabled');
  if (bpmEnabledBtn) {
    bpmEnabledBtn.classList.toggle('active', params.bpmEnabled);
    BPMClock.setEnabled(params.bpmEnabled);
    BPMClock.setBPM(params.bpm || 120);
    BPMClock.setSubdivision(params.bpmSubdivision || 1);
    const bpmInput = document.getElementById('ctrl-bpm-value');
    if (bpmInput) bpmInput.value = params.bpm || 120;
    const bpmDisp = document.getElementById('val-bpm');
    if (bpmDisp) bpmDisp.textContent = (params.bpm || 120) + ' BPM';
    const subdivSel = document.getElementById('ctrl-bpm-subdivision');
    if (subdivSel) subdivSel.value = params.bpmSubdivision || 1;
  }

  /* FX */
  const fxMode = document.getElementById('ctrl-fx-mode');
  if (fxMode) fxMode.value = params.fxMode || 'none';
  const fxInt = document.getElementById('ctrl-fx-intensity');
  if (fxInt) {
    fxInt.value = params.fxIntensity || 0.5;
    const fxVal = document.getElementById('val-fx-intensity');
    if (fxVal) fxVal.textContent = (params.fxIntensity || 0.5).toFixed(2);
  }

  /* Resolution */
  const resSel = document.getElementById('ctrl-record-resolution');
  if (resSel) resSel.value = params.recordResolution || '1080p';

  /* Layers enabled */
  const layEnabledBtn = document.getElementById('ctrl-layers-enabled');
  if (layEnabledBtn) layEnabledBtn.classList.toggle('active', params.layersEnabled);

  /* artist card */
  document.getElementById('ctrl-artist-card-enabled').classList.toggle('active', params.artistCardEnabled);
  document.getElementById('ctrl-artist-name').value = params.artistCardName;
  document.getElementById('ctrl-track-title').value = params.artistCardTitle;
  document.getElementById('ctrl-artist-card-opacity').value = params.artistCardOpacity;
  document.getElementById('val-artist-card-opacity').textContent = params.artistCardOpacity.toFixed(1);
  document.getElementById('ctrl-artist-card-timer-enabled').classList.toggle('active', params.artistCardTimerEnabled);
  document.getElementById('ctrl-artist-card-timer-duration').value = params.artistCardTimerDuration;
  document.getElementById('val-artist-card-timer-duration').textContent = params.artistCardTimerDuration + 's';
  document.getElementById('row-artist-card-timer-duration').style.display =
    params.artistCardTimerEnabled ? '' : 'none';
}

function applyTheme(index, canvasWrap, barsGradHRef, vignetteWRef, vignettHRef) {
  params.theme    = index;
  params.themeName = THEMES[index].name;
  const t = THEMES[index];

  THEME.bgColor   = t.bgColor;
  THEME.accent    = t.accentColor;
  THEME.highlight = t.highlightColor;
  THEME.mid       = t.midColor;
  THEME.waveRGB   = hexToRgb(t.highlightColor);

  setGradHueBase(hexToHsl(t.accentColor)[0]);

  document.documentElement.style.setProperty('--accent-color', t.highlightColor);

  invalidateBarsGrad();

  canvasWrap.style.background = t.bgColor;

  buildHeat(t.bgColor, t.accentColor, t.midColor, t.highlightColor);

  clearSpectrogramCanvas();

  document.querySelectorAll('.swatch').forEach((sw, i) => {
    sw.classList.toggle('active', i === index);
  });
}


function initModeButtons(switchModeAnimatedFn, markModifiedFn) {
  document.getElementById('btn-mode-bars').addEventListener('click', () => {
    switchModeAnimatedFn('bars'); markModifiedFn();
  });
  document.getElementById('btn-mode-waveform').addEventListener('click', () => {
    switchModeAnimatedFn('waveform'); markModifiedFn();
  });
  document.getElementById('btn-mode-spectrogram').addEventListener('click', () => {
    switchModeAnimatedFn('spectrogram'); markModifiedFn();
  });
  document.getElementById('btn-mode-radial').addEventListener('click', () => {
    switchModeAnimatedFn('radial'); markModifiedFn();
  });
  document.getElementById('btn-mode-particles').addEventListener('click', () => {
    switchModeAnimatedFn('particles'); markModifiedFn();
  });
  document.getElementById('btn-mode-rings').addEventListener('click', () => {
    switchModeAnimatedFn('rings'); markModifiedFn();
  });
  document.getElementById('btn-mode-scope').addEventListener('click', () => {
    switchModeAnimatedFn('scope'); markModifiedFn();
  });
  document.getElementById('btn-mode-terrain').addEventListener('click', () => {
    switchModeAnimatedFn('terrain'); markModifiedFn();
  });
}

function initAnalyzerControls(markModifiedFn) {
  document.getElementById('ctrl-fft-size').addEventListener('change', e => {
    const size = parseInt(e.target.value, 10);
    AudioEngine.setFftSize(size);
    barHeights.fill(0);
    markModifiedFn();
  });

  document.getElementById('ctrl-smoothing').addEventListener('input', e => {
    const val = parseFloat(e.target.value);
    document.getElementById('val-smoothing').textContent = val.toFixed(2);
    AudioEngine.setSmoothing(val);
    markModifiedFn();
  });

  document.getElementById('ctrl-gain').addEventListener('input', e => {
    const val = parseFloat(e.target.value);
    document.getElementById('val-gain').textContent = val.toFixed(1);
    AudioEngine.setGain(val);
    markModifiedFn();
  });
}

function initVisualControls(markModifiedFn) {
  document.getElementById('ctrl-motion').addEventListener('input', e => {
    params.motionAmount = parseFloat(e.target.value);
    document.getElementById('val-motion').textContent = params.motionAmount.toFixed(2);
    markModifiedFn();
  });

  document.getElementById('ctrl-trail').addEventListener('input', e => {
    params.trailAlpha = parseFloat(e.target.value);
    document.getElementById('val-trail').textContent = params.trailAlpha.toFixed(2);
    markModifiedFn();
  });

  document.getElementById('ctrl-mirror').addEventListener('click', e => {
    params.mirror = !params.mirror;
    e.currentTarget.classList.toggle('active', params.mirror);
    if (!params.mirror) barHeights.fill(0);
    markModifiedFn();
  });

  document.getElementById('ctrl-fill').addEventListener('click', e => {
    params.fill = !params.fill;
    e.currentTarget.classList.toggle('active', params.fill);
    markModifiedFn();
  });

  document.getElementById('ctrl-barcount').addEventListener('input', e => {
    params.barCount = parseInt(e.target.value, 10);
    document.getElementById('val-barcount').textContent = params.barCount;
    barHeights.fill(0);
    invalidateBarsGrad();
    markModifiedFn();
  });

  document.getElementById('ctrl-bloom').addEventListener('input', e => {
    params.bloomIntensity = parseInt(e.target.value, 10);
    document.getElementById('val-bloom').textContent = params.bloomIntensity === 0 ? 'Off' : params.bloomIntensity;
    markModifiedFn();
  });

  document.getElementById('ctrl-density').addEventListener('input', e => {
    params.particleDensity = parseInt(e.target.value, 10);
    document.getElementById('val-density').textContent = params.particleDensity;
    markModifiedFn();
  });

  document.getElementById('ctrl-scope-mono-delay').addEventListener('click', e => {
    params.scopeMonoDelay = !params.scopeMonoDelay;
    e.currentTarget.classList.toggle('active', params.scopeMonoDelay);
    scopeTrail.length = 0;
    markModifiedFn();
  });

  document.getElementById('ctrl-terrain-speed').addEventListener('input', e => {
    params.terrainSpeed = parseInt(e.target.value, 10);
    document.getElementById('val-terrain-speed').textContent = params.terrainSpeed;
    markModifiedFn();
  });

  document.getElementById('ctrl-progress-bar').addEventListener('click', e => {
    params.progressBar = !params.progressBar;
    e.currentTarget.classList.toggle('active', params.progressBar);
    markModifiedFn();
  });

  document.getElementById('ctrl-show-timer').addEventListener('click', e => {
    params.showTimer = !params.showTimer;
    e.currentTarget.classList.toggle('active', params.showTimer);
    markModifiedFn();
  });
}

function initBeatControls(markModifiedFn, getBeatFlashStart, setBeatFlashStart) {
  document.getElementById('ctrl-beat-enabled').addEventListener('click', e => {
    const on = !BeatDetector.isEnabled();
    BeatDetector.setEnabled(on);
    e.currentTarget.classList.toggle('active', on);
    if (!on) setBeatFlashStart(-Infinity); /* cancel any live flash */
  });

  document.getElementById('ctrl-beat-sensitivity').addEventListener('input', e => {
    const val = parseFloat(e.target.value);
    document.getElementById('val-beat-sensitivity').textContent = val.toFixed(2);
    BeatDetector.setMultiplier(val);
  });
}

function initTextOverlayControls(markModifiedFn) {
  const OVERLAY_STYLE_DEFS = [
    {
      id: 'scroll',
      label: 'Scroll',
      icon: `<svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="1" y1="6" x2="13" y2="6"/>
        <polyline points="10,3 13,6 10,9"/>
        <line x1="1" y1="2" x2="8" y2="2" opacity="0.4"/>
        <line x1="1" y1="10" x2="8" y2="10" opacity="0.4"/>
      </svg>`,
    },
    {
      id: 'fade',
      label: 'Fade',
      icon: `<svg width="18" height="12" viewBox="0 0 18 12">
        <circle cx="6" cy="6" r="4.5" fill="currentColor" opacity="0.9"/>
        <circle cx="13.5" cy="6" r="3.5" fill="currentColor" opacity="0.3"/>
      </svg>`,
    },
    {
      id: 'typewriter',
      label: 'Type',
      icon: `<svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <rect x="2" y="2" width="10" height="8" rx="1.5" opacity="0.5"/>
        <line x1="15" y1="2" x2="15" y2="10"/>
      </svg>`,
    },
    {
      id: 'glitch',
      label: 'Glitch',
      icon: `<svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <line x1="1" y1="4" x2="11" y2="4"/>
        <line x1="4" y1="6" x2="15" y2="6"/>
        <line x1="1" y1="8" x2="10" y2="8"/>
        <line x1="12" y1="3" x2="17" y2="3" opacity="0.5" stroke="#ff4466"/>
      </svg>`,
    },
    {
      id: 'wave',
      label: 'Wave',
      icon: `<svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1,6 C3,2 5,2 7,6 C9,10 11,10 13,6 C15,2 17,2 17,6"/>
      </svg>`,
    },
    {
      id: 'spotlight',
      label: 'Spot',
      icon: `<svg width="18" height="12" viewBox="0 0 18 12">
        <circle cx="9" cy="6" r="5.5" fill="currentColor" opacity="0.12"/>
        <circle cx="9" cy="6" r="3.5" fill="currentColor" opacity="0.4"/>
        <circle cx="9" cy="6" r="1.5" fill="currentColor" opacity="0.95"/>
      </svg>`,
    },
    {
      id: 'lower-third',
      label: 'Lower 3rd',
      icon: `<svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="6.5" width="16" height="4.5" rx="0.75" opacity="0.55" fill="currentColor" stroke="none"/>
        <line x1="1" y1="6.5" x2="1" y2="11" stroke-width="2.5"/>
        <line x1="3.5" y1="8" x2="11" y2="8" opacity="0.9"/>
        <line x1="3.5" y1="10" x2="8.5" y2="10" opacity="0.55"/>
      </svg>`,
    },
  ];

  const grid = document.getElementById('overlay-style-grid');
  OVERLAY_STYLE_DEFS.forEach(def => {
    const btn = document.createElement('button');
    btn.className       = 'style-btn' + (def.id === params.overlayStyle ? ' active' : '');
    btn.dataset.style   = def.id;
    btn.innerHTML       = def.icon + `<span>${def.label}</span>`;
    btn.addEventListener('click', () => {
      params.overlayStyle = def.id;
      resetOverlayTimer();
      document.querySelectorAll('.style-btn').forEach(b => b.classList.toggle('active', b.dataset.style === def.id));
      document.getElementById('lower-third-controls').style.display =
        def.id === 'lower-third' ? '' : 'none';
      if (def.id === 'lower-third' && params.overlayEnabled) triggerLowerThird();
      markModifiedFn();
    });
    grid.appendChild(btn);
  });

  document.getElementById('ctrl-overlay-enabled').addEventListener('click', e => {
    params.overlayEnabled = !params.overlayEnabled;
    e.currentTarget.classList.toggle('active', params.overlayEnabled);
    if (params.overlayEnabled && params.overlayStyle === 'lower-third') triggerLowerThird();
    markModifiedFn();
  });

  document.getElementById('ctrl-overlay-text').addEventListener('input', e => {
    params.overlayText = e.target.value;
    resetOverlayTimer();
    markModifiedFn();
  });

  document.getElementById('ctrl-overlay-fontsize').addEventListener('input', e => {
    params.overlayFontSize = parseInt(e.target.value, 10);
    document.getElementById('val-overlay-fontsize').textContent = params.overlayFontSize + 'px';
    markModifiedFn();
  });

  document.getElementById('ctrl-overlay-fontfamily').addEventListener('change', e => {
    params.overlayFontFamily = e.target.value;
    markModifiedFn();
  });

  document.getElementById('ctrl-overlay-color').addEventListener('input', e => {
    params.overlayColor = e.target.value;
    markModifiedFn();
  });

  document.getElementById('ctrl-overlay-opacity').addEventListener('input', e => {
    params.overlayOpacity = parseFloat(e.target.value);
    document.getElementById('val-overlay-opacity').textContent = params.overlayOpacity.toFixed(1);
    markModifiedFn();
  });

  document.getElementById('ctrl-overlay-subtext').addEventListener('input', e => {
    params.overlaySubtext = e.target.value;
    markModifiedFn();
  });

  document.getElementById('ctrl-overlay-duration').addEventListener('input', e => {
    params.overlayDuration = parseInt(e.target.value, 10);
    document.getElementById('val-overlay-duration').textContent =
      params.overlayDuration === 0 ? 'Always' : params.overlayDuration + 's';
    markModifiedFn();
  });

  document.getElementById('btn-show-lower-third').addEventListener('click', () => {
    triggerLowerThird();
  });
}

function initBackgroundControls(markModifiedFn) {
  const FIT_DEFS = [
    {
      id: 'cover', label: 'Cover',
      icon: `<svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="1" width="16" height="12" rx="1.5"/>
        <rect x="3" y="3" width="12" height="8" rx="1" opacity="0.5" fill="currentColor" stroke="none"/>
      </svg>`,
    },
    {
      id: 'contain', label: 'Contain',
      icon: `<svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="1" width="16" height="12" rx="1.5"/>
        <rect x="5" y="3" width="8" height="8" rx="1" opacity="0.5" fill="currentColor" stroke="none"/>
      </svg>`,
    },
    {
      id: 'stretch', label: 'Stretch',
      icon: `<svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="1" width="16" height="12" rx="1.5" fill="currentColor" opacity="0.25" stroke="currentColor"/>
        <line x1="6"  y1="2" x2="6"  y2="12" opacity="0.55"/>
        <line x1="12" y1="2" x2="12" y2="12" opacity="0.55"/>
      </svg>`,
    },
    {
      id: 'tile', label: 'Tile',
      icon: `<svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="1" width="16" height="12" rx="1.5"/>
        <rect x="2"  y="2"  width="6" height="5" rx="0.5" opacity="0.4" fill="currentColor" stroke="none"/>
        <rect x="10" y="2"  width="7" height="5" rx="0.5" opacity="0.4" fill="currentColor" stroke="none"/>
        <rect x="2"  y="8"  width="7" height="5" rx="0.5" opacity="0.4" fill="currentColor" stroke="none"/>
        <rect x="11" y="8"  width="6" height="5" rx="0.5" opacity="0.4" fill="currentColor" stroke="none"/>
      </svg>`,
    },
  ];

  const grid = document.getElementById('fit-btn-grid');
  FIT_DEFS.forEach(def => {
    const btn = document.createElement('button');
    btn.className   = 'fit-btn' + (def.id === params.bgFit && !params.bgGradient ? ' active' : '');
    btn.dataset.fit = def.id;
    btn.innerHTML   = def.icon + `<span>${def.label}</span>`;
    btn.addEventListener('click', () => {
      params.bgFit      = def.id;
      params.bgGradient = false;
      updateFitButtons(def.id);
      markModifiedFn();
    });
    grid.appendChild(btn);
  });

  /* Gradient button — full-width, below the four fit buttons */
  const gradBtn = document.createElement('button');
  gradBtn.id        = 'btn-bg-gradient';
  gradBtn.className = 'fit-btn' + (params.bgGradient ? ' active' : '');
  gradBtn.style.cssText = 'grid-column:1/-1;flex-direction:row;gap:6px;padding:7px 10px;justify-content:center';
  gradBtn.innerHTML =
    `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rbg-gi" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stop-color="currentColor" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="currentColor" stop-opacity="0.1"/>
        </radialGradient>
      </defs>
      <circle cx="8" cy="8" r="6.5" fill="url(#rbg-gi)" stroke="currentColor" stroke-width="1"/>
      <circle cx="8" cy="8" r="2"   fill="currentColor" opacity="0.75"/>
    </svg>
    <span>Gradient</span>`;
  gradBtn.addEventListener('click', () => {
    params.bgGradient = !params.bgGradient;
    updateFitButtons(params.bgFit);
    markModifiedFn();
  });
  grid.appendChild(gradBtn);

  document.getElementById('btn-load-bg').addEventListener('click', () => {
    document.getElementById('bg-file-input').click();
  });

  document.getElementById('bg-file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    loadBackgroundFromFile(file);
    e.target.value = '';
    markModifiedFn();
  });

  document.getElementById('btn-clear-bg').addEventListener('click', () => {
    clearBackground();
    markModifiedFn();
  });

  document.getElementById('ctrl-bg-opacity').addEventListener('input', e => {
    params.bgOpacity = parseFloat(e.target.value);
    document.getElementById('val-bg-opacity').textContent = params.bgOpacity.toFixed(1);
    markModifiedFn();
  });

  document.getElementById('ctrl-bg-blend').addEventListener('change', e => {
    params.bgBlend = e.target.value;
    markModifiedFn();
  });

  document.getElementById('btn-load-radial-img').addEventListener('click', () => {
    document.getElementById('radial-img-file-input').click();
  });

  document.getElementById('radial-img-file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    loadRadialImageFromFile(file);
    e.target.value = '';
    markModifiedFn();
  });

  document.getElementById('btn-clear-radial-img').addEventListener('click', () => {
    clearRadialImage();
    markModifiedFn();
  });

  document.getElementById('ctrl-radial-img-opacity').addEventListener('input', e => {
    params.radialImgOpacity = parseFloat(e.target.value);
    document.getElementById('val-radial-img-opacity').textContent = params.radialImgOpacity.toFixed(1);
    markModifiedFn();
  });

  document.querySelectorAll('#shape-btn-grid .fit-btn[data-shape]').forEach(btn => {
    btn.addEventListener('click', () => {
      params.radialShape = btn.dataset.shape;
      document.querySelectorAll('#shape-btn-grid .fit-btn[data-shape]').forEach(b =>
        b.classList.toggle('active', b === btn));
      markModifiedFn();
    });
  });
}

function initArtistCardControls(markModifiedFn, loadArtistImageFromFile, clearArtistImage) {
  document.getElementById('ctrl-artist-card-enabled').addEventListener('click', e => {
    params.artistCardEnabled = !params.artistCardEnabled;
    e.currentTarget.classList.toggle('active', params.artistCardEnabled);
    markModifiedFn();
  });

  document.getElementById('ctrl-artist-name').addEventListener('input', e => {
    params.artistCardName = e.target.value;
    markModifiedFn();
  });

  document.getElementById('ctrl-track-title').addEventListener('input', e => {
    params.artistCardTitle = e.target.value;
    markModifiedFn();
  });

  document.getElementById('btn-load-artist-img').addEventListener('click', () => {
    document.getElementById('artist-img-file-input').click();
  });

  document.getElementById('artist-img-file-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    loadArtistImageFromFile(file);
    e.target.value = '';
    markModifiedFn();
  });

  document.getElementById('btn-clear-artist-img').addEventListener('click', () => {
    clearArtistImage();
    markModifiedFn();
  });

  document.getElementById('ctrl-artist-card-opacity').addEventListener('input', e => {
    params.artistCardOpacity = parseFloat(e.target.value);
    document.getElementById('val-artist-card-opacity').textContent = params.artistCardOpacity.toFixed(1);
    markModifiedFn();
  });

  document.getElementById('ctrl-artist-card-timer-enabled').addEventListener('click', e => {
    params.artistCardTimerEnabled = !params.artistCardTimerEnabled;
    e.currentTarget.classList.toggle('active', params.artistCardTimerEnabled);
    document.getElementById('row-artist-card-timer-duration').style.display =
      params.artistCardTimerEnabled ? '' : 'none';
    markModifiedFn();
  });

  document.getElementById('ctrl-artist-card-timer-duration').addEventListener('input', e => {
    params.artistCardTimerDuration = parseInt(e.target.value, 10);
    document.getElementById('val-artist-card-timer-duration').textContent = params.artistCardTimerDuration + 's';
    markModifiedFn();
  });
}

function initShortcutsModal() {
  const shortcutsModal = document.getElementById('shortcuts-modal');

  function openShortcutsModal()  { shortcutsModal.classList.remove('hidden'); }
  function closeShortcutsModal() { shortcutsModal.classList.add('hidden'); }

  document.getElementById('btn-shortcuts').addEventListener('click', openShortcutsModal);
  document.getElementById('btn-close-shortcuts').addEventListener('click', closeShortcutsModal);

  shortcutsModal.addEventListener('click', e => {
    if (e.target === shortcutsModal) closeShortcutsModal();
  });

  return { openShortcutsModal, closeShortcutsModal };
}

function initMobileDrawer(canvasWrap, isMobileFn) {
  const sidebar      = document.getElementById('sidebar');
  const drawerToggle = document.getElementById('drawer-toggle');
  const iconOpen     = document.getElementById('drawer-icon-open');
  const iconClose    = document.getElementById('drawer-icon-close');

  let drawerOpen = false;

  function setDrawer(open) {
    drawerOpen = open;
    sidebar.classList.toggle('open', open);
    iconOpen.style.display  = open ? 'none'  : '';
    iconClose.style.display = open ? ''      : 'none';
  }

  drawerToggle.addEventListener('click', () => setDrawer(!drawerOpen));

  /* Close drawer on canvas tap (mobile) */
  canvasWrap.addEventListener('click', () => {
    if (drawerOpen && isMobileFn()) setDrawer(false);
  }, { passive: true });
}

function initRightPanel() {
  const host     = document.getElementById('right-panel-host');
  const navBtns  = Array.from(document.querySelectorAll('.nav-btn[data-panel]'));
  const sections = Array.from(document.querySelectorAll('.panel-section'));

  function closePanel() {
    host.classList.remove('panel-open');
    sections.forEach(s => s.classList.remove('panel-active'));
    navBtns.forEach(b => b.classList.remove('active'));
  }

  function openPanel(panelId) {
    sections.forEach(s => s.classList.toggle('panel-active', s.id === panelId));
    host.classList.add('panel-open');
    host.scrollTop = 0;
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const panelId = btn.dataset.panel;
      const isActive = btn.classList.contains('active');
      navBtns.forEach(b => b.classList.remove('active'));
      if (isActive) {
        closePanel();
      } else {
        btn.classList.add('active');
        openPanel(panelId);
      }
    });
  });

  host.addEventListener('click', e => {
    if (e.target.closest('.panel-close-btn')) closePanel();
  });

  // Tab focus trap
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !host.classList.contains('panel-open')) return;
    const activeSection = host.querySelector('.panel-section.panel-active');
    if (!activeSection) return;
    const focusable = Array.from(activeSection.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
      'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    e.preventDefault();
    const idx = focusable.indexOf(document.activeElement);
    if (e.shiftKey) {
      focusable[idx <= 0 ? focusable.length - 1 : idx - 1].focus();
    } else {
      focusable[idx < 0 || idx === focusable.length - 1 ? 0 : idx + 1].focus();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && host.classList.contains('panel-open')) closePanel();
  });

  // Active-selection indicator
  const navMode   = document.getElementById('nav-mode');
  const navThemes = document.getElementById('nav-themes');
  if (navMode)   navMode.dataset.hasSelection   = '';
  if (navThemes) navThemes.dataset.hasSelection = '';
}


/* ═══════════════════════════════════════════════════════════════
   BPM CLOCK CONTROLS
═══════════════════════════════════════════════════════════════ */
function initBPMControls(markModifiedFn) {
  const enableBtn   = document.getElementById('ctrl-bpm-enabled');
  const tapBtn      = document.getElementById('ctrl-bpm-tap');
  const bpmInput    = document.getElementById('ctrl-bpm-value');
  const bpmDisplay  = document.getElementById('val-bpm');
  const subdivSel   = document.getElementById('ctrl-bpm-subdivision');

  if (!enableBtn) return;

  enableBtn.addEventListener('click', () => {
    params.bpmEnabled = !params.bpmEnabled;
    BPMClock.setEnabled(params.bpmEnabled);
    enableBtn.classList.toggle('active', params.bpmEnabled);
    markModifiedFn();
  });

  tapBtn.addEventListener('click', () => {
    BPMClock.tap();
    params.bpm = Math.round(BPMClock.getBPM());
    bpmInput.value  = params.bpm;
    bpmDisplay.textContent = params.bpm + ' BPM';
    markModifiedFn();
  });

  bpmInput.addEventListener('input', () => {
    const v = Math.max(40, Math.min(250, parseInt(bpmInput.value, 10) || 120));
    params.bpm = v;
    BPMClock.setBPM(v);
    bpmDisplay.textContent = v + ' BPM';
    markModifiedFn();
  });

  subdivSel.addEventListener('change', () => {
    const v = parseInt(subdivSel.value, 10);
    params.bpmSubdivision = v;
    BPMClock.setSubdivision(v);
    markModifiedFn();
  });
}


/* ═══════════════════════════════════════════════════════════════
   FX CONTROLS
═══════════════════════════════════════════════════════════════ */
function initFXControls(markModifiedFn) {
  const modeSelect   = document.getElementById('ctrl-fx-mode');
  const intensityEl  = document.getElementById('ctrl-fx-intensity');
  const intensityVal = document.getElementById('val-fx-intensity');

  if (!modeSelect) return;

  modeSelect.addEventListener('change', () => {
    params.fxMode = modeSelect.value;
    markModifiedFn();
  });

  intensityEl.addEventListener('input', () => {
    params.fxIntensity = parseFloat(intensityEl.value);
    intensityVal.textContent = params.fxIntensity.toFixed(2);
    markModifiedFn();
  });
}


/* ═══════════════════════════════════════════════════════════════
   PER-ELEMENT BINDING CONTROLS
═══════════════════════════════════════════════════════════════ */
function _makeBindingRow(elementKey, label) {
  const b = params.bindings[elementKey];

  const row = document.createElement('div');
  row.className  = 'binding-row';
  row.innerHTML = `
    <div class="binding-header">
      <span class="binding-label">${label}</span>
      <button class="toggle-btn ${b.enabled ? 'active' : ''}"
              id="ctrl-bind-${elementKey}-enabled" aria-label="Toggle ${label} binding"></button>
    </div>
    <div class="binding-body">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <select class="ctrl-select" id="ctrl-bind-${elementKey}-band" style="flex:1">
          <option value="bass"  ${b.band==='bass'  ? 'selected':''}>Bass</option>
          <option value="mids"  ${b.band==='mids'  ? 'selected':''}>Mids</option>
          <option value="highs" ${b.band==='highs' ? 'selected':''}>Highs</option>
        </select>
        <input type="color" id="ctrl-bind-${elementKey}-color"
               value="${b.color || '#ffffff'}" title="Element color"
               style="width:30px;height:28px;padding:2px;border:none;background:none;cursor:pointer">
      </div>
      ${elementKey === 'label' ? `<input type="text" class="text-input" id="ctrl-bind-${elementKey}-label"
               value="${b.label || 'LIVE'}" maxlength="20" placeholder="Label text…"
               style="margin-top:6px">` : ''}
      <div style="display:flex;gap:4px;align-items:center;margin-top:6px;font-size:11px;color:#888">
        <span>Range&nbsp;</span>
        <input type="range" id="ctrl-bind-${elementKey}-min"
               min="0" max="1" step="0.01" value="${b.minVal}" style="flex:1">
        <span id="val-bind-${elementKey}-min">${b.minVal.toFixed(2)}</span>
        <span>&nbsp;→&nbsp;</span>
        <input type="range" id="ctrl-bind-${elementKey}-max"
               min="0" max="1" step="0.01" value="${b.maxVal}" style="flex:1">
        <span id="val-bind-${elementKey}-max">${b.maxVal.toFixed(2)}</span>
      </div>
    </div>`;
  return row;
}

function initBindingControls(markModifiedFn) {
  const container = document.getElementById('binding-rows');
  if (!container) return;

  const ELEMENTS = [
    { key: 'circle', label: 'Circle' },
    { key: 'bar',    label: 'Bar Strip' },
    { key: 'ring',   label: 'Ring' },
    { key: 'label',  label: 'Label' },
  ];

  ELEMENTS.forEach(({ key, label }) => {
    const row = _makeBindingRow(key, label);
    container.appendChild(row);

    const b = params.bindings[key];

    document.getElementById(`ctrl-bind-${key}-enabled`).addEventListener('click', e => {
      b.enabled = !b.enabled;
      e.currentTarget.classList.toggle('active', b.enabled);
      markModifiedFn();
    });

    document.getElementById(`ctrl-bind-${key}-band`).addEventListener('change', e => {
      b.band = e.target.value;
      markModifiedFn();
    });

    document.getElementById(`ctrl-bind-${key}-color`).addEventListener('input', e => {
      b.color = e.target.value;
      markModifiedFn();
    });

    if (key === 'label') {
      document.getElementById(`ctrl-bind-${key}-label`).addEventListener('input', e => {
        b.label = e.target.value;
        markModifiedFn();
      });
    }

    document.getElementById(`ctrl-bind-${key}-min`).addEventListener('input', e => {
      b.minVal = parseFloat(e.target.value);
      document.getElementById(`val-bind-${key}-min`).textContent = b.minVal.toFixed(2);
      markModifiedFn();
    });

    document.getElementById(`ctrl-bind-${key}-max`).addEventListener('input', e => {
      b.maxVal = parseFloat(e.target.value);
      document.getElementById(`val-bind-${key}-max`).textContent = b.maxVal.toFixed(2);
      markModifiedFn();
    });
  });
}


/* ═══════════════════════════════════════════════════════════════
   LAYER COMPOSITOR CONTROLS
═══════════════════════════════════════════════════════════════ */
const LAYER_MODES = ['bars','waveform','spectrogram','radial','particles','rings','scope','terrain'];
const BLEND_MODES = [
  'source-over','screen','multiply','overlay','soft-light',
  'hard-light','color-dodge','color-burn','difference','exclusion','lighter',
];

function _renderLayerList(container, markModifiedFn) {
  if (!_getLayerManagerFn) return;
  const lm = _getLayerManagerFn();
  container.innerHTML = '';

  if (lm.layers.length === 0) {
    container.innerHTML = '<p style="color:#666;font-size:12px;margin:8px 0">No layers. Add one below.</p>';
    return;
  }

  lm.layers.forEach((layer, idx) => {
    const div = document.createElement('div');
    div.className = 'layer-row';
    const layerThemeMiniSwatches = THEMES.map((t, ti) => {
      const isActive = layer.themeIndex === ti;
      const isGlobal = layer.themeIndex === null && ti === params.theme;
      return `<div class="layer-theme-dot ${isActive ? 'active' : ''}"
        data-ti="${ti}"
        title="${t.name}"
        style="background:linear-gradient(135deg,${t.bgColor} 0%,${t.accentColor} 50%,${t.highlightColor} 100%);${isGlobal?'outline:1px dashed #888;':''}">
      </div>`;
    }).join('');

    div.innerHTML = `
      <div class="layer-row-header">
        <span class="layer-idx">${idx + 1}</span>
        <select class="ctrl-select layer-mode-sel" style="flex:1">
          ${LAYER_MODES.map(m => `<option value="${m}" ${m===layer.mode?'selected':''}>${m[0].toUpperCase()+m.slice(1)}</option>`).join('')}
        </select>
        <button class="toggle-btn ${layer.visible?'active':''} layer-vis-btn" title="Toggle visibility"></button>
        <button class="btn layer-del-btn" title="Remove layer" style="padding:3px 7px;font-size:11px">✕</button>
      </div>
      <div style="margin-top:6px">
        <div style="font-size:11px;color:#888;margin-bottom:4px">Theme <span class="layer-theme-name">${layer.themeIndex !== null ? THEMES[layer.themeIndex].name : '(Global)'}</span></div>
        <div class="layer-theme-dots">
          <div class="layer-theme-dot ${layer.themeIndex === null ? 'active' : ''}" data-ti="null" title="Use global theme" style="background:#1a1a1a;border:1px solid #444;font-size:9px;display:flex;align-items:center;justify-content:center;color:#888">↩</div>
          ${layerThemeMiniSwatches}
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:6px;flex-wrap:wrap">
        <div style="flex:1;min-width:80px">
          <div style="font-size:11px;color:#888;margin-bottom:3px">Opacity <span class="layer-op-val">${layer.opacity.toFixed(2)}</span></div>
          <input type="range" class="layer-op-range" min="0.05" max="1" step="0.05" value="${layer.opacity}" style="width:100%">
        </div>
        <div style="flex:1;min-width:80px">
          <div style="font-size:11px;color:#888;margin-bottom:3px">Blend</div>
          <select class="ctrl-select layer-blend-sel">
            ${BLEND_MODES.map(m => `<option value="${m}" ${m===layer.blendMode?'selected':''}>${m}</option>`).join('')}
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:3px">
          <button class="btn layer-up-btn" style="padding:2px 7px;font-size:11px" ${idx===0?'disabled':''}>▲</button>
          <button class="btn layer-dn-btn" style="padding:2px 7px;font-size:11px" ${idx===lm.layers.length-1?'disabled':''}>▼</button>
        </div>
      </div>`;

    div.querySelector('.layer-mode-sel').addEventListener('change', e => {
      layer.mode = e.target.value;
      markModifiedFn();
    });

    div.querySelector('.layer-vis-btn').addEventListener('click', e => {
      layer.visible = !layer.visible;
      e.currentTarget.classList.toggle('active', layer.visible);
      markModifiedFn();
    });

    div.querySelector('.layer-del-btn').addEventListener('click', () => {
      lm.removeLayer(layer.id);
      if (lm.layers.length === 0) params.layersEnabled = false;
      _renderLayerList(container, markModifiedFn);
      _syncLayerEnabledBtn();
      markModifiedFn();
    });

    div.querySelector('.layer-theme-dots').addEventListener('click', e => {
      const dot = e.target.closest('.layer-theme-dot');
      if (!dot) return;
      const ti = dot.dataset.ti;
      layer.themeIndex = ti === 'null' ? null : parseInt(ti, 10);
      div.querySelectorAll('.layer-theme-dot').forEach(d => d.classList.toggle('active', d.dataset.ti === dot.dataset.ti));
      div.querySelector('.layer-theme-name').textContent = layer.themeIndex !== null ? THEMES[layer.themeIndex].name : '(Global)';
      markModifiedFn();
    });

    div.querySelector('.layer-op-range').addEventListener('input', e => {
      layer.opacity = parseFloat(e.target.value);
      div.querySelector('.layer-op-val').textContent = layer.opacity.toFixed(2);
      markModifiedFn();
    });

    div.querySelector('.layer-blend-sel').addEventListener('change', e => {
      layer.blendMode = e.target.value;
      markModifiedFn();
    });

    div.querySelector('.layer-up-btn').addEventListener('click', () => {
      lm.moveUp(layer.id);
      _renderLayerList(container, markModifiedFn);
      markModifiedFn();
    });

    div.querySelector('.layer-dn-btn').addEventListener('click', () => {
      lm.moveDown(layer.id);
      _renderLayerList(container, markModifiedFn);
      markModifiedFn();
    });

    container.appendChild(div);
  });
}

let _syncLayerEnabledBtn = () => {};

function initLayerControls(markModifiedFn) {
  const enableBtn  = document.getElementById('ctrl-layers-enabled');
  const addBtn     = document.getElementById('ctrl-layer-add');
  const container  = document.getElementById('layer-list');
  const addModeEl  = document.getElementById('ctrl-layer-add-mode');

  if (!enableBtn || !_getLayerManagerFn) return;

  _syncLayerEnabledBtn = () => {
    enableBtn.classList.toggle('active', params.layersEnabled);
  };

  enableBtn.addEventListener('click', () => {
    params.layersEnabled = !params.layersEnabled;
    _syncLayerEnabledBtn();
    markModifiedFn();
  });

  addBtn.addEventListener('click', () => {
    const lm = _getLayerManagerFn();
    if (lm.layers.length >= 4) {
      showToast('Maximum 4 layers reached', 'warn');
      return;
    }
    const mode = addModeEl ? addModeEl.value : 'bars';
    lm.addLayer({ mode, opacity: 1.0, blendMode: 'source-over' });
    params.layersEnabled = true;
    _syncLayerEnabledBtn();
    _renderLayerList(container, markModifiedFn);
    markModifiedFn();
  });

  _renderLayerList(container, markModifiedFn);
}


/* ═══════════════════════════════════════════════════════════════
   RECORDING RESOLUTION CONTROLS
═══════════════════════════════════════════════════════════════ */
function initRecordingControls(markModifiedFn) {
  const sel = document.getElementById('ctrl-record-resolution');
  if (!sel) return;

  sel.value = params.recordResolution || '1080p';

  sel.addEventListener('change', () => {
    params.recordResolution = sel.value;
    if (_updateYtLabelFn) _updateYtLabelFn();
    markModifiedFn();
  });
}
