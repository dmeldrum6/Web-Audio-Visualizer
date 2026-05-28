
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

function saveRecording() {
  if (!recordChunks.length) return;
  const blob = new Blob(recordChunks, { type: 'video/webm' });
  const url  = URL.createObjectURL(blob);
  const ts   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `visualizer-${ts}.webm`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  recordChunks = [];
}

let _enableYtModeFn  = null;
let _disableYtModeFn = null;
let _wasInYtMode     = false;

function initRecordingResolution(enableYtMode, disableYtMode) {
  _enableYtModeFn  = enableYtMode;
  _disableYtModeFn = disableYtMode;
}

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
}

async function startRecording(canvas) {
  if (!canvas.captureStream || !window.MediaRecorder) {
    showToast('Recording not supported in this browser — try Chrome or Edge', 'error');
    return;
  }

  const ytModeActive = _ytModeActiveGetter ? _ytModeActiveGetter() : false;

  /* Auto-enter the requested resolution mode if not already in YT mode */
  if (!ytModeActive && _enableYtModeFn && params.recordResolution && params.recordResolution !== 'native') {
    _wasInYtMode = false;
    _enableYtModeFn(params.recordResolution);
  } else {
    _wasInYtMode = ytModeActive;
  }

  const videoStream = canvas.captureStream(30);
  const audioStream = AudioEngine.getAudioStream();

  let tracks = [...videoStream.getVideoTracks()];
  if (audioStream) tracks = [...tracks, ...audioStream.getAudioTracks()];

  const combined = new MediaStream(tracks);

  /* Bitrate scales with resolution */
  const resBitrates = { '1080p': 12_000_000, '1440p': 20_000_000, '2160p': 45_000_000 };
  const targetBps   = resBitrates[params.recordResolution] || 12_000_000;

  const inHighRes = !_wasInYtMode || ytModeActive; /* true once we entered a resolution mode */

  let recOptions = {};
  if (inHighRes && params.recordResolution !== 'native') {
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      recOptions = { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: targetBps };
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      recOptions = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: targetBps };
    }
  } else {
    try {
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        recOptions = { mimeType: 'video/webm;codecs=vp9,opus' };
      }
    } catch (_) {}
  }

  try {
    recorder = new MediaRecorder(combined, recOptions);
  } catch (err) {
    showToast('Recording not supported in this browser — try Chrome or Edge', 'error');
    return;
  }

  recordChunks = [];
  recorder.ondataavailable = e => { if (e.data.size > 0) recordChunks.push(e.data); };
  recorder.onstop = saveRecording;
  recorder.start(100);

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
}

function toggleRecording(canvas) {
  if (isRecording) stopRecording();
  else startRecording(canvas);
}

function initRecordButton(canvas) {
  btnRecord.addEventListener('click', () => toggleRecording(canvas));
}
