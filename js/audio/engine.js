
/* ═══════════════════════════════════════════════════════════════
   AUDIO ENGINE
═══════════════════════════════════════════════════════════════ */
const AudioEngine = (() => {
  let ctx        = null;
  let analyser   = null;
  let gainNode   = null;
  let compressor = null;
  let freqBuf    = null;
  let timeBuf    = null;
  let streamDest = null;

  let activeSource = null;
  let activeStream = null;
  let sourceType   = null;

  /* File transport */
  let audioBuf         = null;
  let bufSrc           = null;
  let fileIsPlaying    = false;
  let pauseOffset      = 0;
  let playStartTime    = 0;
  let loopEnabled      = false;
  let filePlaybackRate = 1.0;
  let onFileEndedCb    = null;

  function init() {
    if (ctx) return;

    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();

    analyser = ctx.createAnalyser();
    analyser.fftSize               = params.fftSize;
    analyser.smoothingTimeConstant = params.smoothing;

    gainNode = ctx.createGain();
    gainNode.gain.value = params.gain;

    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value      = 10;
    compressor.ratio.value     = 4;
    compressor.attack.value    = 0.003;
    compressor.release.value   = 0.25;

    gainNode.connect(analyser);
    analyser.connect(compressor);
    compressor.connect(ctx.destination);

    freqBuf = new Uint8Array(analyser.frequencyBinCount);
    timeBuf = new Uint8Array(analyser.fftSize);
  }

  function disconnectActive() {
    /* Stop file buffer source */
    if (bufSrc) {
      bufSrc.onended = null;
      try { bufSrc.stop(); }       catch (_) {}
      try { bufSrc.disconnect(); } catch (_) {}
      bufSrc = null;
    }
    audioBuf      = null;
    fileIsPlaying = false;
    pauseOffset   = 0;

    /* Stop mic source */
    if (activeSource) {
      try { activeSource.disconnect(); } catch (_) {}
      if (typeof activeSource.stop === 'function') {
        try { activeSource.stop(); } catch (_) {}
      }
      activeSource = null;
    }
    if (activeStream) {
      activeStream.getTracks().forEach(t => t.stop());
      activeStream = null;
    }
    sourceType = null;
  }

  async function connectMic() {
    init();
    disconnectActive();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    activeStream = stream;

    if (ctx.state === 'suspended') await ctx.resume();

    const node = ctx.createMediaStreamSource(stream);
    node.connect(gainNode);
    activeSource = node;
    sourceType   = 'mic';
  }

  /* Internal: create, connect, and start a new BufferSource at the given offset */
  function createAndStartBufSrc(offset) {
    if (bufSrc) {
      bufSrc.onended = null;
      try { bufSrc.stop(); }       catch (_) {}
      try { bufSrc.disconnect(); } catch (_) {}
      bufSrc = null;
    }
    const node = ctx.createBufferSource();
    node.buffer = audioBuf;
    node.playbackRate.value = filePlaybackRate;
    node.connect(gainNode);
    node.onended = function () {
      if (bufSrc !== node) return; /* manually stopped — ignore */
      bufSrc = null;
      fileIsPlaying = false;
      if (loopEnabled) {
        pauseOffset = 0;
        createAndStartBufSrc(0);
      } else {
        pauseOffset = 0;
        onFileEndedCb && onFileEndedCb();
      }
    };
    node.start(0, offset);
    bufSrc = node;
    playStartTime = ctx.currentTime;
    fileIsPlaying = true;
  }

  async function connectFile(file) {
    init();
    disconnectActive();

    const arrayBuf = await file.arrayBuffer();
    audioBuf = await ctx.decodeAudioData(arrayBuf);

    if (ctx.state === 'suspended') await ctx.resume();

    pauseOffset = 0;
    filePlaybackRate = 1.0;
    loopEnabled = false;
    createAndStartBufSrc(0);
    sourceType = 'file';
  }

  async function filePlay() {
    if (!audioBuf || !ctx || fileIsPlaying) return;
    if (ctx.state === 'suspended') await ctx.resume();
    createAndStartBufSrc(pauseOffset);
  }

  function filePause() {
    if (!fileIsPlaying || !bufSrc) return;
    pauseOffset = fileGetOffset();
    bufSrc.onended = null;
    try { bufSrc.stop(); }       catch (_) {}
    try { bufSrc.disconnect(); } catch (_) {}
    bufSrc = null;
    fileIsPlaying = false;
  }

  function fileStop() {
    if (bufSrc) {
      bufSrc.onended = null;
      try { bufSrc.stop(); }       catch (_) {}
      try { bufSrc.disconnect(); } catch (_) {}
      bufSrc = null;
    }
    fileIsPlaying = false;
    pauseOffset   = 0;
  }

  function fileSeek(seconds) {
    if (!audioBuf) return;
    seconds = Math.max(0, Math.min(seconds, audioBuf.duration));
    pauseOffset = seconds;
    if (fileIsPlaying) {
      if (bufSrc) {
        bufSrc.onended = null;
        try { bufSrc.stop(); }       catch (_) {}
        try { bufSrc.disconnect(); } catch (_) {}
        bufSrc = null;
      }
      fileIsPlaying = false;
      createAndStartBufSrc(seconds);
    }
  }

  function fileGetOffset() {
    if (!audioBuf) return 0;
    if (!fileIsPlaying) return pauseOffset;
    let pos = pauseOffset + (ctx.currentTime - playStartTime) * filePlaybackRate;
    if (loopEnabled) {
      pos = ((pos % audioBuf.duration) + audioBuf.duration) % audioBuf.duration;
    } else {
      pos = Math.min(pos, audioBuf.duration);
    }
    return pos;
  }

  function fileGetDuration()  { return audioBuf ? audioBuf.duration : 0; }
  function fileGetIsPlaying() { return fileIsPlaying; }
  function fileSetLoop(val)   { loopEnabled = !!val; }

  function fileSetPlaybackRate(rate) {
    if (fileIsPlaying && bufSrc) {
      /* Snapshot current position, update startTime anchor, change rate live */
      pauseOffset   = fileGetOffset();
      playStartTime = ctx.currentTime;
      filePlaybackRate = rate;
      bufSrc.playbackRate.value = rate;
    } else {
      filePlaybackRate = rate;
    }
  }

  function fileSetOnEnded(cb) { onFileEndedCb = cb; }

  function setFftSize(size) {
    params.fftSize = size;
    if (!analyser) return;
    analyser.fftSize = size;
    freqBuf = new Uint8Array(analyser.frequencyBinCount);
    timeBuf = new Uint8Array(analyser.fftSize);
  }

  function setSmoothing(val) {
    params.smoothing = val;
    if (analyser) analyser.smoothingTimeConstant = val;
  }

  function setGain(val) {
    params.gain = val;
    if (gainNode) gainNode.gain.value = val;
  }

  function getFrequencyData() {
    if (!analyser) return null;
    analyser.getByteFrequencyData(freqBuf);
    return freqBuf;
  }

  function getTimeDomainData() {
    if (!analyser) return null;
    analyser.getByteTimeDomainData(timeBuf);
    return timeBuf;
  }

  function getRMS() {
    if (!timeBuf) return 0;
    let sum = 0;
    const len = timeBuf.length;
    for (let i = 0; i < len; i++) {
      const s = (timeBuf[i] - 128) / 128;
      sum += s * s;
    }
    return Math.sqrt(sum / len);
  }

  async function resume() {
    if (ctx && ctx.state === 'suspended') await ctx.resume();
  }

  function getState()      { return ctx ? ctx.state : 'closed'; }
  function getContext()    { return ctx; }
  function getSourceType() { return sourceType; }

  /* Lazily create a MediaStreamDestination and return its audio stream for recording */
  function getAudioStream() {
    if (!ctx) return null;
    if (!streamDest) {
      streamDest = ctx.createMediaStreamDestination();
      compressor.connect(streamDest);
    }
    return streamDest.stream;
  }

  return {
    init, connectMic, connectFile,
    setFftSize, setSmoothing, setGain,
    getFrequencyData, getTimeDomainData, getRMS,
    getState, getContext, getSourceType, resume,
    getAudioStream,
    filePlay, filePause, fileStop, fileSeek,
    fileGetOffset, fileGetDuration, fileGetIsPlaying,
    fileSetLoop, fileSetPlaybackRate, fileSetOnEnded,
  };
})();
