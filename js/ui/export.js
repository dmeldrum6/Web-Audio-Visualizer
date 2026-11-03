/* ═══════════════════════════════════════════════════════════════
   OFFLINE VIDEO EXPORT — frame-perfect MP4 rendering

   Instead of screen-recording in real time (which drops frames when
   rendering can't keep up, and stalls if the tab is hidden), the song is
   rendered frame by frame:

   1. An OfflineAudioContext plays the song through an AnalyserNode with
      the same FFT size / smoothing / gain as the live view. It is
      suspended every 1/60 s of *song* time so we can read the analyser.
   2. At each step the normal render pipeline draws one frame, driven by
      the virtual Clock, so every animation advances exactly one step.
   3. Frames go to a WebCodecs VideoEncoder (H.264 → VP9 → AV1, whatever
      the browser supports); the original audio samples go untouched to
      an AudioEncoder (AAC → Opus).
   4. mp4-muxer writes the MP4 — streamed straight to disk when the
      File System Access API is available, otherwise built in memory.

   The simulation always steps at 60 Hz (same as the live preview); for
   a 30 fps export every other step is encoded.
═══════════════════════════════════════════════════════════════ */
const EXPORT_SIM_FPS = 60;

const EXPORT_RESOLUTIONS = {
  '1080p': { w: 1920, h: 1080 },
  '1440p': { w: 2560, h: 1440 },
  '2160p': { w: 3840, h: 2160 },
};

let _exportActive = false;
let _exportCancel = false;
let _exportHooks  = null;

function isExporting() { return _exportActive; }

/*
 * hooks (from main.js):
 *   canvas                      – the visible canvas (rendered at export size)
 *   beginExportView(resKey)     – pause live playback, switch canvas to resKey
 *   endExportView()             – restore canvas + playback state
 *   resetSongVisualState()      – clear trails/particles/overlay timers for a clean start
 *   stepFrame(freq, time)       – beat detection + render one frame
 */
function initExport(hooks) {
  _exportHooks = hooks;

  const modal    = document.getElementById('export-modal');
  const btnOpen  = document.getElementById('btn-export');
  const btnClose = document.getElementById('btn-close-export');
  const btnStart = document.getElementById('btn-export-start');
  const btnCancel = document.getElementById('btn-export-cancel');
  const resSel   = document.getElementById('export-resolution');
  const fpsSel   = document.getElementById('export-fps');

  function open() {
    if (_exportActive) return;
    if (!AudioEngine.getAudioBuffer()) {
      showToast('Load an audio file first — export renders the whole song', 'warn');
      return;
    }
    resSel.value = EXPORT_RESOLUTIONS[params.recordResolution] ? params.recordResolution : '1080p';
    fpsSel.value = String(params.recordFps || 30);
    _setExportUI('idle');
    modal.classList.remove('hidden');
  }
  function close() {
    if (_exportActive) return;
    modal.classList.add('hidden');
  }

  btnOpen.addEventListener('click', open);
  btnClose.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  btnCancel.addEventListener('click', () => {
    if (_exportActive) { _exportCancel = true; _setExportStatus('Cancelling…'); }
    else close();
  });
  btnStart.addEventListener('click', () => {
    params.recordFps = parseInt(fpsSel.value, 10) || 30;
    const topFps = document.getElementById('ctrl-record-fps');
    if (topFps) topFps.value = String(params.recordFps);
    runExport(resSel.value, params.recordFps);
  });

  return { open, close };
}

function _setExportUI(state) {
  const modal = document.getElementById('export-modal');
  modal.classList.toggle('exporting', state === 'running');
  document.getElementById('export-settings').style.display = state === 'running' ? 'none' : '';
  document.getElementById('export-progress').style.display = state === 'idle' ? 'none' : '';
  document.getElementById('btn-export-start').style.display = state === 'running' ? 'none' : '';
  document.getElementById('btn-export-cancel').textContent = state === 'running' ? 'Cancel export' : 'Close';
  document.getElementById('btn-close-export').style.visibility = state === 'running' ? 'hidden' : '';
  if (state === 'idle') {
    _setExportProgress(0);
    _setExportStatus('');
  }
}

function _setExportProgress(frac) {
  document.getElementById('export-bar-fill').style.width = (Math.max(0, Math.min(1, frac)) * 100).toFixed(1) + '%';
}
function _setExportStatus(text) {
  document.getElementById('export-status').textContent = text;
}

