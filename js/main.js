
/* ═══════════════════════════════════════════════════════════════
   CANVAS + RESIZE
═══════════════════════════════════════════════════════════════ */
const canvasWrap = document.getElementById('canvas-wrap');
const canvas     = document.getElementById('viz-canvas');
const g          = canvas.getContext('2d');
const idleEl     = document.getElementById('idle-msg');

let logicalW = 1, logicalH = 1;
let ytModeActive = false;

/* Bloom off-screen canvas */
let bloomCanvas = document.createElement('canvas');
let bloomCtx    = bloomCanvas.getContext('2d');

/* Vignette gradient cache — invalidated on resize */
let vignetteGrad = null;
let vignetteW = -1, vignetteH = -1;

function resizeCanvas() {
  if (ytModeActive) return;
  const dpr = window.devicePixelRatio || 1;
  logicalW = canvasWrap.clientWidth;
  logicalH = canvasWrap.clientHeight;
  canvas.width  = Math.round(logicalW * dpr);
  canvas.height = Math.round(logicalH * dpr);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  bloomCanvas.width  = canvas.width;
  bloomCanvas.height = canvas.height;
  bloomCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  vignetteW = -1;
  vignetteH = -1;
  bgState.patternW = -1;
  bgState.patternH = -1;
}

new ResizeObserver(resizeCanvas).observe(canvasWrap);
resizeCanvas();


/* ═══════════════════════════════════════════════════════════════
   VISUALIZER STATE
═══════════════════════════════════════════════════════════════ */
let currentMode = 'bars';

/* Beat flash — timestamp of the last detected beat; -Infinity = no flash active */
let beatFlashStart = -Infinity;

/* Mode array for cycling */
const MODES = ['bars', 'waveform', 'spectrogram', 'radial', 'particles', 'rings', 'scope', 'terrain'];

function getCurrentMode()      { return currentMode; }
function setCurrentMode(mode)  { currentMode = mode; }
function getLogicalW()         { return logicalW; }
function getLogicalH()         { return logicalH; }


/* ═══════════════════════════════════════════════════════════════
   MARK MODIFIED
═══════════════════════════════════════════════════════════════ */
function doMarkModified() {
  clearActivePresetName();
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  refreshPresetGrid();
}


/* ═══════════════════════════════════════════════════════════════
   CYCLE MODE
═══════════════════════════════════════════════════════════════ */
function cycleMode() {
  const idx  = MODES.indexOf(currentMode);
  const next = MODES[(idx + 1) % MODES.length];
  switchModeAnimated(next);
  doMarkModified();
}


/* ═══════════════════════════════════════════════════════════════
   VIGNETTE
═══════════════════════════════════════════════════════════════ */
function drawVignette(W, H) {
  if (vignetteW !== W || vignetteH !== H) {
    const cx = W / 2, cy = H / 2;
    const r  = Math.sqrt(W * W + H * H) * 0.55;
    vignetteGrad = g.createRadialGradient(cx, cy, r * 0.25, cx, cy, r);
    vignetteGrad.addColorStop(0,   'rgba(0,0,0,0)');
    vignetteGrad.addColorStop(0.6, 'rgba(0,0,0,0)');
    vignetteGrad.addColorStop(1,   'rgba(0,0,0,0.65)');
    vignetteW = W;
    vignetteH = H;
  }
  g.fillStyle = vignetteGrad;
  g.fillRect(0, 0, W, H);
}


