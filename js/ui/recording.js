
let recorder        = null;
let recordChunks    = [];
let isRecording = false;
let recordStartTime = 0;
let recTimerInterval = null;
let recMaxTimer     = null;
let recWarnTimer    = null;

const btnRecord  = document.getElementById('btn-record');
const recBadge   = document.getElementById('rec-badge');
const recTimeEl  = document.getElementById('rec-time');

const REC_ICON_CIRCLE = `<circle cx="5" cy="5" r="5" fill="#e05050"/>`;
const REC_ICON_STOP   = `<rect x="1" y="1" width="8" height="8" rx="1" fill="currentColor"/>`;

function formatRecTime(ms) {
  const s   = Math.floor(ms / 1000);
  const mm  = String(Math.floor(s / 60)).padStart(2, '0');
  const ss  = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function updateRecordTimer() {
  recTimeEl.textContent = formatRecTime(Date.now() - recordStartTime);
}

let _ytModeActiveGetter = null;
let _ytGuide = null;

function initRecording(getYtModeActive, ytGuide) {
  _ytModeActiveGetter = getYtModeActive;
  _ytGuide = ytGuide;
}

function updateRecordUI() {
  const ytModeActive = _ytModeActiveGetter ? _ytModeActiveGetter() : false;
  if (isRecording) {
    btnRecord.classList.add('recording');
    btnRecord.innerHTML = `<svg id="rec-icon" width="10" height="10" viewBox="0 0 10 10">${REC_ICON_STOP}</svg> Stop`;
    recBadge.classList.add('show');
    if (_ytGuide) _ytGuide.style.display = 'none';
  } else {
    btnRecord.classList.remove('recording');
    btnRecord.innerHTML = `<svg id="rec-icon" width="10" height="10" viewBox="0 0 10 10">${REC_ICON_CIRCLE}</svg> Record`;
    recBadge.classList.remove('show');
    recTimeEl.textContent = '00:00';
    if (_ytGuide && ytModeActive) _ytGuide.style.display = 'block';
  }
}

/* ── Output naming ─────────────────────────────────────────── */
let _recordingBaseName = '';

/* Use the loaded song's file name (minus extension) for exported videos */
function setRecordingBaseName(fileName) {
  _recordingBaseName = sanitizeFileBase(fileName || '');
}

function sanitizeFileBase(name) {
  return name
    .replace(/\.[^.]+$/, '')                 /* drop extension */
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

function buildOutputFilename(ext, resLabel, fps) {
  const tag = [resLabel, fps ? `${fps}fps` : ''].filter(Boolean).join('-');
  if (_recordingBaseName) {
    return `${_recordingBaseName}${tag ? ' - ' + tag : ''}.${ext}`;
  }
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `visualizer-${ts}${tag ? '-' + tag : ''}.${ext}`;
}

/* Video bitrate scaled to pixel rate (~0.2 bits/pixel), clamped to a sane range.
   1080p30 ≈ 12 Mbps, 1440p30 ≈ 22 Mbps, 4K30 ≈ 50 Mbps, 4K60 = 80 Mbps. */
function videoBitrateFor(w, h, fps) {
  return Math.round(Math.min(80e6, Math.max(8e6, w * h * fps * 0.2)));
}

const RECORD_AUDIO_BPS = 320_000;

/* Preferred MediaRecorder formats, best first. MP4/H.264+AAC is the most
   editor-friendly; WebM/VP9+Opus is the Chrome/Firefox fallback. */
const RECORDER_FORMATS = [
  { mimeType: 'video/mp4;codecs=avc1,mp4a.40.2', ext: 'mp4'  },
  { mimeType: 'video/mp4;codecs=avc1,opus',      ext: 'mp4'  },
  { mimeType: 'video/webm;codecs=vp9,opus',      ext: 'webm' },
  { mimeType: 'video/webm;codecs=vp8,opus',      ext: 'webm' },
  { mimeType: 'video/mp4',                       ext: 'mp4'  },
  { mimeType: 'video/webm',                      ext: 'webm' },
];

function pickRecorderFormat() {
  for (const f of RECORDER_FORMATS) {
    try { if (MediaRecorder.isTypeSupported(f.mimeType)) return f; } catch (_) {}
  }
  return null;
}

function extForMime(mime) {
  return /mp4/i.test(mime || '') ? 'mp4' : 'webm';
}

let _recordingFilename = '';

function saveRecording(mimeType) {
  if (!recordChunks.length) return;
  const type = (mimeType || 'video/webm').split(';')[0];
  const blob = new Blob(recordChunks, { type });
  downloadBlob(blob, _recordingFilename || buildOutputFilename(extForMime(type)));
  recordChunks = [];
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

let _enableYtModeFn  = null;
let _disableYtModeFn = null;
let _wasInYtMode     = false;
let _onRecordingStopped = null;

function initRecordingResolution(enableYtMode, disableYtMode) {
  _enableYtModeFn  = enableYtMode;
  _disableYtModeFn = disableYtMode;
}

/* Called (once) whenever a recording stops, for whatever reason */
function setRecordingStopListener(fn) { _onRecordingStopped = fn; }

function stopRecording() {
  if (!isRecording || !recorder) return;
  clearInterval(recTimerInterval);
  clearTimeout(recMaxTimer);
  clearTimeout(recWarnTimer);
  recTimerInterval = null;
  recMaxTimer      = null;
  recWarnTimer     = null;
  isRecording      = false;
  updateRecordUI();
  recorder.stop();
  recorder = null;
  /* Exit resolution mode if we auto-entered it */
  if (!_wasInYtMode && _disableYtModeFn) {
    _disableYtModeFn();
  }
  if (_onRecordingStopped) _onRecordingStopped();
}

/* Returns true if recording started */
async function startRecording(canvas) {
  if (isRecording) return false;
  if (typeof isExporting === 'function' && isExporting()) return false;
  if (!canvas.captureStream || !window.MediaRecorder) {
    showToast('Recording not supported in this browser — try Chrome or Edge', 'error');
    return false;
  }

  const ytModeActive = _ytModeActiveGetter ? _ytModeActiveGetter() : false;

  /* Auto-enter the requested resolution mode if not already in YT mode */
  if (!ytModeActive && _enableYtModeFn && params.recordResolution && params.recordResolution !== 'native') {
    _wasInYtMode = false;
    _enableYtModeFn(params.recordResolution);
  } else {
    _wasInYtMode = true; /* nothing to undo on stop */
  }

  const fps         = params.recordFps || 30;
  const videoStream = canvas.captureStream(fps);
  const audioStream = AudioEngine.getAudioStream();

  let tracks = [...videoStream.getVideoTracks()];
  if (audioStream) tracks = [...tracks, ...audioStream.getAudioTracks()];

  const combined = new MediaStream(tracks);
  const format   = pickRecorderFormat();
  const recOptions = {
    videoBitsPerSecond: videoBitrateFor(canvas.width, canvas.height, fps),
    audioBitsPerSecond: RECORD_AUDIO_BPS,
  };
  if (format) recOptions.mimeType = format.mimeType;

  try {
    recorder = new MediaRecorder(combined, recOptions);
  } catch (err) {
    console.error('[Recording] MediaRecorder error:', err);
    showToast('Recording not supported in this browser — try Chrome or Edge', 'error');
    if (!_wasInYtMode && _disableYtModeFn) _disableYtModeFn();
    return false;
  }

  const resLabel = params.recordResolution === 'native'
    ? `${canvas.width}x${canvas.height}` : params.recordResolution;
  const mime = recorder.mimeType || (format && format.mimeType) || 'video/webm';
  _recordingFilename = buildOutputFilename(extForMime(mime), resLabel, fps);

  recordChunks = [];
  const thisRecorder = recorder;
  recorder.ondataavailable = e => { if (e.data.size > 0) recordChunks.push(e.data); };
  recorder.onstop = () => saveRecording(thisRecorder.mimeType || mime);
  recorder.start(1000);

  recordStartTime  = Date.now();
  isRecording      = true;
  updateRecordUI();

  /* Trigger artist card display timer if enabled */
  if (params.artistCardTimerEnabled && params.artistCardEnabled) {
    startArtistCardTimer(params.artistCardTimerDuration * 1000);
  }

  recTimerInterval = setInterval(updateRecordTimer, 500);

  /* Warning at 59:50 */
  recWarnTimer = setTimeout(() => {
    showToast('Recording will auto-stop in 10 seconds', 'warn');
  }, 3590000);

  /* Auto-stop at 60:00 */
  recMaxTimer = setTimeout(() => {
    showToast('Max recording time (60:00) reached — saving…', 'warn');
    stopRecording();
  }, 3600000);

  return true;
}

function toggleRecording(canvas) {
  if (isRecording) stopRecording();
  else startRecording(canvas);
}

function initRecordButton(canvas) {
  btnRecord.addEventListener('click', () => toggleRecording(canvas));
}