function _fmtDuration(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ── Codec selection ─────────────────────────────────────────── */
function _avcCodecFor(h, fps) {
  /* H.264 High profile; level chosen for resolution × frame rate */
  if (h >= 2160) return fps > 30 ? 'avc1.640034' : 'avc1.640033';  /* 5.2 / 5.1 */
  if (h >= 1440) return fps > 30 ? 'avc1.640033' : 'avc1.640032';  /* 5.1 / 5.0 */
  return fps > 30 ? 'avc1.64002a' : 'avc1.640028';                   /* 4.2 / 4.0 */
}

async function _pickVideoConfig(w, h, fps) {
  const bitrate = videoBitrateFor(w, h, fps);
  const base = { width: w, height: h, bitrate, framerate: fps, bitrateMode: 'variable', latencyMode: 'quality' };
  const candidates = [
    { mux: 'avc', config: { ...base, codec: _avcCodecFor(h, fps), avc: { format: 'avc' } } },
    { mux: 'vp9', config: { ...base, codec: 'vp09.00.51.08' } },
    { mux: 'av1', config: { ...base, codec: 'av01.0.13M.08' } },
  ];
  for (const c of candidates) {
    try {
      const r = await VideoEncoder.isConfigSupported(c.config);
      if (r.supported) return c;
    } catch (_) {}
  }
  return null;
}

async function _pickAudioConfig(sampleRate, numberOfChannels) {
  const candidates = [
    { mux: 'aac',  config: { codec: 'mp4a.40.2', sampleRate, numberOfChannels, bitrate: 320_000 } },
    { mux: 'opus', config: { codec: 'opus',      sampleRate, numberOfChannels, bitrate: 256_000 } },
  ];
  for (const c of candidates) {
    try {
      const r = await AudioEncoder.isConfigSupported(c.config);
      if (r.supported) return c;
    } catch (_) {}
  }
  return null;
}

/* Resample (or down-mix to ≤2 channels) using an OfflineAudioContext */
async function _resampleBuffer(buf, sampleRate, channels) {
  const length = Math.ceil(buf.duration * sampleRate);
  const off = new OfflineAudioContext(channels, length, sampleRate);
  const src = off.createBufferSource();
  src.buffer = buf;
  src.connect(off.destination);
  src.start(0);
  return off.startRendering();
}

/* ── Main export routine ─────────────────────────────────────── */
async function runExport(resKey, fps) {
  if (_exportActive) return;
  const hooks = _exportHooks;
  const songBuf = AudioEngine.getAudioBuffer();
  if (!songBuf) { showToast('Load an audio file first', 'warn'); return; }
  if (isRecording) { showToast('Stop the current recording first', 'warn'); return; }
  if (!('VideoEncoder' in window) || !('AudioEncoder' in window) || !window.OfflineAudioContext) {
    showToast('Frame-perfect export needs Chrome or Edge (WebCodecs). Use Record Song instead.', 'error');
    return;
  }
  if (!window.Mp4Muxer) { showToast('MP4 muxer failed to load', 'error'); return; }

  const res = EXPORT_RESOLUTIONS[resKey] || EXPORT_RESOLUTIONS['1080p'];
  const { w, h } = res;
  const filename = buildOutputFilename('mp4', resKey, fps);

  /* Ask where to save first, while we still have the click's user activation.
     Streaming to disk keeps memory flat even for long 4K renders. */
  let writable = null;
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'MP4 video', accept: { 'video/mp4': ['.mp4'] } }],
      });
      writable = await handle.createWritable();
    } catch (err) {
      if (err && err.name === 'AbortError') return;      /* user cancelled */
      console.warn('[Export] save picker unavailable, rendering in memory:', err);
      writable = null;
    }
  }

  /* Audio: AAC/Opus encoders want 44.1/48 kHz and ≤2 channels */
  const channels = Math.min(2, songBuf.numberOfChannels);
  let audioSr = songBuf.sampleRate;
  if (audioSr !== 44100 && audioSr !== 48000) audioSr = 48000;

  const videoChoice = await _pickVideoConfig(w, h, fps);
  let   audioChoice = await _pickAudioConfig(audioSr, channels);
  if (!audioChoice && audioSr !== 48000) {
    audioSr = 48000;
    audioChoice = await _pickAudioConfig(audioSr, channels);
  }
  if (!videoChoice || !audioChoice) {
    if (writable) { try { await writable.abort(); } catch (_) {} }
    showToast(`This browser can't encode ${!videoChoice ? resKey + ' video' : 'audio'} — try Chrome or Edge`, 'error');
    return;
  }

  const modal = document.getElementById('export-modal');
  modal.classList.remove('hidden');
  _exportActive = true;
  _exportCancel = false;
  _setExportUI('running');
  _setExportStatus('Preparing…');

  let failure = null;
  let videoEnc = null, audioEnc = null;
  const startedAt = performance.now();

  try {
    const encBuf = (audioSr !== songBuf.sampleRate || channels !== songBuf.numberOfChannels)
      ? await _resampleBuffer(songBuf, audioSr, channels)
      : songBuf;

    const target = writable
      ? new Mp4Muxer.FileSystemWritableFileStreamTarget(writable)
      : new Mp4Muxer.ArrayBufferTarget();
    const muxer = new Mp4Muxer.Muxer({
      target,
      video: { codec: videoChoice.mux, width: w, height: h, frameRate: fps },
      audio: { codec: audioChoice.mux, numberOfChannels: channels, sampleRate: audioSr },
      fastStart: writable ? false : 'in-memory',
      firstTimestampBehavior: 'offset',
    });

    let encodeError = null;
    videoEnc = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error:  e => { encodeError = e; },
    });
    videoEnc.configure(videoChoice.config);
    audioEnc = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error:  e => { encodeError = e; },
    });
    audioEnc.configure(audioChoice.config);

    /* Audio is encoded in step with the video so the muxer can interleave */
    const audioData = [];
    for (let c = 0; c < channels; c++) audioData.push(encBuf.getChannelData(c));
    let audioPos = 0;
    const AUDIO_CHUNK = 4096;
    function encodeAudioUntil(endFrame) {
      endFrame = Math.min(endFrame, encBuf.length);
      while (audioPos < endFrame) {
        const n = Math.min(AUDIO_CHUNK, endFrame - audioPos);
        const planar = new Float32Array(n * channels);
        for (let c = 0; c < channels; c++) planar.set(audioData[c].subarray(audioPos, audioPos + n), c * n);
        const ad = new AudioData({
          format: 'f32-planar', sampleRate: audioSr,
          numberOfFrames: n, numberOfChannels: channels,
          timestamp: Math.round(audioPos / audioSr * 1e6),
          data: planar,
        });
        audioEnc.encode(ad);
        ad.close();
        audioPos += n;
      }
    }

    /* Backpressure: wait for the encoders to drain. Uses the 'dequeue' event
       where available (timers are heavily throttled in background tabs). */
    const VQ_MAX = 6, AQ_MAX = 32;
    const encodersBusy = () => videoEnc.encodeQueueSize > VQ_MAX || audioEnc.encodeQueueSize > AQ_MAX;
    function waitForEncoders() {
      if (!encodersBusy()) return null;
      return new Promise(resolve => {
        let done = false;
        const finish = () => {
          if (done) return;
          if (encodeError || _exportCancel || !encodersBusy()) {
            done = true;
            videoEnc.removeEventListener?.('dequeue', finish);
            audioEnc.removeEventListener?.('dequeue', finish);
            resolve();
          }
        };
        if ('ondequeue' in videoEnc) {
          videoEnc.addEventListener('dequeue', finish);
          audioEnc.addEventListener('dequeue', finish);
        }
        const poll = () => { finish(); if (!done) setTimeout(poll, 20); };
        poll();
      });
    }

    /* Analysis graph — mirrors the live analyser settings */
    const off = new OfflineAudioContext(songBuf.numberOfChannels, songBuf.length, songBuf.sampleRate);
    const src = off.createBufferSource();
    src.buffer = songBuf;
    const gain = off.createGain();
    gain.gain.value = params.gain;
    const an = off.createAnalyser();
    an.fftSize = params.fftSize;
    an.smoothingTimeConstant = params.smoothing;
    src.connect(gain);
    gain.connect(an);
    an.connect(off.destination);
    src.start(0);

    const freq = new Uint8Array(an.frequencyBinCount);
    const time = new Uint8Array(an.fftSize);

    const duration    = songBuf.duration;
    const stepsPerFrame = Math.max(1, Math.round(EXPORT_SIM_FPS / fps));
    const totalSteps  = Math.max(1, Math.floor(duration * EXPORT_SIM_FPS));
    const totalFrames = Math.ceil(totalSteps / stepsPerFrame);
    const frameUs     = 1e6 / fps;
    const keyEvery    = fps * 2;   /* keyframe every 2 s */

    /* Switch the canvas to export size and reset per-song visual state */
    hooks.beginExportView(resKey);
    const clockBase = Clock.beginVirtual();
    setSongTimeOverride(0);
    BeatDetector.reset();
    BPMClock.reset();
    hooks.resetSongVisualState();

    const canvas = hooks.canvas;
    let step = 0;
    let lastUi = 0;

    const onStep = async () => {
      try {
        if (_exportCancel || encodeError) { off.resume(); return; }

        an.getByteFrequencyData(freq);
        an.getByteTimeDomainData(time);
        const t = step / EXPORT_SIM_FPS;
        Clock.setVirtual(clockBase + t * 1000);
        setSongTimeOverride(t);

        hooks.stepFrame(freq, time);

        if (step % stepsPerFrame === 0) {
          const fi = step / stepsPerFrame;
          const frame = new VideoFrame(canvas, {
            timestamp: Math.round(fi * frameUs),
            duration:  Math.round(frameUs),
          });
          videoEnc.encode(frame, { keyFrame: fi % keyEvery === 0 });
          frame.close();
          encodeAudioUntil(Math.round((fi + 1) / fps * audioSr));

          const nowMs = performance.now();
          if (nowMs - lastUi > 250) {
            lastUi = nowMs;
            const frac    = (fi + 1) / totalFrames;
            const elapsed = (nowMs - startedAt) / 1000;
            const speed   = (t || 0.001) / Math.max(0.001, elapsed);
            const eta     = frac > 0.01 ? elapsed / frac - elapsed : NaN;
            _setExportProgress(frac);
            _setExportStatus(
              `Frame ${fi + 1} / ${totalFrames} · ${_fmtDuration(t)} of ${_fmtDuration(duration)} · ` +
              `${speed.toFixed(2)}× real-time` + (isFinite(eta) ? ` · ~${_fmtDuration(eta)} left` : ''));
          }

          const wait = waitForEncoders();
          if (wait) await wait;
        }

        step++;
        if (step < totalSteps && !_exportCancel && !encodeError) {
          off.suspend(step / EXPORT_SIM_FPS).then(onStep);
        }
        off.resume();
      } catch (err) {
        failure = failure || err;
        _exportCancel = true;
        off.resume();
      }
    };

    off.suspend(0).then(onStep);
    await off.startRendering();

    if (encodeError) failure = failure || encodeError;

    if (!_exportCancel && !failure) {
      _setExportStatus('Finishing…');
      encodeAudioUntil(encBuf.length);
      await videoEnc.flush();
      await audioEnc.flush();
      muxer.finalize();
      if (writable) {
        await writable.close();
        writable = null;
      } else {
        downloadBlob(new Blob([target.buffer], { type: 'video/mp4' }), filename);
      }
    }
  } catch (err) {
    failure = failure || err;
  } finally {
    try { if (videoEnc && videoEnc.state !== 'closed') videoEnc.close(); } catch (_) {}
    try { if (audioEnc && audioEnc.state !== 'closed') audioEnc.close(); } catch (_) {}
    if (writable) { try { await writable.abort(); } catch (_) {} }

    setSongTimeOverride(null);
    Clock.endVirtual();
    try { hooks.endExportView(); } catch (e) { console.error(e); }
    _exportActive = false;
  }

  const took = (performance.now() - startedAt) / 1000;
  if (failure) {
    console.error('[Export] failed:', failure);
    _setExportUI('done');
    _setExportStatus('Export failed: ' + (failure.message || String(failure)));
    showToast('Export failed — see the export dialog for details', 'error');
  } else if (_exportCancel) {
    _setExportUI('idle');
    document.getElementById('export-modal').classList.add('hidden');
    showToast('Export cancelled', 'info');
  } else {
    _setExportUI('done');
    _setExportProgress(1);
    _setExportStatus(`Done in ${_fmtDuration(took)} — ${filename}`);
    showToast('Export complete', 'info');
  }
}