/* ═══════════════════════════════════════════════════════════════
   RENDER
═══════════════════════════════════════════════════════════════ */
function render(freq, time) {
  const W = logicalW;
  const H = logicalH;

  /* 1. Clear canvas — solid fill or fading trail */
  g.globalCompositeOperation = 'source-over';
  if (params.trailAlpha > 0) {
    const [br, bg2, bb] = hexToRgb(THEME.bgColor);
    g.globalAlpha = 1 - params.trailAlpha;
    g.fillStyle   = `rgb(${br},${bg2},${bb})`;
    g.fillRect(0, 0, W, H);
    g.globalAlpha = 1;
  } else {
    g.globalAlpha = 1;
    g.fillStyle   = THEME.bgColor;
    g.fillRect(0, 0, W, H);
  }

  /* 2. Background — gradient or image */
  if (params.bgGradient) {
    drawGradientBackground(g, W, H, freq);
  } else {
    drawBackground(g, W, H);
  }

  /* 3. Reset compositing before visualizer pass */
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;

  /* 4. Visualizer — fill opacity reduced 20% when any background is active */
  const vizFillAlpha = (params.bgGradient || bgState.image) ? 0.8 : 1.0;
  renderMode(g, currentMode, freq, time, W, H, vizFillAlpha, bgState, radialImageState);

  /* 5. Vignette */
  drawVignette(W, H);

  /* 6. Text overlay */
  drawTextOverlay(g, W, H);

  /* 7. Mode transition fade-to-black overlay */
  const mt = modeTransition;
  if (mt) {
    const elapsed = performance.now() - mt.startTime;
    const alpha   = Math.min(1, elapsed / 200);
    g.fillStyle   = `rgba(0,0,0,${alpha})`;
    g.fillRect(0, 0, W, H);
    if (alpha >= 1) {
      switchMode(mt.target, g);
      clearModeTransition();
    }
  }

  /* 8. Beat flash — brief white overlay lasting 150 ms */
  if (BeatDetector.isEnabled()) {
    const bfElapsed = performance.now() - beatFlashStart;
    if (bfElapsed >= 0 && bfElapsed < 150) {
      g.fillStyle = `rgba(255,255,255,${0.06 * (1 - bfElapsed / 150)})`;
      g.fillRect(0, 0, W, H);
    }
  }

  /* 9. Bloom/glow post-processing */
  if (params.bloomIntensity > 0) {
    applyBloom(g, canvas, bloomCanvas, bloomCtx, W, H);
  }

  /* 10. Progress bar — drawn last so it composites over everything */
  drawProgressBar(g, W, H);

  /* 11. Elapsed timer */
  drawElapsedTimer(g, W, H);

  /* 12. Artist card — drawn after bloom so the panel is never blurred */
  drawArtistCard(g, W, H);
}


/* ═══════════════════════════════════════════════════════════════
   FPS COUNTER
═══════════════════════════════════════════════════════════════ */
const fpsEl  = document.getElementById('fps-counter');
let fpsCount = 0;
let fpsLast  = performance.now();

function tickFPS(now) {
  fpsCount++;
  const delta = now - fpsLast;
  if (delta >= 1000) {
    fpsEl.textContent = `${Math.round(fpsCount * 1000 / delta)} fps`;
    fpsCount = 0;
    fpsLast  = now;
  }
}


/* ═══════════════════════════════════════════════════════════════
   LEVEL METER
═══════════════════════════════════════════════════════════════ */
const levelBar  = document.getElementById('level-bar');
const clipBadge = document.getElementById('clip-badge');
let   clipTimer = null;

function updateLevelMeter(rms) {
  const pct = Math.min(100, rms * 420);
  levelBar.style.width = pct + '%';

  if (rms > 0.9) {
    clipBadge.classList.add('visible');
    clearTimeout(clipTimer);
    clipTimer = setTimeout(() => clipBadge.classList.remove('visible'), 900);
  }
}


/* ═══════════════════════════════════════════════════════════════
   SAFE-LISTEN  — warn when RMS stays high for 3+ seconds
═══════════════════════════════════════════════════════════════ */
let highRmsStart    = 0;
let safListenWarned = false;

function checkSafeListen(rms) {
  if (rms > 0.85) {
    if (highRmsStart === 0) highRmsStart = performance.now();
    if (!safListenWarned && (performance.now() - highRmsStart) >= 3000) {
      safListenWarned = true;
      showToast('Audio level is high — consider reducing gain', 'warn');
    }
  } else {
    highRmsStart    = 0;
    safListenWarned = false;
  }
}


/* ═══════════════════════════════════════════════════════════════
   BEAT DOT UI
═══════════════════════════════════════════════════════════════ */
const beatDotEl = document.getElementById('beat-dot');

function flashBeatDot() {
  beatDotEl.classList.remove('beat');
  void beatDotEl.offsetWidth; /* restart animation */
  beatDotEl.classList.add('beat');
}


/* ═══════════════════════════════════════════════════════════════
   RENDER LOOP
═══════════════════════════════════════════════════════════════ */
let hasSource = false;

function loop(now) {
  requestAnimationFrame(loop);
  tickFPS(now);

  const running = AudioEngine.getState() === 'running';
  idleEl.style.display = (running && hasSource) ? 'none' : '';

  if (!running) {
    render(null, null);
    return;
  }

  const freq = AudioEngine.getFrequencyData();
  const time = AudioEngine.getTimeDomainData();

  BeatDetector.update(freq);
  if (BeatDetector.isBeat()) {
    beatFlashStart = performance.now();
    setRadialBeatTime(performance.now());
    setArtistCardBeatState(1.15, 0.20, 0.40);
    flashBeatDot();
  }

  render(freq, time);

  const rms = AudioEngine.getRMS();
  updateLevelMeter(rms);
  checkSafeListen(rms);

  /* Tick seek bar while a file is active and the user is not dragging */
  if (AudioEngine.getSourceType() === 'file' && !pbIsSeeking) {
    const dur = AudioEngine.fileGetDuration();
    const pos = AudioEngine.fileGetOffset();
    if (dur > 0) {
      pbSeekEl.value = pos;
      pbCurrentEl.textContent = formatTime(pos);
      updateSeekBarStyle(pos, dur);
    }
  }
}

requestAnimationFrame(loop);


/* ═══════════════════════════════════════════════════════════════
   YOUTUBE MODE
═══════════════════════════════════════════════════════════════ */
const btnYtMode = document.getElementById('btn-yt-mode');
const ytInner   = document.getElementById('yt-inner');
const ytGuide   = document.getElementById('yt-guide');

function applyYtModeLayout() {
  const wrapW  = canvasWrap.clientWidth;
  const wrapH  = canvasWrap.clientHeight;
  const scaleX = wrapW / 1920;
  const scaleY = wrapH / 1080;
  ytInner.style.transform = `scale(${Math.min(scaleX, scaleY)})`;
}

const ytResizeObserver = new ResizeObserver(applyYtModeLayout);

function enableYtMode() {
  ytModeActive = true;
  btnYtMode.classList.add('active');

  ytInner.appendChild(canvas);
  canvasWrap.classList.add('yt-mode');

  canvas.width  = 1920;
  canvas.height = 1080;
  g.setTransform(1, 0, 0, 1, 0, 0);
  bloomCanvas.width  = 1920;
  bloomCanvas.height = 1080;
  bloomCtx.setTransform(1, 0, 0, 1, 0, 0);
  logicalW = 1920;
  logicalH = 1080;
  vignetteW = -1;
  vignetteH = -1;
  bgState.patternW = -1;
  bgState.patternH = -1;

  applyYtModeLayout();
  ytResizeObserver.observe(canvasWrap);

  if (!isRecording) ytGuide.style.display = 'block';
}

function disableYtMode() {
  ytModeActive = false;
  btnYtMode.classList.remove('active');

  ytGuide.style.display = 'none';
  ytResizeObserver.unobserve(canvasWrap);

  canvasWrap.appendChild(canvas);
  canvasWrap.classList.remove('yt-mode');

  resizeCanvas();
}

btnYtMode.addEventListener('click', () => {
  if (ytModeActive) disableYtMode();
  else enableYtMode();
});

document.getElementById('btn-yt-layout').addEventListener('click', () => {
  if (!ytModeActive) enableYtMode();
  params.artistCardEnabled = true;
  params.progressBar       = true;
  params.showTimer         = true;
  if (params.overlayText.trim()) {
    params.overlayEnabled = true;
    params.overlayStyle   = 'lower-third';
    triggerLowerThird();
  }
  syncControlsToParams(currentMode);
  doMarkModified();
  showToast('YouTube layout applied', 'info');
});


/* ═══════════════════════════════════════════════════════════════
   FILE TRANSPORT
═══════════════════════════════════════════════════════════════ */
const playbackBar  = document.getElementById('playback-bar');
const pbPlayBtn    = document.getElementById('pb-play');
const pbStopBtn    = document.getElementById('pb-stop');
const pbLoopBtn    = document.getElementById('pb-loop');
const pbSeekEl     = document.getElementById('pb-seek');
const pbCurrentEl  = document.getElementById('pb-current');
const pbDurationEl = document.getElementById('pb-duration');
const pbSpeedEl    = document.getElementById('pb-speed');
const pbPlayIcon   = document.getElementById('pb-play-icon');
const fileInfoEl   = document.getElementById('file-info');
const fileInfoName = document.getElementById('file-info-name');
const fileInfoDur  = document.getElementById('file-info-dur');

let pbIsSeeking = false;
let pbLoopOn    = false;

const PB_PLAY_ICON  = `<polygon points="5 3 19 12 5 21 5 3"/>`;
const PB_PAUSE_ICON = `<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>`;

function formatTime(secs) {
  secs = Math.max(0, Math.floor(secs));
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

function updateSeekBarStyle(pos, dur) {
  const pct = dur > 0 ? (pos / dur * 100) : 0;
  pbSeekEl.style.background =
    `linear-gradient(to right, var(--accent-color) ${pct}%, #28282f ${pct}%)`;
}

function updatePbPlayIcon() {
  pbPlayIcon.innerHTML = AudioEngine.fileGetIsPlaying() ? PB_PAUSE_ICON : PB_PLAY_ICON;
}

function showPlaybackBar(filename) {
  const dur  = AudioEngine.fileGetDuration();
  const name = filename.length > 28 ? filename.slice(0, 27) + '…' : filename;

  fileInfoName.textContent = name;
  fileInfoDur.textContent  = formatTime(dur);
  fileInfoEl.classList.add('visible');

  pbSeekEl.max = dur;
  pbSeekEl.value = 0;
  pbDurationEl.textContent = formatTime(dur);
  pbCurrentEl.textContent  = '0:00';
  pbSeekEl.style.background = '#28282f';

  pbPlayIcon.innerHTML = PB_PAUSE_ICON;
  pbLoopOn = false;
  pbLoopBtn.classList.remove('active');
  pbSpeedEl.value = '1';

  AudioEngine.fileSetOnEnded(onPbFileEnded);

  playbackBar.classList.add('visible');
  canvasWrap.classList.add('with-playbar');
}

function hidePlaybackBar() {
  playbackBar.classList.remove('visible');
  canvasWrap.classList.remove('with-playbar');
  fileInfoEl.classList.remove('visible');
}

function onPbFileEnded() {
  pbPlayIcon.innerHTML = PB_PLAY_ICON;
  pbSeekEl.value = 0;
  pbCurrentEl.textContent = '0:00';
  pbSeekEl.style.background = '#28282f';
}

pbPlayBtn.addEventListener('click', async () => {
  if (AudioEngine.getSourceType() !== 'file') return;
  if (AudioEngine.fileGetIsPlaying()) {
    AudioEngine.filePause();
  } else {
    await AudioEngine.filePlay();
  }
  updatePbPlayIcon();
});

pbStopBtn.addEventListener('click', () => {
  if (AudioEngine.getSourceType() !== 'file') return;
  AudioEngine.fileStop();
  updatePbPlayIcon();
  pbSeekEl.value = 0;
  pbCurrentEl.textContent = '0:00';
  updateSeekBarStyle(0, AudioEngine.fileGetDuration());
});

pbLoopBtn.addEventListener('click', () => {
  pbLoopOn = !pbLoopOn;
  AudioEngine.fileSetLoop(pbLoopOn);
  pbLoopBtn.classList.toggle('active', pbLoopOn);
});

pbSpeedEl.addEventListener('change', () => {
  AudioEngine.fileSetPlaybackRate(parseFloat(pbSpeedEl.value));
});

pbSeekEl.addEventListener('mousedown',  () => { pbIsSeeking = true; });
pbSeekEl.addEventListener('touchstart', () => { pbIsSeeking = true; }, { passive: true });

pbSeekEl.addEventListener('input', () => {
  const val = parseFloat(pbSeekEl.value);
  pbCurrentEl.textContent = formatTime(val);
  updateSeekBarStyle(val, AudioEngine.fileGetDuration());
});

function finishSeek() {
  if (!pbIsSeeking) return;
  pbIsSeeking = false;
  AudioEngine.fileSeek(parseFloat(pbSeekEl.value));
}
pbSeekEl.addEventListener('mouseup',  finishSeek);
pbSeekEl.addEventListener('touchend', finishSeek);
pbSeekEl.addEventListener('change',   finishSeek);


/* ═══════════════════════════════════════════════════════════════
   SOURCE BUTTONS
═══════════════════════════════════════════════════════════════ */
const btnMic    = document.getElementById('btn-mic');
const btnFile   = document.getElementById('btn-file');
const fileInput = document.getElementById('file-input');
const srcLabel  = document.getElementById('source-label');
const tapOver   = document.getElementById('tap-overlay');

const MIC_HTML = `
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8"  y1="23" x2="16" y2="23"/>
  </svg>
  Use Mic`;

const FILE_HTML = `
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6"  cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>
  Load File`;

function setActive(which) {
  btnMic.classList.toggle('active', which === 'mic');
  btnFile.classList.toggle('active', which === 'file');
}

btnMic.addEventListener('click', async () => {
  btnMic.disabled = true;
  btnMic.textContent = 'Connecting…';
  try {
    await AudioEngine.connectMic();
    setActive('mic');
    srcLabel.textContent = 'Microphone active';
    tapOver.classList.remove('show');
    hasSource = true;
    hidePlaybackBar();
  } catch (err) {
    console.error('[AudioEngine] mic error:', err);
    srcLabel.textContent = 'Mic error: ' + (err.message || String(err));
    setActive(null);
  } finally {
    btnMic.disabled = false;
    btnMic.innerHTML = MIC_HTML;
  }
});

btnFile.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;

  btnFile.disabled = true;
  btnFile.textContent = 'Loading…';
  try {
    await AudioEngine.connectFile(file);
    setActive('file');
    srcLabel.textContent = '▶ ' + file.name;
    tapOver.classList.remove('show');
    hasSource = true;
    showPlaybackBar(file.name);
  } catch (err) {
    console.error('[AudioEngine] file error:', err);
    srcLabel.textContent = 'Error: ' + (err.message || String(err));
    setActive(null);
  } finally {
    btnFile.disabled = false;
    btnFile.innerHTML = FILE_HTML;
    fileInput.value = '';
  }
});


/* ═══════════════════════════════════════════════════════════════
   iOS / SAFARI — resume AudioContext on first user gesture
═══════════════════════════════════════════════════════════════ */
function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

if (isMobile()) tapOver.classList.add('show');

async function resumeOnGesture() {
  const ac = AudioEngine.getContext();
  if (ac && ac.state === 'suspended') await AudioEngine.resume();
  if (AudioEngine.getState() === 'running') tapOver.classList.remove('show');
}

document.addEventListener('touchstart', resumeOnGesture, { passive: true, once: false });
document.addEventListener('click',      resumeOnGesture, { passive: true, once: false });


/* ═══════════════════════════════════════════════════════════════
   TOUCH SWIPE — left/right on canvas to cycle modes
═══════════════════════════════════════════════════════════════ */
let swipeStartX = 0;
let swipeStartY = 0;

canvas.addEventListener('touchstart', e => {
  swipeStartX = e.touches[0].clientX;
  swipeStartY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - swipeStartX;
  const dy = e.changedTouches[0].clientY - swipeStartY;

  if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy)) return;

  const idx  = MODES.indexOf(currentMode);
  const next = dx < 0
    ? MODES[(idx + 1) % MODES.length]
    : MODES[(idx + MODES.length - 1) % MODES.length];
  switchModeAnimated(next);
  doMarkModified();
}, { passive: true });


/* ═══════════════════════════════════════════════════════════════
   ARTIST IMAGE (local to main — not serialized into presets)
═══════════════════════════════════════════════════════════════ */
function loadArtistImageFromFile(file) {
  if (artistCardState.objectUrl) URL.revokeObjectURL(artistCardState.objectUrl);
  const url = URL.createObjectURL(file);
  artistCardState.objectUrl = url;
  const img = new Image();
  img.onload = () => {
    artistCardState.image = img;
    const thumb = document.getElementById('artist-img-thumbnail');
    thumb.src = url;
    thumb.classList.add('visible');
    document.getElementById('btn-clear-artist-img').style.display = '';
  };
  img.src = url;
}

function clearArtistImage() {
  if (artistCardState.objectUrl) {
    URL.revokeObjectURL(artistCardState.objectUrl);
    artistCardState.objectUrl = null;
  }
  artistCardState.image = null;
  const thumb = document.getElementById('artist-img-thumbnail');
  thumb.classList.remove('visible');
  thumb.src = '';
  document.getElementById('btn-clear-artist-img').style.display = 'none';
}


/* ═══════════════════════════════════════════════════════════════
   SHORTCUTS MODAL + KEYBOARD
═══════════════════════════════════════════════════════════════ */
const { openShortcutsModal, closeShortcutsModal } = initShortcutsModal();

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  switch (e.key) {
    case ' ':
      e.preventDefault();
      if (AudioEngine.getSourceType() === 'file') {
        (async () => {
          if (AudioEngine.fileGetIsPlaying()) {
            AudioEngine.filePause();
          } else {
            await AudioEngine.filePlay();
          }
          updatePbPlayIcon();
        })();
      } else {
        (async () => {
          const ac = AudioEngine.getContext();
          if (!ac) return;
          if (ac.state === 'running')        await ac.suspend();
          else if (ac.state === 'suspended') await ac.resume();
        })();
      }
      break;

    case 'ArrowLeft':
      if (AudioEngine.getSourceType() === 'file') {
        e.preventDefault();
        AudioEngine.fileSeek(AudioEngine.fileGetOffset() - 5);
      }
      break;

    case 'ArrowRight':
      if (AudioEngine.getSourceType() === 'file') {
        e.preventDefault();
        AudioEngine.fileSeek(AudioEngine.fileGetOffset() + 5);
      }
      break;

    case 'm':
    case 'M':
      cycleMode();
      break;

    case 'r':
    case 'R':
      toggleRecording(canvas);
      break;

    case '?':
      openShortcutsModal();
      break;

    case 'Escape':
      closeShortcutsModal();
      break;

    default: {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 8 && BUILT_IN_PRESETS[n - 1]) {
        applyPreset(BUILT_IN_PRESETS[n - 1]);
      }
      break;
    }
  }
});


/* ═══════════════════════════════════════════════════════════════
   COPY LINK
═══════════════════════════════════════════════════════════════ */
document.getElementById('btn-copy-link').addEventListener('click', async () => {
  const btn = document.getElementById('btn-copy-link');
  try {
    await navigator.clipboard.writeText(window.location.href);
  } catch (_) {
    const ta = document.createElement('textarea');
    ta.value = window.location.href;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  btn.textContent = 'Copied!';
  setTimeout(() => { btn.textContent = 'Copy link'; }, 1800);
});


/* ═══════════════════════════════════════════════════════════════
   PWA — inline manifest + service worker via blob URL
═══════════════════════════════════════════════════════════════ */
(function initPWA() {
  const manifest = {
    name: 'Audio Visualizer',
    short_name: 'Visualizer',
    start_url: location.href,
    display: 'standalone',
    background_color: '#0f0f11',
    theme_color: '#1a1a1f',
    icons: [],
  };
  const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
  const manifestUrl  = URL.createObjectURL(manifestBlob);
  const linkEl       = document.createElement('link');
  linkEl.rel  = 'manifest';
  linkEl.href = manifestUrl;
  document.head.appendChild(linkEl);

  if (!('serviceWorker' in navigator)) return;

  const SW = `
'use strict';
const CACHE = 'av-v1';
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([self.registration.scope])));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res && res.status === 200)
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
`;
  const swBlob = new Blob([SW], { type: 'text/javascript' });
  const swUrl  = URL.createObjectURL(swBlob);
  navigator.serviceWorker.register(swUrl, { scope: './' })
    .then(() => URL.revokeObjectURL(swUrl))
    .catch(() => URL.revokeObjectURL(swUrl));
})();


/* ═══════════════════════════════════════════════════════════════
   WIRING — connect all modules together
═══════════════════════════════════════════════════════════════ */


/* Wrap applyTheme to also reset the vignette cache */
function doApplyTheme(index) {
  applyTheme(index, canvasWrap);
  vignetteW = -1;
  vignetteH = -1;
}

/* Wire controls callbacks (needed before any UI init calls) */
initControls({
  getCurrentMode,
  setCurrentMode,
  getLogicalW,
  getLogicalH,
  getCanvasWrap: () => canvasWrap,
  applyTheme:   doApplyTheme,
  markModified: doMarkModified,
  toggleRecording: () => toggleRecording(canvas),
  cycleMode,
});

/* Wire presets callbacks */
initPresets({
  applyTheme:           doApplyTheme,
  switchMode:           (mode)  => switchMode(mode, g),
  syncControlsToParams: ()      => syncControlsToParams(currentMode),
  markModified:         doMarkModified,
});

/* Wire recording module */
initRecording(() => ytModeActive, ytGuide);
initRecordButton(canvas);

/* Build theme swatches */
buildSwatches((index) => {
  doApplyTheme(index);
  doMarkModified();
});

/* Init all UI control sections */
initModeButtons(switchModeAnimated, doMarkModified);
initAnalyzerControls(doMarkModified);
initVisualControls(doMarkModified);
initBeatControls(doMarkModified, () => beatFlashStart, (v) => { beatFlashStart = v; });
initTextOverlayControls(doMarkModified);
initBackgroundControls(doMarkModified);
initArtistCardControls(doMarkModified, loadArtistImageFromFile, clearArtistImage);
initMobileDrawer(canvasWrap, isMobile);
initRightPanel();

/* Init save-preset button */
initSavePresetButton(() => currentMode);

/* Initial preset grid render */
refreshPresetGrid();

/* Apply initial theme + mode (sets THEME, CSS var, swatch highlight, canvas bg) */
doApplyTheme(0);
switchMode('bars', g);
syncControlsToParams(currentMode);


/* ═══════════════════════════════════════════════════════════════
   URL HASH — initial load (must run after presets are wired)
═══════════════════════════════════════════════════════════════ */
(function initFromHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return;
  const preset = decodePreset(hash);
  if (preset) applyPreset(preset, false);
})();
