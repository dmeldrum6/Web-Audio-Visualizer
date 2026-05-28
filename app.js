var _app = (() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // js/params.js
  var params = {
    mode: "bars",
    fftSize: 8192,
    smoothing: 0.8,
    gain: 1,
    motionAmount: 0.5,
    trailAlpha: 0,
    mirror: false,
    fill: true,
    barCount: 128,
    theme: 0,
    themeName: "Midnight",
    /* text overlay */
    overlayEnabled: false,
    overlayText: "",
    overlayFontSize: 48,
    overlayFontFamily: "sans-serif",
    overlayColor: "#ffffff",
    overlayOpacity: 1,
    overlayStyle: "scroll",
    overlaySubtext: "",
    overlayDuration: 0,
    /* background image */
    bgOpacity: 1,
    bgBlend: "normal",
    bgFit: "cover",
    bgGradient: false,
    /* radial center image */
    radialImgOpacity: 1,
    /* radial center shape: 'circle' | 'square' | 'triangle' */
    radialShape: "circle",
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
    artistCardEnabled: false,
    artistCardName: "",
    artistCardTitle: "",
    artistCardOpacity: 1,
    artistCardTimerEnabled: false,
    artistCardTimerDuration: 5
  };

  // js/themes.js
  var themes_exports = {};
  __export(themes_exports, {
    THEME: () => THEME,
    THEMES: () => THEMES,
    buildHeat: () => buildHeat,
    buildSwatches: () => buildSwatches,
    gradHueBase: () => gradHueBase,
    heatB: () => heatB,
    heatG: () => heatG,
    heatR: () => heatR,
    hexToHsl: () => hexToHsl,
    hexToHue: () => hexToHue,
    hexToRgb: () => hexToRgb,
    setGradHueBase: () => setGradHueBase
  });
  var THEMES = [
    { name: "Midnight", bgColor: "#080c18", accentColor: "#1a3888", highlightColor: "#40d8ff", midColor: "#2060c0" },
    { name: "Ember", bgColor: "#0e0604", accentColor: "#8c1a00", highlightColor: "#ff6428", midColor: "#c03010" },
    { name: "Forest", bgColor: "#040e04", accentColor: "#0a4010", highlightColor: "#38e060", midColor: "#18a030" },
    { name: "Neon", bgColor: "#050508", accentColor: "#8800cc", highlightColor: "#00ffee", midColor: "#cc00ff" },
    { name: "Monochrome", bgColor: "#080808", accentColor: "#303030", highlightColor: "#d8d8d8", midColor: "#808080" },
    { name: "Sunrise", bgColor: "#0c0608", accentColor: "#7a1040", highlightColor: "#ffd060", midColor: "#e04080" }
  ];
  var THEME = {
    bgColor: THEMES[0].bgColor,
    accent: THEMES[0].accentColor,
    highlight: THEMES[0].highlightColor,
    mid: THEMES[0].midColor,
    waveRGB: [64, 216, 255]
  };
  function hexToRgb(hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ];
  }
  function hexToHue(hex) {
    const [rr, gg, bb] = hexToRgb(hex).map((v) => v / 255);
    const max = Math.max(rr, gg, bb);
    const min = Math.min(rr, gg, bb);
    const d = max - min;
    if (d === 0) return 0;
    let h;
    if (max === rr) h = ((gg - bb) / d + 6) % 6;
    else if (max === gg) h = (bb - rr) / d + 2;
    else h = (rr - gg) / d + 4;
    return h * 60;
  }
  function hexToHsl(hex) {
    let [r, g2, b] = hexToRgb(hex);
    r /= 255;
    g2 /= 255;
    b /= 255;
    const max = Math.max(r, g2, b), min = Math.min(r, g2, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l * 100];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h;
    if (max === r) h = ((g2 - b) / d + (g2 < b ? 6 : 0)) / 6;
    else if (max === g2) h = ((b - r) / d + 2) / 6;
    else h = ((r - g2) / d + 4) / 6;
    return [h * 360, s * 100, l * 100];
  }
  var heatR = new Uint8Array(256);
  var heatG = new Uint8Array(256);
  var heatB = new Uint8Array(256);
  function buildHeat(bgHex, accentHex, midHex, highlightHex) {
    const bg = hexToRgb(bgHex);
    const ac = hexToRgb(accentHex);
    const md = hexToRgb(midHex);
    const hi = hexToRgb(highlightHex);
    const stops = [
      [0, bg[0], bg[1], bg[2]],
      [80, ac[0], ac[1], ac[2]],
      [160, md[0], md[1], md[2]],
      [220, hi[0], hi[1], hi[2]],
      [255, 255, 255, 255]
    ];
    for (let v = 0; v < 256; v++) {
      let lo = stops[0], hi2 = stops[1];
      for (let s = 1; s < stops.length - 1; s++) {
        if (v >= stops[s][0]) {
          lo = stops[s];
          hi2 = stops[s + 1];
        }
      }
      const t = lo[0] === hi2[0] ? 1 : (v - lo[0]) / (hi2[0] - lo[0]);
      heatR[v] = Math.round(lo[1] + (hi2[1] - lo[1]) * t);
      heatG[v] = Math.round(lo[2] + (hi2[2] - lo[2]) * t);
      heatB[v] = Math.round(lo[3] + (hi2[3] - lo[3]) * t);
    }
  }
  buildHeat(THEMES[0].bgColor, THEMES[0].accentColor, THEMES[0].midColor, THEMES[0].highlightColor);
  var gradHueBase = hexToHsl(THEMES[0].accentColor)[0];
  function setGradHueBase(val) {
    gradHueBase = val;
  }
  function buildSwatches(onThemeClick) {
    const grid = document.getElementById("swatch-grid");
    THEMES.forEach((t, i) => {
      const sw = document.createElement("div");
      sw.className = "swatch" + (i === 0 ? " active" : "");
      sw.style.background = `linear-gradient(145deg, ${t.bgColor} 0%, ${t.accentColor} 45%, ${t.highlightColor} 100%)`;
      sw.dataset.themeIndex = i;
      sw.innerHTML = `<span class="swatch-name">${t.name}</span>`;
      grid.appendChild(sw);
    });
    grid.addEventListener("click", (e) => {
      const sw = e.target.closest(".swatch");
      if (!sw) return;
      onThemeClick(parseInt(sw.dataset.themeIndex, 10));
    });
  }

  // js/audio/engine.js
  var AudioEngine = /* @__PURE__ */ (() => {
    let ctx = null;
    let analyser = null;
    let gainNode = null;
    let compressor = null;
    let freqBuf = null;
    let timeBuf = null;
    let streamDest = null;
    let activeSource = null;
    let activeStream = null;
    let sourceType = null;
    let audioBuf = null;
    let bufSrc = null;
    let fileIsPlaying = false;
    let pauseOffset = 0;
    let playStartTime = 0;
    let loopEnabled = false;
    let filePlaybackRate = 1;
    let onFileEndedCb = null;
    function init() {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      analyser = ctx.createAnalyser();
      analyser.fftSize = params.fftSize;
      analyser.smoothingTimeConstant = params.smoothing;
      gainNode = ctx.createGain();
      gainNode.gain.value = params.gain;
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 10;
      compressor.ratio.value = 4;
      compressor.attack.value = 3e-3;
      compressor.release.value = 0.25;
      gainNode.connect(analyser);
      analyser.connect(compressor);
      compressor.connect(ctx.destination);
      freqBuf = new Uint8Array(analyser.frequencyBinCount);
      timeBuf = new Uint8Array(analyser.fftSize);
    }
    function disconnectActive() {
      if (bufSrc) {
        bufSrc.onended = null;
        try {
          bufSrc.stop();
        } catch (_) {
        }
        try {
          bufSrc.disconnect();
        } catch (_) {
        }
        bufSrc = null;
      }
      audioBuf = null;
      fileIsPlaying = false;
      pauseOffset = 0;
      if (activeSource) {
        try {
          activeSource.disconnect();
        } catch (_) {
        }
        if (typeof activeSource.stop === "function") {
          try {
            activeSource.stop();
          } catch (_) {
          }
        }
        activeSource = null;
      }
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
        activeStream = null;
      }
      sourceType = null;
    }
    async function connectMic() {
      init();
      disconnectActive();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      activeStream = stream;
      if (ctx.state === "suspended") await ctx.resume();
      const node = ctx.createMediaStreamSource(stream);
      node.connect(gainNode);
      activeSource = node;
      sourceType = "mic";
    }
    function createAndStartBufSrc(offset) {
      if (bufSrc) {
        bufSrc.onended = null;
        try {
          bufSrc.stop();
        } catch (_) {
        }
        try {
          bufSrc.disconnect();
        } catch (_) {
        }
        bufSrc = null;
      }
      const node = ctx.createBufferSource();
      node.buffer = audioBuf;
      node.playbackRate.value = filePlaybackRate;
      node.connect(gainNode);
      node.onended = function() {
        if (bufSrc !== node) return;
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
      if (ctx.state === "suspended") await ctx.resume();
      pauseOffset = 0;
      filePlaybackRate = 1;
      loopEnabled = false;
      createAndStartBufSrc(0);
      sourceType = "file";
    }
    async function filePlay() {
      if (!audioBuf || !ctx || fileIsPlaying) return;
      if (ctx.state === "suspended") await ctx.resume();
      createAndStartBufSrc(pauseOffset);
    }
    function filePause() {
      if (!fileIsPlaying || !bufSrc) return;
      pauseOffset = fileGetOffset();
      bufSrc.onended = null;
      try {
        bufSrc.stop();
      } catch (_) {
      }
      try {
        bufSrc.disconnect();
      } catch (_) {
      }
      bufSrc = null;
      fileIsPlaying = false;
    }
    function fileStop() {
      if (bufSrc) {
        bufSrc.onended = null;
        try {
          bufSrc.stop();
        } catch (_) {
        }
        try {
          bufSrc.disconnect();
        } catch (_) {
        }
        bufSrc = null;
      }
      fileIsPlaying = false;
      pauseOffset = 0;
    }
    function fileSeek(seconds) {
      if (!audioBuf) return;
      seconds = Math.max(0, Math.min(seconds, audioBuf.duration));
      pauseOffset = seconds;
      if (fileIsPlaying) {
        if (bufSrc) {
          bufSrc.onended = null;
          try {
            bufSrc.stop();
          } catch (_) {
          }
          try {
            bufSrc.disconnect();
          } catch (_) {
          }
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
        pos = (pos % audioBuf.duration + audioBuf.duration) % audioBuf.duration;
      } else {
        pos = Math.min(pos, audioBuf.duration);
      }
      return pos;
    }
    function fileGetDuration() {
      return audioBuf ? audioBuf.duration : 0;
    }
    function fileGetIsPlaying() {
      return fileIsPlaying;
    }
    function fileSetLoop(val) {
      loopEnabled = !!val;
    }
    function fileSetPlaybackRate(rate) {
      if (fileIsPlaying && bufSrc) {
        pauseOffset = fileGetOffset();
        playStartTime = ctx.currentTime;
        filePlaybackRate = rate;
        bufSrc.playbackRate.value = rate;
      } else {
        filePlaybackRate = rate;
      }
    }
    function fileSetOnEnded(cb) {
      onFileEndedCb = cb;
    }
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
      if (ctx && ctx.state === "suspended") await ctx.resume();
    }
    function getState() {
      return ctx ? ctx.state : "closed";
    }
    function getContext() {
      return ctx;
    }
    function getSourceType() {
      return sourceType;
    }
    function getAudioStream() {
      if (!ctx) return null;
      if (!streamDest) {
        streamDest = ctx.createMediaStreamDestination();
        compressor.connect(streamDest);
      }
      return streamDest.stream;
    }
    return {
      init,
      connectMic,
      connectFile,
      setFftSize,
      setSmoothing,
      setGain,
      getFrequencyData,
      getTimeDomainData,
      getRMS,
      getState,
      getContext,
      getSourceType,
      resume,
      getAudioStream,
      filePlay,
      filePause,
      fileStop,
      fileSeek,
      fileGetOffset,
      fileGetDuration,
      fileGetIsPlaying,
      fileSetLoop,
      fileSetPlaybackRate,
      fileSetOnEnded
    };
  })();

  // js/audio/beat-detector.js
  var BeatDetector = (() => {
    const HISTORY = 40;
    const COOLDOWN = 200;
    let _enabled = true;
    let _multiplier = 1.4;
    const _bassHist = new Float32Array(HISTORY);
    let _bassIdx = 0;
    let _bassSum = 0;
    let _bassFill = 0;
    let _lastBeat = -Infinity;
    let _isBeat = false;
    let _bassNow = 0;
    let _bassAvg = 0;
    const _trebHist = new Float32Array(HISTORY);
    let _trebIdx = 0;
    let _trebSum = 0;
    let _trebFill = 0;
    let _lastHit = -Infinity;
    let _isHit = false;
    function _binRMS(freq, lo, hi) {
      let sum = 0;
      for (let i = lo; i < hi; i++) {
        const v = freq[i] / 255;
        sum += v * v;
      }
      return Math.sqrt(sum / (hi - lo));
    }
    function update(freq) {
      _isBeat = false;
      _isHit = false;
      if (!_enabled || !freq || freq.length < 12) return;
      const now = performance.now();
      const binCount = freq.length;
      const bass = _binRMS(freq, 0, 11);
      _bassNow = bass;
      _bassSum -= _bassHist[_bassIdx];
      _bassHist[_bassIdx] = bass;
      _bassSum += bass;
      _bassIdx = (_bassIdx + 1) % HISTORY;
      if (_bassFill < HISTORY) _bassFill++;
      _bassAvg = _bassSum / _bassFill;
      if (_bassAvg > 0 && bass > _bassAvg * _multiplier && now - _lastBeat >= COOLDOWN) {
        _isBeat = true;
        _lastBeat = now;
      }
      const trebLo = Math.floor(binCount * 0.75);
      const treb = _binRMS(freq, trebLo, binCount);
      _trebSum -= _trebHist[_trebIdx];
      _trebHist[_trebIdx] = treb;
      _trebSum += treb;
      _trebIdx = (_trebIdx + 1) % HISTORY;
      if (_trebFill < HISTORY) _trebFill++;
      const trebAvg = _trebSum / _trebFill;
      if (trebAvg > 0 && treb > trebAvg * _multiplier && now - _lastHit >= COOLDOWN) {
        _isHit = true;
        _lastHit = now;
      }
    }
    return {
      update,
      isBeat() {
        return _isBeat;
      },
      isHit() {
        return _isHit;
      },
      beatEnergy() {
        return _bassAvg > 0 ? Math.min(1, _bassNow / (_bassAvg * _multiplier)) : 0;
      },
      setEnabled(v) {
        _enabled = !!v;
        if (!v) {
          _isBeat = false;
          _isHit = false;
        }
      },
      setMultiplier(v) {
        _multiplier = v;
      },
      isEnabled() {
        return _enabled;
      }
    };
  })();

  // js/overlays/background.js
  var bgState = {
    image: null,
    /* HTMLImageElement | null */
    objectUrl: null,
    /* blob URL to revoke on clear */
    pattern: null,
    /* cached CanvasPattern for tile mode */
    patternImg: null,
    /* image the pattern was built from */
    patternW: -1,
    /* canvas logical size at pattern creation */
    patternH: -1
  };
  var radialImageState = {
    image: null,
    /* HTMLImageElement | null */
    objectUrl: null
    /* blob URL to revoke on clear */
  };
  function drawBackground(ctx, W, H) {
    const img = bgState.image;
    if (!img) return;
    ctx.globalAlpha = params.bgOpacity;
    ctx.globalCompositeOperation = params.bgBlend;
    switch (params.bgFit) {
      case "cover": {
        const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
        break;
      }
      case "contain": {
        const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
        break;
      }
      case "stretch": {
        ctx.drawImage(img, 0, 0, W, H);
        break;
      }
      case "tile": {
        if (bgState.patternImg !== img || bgState.patternW !== W || bgState.patternH !== H) {
          bgState.pattern = ctx.createPattern(img, "repeat");
          bgState.patternImg = img;
          bgState.patternW = W;
          bgState.patternH = H;
        }
        ctx.fillStyle = bgState.pattern;
        ctx.fillRect(0, 0, W, H);
        break;
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
  function loadBackgroundFromFile(file) {
    if (bgState.objectUrl) URL.revokeObjectURL(bgState.objectUrl);
    const url = URL.createObjectURL(file);
    bgState.objectUrl = url;
    const img = new Image();
    img.onload = () => {
      bgState.image = img;
      bgState.pattern = null;
      bgState.patternImg = null;
      const thumb = document.getElementById("bg-thumbnail");
      thumb.src = url;
      thumb.classList.add("visible");
      document.getElementById("btn-clear-bg").style.display = "";
    };
    img.src = url;
  }
  function loadBackgroundFromDataUrl(dataUrl) {
    const img = new Image();
    img.onload = () => {
      bgState.image = img;
      bgState.pattern = null;
      bgState.patternImg = null;
      const thumb = document.getElementById("bg-thumbnail");
      thumb.src = dataUrl;
      thumb.classList.add("visible");
      document.getElementById("btn-clear-bg").style.display = "";
    };
    img.src = dataUrl;
  }
  function imageToDataUrl(img) {
    const maxDim = 1920;
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  }
  function clearBackground() {
    if (bgState.objectUrl) {
      URL.revokeObjectURL(bgState.objectUrl);
      bgState.objectUrl = null;
    }
    bgState.image = null;
    bgState.pattern = null;
    bgState.patternImg = null;
    params.bgOpacity = 1;
    params.bgBlend = "normal";
    params.bgFit = "cover";
    const thumb = document.getElementById("bg-thumbnail");
    thumb.classList.remove("visible");
    thumb.src = "";
    document.getElementById("btn-clear-bg").style.display = "none";
    document.getElementById("ctrl-bg-opacity").value = "1.0";
    document.getElementById("val-bg-opacity").textContent = "1.0";
    document.getElementById("ctrl-bg-blend").value = "normal";
    updateFitButtons("cover");
  }
  function loadRadialImageFromFile(file) {
    if (radialImageState.objectUrl) URL.revokeObjectURL(radialImageState.objectUrl);
    const url = URL.createObjectURL(file);
    radialImageState.objectUrl = url;
    const img = new Image();
    img.onload = () => {
      radialImageState.image = img;
      const thumb = document.getElementById("radial-img-thumbnail");
      thumb.src = url;
      thumb.classList.add("visible");
      document.getElementById("btn-clear-radial-img").style.display = "";
    };
    img.src = url;
  }
  function loadRadialImageFromDataUrl(dataUrl) {
    const img = new Image();
    img.onload = () => {
      radialImageState.image = img;
      const thumb = document.getElementById("radial-img-thumbnail");
      thumb.src = dataUrl;
      thumb.classList.add("visible");
      document.getElementById("btn-clear-radial-img").style.display = "";
    };
    img.src = dataUrl;
  }
  function clearRadialImage() {
    if (radialImageState.objectUrl) {
      URL.revokeObjectURL(radialImageState.objectUrl);
      radialImageState.objectUrl = null;
    }
    radialImageState.image = null;
    params.radialImgOpacity = 1;
    const thumb = document.getElementById("radial-img-thumbnail");
    thumb.classList.remove("visible");
    thumb.src = "";
    document.getElementById("btn-clear-radial-img").style.display = "none";
    document.getElementById("ctrl-radial-img-opacity").value = "1.0";
    document.getElementById("val-radial-img-opacity").textContent = "1.0";
  }
  function updateFitButtons(fit) {
    document.querySelectorAll(".fit-btn[data-fit]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.fit === fit && !params.bgGradient);
    });
    const gradBtn = document.getElementById("btn-bg-gradient");
    if (gradBtn) gradBtn.classList.toggle("active", params.bgGradient);
  }
  var gradHue = 0;
  var gradBassSmooth = 0;
  var gradMidSmooth = 0;
  function _gradBinRms(freq, lo, hi) {
    if (!freq || freq.length <= lo) return 0;
    const end = Math.min(hi, freq.length);
    let sum = 0;
    for (let i = lo; i < end; i++) {
      const v = freq[i] / 255;
      sum += v * v;
    }
    return Math.sqrt(sum / (end - lo));
  }
  function drawGradientBackground(ctx, W, H, freq) {
    const bassRms = _gradBinRms(freq, 0, 11);
    const midRms = _gradBinRms(freq, 20, 61);
    gradBassSmooth = gradBassSmooth * 0.92 + bassRms * 0.08;
    gradMidSmooth = gradMidSmooth * 0.88 + midRms * 0.12;
    gradHue = (gradHue + 0.05 + gradBassSmooth * 0.5) % 360;
    const hue = (gradHueBase + gradHue) % 360;
    const energy = Math.min(1, gradMidSmooth * 5);
    const sat = 10 + 65 * energy;
    const lit = 5 + 7 * energy;
    const cx = W / 2;
    const cy = H / 2;
    const r = Math.sqrt(W * W + H * H) * 0.6;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, `hsl(${hue.toFixed(1)},${sat.toFixed(1)}%,${lit.toFixed(1)}%)`);
    grad.addColorStop(1, `hsl(${hue.toFixed(1)},10%,3%)`);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // js/overlays/artist-card.js
  var artistCardState = {
    image: null,
    /* HTMLImageElement | null */
    objectUrl: null
    /* blob URL to revoke on clear */
  };
  var artistCardBeatPulse = 1;
  var artistCardBgBeatAlpha = 0;
  var artistCardGlowAlpha = 0;
  function setArtistCardBeatState(pulse, bgAlpha, glowAlpha) {
    artistCardBeatPulse = pulse;
    artistCardBgBeatAlpha = bgAlpha;
    artistCardGlowAlpha = glowAlpha;
  }
  var artistCardTimerActive = false;
  var artistCardTimerEndTime = 0;
  function startArtistCardTimer(durationMs) {
    artistCardTimerActive = true;
    artistCardTimerEndTime = Date.now() + durationMs;
  }
  function drawArtistCard(ctx, W, H) {
    if (!params.artistCardEnabled) return;
    let timerAlpha = 1;
    if (artistCardTimerActive) {
      const remaining = artistCardTimerEndTime - Date.now();
      if (remaining <= 0) {
        artistCardTimerActive = false;
        return;
      }
      const FADE_MS = 1e3;
      timerAlpha = remaining < FADE_MS ? remaining / FADE_MS : 1;
    }
    artistCardBeatPulse = artistCardBeatPulse + (1 - artistCardBeatPulse) * 0.12;
    artistCardBgBeatAlpha = artistCardBgBeatAlpha + (0 - artistCardBgBeatAlpha) * 0.12;
    artistCardGlowAlpha = artistCardGlowAlpha + (0 - artistCardGlowAlpha) * 0.12;
    const PANEL_W = 220;
    const PAD = 16;
    const IMG_D = 160;
    const IMG_R = IMG_D / 2;
    const NAME_SZ = 22;
    const TITLE_SZ = 16;
    const GAP_IMG_NAME = 14;
    const GAP_NAME_TITLE = 6;
    const groupH = IMG_D + GAP_IMG_NAME + NAME_SZ + GAP_NAME_TITLE + TITLE_SZ;
    const groupY = (H - groupH) / 2;
    const cx = PANEL_W / 2;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = params.artistCardOpacity * timerAlpha;
    const bgAlpha = 0.45 + artistCardBgBeatAlpha;
    ctx.fillStyle = `rgba(0,0,0,${bgAlpha})`;
    ctx.fillRect(0, 0, PANEL_W, H);
    const pulse = artistCardBeatPulse;
    const imgCx = cx;
    const imgCy = groupY + IMG_R;
    const pulseR = IMG_R * pulse;
    const pulseD = IMG_D * pulse;
    ctx.save();
    ctx.beginPath();
    ctx.arc(imgCx, imgCy, pulseR, 0, Math.PI * 2);
    ctx.clip();
    if (artistCardState.image) {
      const img = artistCardState.image;
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - side) / 2;
      const sy = (img.naturalHeight - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, imgCx - pulseR, imgCy - pulseR, pulseD, pulseD);
    } else {
      ctx.fillStyle = THEME.accent;
      ctx.fillRect(imgCx - pulseR, imgCy - pulseR, pulseD, pulseD);
      ctx.font = `bold ${pulseR * 0.9}px sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("\u266A", imgCx, imgCy);
    }
    ctx.restore();
    const nameY = groupY + IMG_D + GAP_IMG_NAME + NAME_SZ / 2;
    ctx.font = `bold ${NAME_SZ}px system-ui,-apple-system,sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const nameText = params.artistCardName.trim() || "Artist Name";
    if (artistCardGlowAlpha > 5e-3) {
      const [ar, ag2, ab] = hexToRgb(THEME.accent);
      ctx.fillStyle = `rgba(${ar},${ag2},${ab},${artistCardGlowAlpha})`;
      ctx.fillText(nameText, cx, nameY + 1, PANEL_W - PAD * 2);
    }
    ctx.fillStyle = THEME.highlight;
    ctx.fillText(nameText, cx, nameY, PANEL_W - PAD * 2);
    if (params.artistCardTitle.trim()) {
      const titleY = nameY + NAME_SZ / 2 + GAP_NAME_TITLE + TITLE_SZ / 2;
      ctx.font = `${TITLE_SZ}px system-ui,-apple-system,sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(params.artistCardTitle.trim(), cx, titleY, PANEL_W - PAD * 2);
    }
    ctx.restore();
  }

  // js/overlays/text.js
  var textOverlayStartTime = performance.now();
  var overlaySpotCanvas = null;
  var overlaySpotCtx = null;
  var overlaySpotW = -1;
  var overlaySpotH = -1;
  var LOWER_THIRD_ANIM_MS = 400;
  var lowerThirdPhase = "hidden";
  var lowerThirdAnimStart = 0;
  function triggerLowerThird() {
    lowerThirdPhase = "in";
    lowerThirdAnimStart = performance.now();
  }
  function resetOverlayTimer() {
    textOverlayStartTime = performance.now();
  }
  function overlaySeededRng(seed) {
    let s = seed >>> 0;
    return function() {
      s = Math.imul(s, 1664525) + 1013904223 >>> 0;
      return s / 4294967296;
    };
  }
  function overlaySetBase(ctx, cr, cg, cb) {
    ctx.shadowBlur = 8;
    ctx.shadowColor = `rgba(${cr},${cg},${cb},0.5)`;
  }
  function drawScrollOverlay(ctx, text, t, W, H, cr, cg, cb) {
    ctx.font = `${params.overlayFontSize}px ${params.overlayFontFamily}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${params.overlayOpacity})`;
    const tw = ctx.measureText(text).width;
    const speed = 80 * (W / 800);
    const cycle = tw + W;
    const x = W - t * speed % cycle;
    ctx.fillText(text, x, H / 2);
  }
  function drawFadeOverlay(ctx, text, t, W, H, cr, cg, cb) {
    const sine = (Math.sin(t * 0.8) + 1) / 2;
    const opacity = Math.max(0.15, params.overlayOpacity * sine);
    const scl = 0.96 + sine * 0.08;
    ctx.font = `${params.overlayFontSize * scl}px ${params.overlayFontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${opacity})`;
    ctx.fillText(text, W / 2, H / 2);
  }
  function drawTypewriterOverlay(ctx, text, t, W, H, cr, cg, cb) {
    const REVEAL = 3, HOLD1 = 2, WIPE = 1.5, HOLD2 = 1;
    const cycle = REVEAL + HOLD1 + WIPE + HOLD2;
    const phase = t % cycle;
    const n = text.length;
    let charCount;
    if (phase < REVEAL) charCount = Math.floor(phase / REVEAL * n);
    else if (phase < REVEAL + HOLD1) charCount = n;
    else if (phase < REVEAL + HOLD1 + WIPE) charCount = Math.floor(n * (1 - (phase - REVEAL - HOLD1) / WIPE));
    else charCount = 0;
    if (charCount <= 0) return;
    const visible = text.slice(0, charCount);
    ctx.font = `${params.overlayFontSize}px ${params.overlayFontFamily}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${params.overlayOpacity})`;
    const fullW = ctx.measureText(text).width;
    ctx.fillText(visible, W / 2 - fullW / 2, H / 2);
  }
  function drawGlitchOverlay(ctx, text, t, W, H, cr, cg, cb) {
    const segId = Math.floor(t / 0.4);
    const rng = overlaySeededRng(segId * 137 + 42);
    const numEffects = Math.floor(rng() * 4);
    ctx.font = `${params.overlayFontSize}px ${params.overlayFontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (numEffects >= 1) {
      const ox = (rng() - 0.5) * 12;
      const oy = (rng() - 0.5) * 8;
      ctx.fillStyle = rng() > 0.5 ? "rgba(255,0,0,0.45)" : "rgba(0,255,238,0.45)";
      ctx.fillText(text, W / 2 + ox, H / 2 + oy);
    }
    let displayText = text;
    if (numEffects >= 3) {
      const chars = text.split("");
      const numSub = 1 + Math.floor(rng() * 2);
      const glitchSet = "!@#$%^&*<>?/\\|{}[]~";
      for (let s = 0; s < numSub; s++) {
        const idx = Math.floor(rng() * chars.length);
        chars[idx] = glitchSet[Math.floor(rng() * glitchSet.length)];
      }
      displayText = chars.join("");
    }
    if (numEffects >= 2) {
      const sliceY = H * (0.3 + rng() * 0.4);
      const sliceH2 = params.overlayFontSize * (0.2 + rng() * 0.3);
      const sliceX = (rng() - 0.5) * 24;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, sliceY - sliceH2 / 2, W, sliceH2);
      ctx.clip();
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${params.overlayOpacity})`;
      ctx.fillText(displayText, W / 2 + sliceX, H / 2);
      ctx.restore();
    }
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${params.overlayOpacity})`;
    ctx.fillText(displayText, W / 2, H / 2);
  }
  function drawWaveOverlay(ctx, text, t, W, H, cr, cg, cb) {
    ctx.font = `${params.overlayFontSize}px ${params.overlayFontFamily}`;
    ctx.textBaseline = "middle";
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${params.overlayOpacity})`;
    const amplitude = params.overlayFontSize * 0.3;
    const advances = [];
    let totalWidth = 0;
    for (let i = 0; i < text.length; i++) {
      const w = ctx.measureText(text[i]).width;
      advances.push(w);
      totalWidth += w;
    }
    let x = W / 2 - totalWidth / 2;
    for (let i = 0; i < text.length; i++) {
      const y = H / 2 + Math.sin(t * 2 + i * 0.4) * amplitude;
      ctx.fillText(text[i], x, y);
      x += advances[i];
    }
  }
  function drawSpotlightOverlay(ctx, text, t, W, H, cr, cg, cb) {
    const lx = W / 2 + W * 0.3 * Math.sin(t * 0.5);
    const ly = H / 2 + H * 0.25 * Math.sin(t * 0.3);
    ctx.font = `${params.overlayFontSize}px ${params.overlayFontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.08 * params.overlayOpacity;
    ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
    ctx.fillText(text, W / 2, H / 2);
    ctx.globalAlpha = 1;
    const iW = Math.ceil(W), iH = Math.ceil(H);
    if (overlaySpotW !== iW || overlaySpotH !== iH) {
      overlaySpotCanvas = document.createElement("canvas");
      overlaySpotCanvas.width = iW;
      overlaySpotCanvas.height = iH;
      overlaySpotCtx = overlaySpotCanvas.getContext("2d");
      overlaySpotW = iW;
      overlaySpotH = iH;
    }
    const sc = overlaySpotCtx;
    sc.clearRect(0, 0, iW, iH);
    sc.font = `${params.overlayFontSize}px ${params.overlayFontFamily}`;
    sc.textAlign = "center";
    sc.textBaseline = "middle";
    sc.shadowBlur = 8;
    sc.shadowColor = `rgba(${cr},${cg},${cb},0.5)`;
    sc.fillStyle = `rgba(${cr},${cg},${cb},${params.overlayOpacity})`;
    sc.fillText(text, W / 2, H / 2);
    const spotR = Math.max(W, H) * 0.28;
    const grad = sc.createRadialGradient(lx, ly, 0, lx, ly, spotR);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.45, "rgba(255,255,255,0.7)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    sc.globalCompositeOperation = "destination-in";
    sc.fillStyle = grad;
    sc.fillRect(0, 0, iW, iH);
    sc.globalCompositeOperation = "source-over";
    ctx.drawImage(overlaySpotCanvas, 0, 0);
  }
  function drawLowerThirdOverlay(ctx, W, H, cr, cg, cb) {
    const now = performance.now();
    if (lowerThirdPhase === "in") {
      if (now - lowerThirdAnimStart >= LOWER_THIRD_ANIM_MS) {
        lowerThirdPhase = "visible";
        lowerThirdAnimStart = now;
      }
    } else if (lowerThirdPhase === "visible" && params.overlayDuration > 0) {
      if (now - lowerThirdAnimStart >= params.overlayDuration * 1e3) {
        lowerThirdPhase = "out";
        lowerThirdAnimStart = now;
      }
    } else if (lowerThirdPhase === "out") {
      if (now - lowerThirdAnimStart >= LOWER_THIRD_ANIM_MS) {
        lowerThirdPhase = "hidden";
      }
    }
    if (lowerThirdPhase === "hidden") return;
    let progress;
    const elapsed = now - lowerThirdAnimStart;
    if (lowerThirdPhase === "in") {
      const raw = Math.min(elapsed / LOWER_THIRD_ANIM_MS, 1);
      progress = 1 - Math.pow(1 - raw, 3);
    } else if (lowerThirdPhase === "visible") {
      progress = 1;
    } else {
      const raw = Math.min(elapsed / LOWER_THIRD_ANIM_MS, 1);
      progress = Math.pow(1 - raw, 3);
    }
    const restingY = H * 0.82;
    const barH = H * 0.14;
    const barY = H + (restingY - H) * progress;
    ctx.shadowBlur = 0;
    const grad = ctx.createLinearGradient(0, barY, 0, barY + barH);
    grad.addColorStop(0, "rgba(0,0,0,0.45)");
    grad.addColorStop(1, "rgba(0,0,0,0.72)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, barY, W, barH);
    const accentHex = params.overlayColor;
    ctx.fillStyle = accentHex;
    ctx.fillRect(0, barY, 6, barH);
    const textX = 6 + 32;
    const line1Y = barY + barH * 0.35;
    const line2Y = barY + barH * 0.72;
    const title = params.overlayText.trim();
    if (title) {
      ctx.font = `600 ${params.overlayFontSize * 1.2}px ${params.overlayFontFamily}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillStyle = `rgba(255,255,255,${params.overlayOpacity})`;
      ctx.fillText(title, textX, line1Y);
    }
    const sub = params.overlaySubtext.trim();
    if (sub) {
      ctx.font = `${params.overlayFontSize * 0.72}px ${params.overlayFontFamily}`;
      ctx.fillStyle = accentHex;
      ctx.globalAlpha = params.overlayOpacity;
      ctx.fillText(sub, textX, line2Y);
      ctx.globalAlpha = 1;
    }
  }
  function drawTextOverlay(ctx, logicalW2, logicalH2) {
    if (!params.overlayEnabled) return;
    const t = (performance.now() - textOverlayStartTime) / 1e3;
    const W = logicalW2, H = logicalH2;
    const text = params.overlayText;
    const [cr, cg, cb] = hexToRgb(params.overlayColor);
    if (params.overlayStyle === "lower-third") {
      ctx.save();
      drawLowerThirdOverlay(ctx, W, H, cr, cg, cb);
      ctx.restore();
      return;
    }
    if (!text.trim()) return;
    ctx.save();
    overlaySetBase(ctx, cr, cg, cb);
    switch (params.overlayStyle) {
      case "scroll":
        drawScrollOverlay(ctx, text, t, W, H, cr, cg, cb);
        break;
      case "fade":
        drawFadeOverlay(ctx, text, t, W, H, cr, cg, cb);
        break;
      case "typewriter":
        drawTypewriterOverlay(ctx, text, t, W, H, cr, cg, cb);
        break;
      case "glitch":
        drawGlitchOverlay(ctx, text, t, W, H, cr, cg, cb);
        break;
      case "wave":
        drawWaveOverlay(ctx, text, t, W, H, cr, cg, cb);
        break;
      case "spotlight":
        drawSpotlightOverlay(ctx, text, t, W, H, cr, cg, cb);
        break;
    }
    ctx.restore();
  }

  // js/overlays/progress-bar.js
  function formatTime(secs) {
    secs = Math.max(0, Math.floor(secs));
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  }
  function drawProgressBar(ctx, W, H) {
    if (!params.progressBar) return;
    if (AudioEngine.getSourceType() !== "file") return;
    const dur = AudioEngine.fileGetDuration();
    if (dur <= 0) return;
    const pos = AudioEngine.fileGetOffset();
    const progress = Math.min(1, pos / dur);
    const fillW = progress * W;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = THEME.accent;
    ctx.fillRect(0, 0, W, 4);
    if (fillW > 0) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = THEME.accent;
      ctx.fillRect(0, 0, fillW, 4);
      const cx = fillW;
      const cy = 2;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = THEME.accent;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = THEME.accent;
      ctx.fill();
    }
    if (H > 300) {
      const elapsed = formatTime(pos);
      const remaining = "-" + formatTime(dur - pos);
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#ffffff";
      ctx.font = "11px monospace";
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillText(elapsed, 6, 8);
      ctx.textAlign = "right";
      ctx.fillText(remaining, W - 6, 8);
    }
    ctx.restore();
  }
  function drawElapsedTimer(ctx, W, H) {
    if (!params.showTimer) return;
    const pos = AudioEngine.getSourceType() === "file" ? AudioEngine.fileGetOffset() : 0;
    const mins = Math.floor(pos / 60);
    const secs = Math.floor(pos) % 60;
    const label = String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
    const pad = 16;
    const bottomOffset = params.progressBar ? 4 : 0;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.8;
    ctx.font = "18px monospace";
    ctx.fillStyle = THEME.highlight;
    ctx.textBaseline = "bottom";
    ctx.textAlign = "right";
    ctx.fillText(label, W - pad, H - pad - bottomOffset);
    ctx.restore();
  }

  // js/overlays/bloom.js
  function applyBloom(outputCtx, sourceCanvas, bloomCanvas2, bloomCtx2, W, H) {
    if (params.bloomIntensity <= 0) return;
    const N = params.bloomIntensity;
    const blurPx = 4 + (N - 1) * 3.5;
    const baseAlpha = 0.3 + (N - 1) * 0.05;
    const energy = BeatDetector.beatEnergy();
    const finalAlpha = Math.min(1, baseAlpha * (1 + energy * 0.5));
    bloomCtx2.clearRect(0, 0, W, H);
    bloomCtx2.filter = `blur(${blurPx}px)`;
    bloomCtx2.drawImage(sourceCanvas, 0, 0, W, H);
    bloomCtx2.filter = "none";
    outputCtx.globalAlpha = finalAlpha;
    outputCtx.globalCompositeOperation = "lighter";
    outputCtx.drawImage(bloomCanvas2, 0, 0, W, H);
    outputCtx.globalCompositeOperation = "source-over";
    outputCtx.globalAlpha = 1;
  }

  // js/renderers/bars.js
  var barsGrad = null;
  var barsGradH = -1;
  function invalidateBarsGrad() {
    barsGradH = -1;
  }
  var barHeights = new Float32Array(256);
  function renderBars(ctx, freq, W, H, vizFillAlpha = 1) {
    if (!freq) return;
    if (barsGradH !== H) {
      barsGrad = ctx.createLinearGradient(0, H, 0, 0);
      barsGrad.addColorStop(0, THEME.accent);
      barsGrad.addColorStop(1, THEME.highlight);
      barsGradH = H;
    }
    const barCount = params.barCount;
    const binCount = freq.length;
    const barW = W / barCount;
    const drawW = Math.max(1, barW - 1);
    const centerY = H * 0.5;
    const maxBarH = centerY * 0.95;
    const smoothK = 0.08 + 0.14 * params.motionAmount;
    ctx.globalAlpha = vizFillAlpha;
    ctx.fillStyle = barsGrad;
    for (let i = 0; i < barCount; i++) {
      const srcI = params.mirror && i >= barCount / 2 ? barCount - 1 - i : i;
      const lo = Math.floor(srcI * binCount / barCount);
      const hi = Math.floor((srcI + 1) * binCount / barCount);
      let sum = 0;
      for (let b = lo; b < hi; b++) sum += freq[b];
      const newVal = hi > lo ? sum / ((hi - lo) * 255) : freq[lo] / 255;
      barHeights[i] += (newVal - barHeights[i]) * smoothK;
      const bh = barHeights[i] * maxBarH;
      const x = i * barW;
      ctx.fillRect(x, centerY - bh, drawW, bh);
      ctx.fillRect(x, centerY, drawW, bh);
    }
    ctx.globalAlpha = 1;
  }

  // js/renderers/radial.js
  var radialAngle = 0;
  var radialBeatTime = -Infinity;
  function setRadialBeatTime(t) {
    radialBeatTime = t;
  }
  function polygonBoundaryRadius(n, R, vertex0Angle, phi) {
    const segAngle = 2 * Math.PI / n;
    const phiRel = ((phi - vertex0Angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    const phiInSector = phiRel % segAngle - segAngle / 2;
    return R * Math.cos(Math.PI / n) / Math.cos(phiInSector);
  }
  function radialCenterPath(ctx, shape, cx, cy, r, angle) {
    ctx.beginPath();
    if (shape === "square") {
      for (let i = 0; i < 4; i++) {
        const a = angle + Math.PI / 4 + i / 4 * Math.PI * 2;
        if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        else ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.closePath();
    } else if (shape === "triangle") {
      for (let i = 0; i < 3; i++) {
        const a = angle - Math.PI / 2 + i / 3 * Math.PI * 2;
        if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        else ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.closePath();
    } else {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    }
  }
  function renderRadial(ctx, freq, W, H, vizFillAlpha, bgState2, radialImageState2) {
    if (!freq) return;
    const cx = W / 2;
    const cy = H / 2;
    const minDim = Math.min(W, H);
    const innerBase = minDim * 0.18;
    const outerMax = minDim * 0.46;
    const beatElapsed = performance.now() - radialBeatTime;
    const beatScale = beatElapsed < 200 ? 1 + 0.08 * (1 - beatElapsed / 200) : 1;
    const innerRadius = innerBase * beatScale;
    radialAngle += 1e-3 * params.motionAmount;
    const barCount = params.barCount;
    const binCount = freq.length;
    const smoothK = 0.08 + 0.14 * params.motionAmount;
    const shape = params.radialShape || "circle";
    const barWidth = Math.max(1, 2 * Math.PI * innerBase / barCount * 0.75);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(radialAngle);
    ctx.globalAlpha = vizFillAlpha;
    for (let i = 0; i < barCount; i++) {
      const srcI = params.mirror && i >= barCount / 2 ? barCount - 1 - i : i;
      const lo = Math.floor(srcI * binCount / barCount);
      const hi = Math.floor((srcI + 1) * binCount / barCount);
      let sum = 0;
      for (let b = lo; b < hi; b++) sum += freq[b];
      const newVal = hi > lo ? sum / ((hi - lo) * 255) : freq[lo] / 255;
      barHeights[i] += (newVal - barHeights[i]) * smoothK;
      const barH = barHeights[i] * (outerMax - innerRadius);
      if (barH <= 0.5) continue;
      const angle = i / barCount * Math.PI * 2;
      const cv = Math.min(255, Math.max(0, Math.floor(barHeights[i] * 255)));
      let startR = innerRadius;
      if (shape === "square") {
        startR = polygonBoundaryRadius(4, innerRadius, Math.PI / 4, angle);
      } else if (shape === "triangle") {
        startR = polygonBoundaryRadius(3, innerRadius, -Math.PI / 2, angle);
      }
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = `rgb(${heatR[cv]},${heatG[cv]},${heatB[cv]})`;
      ctx.fillRect(startR, -barWidth / 2, barH, barWidth);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    radialCenterPath(ctx, shape, cx, cy, innerRadius, radialAngle);
    ctx.fillStyle = THEME.bgColor;
    ctx.fill();
    const centerImg = radialImageState2.image || bgState2.image;
    const centerOpacity = radialImageState2.image ? params.radialImgOpacity : params.bgOpacity;
    if (centerImg) {
      const d = innerRadius * 2;
      const scale = Math.max(d / centerImg.naturalWidth, d / centerImg.naturalHeight);
      const dw = centerImg.naturalWidth * scale;
      const dh = centerImg.naturalHeight * scale;
      ctx.save();
      radialCenterPath(ctx, shape, cx, cy, innerRadius, radialAngle);
      ctx.clip();
      ctx.globalAlpha = centerOpacity;
      ctx.drawImage(centerImg, cx - dw / 2, cy - dh / 2, dw, dh);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  // js/renderers/waveform.js
  var wavePhase = 0;
  var waveYBuf = new Float32Array(4096);
  function renderWaveform(ctx, time, W, H, vizFillAlpha = 1) {
    if (!time) return;
    wavePhase = (wavePhase + 4e-3 * params.motionAmount) % 1;
    const tLen = time.length;
    const phShift = Math.floor(wavePhase * tLen);
    const centerY = H * 0.5;
    const amp = H * 0.42;
    const [wr, wg2, wb] = THEME.waveRGB;
    if (W > waveYBuf.length) waveYBuf = new Float32Array(W * 2);
    for (let i = 0; i < W; i++) {
      const idx = (phShift + Math.floor(i * tLen / W)) % tLen;
      waveYBuf[i] = centerY + (time[idx] - 128) / 128 * amp;
    }
    if (params.fill) {
      ctx.beginPath();
      ctx.moveTo(0, waveYBuf[0]);
      for (let i = 1; i < W; i++) ctx.lineTo(i, waveYBuf[i]);
      ctx.lineTo(W, centerY);
      ctx.lineTo(0, centerY);
      ctx.closePath();
      ctx.fillStyle = `rgba(${wr},${wg2},${wb},${0.08 * vizFillAlpha})`;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(0, waveYBuf[0]);
    for (let i = 1; i < W; i++) ctx.lineTo(i, waveYBuf[i]);
    ctx.strokeStyle = `rgba(${wr},${wg2},${wb},0.15)`;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, waveYBuf[0]);
    for (let i = 1; i < W; i++) ctx.lineTo(i, waveYBuf[i]);
    ctx.strokeStyle = `rgb(${wr},${wg2},${wb})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // js/renderers/spectrogram.js
  var spectroCanvas = null;
  var spectroCtx2 = null;
  var spectroStripData = null;
  var spectroSW = 0;
  var spectroSH = 0;
  function ensureSpectrogram(W, H) {
    if (spectroCanvas && spectroSW === W && spectroSH === H) return;
    spectroCanvas = document.createElement("canvas");
    spectroCanvas.width = W;
    spectroCanvas.height = H;
    spectroCtx2 = spectroCanvas.getContext("2d");
    spectroCtx2.fillStyle = THEME.bgColor;
    spectroCtx2.fillRect(0, 0, W, H);
    spectroStripData = spectroCtx2.createImageData(2, H);
    spectroSW = W;
    spectroSH = H;
  }
  function clearSpectrogramCanvas() {
    if (spectroCtx2) {
      spectroCtx2.fillStyle = THEME.bgColor;
      spectroCtx2.fillRect(0, 0, spectroSW, spectroSH);
    }
  }
  function renderSpectrogram(ctx, freq, W, H, vizFillAlpha = 1) {
    ensureSpectrogram(W, H);
    if (freq) {
      const binCount = freq.length;
      const sh = spectroSH;
      const sd = spectroStripData;
      for (let y = 0; y < sh; y++) {
        const binIdx = Math.min(binCount - 1, Math.floor((1 - y / sh) * binCount));
        const val = freq[binIdx];
        const p = y * 8;
        sd.data[p] = heatR[val];
        sd.data[p + 1] = heatG[val];
        sd.data[p + 2] = heatB[val];
        sd.data[p + 3] = 255;
        sd.data[p + 4] = heatR[val];
        sd.data[p + 5] = heatG[val];
        sd.data[p + 6] = heatB[val];
        sd.data[p + 7] = 255;
      }
      spectroCtx2.drawImage(spectroCanvas, -2, 0);
      spectroCtx2.putImageData(sd, spectroSW - 2, 0);
    }
    ctx.globalAlpha = vizFillAlpha;
    ctx.drawImage(spectroCanvas, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  // js/renderers/particles.js
  var particlePool = [];
  function spawnParticle(px, py, vx, vy, size) {
    const maxPool = params.particleDensity;
    let p = null;
    for (let i = 0; i < particlePool.length; i++) {
      if (particlePool[i].life <= 0) {
        p = particlePool[i];
        break;
      }
    }
    if (!p) {
      if (particlePool.length >= maxPool) return;
      p = {};
      particlePool.push(p);
    }
    const accentHue = hexToHue(THEME.accent);
    const vMag = Math.sqrt(vx * vx + vy * vy);
    p.x = px;
    p.y = py;
    p.vx = vx;
    p.vy = vy;
    p.life = 1;
    p.size = size;
    p.hue = (accentHue + vMag / 8 * 60) % 360;
    p.lifeDecay = 1 / (60 + Math.random() * 120);
  }
  function renderParticles(ctx, time, W, H, vizFillAlpha) {
    const cx = W / 2;
    const cy = H / 2;
    ctx.save();
    ctx.globalAlpha = 0.3;
    renderWaveform(ctx, time, W, H, vizFillAlpha);
    ctx.restore();
    const rms = AudioEngine.getRMS();
    const baseVel = 0.5 + rms * 4;
    const nSpawn = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < nSpawn; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = baseVel * (0.5 + Math.random() * 0.5);
      spawnParticle(
        cx,
        cy,
        Math.cos(angle) * vel,
        Math.sin(angle) * vel,
        2 + Math.random() * 3
      );
    }
    if (BeatDetector.isBeat()) {
      const bassEnergy = BeatDetector.beatEnergy();
      const burst = Math.round(30 + bassEnergy * 30);
      for (let i = 0; i < burst; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vel = 3 + Math.random() * 5;
        spawnParticle(
          cx,
          cy,
          Math.cos(angle) * vel,
          Math.sin(angle) * vel,
          2.5 + Math.random() * 2.5
        );
      }
    }
    if (BeatDetector.isHit()) {
      const hitCount = 15 + Math.floor(Math.random() * 11);
      for (let i = 0; i < hitCount; i++) {
        const edge = Math.floor(Math.random() * 4);
        let px, py;
        if (edge === 0) {
          px = Math.random() * W;
          py = 0;
        } else if (edge === 1) {
          px = Math.random() * W;
          py = H;
        } else if (edge === 2) {
          px = 0;
          py = Math.random() * H;
        } else {
          px = W;
          py = Math.random() * H;
        }
        const dx = cx - px;
        const dy = cy - py;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const vel = 3 + Math.random() * 4;
        spawnParticle(
          px,
          py,
          dx / dist * vel,
          dy / dist * vel,
          1.5 + Math.random() * 1.5
        );
      }
    }
    for (let i = 0; i < particlePool.length; i++) {
      const p = particlePool[i];
      if (p.life <= 0) continue;
      p.vy += 0.04;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life -= p.lifeDecay;
      if (p.life < 0) p.life = 0;
      if (p.life === 0) continue;
      const drawSize = p.size * p.life;
      if (drawSize < 0.5) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, drawSize, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},100%,65%,${Math.sqrt(p.life) * vizFillAlpha})`;
      ctx.fill();
    }
  }

  // js/renderers/rings.js
  var RING_BANDS = [
    { lo: 0, hi: 3 },
    // sub-bass
    { lo: 4, hi: 10 },
    // bass
    { lo: 11, hi: 25 },
    // low-mid
    { lo: 26, hi: 60 },
    // mid
    { lo: 61, hi: 120 },
    // high-mid
    { lo: 121, hi: -1 }
    // treble (hi = -1 → end of useful range)
  ];
  var ringValues = new Float32Array(6);
  var ringRipples = [];
  function renderRings(ctx, freq, W, H, vizFillAlpha = 1) {
    const cx = W / 2;
    const cy = H / 2;
    const minDim = Math.min(W, H);
    const innerR = minDim * 0.08;
    const outerR = minDim * 0.46;
    const nBands = RING_BANDS.length;
    const smoothK = 0.08 + 0.14 * params.motionAmount;
    for (let b = 0; b < nBands; b++) {
      let rawVal = 0;
      if (freq) {
        const lo = RING_BANDS[b].lo;
        const hi = RING_BANDS[b].hi === -1 ? Math.min(freq.length - 1, 200) : RING_BANDS[b].hi;
        const end = Math.min(hi + 1, freq.length);
        let sum = 0;
        for (let i = lo; i < end; i++) sum += freq[i];
        rawVal = end > lo ? sum / ((end - lo) * 255) : 0;
      }
      ringValues[b] += (rawVal - ringValues[b]) * smoothK;
    }
    if (BeatDetector.isBeat()) {
      ringRipples.push({ r: innerR, startTime: performance.now() });
    }
    const [ar, ag2, ab] = hexToRgb(THEME.accent);
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${ar},${ag2},${ab},0.03)`;
    ctx.fill();
    ctx.globalAlpha = 0.12 * vizFillAlpha;
    for (let b = 0; b < nBands; b++) {
      const r = innerR + (outerR - innerR) * (b / (nBands - 1));
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgb(${ar},${ag2},${ab})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (let b = 0; b < nBands; b++) {
      const v = ringValues[b];
      const r = innerR + (outerR - innerR) * (b / (nBands - 1));
      const cv = Math.min(255, Math.floor(v * 255));
      const lw = 2 + v * 14;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${heatR[cv]},${heatG[cv]},${heatB[cv]},${vizFillAlpha})`;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
    const RIPPLE_DURATION = 600;
    const now = performance.now();
    for (let i = ringRipples.length - 1; i >= 0; i--) {
      const rip = ringRipples[i];
      const elapsed = now - rip.startTime;
      if (elapsed > RIPPLE_DURATION) {
        ringRipples.splice(i, 1);
        continue;
      }
      const progress = elapsed / RIPPLE_DURATION;
      const rr = innerR + (outerR - innerR) * progress;
      const alpha = (1 - progress) * 0.6 * vizFillAlpha;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${ar},${ag2},${ab},${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // js/renderers/scope.js
  var SCOPE_TRAIL_FRAMES = 8;
  var scopeTrail = [];
  function renderScope(ctx, time, W, H, vizFillAlpha = 1) {
    if (!time) return;
    const half = Math.floor(time.length / 2);
    const n = half;
    const xs = new Float32Array(n);
    const ys = new Float32Array(n);
    if (params.scopeMonoDelay) {
      const delay = 64;
      for (let i = 0; i < n; i++) {
        xs[i] = W / 2 + (time[i] - 128) / 128 * W * 0.42;
        const j = Math.min(i + delay, time.length - 1);
        ys[i] = H / 2 + (time[j] - 128) / 128 * H * 0.42;
      }
    } else {
      for (let i = 0; i < n; i++) {
        xs[i] = W / 2 + (time[i] - 128) / 128 * W * 0.42;
        ys[i] = H / 2 + (time[i + half] - 128) / 128 * H * 0.42;
      }
    }
    scopeTrail.push({ xs, ys });
    if (scopeTrail.length > SCOPE_TRAIL_FRAMES) scopeTrail.shift();
    const [ar, ag2, ab] = hexToRgb(THEME.accent);
    ctx.save();
    ctx.globalAlpha = 0.15 * vizFillAlpha;
    ctx.strokeStyle = `rgb(${ar},${ag2},${ab})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();
    ctx.restore();
    const total = scopeTrail.length;
    for (let f = 0; f < total; f++) {
      const frame = scopeTrail[f];
      const t = (f + 1) / total;
      const alpha = (0.05 + 0.95 * t) * vizFillAlpha;
      const lw = f === total - 1 ? 1.5 : 0.5;
      ctx.beginPath();
      ctx.moveTo(frame.xs[0], frame.ys[0]);
      for (let i = 1; i < frame.xs.length; i++) {
        ctx.lineTo(frame.xs[i], frame.ys[i]);
      }
      ctx.strokeStyle = `rgba(${ar},${ag2},${ab},${alpha})`;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
  }

  // js/renderers/terrain.js
  var TERRAIN_ROWS = 48;
  var terrainBuf = null;
  var terrainBufCount = 0;
  var terrainHead = 0;
  function ensureTerrainBuffer(barCount) {
    if (terrainBuf && terrainBufCount === barCount) return;
    terrainBuf = new Float32Array(TERRAIN_ROWS * barCount);
    terrainBufCount = barCount;
    terrainHead = 0;
  }
  function renderTerrain(ctx, freq, W, H, vizFillAlpha = 1) {
    const barCount = params.barCount;
    ensureTerrainBuffer(barCount);
    const steps = Math.max(1, Math.round(params.terrainSpeed));
    for (let s = 0; s < steps; s++) {
      const rowOff = terrainHead * barCount;
      if (freq) {
        const binCount = freq.length;
        for (let i = 0; i < barCount; i++) {
          const lo = Math.floor(i * binCount / barCount);
          const hi = Math.floor((i + 1) * binCount / barCount);
          let sum = 0;
          for (let b = lo; b < hi; b++) sum += freq[b];
          terrainBuf[rowOff + i] = hi > lo ? sum / ((hi - lo) * 255) : freq[lo] / 255;
        }
      } else {
        terrainBuf.fill(0, rowOff, rowOff + barCount);
      }
      terrainHead = (terrainHead + 1) % TERRAIN_ROWS;
    }
    const vpY = H * 0.38;
    const nearY = H * 0.92;
    ctx.save();
    ctx.globalAlpha = 0.08 * vizFillAlpha;
    ctx.strokeStyle = `rgb(${heatR[180]},${heatG[180]},${heatB[180]})`;
    ctx.lineWidth = 0.5;
    const nearScale = 1;
    const farT = (TERRAIN_ROWS - 1) / (TERRAIN_ROWS - 1);
    const farScale = 1 - (TERRAIN_ROWS - 1) / TERRAIN_ROWS * 0.92;
    const farY = vpY + (nearY - vpY) * farT;
    for (let i = 0; i <= barCount; i++) {
      const nx = i / barCount * W * nearScale + (W - W * nearScale) / 2;
      const fx = i / barCount * W * farScale + (W - W * farScale) / 2;
      ctx.beginPath();
      ctx.moveTo(nx, nearY);
      ctx.lineTo(fx, farY);
      ctx.stroke();
    }
    ctx.restore();
    for (let r = TERRAIN_ROWS - 1; r >= 0; r--) {
      const t = r / (TERRAIN_ROWS - 1);
      const scale = 1 - r / TERRAIN_ROWS * 0.92;
      const rowY = nearY + (vpY - nearY) * t;
      const rowW = W * scale;
      const rowX0 = (W - rowW) / 2;
      const barW = rowW / barCount;
      const alpha = Math.pow(scale, 1.5) * vizFillAlpha;
      const bufRow = (terrainHead - 1 - r + TERRAIN_ROWS * 4) % TERRAIN_ROWS;
      const rowOff = bufRow * barCount;
      let maxVal = 0;
      for (let i = 0; i < barCount; i++) {
        if (terrainBuf[rowOff + i] > maxVal) maxVal = terrainBuf[rowOff + i];
      }
      const heatIdx = Math.min(255, Math.floor(maxVal * 255));
      ctx.beginPath();
      ctx.moveTo(rowX0, rowY);
      const firstH = terrainBuf[rowOff] * H * 0.3 * scale;
      ctx.lineTo(rowX0, rowY - firstH);
      for (let i = 0; i < barCount; i++) {
        const bh = terrainBuf[rowOff + i] * H * 0.3 * scale;
        const x = rowX0 + (i + 0.5) * barW;
        ctx.lineTo(x, rowY - bh);
      }
      const lastH = terrainBuf[rowOff + barCount - 1] * H * 0.3 * scale;
      ctx.lineTo(rowX0 + rowW, rowY - lastH);
      ctx.lineTo(rowX0 + rowW, rowY);
      ctx.closePath();
      ctx.fillStyle = `rgba(${heatR[heatIdx]},${heatG[heatIdx]},${heatB[heatIdx]},${alpha})`;
      ctx.fill();
    }
  }

  // js/renderers/index.js
  function renderMode(ctx, mode, freq, time, W, H, vizFillAlpha, bgState2, radialImageState2) {
    switch (mode) {
      case "bars":
        renderBars(ctx, freq, W, H, vizFillAlpha);
        break;
      case "waveform":
        renderWaveform(ctx, time, W, H, vizFillAlpha);
        break;
      case "spectrogram":
        renderSpectrogram(ctx, freq, W, H, vizFillAlpha);
        break;
      case "radial":
        renderRadial(ctx, freq, W, H, vizFillAlpha, bgState2, radialImageState2);
        break;
      case "particles":
        renderParticles(ctx, time, W, H, vizFillAlpha);
        break;
      case "rings":
        renderRings(ctx, freq, W, H, vizFillAlpha);
        break;
      case "scope":
        renderScope(ctx, time, W, H, vizFillAlpha);
        break;
      case "terrain":
        renderTerrain(ctx, freq, W, H, vizFillAlpha);
        break;
    }
  }

  // js/ui/toast.js
  var toastContainer = document.getElementById("toast-container");
  function showToast(message, type = "info", duration = 4e3) {
    const el = document.createElement("div");
    el.className = "toast" + (type !== "info" ? " " + type : "");
    el.textContent = message;
    toastContainer.appendChild(el);
    setTimeout(() => {
      el.classList.add("removing");
      el.addEventListener("animationend", () => el.remove(), { once: true });
    }, duration);
  }

  // js/ui/presets.js
  var BUILT_IN_PRESETS = [
    { version: 1, name: "Classic Bars", mode: "bars", fftSize: 8192, smoothing: 0.8, gain: 1, motionAmount: 0.5, mirror: false, fill: true, barCount: 128, theme: 0, themeName: "Midnight" },
    { version: 1, name: "Deep Waveform", mode: "waveform", fftSize: 4096, smoothing: 0.85, gain: 1, motionAmount: 0.5, mirror: false, fill: true, barCount: 128, theme: 3, themeName: "Neon" },
    { version: 1, name: "Heat Map", mode: "spectrogram", fftSize: 16384, smoothing: 0.8, gain: 1, motionAmount: 0.5, mirror: false, fill: true, barCount: 128, theme: 1, themeName: "Ember" },
    { version: 1, name: "Mirror Dance", mode: "bars", fftSize: 8192, smoothing: 0.8, gain: 1, motionAmount: 0.8, mirror: true, fill: true, barCount: 64, theme: 5, themeName: "Sunrise" },
    { version: 1, name: "Forensic", mode: "spectrogram", fftSize: 32768, smoothing: 0.5, gain: 1, motionAmount: 0.5, mirror: false, fill: true, barCount: 128, theme: 4, themeName: "Monochrome" },
    { version: 1, name: "Minimal Wave", mode: "waveform", fftSize: 8192, smoothing: 0.8, gain: 1, motionAmount: 0.3, mirror: false, fill: false, barCount: 128, theme: 4, themeName: "Monochrome" },
    { version: 1, name: "Forest Pulse", mode: "bars", fftSize: 8192, smoothing: 0.8, gain: 1, motionAmount: 0.5, mirror: true, fill: true, barCount: 128, theme: 2, themeName: "Forest" },
    { version: 1, name: "Neon Storm", mode: "bars", fftSize: 8192, smoothing: 0.65, gain: 1, motionAmount: 1, mirror: false, fill: true, barCount: 256, theme: 3, themeName: "Neon" },
    { version: 1, name: "Radial Pulse", mode: "radial", fftSize: 8192, smoothing: 0.8, gain: 1, motionAmount: 0.5, mirror: false, fill: true, barCount: 128, theme: 0, themeName: "Midnight" },
    { version: 1, name: "Radial Mirror", mode: "radial", fftSize: 8192, smoothing: 0.8, gain: 1, motionAmount: 0.6, mirror: true, fill: true, barCount: 128, theme: 3, themeName: "Neon" }
  ];
  function encodePreset(p) {
    try {
      const json = JSON.stringify(p);
      const b64 = btoa(unescape(encodeURIComponent(json)));
      return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    } catch (_) {
      return "";
    }
  }
  function decodePreset(s) {
    try {
      const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
      const pad = b64 + "==".slice(0, (4 - b64.length % 4) % 4);
      const json = decodeURIComponent(escape(atob(pad)));
      const obj = JSON.parse(json);
      if (obj && obj.version === 1) return obj;
    } catch (_) {
    }
    return null;
  }
  var activePresetName = null;
  function clearActivePresetName() {
    activePresetName = null;
  }
  var LS_KEY = "audio-viz-presets-v1";
  function loadSavedPresets() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }
  function persistSavedPresets(list) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(list));
    } catch (_) {
    }
  }
  var _applyThemeCb = null;
  var _switchModeCb = null;
  var _syncControlsCb = null;
  var _markModifiedCb = null;
  function initPresets({ applyTheme: applyTheme2, switchMode: switchMode2, syncControlsToParams: syncControlsToParams2, markModified }) {
    _applyThemeCb = applyTheme2;
    _switchModeCb = switchMode2;
    _syncControlsCb = syncControlsToParams2;
    _markModifiedCb = markModified;
  }
  function refreshPresetGrid() {
    const grid = document.getElementById("preset-grid");
    if (!grid) return;
    grid.innerHTML = "";
    const saved = loadSavedPresets();
    const all = [
      ...BUILT_IN_PRESETS.map((p) => ({ ...p, _saved: false })),
      ...saved.map((p) => ({ ...p, _saved: true }))
    ];
    all.forEach((preset) => {
      const themeColor = (THEMES[preset.theme] || THEMES[0]).highlightColor;
      const isActive = preset.name === activePresetName;
      const card = document.createElement("div");
      card.className = "preset-card" + (isActive ? " active" : "");
      card.innerHTML = `<span class="preset-dot" style="background:${themeColor}"></span><span class="preset-name">${preset.name}</span>` + (preset._saved ? `<button class="preset-delete" title="Delete">&#x2715;</button>` : "");
      card.addEventListener("click", (e) => {
        if (e.target.closest(".preset-delete")) return;
        applyPreset(preset);
      });
      if (preset._saved) {
        card.querySelector(".preset-delete").addEventListener("click", (e) => {
          e.stopPropagation();
          const updated = loadSavedPresets().filter((p) => p.name !== preset.name);
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
  function applyPreset(preset, writeToHash = true) {
    AudioEngine.setFftSize(preset.fftSize);
    AudioEngine.setSmoothing(preset.smoothing);
    AudioEngine.setGain(preset.gain);
    params.motionAmount = preset.motionAmount;
    params.trailAlpha = preset.trailAlpha ?? 0;
    params.mirror = preset.mirror;
    params.fill = preset.fill;
    params.barCount = preset.barCount;
    barHeights.fill(0);
    params.overlayEnabled = preset.overlayEnabled ?? false;
    params.overlayText = preset.overlayText ?? "";
    params.overlayFontSize = preset.overlayFontSize ?? 48;
    params.overlayFontFamily = preset.overlayFontFamily ?? "sans-serif";
    params.overlayColor = preset.overlayColor ?? "#ffffff";
    params.overlayOpacity = preset.overlayOpacity ?? 1;
    params.overlayStyle = preset.overlayStyle ?? "scroll";
    params.overlaySubtext = preset.overlaySubtext ?? "";
    params.overlayDuration = preset.overlayDuration ?? 0;
    resetOverlayTimer();
    if (params.overlayEnabled && params.overlayStyle === "lower-third") triggerLowerThird();
    params.bgOpacity = preset.bgOpacity ?? 1;
    params.bgBlend = preset.bgBlend ?? "normal";
    params.bgFit = preset.bgFit ?? "cover";
    params.bgGradient = preset.bgGradient ?? false;
    params.radialImgOpacity = preset.radialImgOpacity ?? 1;
    params.radialShape = preset.radialShape ?? "circle";
    params.bloomIntensity = preset.bloomIntensity ?? 0;
    params.particleDensity = preset.particleDensity ?? 200;
    params.terrainSpeed = preset.terrainSpeed ?? 1;
    params.progressBar = preset.progressBar ?? false;
    params.showTimer = preset.showTimer ?? false;
    params.artistCardEnabled = preset.artistCard?.enabled ?? false;
    params.artistCardName = preset.artistCard?.artistName ?? "";
    params.artistCardTitle = preset.artistCard?.trackTitle ?? "";
    params.artistCardOpacity = preset.artistCard?.opacity ?? 1;
    if (preset.name) {
      const storedImg = localStorage.getItem(`audio-viz-bg-${preset.name}`);
      if (storedImg) {
        loadBackgroundFromDataUrl(storedImg);
      } else {
        clearBackground();
        params.bgOpacity = preset.bgOpacity ?? 1;
        params.bgBlend = preset.bgBlend ?? "normal";
        params.bgFit = preset.bgFit ?? "cover";
      }
      const storedRadialImg = localStorage.getItem(`audio-viz-radial-img-${preset.name}`);
      if (storedRadialImg) {
        loadRadialImageFromDataUrl(storedRadialImg);
      } else {
        clearRadialImage();
        params.radialImgOpacity = preset.radialImgOpacity ?? 1;
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
      if (encoded) history.replaceState(null, "", "#" + encoded);
    }
    refreshPresetGrid();
  }
  function initSavePresetButton(getCurrentMode2) {
    document.getElementById("btn-save-preset").addEventListener("click", () => {
      const raw = prompt("Preset name:");
      if (!raw || !raw.trim()) return;
      const name = raw.trim();
      const preset = {
        version: 1,
        name,
        mode: getCurrentMode2(),
        fftSize: params.fftSize,
        smoothing: params.smoothing,
        gain: params.gain,
        motionAmount: params.motionAmount,
        trailAlpha: params.trailAlpha,
        mirror: params.mirror,
        fill: params.fill,
        barCount: params.barCount,
        theme: params.theme,
        themeName: params.themeName,
        overlayEnabled: params.overlayEnabled,
        overlayText: params.overlayText,
        overlayFontSize: params.overlayFontSize,
        overlayFontFamily: params.overlayFontFamily,
        overlayColor: params.overlayColor,
        overlayOpacity: params.overlayOpacity,
        overlayStyle: params.overlayStyle,
        overlaySubtext: params.overlaySubtext,
        overlayDuration: params.overlayDuration,
        bgOpacity: params.bgOpacity,
        bgBlend: params.bgBlend,
        bgFit: params.bgFit,
        bgGradient: params.bgGradient,
        radialImgOpacity: params.radialImgOpacity,
        bloomIntensity: params.bloomIntensity,
        particleDensity: params.particleDensity,
        terrainSpeed: params.terrainSpeed,
        progressBar: params.progressBar,
        showTimer: params.showTimer,
        /* image cannot be serialized — only text/opacity fields are saved */
        artistCard: {
          enabled: params.artistCardEnabled,
          artistName: params.artistCardName,
          trackTitle: params.artistCardTitle,
          opacity: params.artistCardOpacity
        }
      };
      const updated = loadSavedPresets().filter((p) => p.name !== name);
      updated.push(preset);
      persistSavedPresets(updated);
      const bgImgKey = `audio-viz-bg-${name}`;
      if (bgState.image) {
        if (confirm("Include background image in this preset?\n(Stored locally only \u2014 not in shared links)")) {
          try {
            localStorage.setItem(bgImgKey, imageToDataUrl(bgState.image));
          } catch (_) {
            showToast("Could not save image \u2014 local storage may be full", "warn");
            localStorage.removeItem(bgImgKey);
          }
        } else {
          localStorage.removeItem(bgImgKey);
        }
      } else {
        localStorage.removeItem(bgImgKey);
      }
      const radialImgKey = `audio-viz-radial-img-${name}`;
      if (radialImageState.image) {
        if (confirm("Include radial center image in this preset?\n(Stored locally only \u2014 not in shared links)")) {
          try {
            localStorage.setItem(radialImgKey, imageToDataUrl(radialImageState.image));
          } catch (_) {
            showToast("Could not save radial image \u2014 local storage may be full", "warn");
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
      if (encoded) history.replaceState(null, "", "#" + encoded);
      refreshPresetGrid();
    });
  }

  // js/ui/controls.js
  var modeTransition = null;
  function clearModeTransition() {
    modeTransition = null;
  }
  var _getCurrentMode = null;
  var _setCurrentMode = null;
  var _getLogicalW = null;
  var _getLogicalH = null;
  var _getCanvasWrap = null;
  var _applyThemeFn = null;
  var _markModifiedFn = null;
  var _toggleRecordFn = null;
  var _cycleModeFn = null;
  function initControls({
    getCurrentMode: getCurrentMode2,
    setCurrentMode: setCurrentMode2,
    getLogicalW: getLogicalW2,
    getLogicalH: getLogicalH2,
    getCanvasWrap,
    applyTheme: applyTheme2,
    markModified,
    toggleRecording: toggleRecording2,
    cycleMode: cycleMode2
  }) {
    _getCurrentMode = getCurrentMode2;
    _setCurrentMode = setCurrentMode2;
    _getLogicalW = getLogicalW2;
    _getLogicalH = getLogicalH2;
    _getCanvasWrap = getCanvasWrap;
    _applyThemeFn = applyTheme2;
    _markModifiedFn = markModified;
    _toggleRecordFn = toggleRecording2;
    _cycleModeFn = cycleMode2;
  }
  function switchModeAnimated(mode) {
    if (mode === _getCurrentMode()) return;
    modeTransition = { target: mode, startTime: performance.now() };
  }
  function switchMode(mode, g2, spectroCtx22, spectroSW2, spectroSH2) {
    _setCurrentMode(mode);
    params.mode = mode;
    const logicalW2 = _getLogicalW();
    const logicalH2 = _getLogicalH();
    g2.fillStyle = THEME.bgColor;
    g2.fillRect(0, 0, logicalW2, logicalH2);
    if (mode === "spectrogram") {
      clearSpectrogramCanvas();
    }
    document.getElementById("btn-mode-bars").classList.toggle("active", mode === "bars");
    document.getElementById("btn-mode-waveform").classList.toggle("active", mode === "waveform");
    document.getElementById("btn-mode-spectrogram").classList.toggle("active", mode === "spectrogram");
    document.getElementById("btn-mode-radial").classList.toggle("active", mode === "radial");
    document.getElementById("btn-mode-particles").classList.toggle("active", mode === "particles");
    document.getElementById("btn-mode-rings").classList.toggle("active", mode === "rings");
    document.getElementById("btn-mode-scope").classList.toggle("active", mode === "scope");
    document.getElementById("btn-mode-terrain").classList.toggle("active", mode === "terrain");
    document.getElementById("row-density").style.display = mode === "particles" ? "" : "none";
    document.getElementById("row-scope-mode").style.display = mode === "scope" ? "" : "none";
    document.getElementById("row-terrain-speed").style.display = mode === "terrain" ? "" : "none";
    if (mode !== "scope") scopeTrail.length = 0;
  }
  function syncControlsToParams(currentMode2) {
    document.getElementById("ctrl-fft-size").value = params.fftSize;
    document.getElementById("ctrl-smoothing").value = params.smoothing;
    document.getElementById("val-smoothing").textContent = params.smoothing.toFixed(2);
    document.getElementById("ctrl-gain").value = params.gain;
    document.getElementById("val-gain").textContent = params.gain.toFixed(1);
    document.getElementById("ctrl-motion").value = params.motionAmount;
    document.getElementById("val-motion").textContent = params.motionAmount.toFixed(2);
    document.getElementById("ctrl-trail").value = params.trailAlpha;
    document.getElementById("val-trail").textContent = params.trailAlpha.toFixed(2);
    document.getElementById("ctrl-mirror").classList.toggle("active", params.mirror);
    document.getElementById("ctrl-fill").classList.toggle("active", params.fill);
    document.getElementById("ctrl-barcount").value = params.barCount;
    document.getElementById("val-barcount").textContent = params.barCount;
    document.getElementById("ctrl-overlay-enabled").classList.toggle("active", params.overlayEnabled);
    document.getElementById("ctrl-overlay-text").value = params.overlayText;
    document.getElementById("ctrl-overlay-fontsize").value = params.overlayFontSize;
    document.getElementById("val-overlay-fontsize").textContent = params.overlayFontSize + "px";
    document.getElementById("ctrl-overlay-fontfamily").value = params.overlayFontFamily;
    document.getElementById("ctrl-overlay-color").value = params.overlayColor;
    document.getElementById("ctrl-overlay-opacity").value = params.overlayOpacity;
    document.getElementById("val-overlay-opacity").textContent = params.overlayOpacity.toFixed(1);
    document.querySelectorAll(".style-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.style === params.overlayStyle);
    });
    document.getElementById("ctrl-overlay-subtext").value = params.overlaySubtext;
    document.getElementById("ctrl-overlay-duration").value = params.overlayDuration;
    document.getElementById("val-overlay-duration").textContent = params.overlayDuration === 0 ? "Always" : params.overlayDuration + "s";
    document.getElementById("lower-third-controls").style.display = params.overlayStyle === "lower-third" ? "" : "none";
    document.getElementById("ctrl-bg-opacity").value = params.bgOpacity;
    document.getElementById("val-bg-opacity").textContent = params.bgOpacity.toFixed(1);
    document.getElementById("ctrl-bg-blend").value = params.bgBlend;
    updateFitButtons(params.bgFit);
    document.getElementById("ctrl-radial-img-opacity").value = params.radialImgOpacity;
    document.getElementById("val-radial-img-opacity").textContent = params.radialImgOpacity.toFixed(1);
    document.querySelectorAll("#shape-btn-grid .fit-btn[data-shape]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.shape === params.radialShape);
    });
    document.getElementById("ctrl-bloom").value = params.bloomIntensity;
    document.getElementById("val-bloom").textContent = params.bloomIntensity === 0 ? "Off" : params.bloomIntensity;
    document.getElementById("ctrl-progress-bar").classList.toggle("active", params.progressBar);
    document.getElementById("ctrl-show-timer").classList.toggle("active", params.showTimer);
    document.getElementById("ctrl-density").value = params.particleDensity;
    document.getElementById("val-density").textContent = params.particleDensity;
    document.getElementById("row-density").style.display = currentMode2 === "particles" ? "" : "none";
    document.getElementById("ctrl-scope-mono-delay").classList.toggle("active", params.scopeMonoDelay);
    document.getElementById("row-scope-mode").style.display = currentMode2 === "scope" ? "" : "none";
    document.getElementById("ctrl-terrain-speed").value = params.terrainSpeed;
    document.getElementById("val-terrain-speed").textContent = params.terrainSpeed;
    document.getElementById("row-terrain-speed").style.display = currentMode2 === "terrain" ? "" : "none";
    document.getElementById("ctrl-artist-card-enabled").classList.toggle("active", params.artistCardEnabled);
    document.getElementById("ctrl-artist-name").value = params.artistCardName;
    document.getElementById("ctrl-track-title").value = params.artistCardTitle;
    document.getElementById("ctrl-artist-card-opacity").value = params.artistCardOpacity;
    document.getElementById("val-artist-card-opacity").textContent = params.artistCardOpacity.toFixed(1);
    document.getElementById("ctrl-artist-card-timer-enabled").classList.toggle("active", params.artistCardTimerEnabled);
    document.getElementById("ctrl-artist-card-timer-duration").value = params.artistCardTimerDuration;
    document.getElementById("val-artist-card-timer-duration").textContent = params.artistCardTimerDuration + "s";
    document.getElementById("row-artist-card-timer-duration").style.display = params.artistCardTimerEnabled ? "" : "none";
  }
  function applyTheme(index, canvasWrap2, barsGradHRef, vignetteWRef, vignettHRef) {
    params.theme = index;
    params.themeName = THEMES[index].name;
    const t = THEMES[index];
    THEME.bgColor = t.bgColor;
    THEME.accent = t.accentColor;
    THEME.highlight = t.highlightColor;
    THEME.mid = t.midColor;
    THEME.waveRGB = hexToRgb(t.highlightColor);
    const { setGradHueBase: setGradHueBase2 } = _themeModule;
    if (setGradHueBase2) setGradHueBase2(hexToHsl(t.accentColor)[0]);
    document.documentElement.style.setProperty("--accent-color", t.highlightColor);
    invalidateBarsGrad();
    canvasWrap2.style.background = t.bgColor;
    buildHeat(t.bgColor, t.accentColor, t.midColor, t.highlightColor);
    clearSpectrogramCanvas();
    document.querySelectorAll(".swatch").forEach((sw, i) => {
      sw.classList.toggle("active", i === index);
    });
  }
  var _themeModule = {};
  function setThemeModule(mod) {
    _themeModule = mod;
  }
  function initModeButtons(switchModeAnimatedFn, markModifiedFn) {
    document.getElementById("btn-mode-bars").addEventListener("click", () => {
      switchModeAnimatedFn("bars");
      markModifiedFn();
    });
    document.getElementById("btn-mode-waveform").addEventListener("click", () => {
      switchModeAnimatedFn("waveform");
      markModifiedFn();
    });
    document.getElementById("btn-mode-spectrogram").addEventListener("click", () => {
      switchModeAnimatedFn("spectrogram");
      markModifiedFn();
    });
    document.getElementById("btn-mode-radial").addEventListener("click", () => {
      switchModeAnimatedFn("radial");
      markModifiedFn();
    });
    document.getElementById("btn-mode-particles").addEventListener("click", () => {
      switchModeAnimatedFn("particles");
      markModifiedFn();
    });
    document.getElementById("btn-mode-rings").addEventListener("click", () => {
      switchModeAnimatedFn("rings");
      markModifiedFn();
    });
    document.getElementById("btn-mode-scope").addEventListener("click", () => {
      switchModeAnimatedFn("scope");
      markModifiedFn();
    });
    document.getElementById("btn-mode-terrain").addEventListener("click", () => {
      switchModeAnimatedFn("terrain");
      markModifiedFn();
    });
  }
  function initAnalyzerControls(markModifiedFn) {
    document.getElementById("ctrl-fft-size").addEventListener("change", (e) => {
      const size = parseInt(e.target.value, 10);
      AudioEngine.setFftSize(size);
      barHeights.fill(0);
      markModifiedFn();
    });
    document.getElementById("ctrl-smoothing").addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      document.getElementById("val-smoothing").textContent = val.toFixed(2);
      AudioEngine.setSmoothing(val);
      markModifiedFn();
    });
    document.getElementById("ctrl-gain").addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      document.getElementById("val-gain").textContent = val.toFixed(1);
      AudioEngine.setGain(val);
      markModifiedFn();
    });
  }
  function initVisualControls(markModifiedFn) {
    document.getElementById("ctrl-motion").addEventListener("input", (e) => {
      params.motionAmount = parseFloat(e.target.value);
      document.getElementById("val-motion").textContent = params.motionAmount.toFixed(2);
      markModifiedFn();
    });
    document.getElementById("ctrl-trail").addEventListener("input", (e) => {
      params.trailAlpha = parseFloat(e.target.value);
      document.getElementById("val-trail").textContent = params.trailAlpha.toFixed(2);
      markModifiedFn();
    });
    document.getElementById("ctrl-mirror").addEventListener("click", (e) => {
      params.mirror = !params.mirror;
      e.currentTarget.classList.toggle("active", params.mirror);
      if (!params.mirror) barHeights.fill(0);
      markModifiedFn();
    });
    document.getElementById("ctrl-fill").addEventListener("click", (e) => {
      params.fill = !params.fill;
      e.currentTarget.classList.toggle("active", params.fill);
      markModifiedFn();
    });
    document.getElementById("ctrl-barcount").addEventListener("input", (e) => {
      params.barCount = parseInt(e.target.value, 10);
      document.getElementById("val-barcount").textContent = params.barCount;
      barHeights.fill(0);
      invalidateBarsGrad();
      markModifiedFn();
    });
    document.getElementById("ctrl-bloom").addEventListener("input", (e) => {
      params.bloomIntensity = parseInt(e.target.value, 10);
      document.getElementById("val-bloom").textContent = params.bloomIntensity === 0 ? "Off" : params.bloomIntensity;
      markModifiedFn();
    });
    document.getElementById("ctrl-density").addEventListener("input", (e) => {
      params.particleDensity = parseInt(e.target.value, 10);
      document.getElementById("val-density").textContent = params.particleDensity;
      markModifiedFn();
    });
    document.getElementById("ctrl-scope-mono-delay").addEventListener("click", (e) => {
      params.scopeMonoDelay = !params.scopeMonoDelay;
      e.currentTarget.classList.toggle("active", params.scopeMonoDelay);
      scopeTrail.length = 0;
      markModifiedFn();
    });
    document.getElementById("ctrl-terrain-speed").addEventListener("input", (e) => {
      params.terrainSpeed = parseInt(e.target.value, 10);
      document.getElementById("val-terrain-speed").textContent = params.terrainSpeed;
      markModifiedFn();
    });
    document.getElementById("ctrl-progress-bar").addEventListener("click", (e) => {
      params.progressBar = !params.progressBar;
      e.currentTarget.classList.toggle("active", params.progressBar);
      markModifiedFn();
    });
    document.getElementById("ctrl-show-timer").addEventListener("click", (e) => {
      params.showTimer = !params.showTimer;
      e.currentTarget.classList.toggle("active", params.showTimer);
      markModifiedFn();
    });
  }
  function initBeatControls(markModifiedFn, getBeatFlashStart, setBeatFlashStart) {
    document.getElementById("ctrl-beat-enabled").addEventListener("click", (e) => {
      const on = !BeatDetector.isEnabled();
      BeatDetector.setEnabled(on);
      e.currentTarget.classList.toggle("active", on);
      if (!on) setBeatFlashStart(-Infinity);
    });
    document.getElementById("ctrl-beat-sensitivity").addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      document.getElementById("val-beat-sensitivity").textContent = val.toFixed(2);
      BeatDetector.setMultiplier(val);
    });
  }
  function initTextOverlayControls(markModifiedFn) {
    const OVERLAY_STYLE_DEFS = [
      {
        id: "scroll",
        label: "Scroll",
        icon: `<svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="1" y1="6" x2="13" y2="6"/>
        <polyline points="10,3 13,6 10,9"/>
        <line x1="1" y1="2" x2="8" y2="2" opacity="0.4"/>
        <line x1="1" y1="10" x2="8" y2="10" opacity="0.4"/>
      </svg>`
      },
      {
        id: "fade",
        label: "Fade",
        icon: `<svg width="18" height="12" viewBox="0 0 18 12">
        <circle cx="6" cy="6" r="4.5" fill="currentColor" opacity="0.9"/>
        <circle cx="13.5" cy="6" r="3.5" fill="currentColor" opacity="0.3"/>
      </svg>`
      },
      {
        id: "typewriter",
        label: "Type",
        icon: `<svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <rect x="2" y="2" width="10" height="8" rx="1.5" opacity="0.5"/>
        <line x1="15" y1="2" x2="15" y2="10"/>
      </svg>`
      },
      {
        id: "glitch",
        label: "Glitch",
        icon: `<svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <line x1="1" y1="4" x2="11" y2="4"/>
        <line x1="4" y1="6" x2="15" y2="6"/>
        <line x1="1" y1="8" x2="10" y2="8"/>
        <line x1="12" y1="3" x2="17" y2="3" opacity="0.5" stroke="#ff4466"/>
      </svg>`
      },
      {
        id: "wave",
        label: "Wave",
        icon: `<svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1,6 C3,2 5,2 7,6 C9,10 11,10 13,6 C15,2 17,2 17,6"/>
      </svg>`
      },
      {
        id: "spotlight",
        label: "Spot",
        icon: `<svg width="18" height="12" viewBox="0 0 18 12">
        <circle cx="9" cy="6" r="5.5" fill="currentColor" opacity="0.12"/>
        <circle cx="9" cy="6" r="3.5" fill="currentColor" opacity="0.4"/>
        <circle cx="9" cy="6" r="1.5" fill="currentColor" opacity="0.95"/>
      </svg>`
      },
      {
        id: "lower-third",
        label: "Lower 3rd",
        icon: `<svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="6.5" width="16" height="4.5" rx="0.75" opacity="0.55" fill="currentColor" stroke="none"/>
        <line x1="1" y1="6.5" x2="1" y2="11" stroke-width="2.5"/>
        <line x1="3.5" y1="8" x2="11" y2="8" opacity="0.9"/>
        <line x1="3.5" y1="10" x2="8.5" y2="10" opacity="0.55"/>
      </svg>`
      }
    ];
    const grid = document.getElementById("overlay-style-grid");
    OVERLAY_STYLE_DEFS.forEach((def) => {
      const btn = document.createElement("button");
      btn.className = "style-btn" + (def.id === params.overlayStyle ? " active" : "");
      btn.dataset.style = def.id;
      btn.innerHTML = def.icon + `<span>${def.label}</span>`;
      btn.addEventListener("click", () => {
        params.overlayStyle = def.id;
        resetOverlayTimer();
        document.querySelectorAll(".style-btn").forEach((b) => b.classList.toggle("active", b.dataset.style === def.id));
        document.getElementById("lower-third-controls").style.display = def.id === "lower-third" ? "" : "none";
        if (def.id === "lower-third" && params.overlayEnabled) triggerLowerThird();
        markModifiedFn();
      });
      grid.appendChild(btn);
    });
    document.getElementById("ctrl-overlay-enabled").addEventListener("click", (e) => {
      params.overlayEnabled = !params.overlayEnabled;
      e.currentTarget.classList.toggle("active", params.overlayEnabled);
      if (params.overlayEnabled && params.overlayStyle === "lower-third") triggerLowerThird();
      markModifiedFn();
    });
    document.getElementById("ctrl-overlay-text").addEventListener("input", (e) => {
      params.overlayText = e.target.value;
      resetOverlayTimer();
      markModifiedFn();
    });
    document.getElementById("ctrl-overlay-fontsize").addEventListener("input", (e) => {
      params.overlayFontSize = parseInt(e.target.value, 10);
      document.getElementById("val-overlay-fontsize").textContent = params.overlayFontSize + "px";
      markModifiedFn();
    });
    document.getElementById("ctrl-overlay-fontfamily").addEventListener("change", (e) => {
      params.overlayFontFamily = e.target.value;
      markModifiedFn();
    });
    document.getElementById("ctrl-overlay-color").addEventListener("input", (e) => {
      params.overlayColor = e.target.value;
      markModifiedFn();
    });
    document.getElementById("ctrl-overlay-opacity").addEventListener("input", (e) => {
      params.overlayOpacity = parseFloat(e.target.value);
      document.getElementById("val-overlay-opacity").textContent = params.overlayOpacity.toFixed(1);
      markModifiedFn();
    });
    document.getElementById("ctrl-overlay-subtext").addEventListener("input", (e) => {
      params.overlaySubtext = e.target.value;
      markModifiedFn();
    });
    document.getElementById("ctrl-overlay-duration").addEventListener("input", (e) => {
      params.overlayDuration = parseInt(e.target.value, 10);
      document.getElementById("val-overlay-duration").textContent = params.overlayDuration === 0 ? "Always" : params.overlayDuration + "s";
      markModifiedFn();
    });
    document.getElementById("btn-show-lower-third").addEventListener("click", () => {
      triggerLowerThird();
    });
  }
  function initBackgroundControls(markModifiedFn) {
    const FIT_DEFS = [
      {
        id: "cover",
        label: "Cover",
        icon: `<svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="1" width="16" height="12" rx="1.5"/>
        <rect x="3" y="3" width="12" height="8" rx="1" opacity="0.5" fill="currentColor" stroke="none"/>
      </svg>`
      },
      {
        id: "contain",
        label: "Contain",
        icon: `<svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="1" width="16" height="12" rx="1.5"/>
        <rect x="5" y="3" width="8" height="8" rx="1" opacity="0.5" fill="currentColor" stroke="none"/>
      </svg>`
      },
      {
        id: "stretch",
        label: "Stretch",
        icon: `<svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="1" width="16" height="12" rx="1.5" fill="currentColor" opacity="0.25" stroke="currentColor"/>
        <line x1="6"  y1="2" x2="6"  y2="12" opacity="0.55"/>
        <line x1="12" y1="2" x2="12" y2="12" opacity="0.55"/>
      </svg>`
      },
      {
        id: "tile",
        label: "Tile",
        icon: `<svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="1" width="16" height="12" rx="1.5"/>
        <rect x="2"  y="2"  width="6" height="5" rx="0.5" opacity="0.4" fill="currentColor" stroke="none"/>
        <rect x="10" y="2"  width="7" height="5" rx="0.5" opacity="0.4" fill="currentColor" stroke="none"/>
        <rect x="2"  y="8"  width="7" height="5" rx="0.5" opacity="0.4" fill="currentColor" stroke="none"/>
        <rect x="11" y="8"  width="6" height="5" rx="0.5" opacity="0.4" fill="currentColor" stroke="none"/>
      </svg>`
      }
    ];
    const grid = document.getElementById("fit-btn-grid");
    FIT_DEFS.forEach((def) => {
      const btn = document.createElement("button");
      btn.className = "fit-btn" + (def.id === params.bgFit && !params.bgGradient ? " active" : "");
      btn.dataset.fit = def.id;
      btn.innerHTML = def.icon + `<span>${def.label}</span>`;
      btn.addEventListener("click", () => {
        params.bgFit = def.id;
        params.bgGradient = false;
        updateFitButtons(def.id);
        markModifiedFn();
      });
      grid.appendChild(btn);
    });
    const gradBtn = document.createElement("button");
    gradBtn.id = "btn-bg-gradient";
    gradBtn.className = "fit-btn" + (params.bgGradient ? " active" : "");
    gradBtn.style.cssText = "grid-column:1/-1;flex-direction:row;gap:6px;padding:7px 10px;justify-content:center";
    gradBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    gradBtn.addEventListener("click", () => {
      params.bgGradient = !params.bgGradient;
      updateFitButtons(params.bgFit);
      markModifiedFn();
    });
    grid.appendChild(gradBtn);
    document.getElementById("btn-load-bg").addEventListener("click", () => {
      document.getElementById("bg-file-input").click();
    });
    document.getElementById("bg-file-input").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      loadBackgroundFromFile(file);
      e.target.value = "";
      markModifiedFn();
    });
    document.getElementById("btn-clear-bg").addEventListener("click", () => {
      clearBackground();
      markModifiedFn();
    });
    document.getElementById("ctrl-bg-opacity").addEventListener("input", (e) => {
      params.bgOpacity = parseFloat(e.target.value);
      document.getElementById("val-bg-opacity").textContent = params.bgOpacity.toFixed(1);
      markModifiedFn();
    });
    document.getElementById("ctrl-bg-blend").addEventListener("change", (e) => {
      params.bgBlend = e.target.value;
      markModifiedFn();
    });
    document.getElementById("btn-load-radial-img").addEventListener("click", () => {
      document.getElementById("radial-img-file-input").click();
    });
    document.getElementById("radial-img-file-input").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      loadRadialImageFromFile(file);
      e.target.value = "";
      markModifiedFn();
    });
    document.getElementById("btn-clear-radial-img").addEventListener("click", () => {
      clearRadialImage();
      markModifiedFn();
    });
    document.getElementById("ctrl-radial-img-opacity").addEventListener("input", (e) => {
      params.radialImgOpacity = parseFloat(e.target.value);
      document.getElementById("val-radial-img-opacity").textContent = params.radialImgOpacity.toFixed(1);
      markModifiedFn();
    });
    document.querySelectorAll("#shape-btn-grid .fit-btn[data-shape]").forEach((btn) => {
      btn.addEventListener("click", () => {
        params.radialShape = btn.dataset.shape;
        document.querySelectorAll("#shape-btn-grid .fit-btn[data-shape]").forEach((b) => b.classList.toggle("active", b === btn));
        markModifiedFn();
      });
    });
  }
  function initArtistCardControls(markModifiedFn, loadArtistImageFromFile2, clearArtistImage2) {
    document.getElementById("ctrl-artist-card-enabled").addEventListener("click", (e) => {
      params.artistCardEnabled = !params.artistCardEnabled;
      e.currentTarget.classList.toggle("active", params.artistCardEnabled);
      markModifiedFn();
    });
    document.getElementById("ctrl-artist-name").addEventListener("input", (e) => {
      params.artistCardName = e.target.value;
      markModifiedFn();
    });
    document.getElementById("ctrl-track-title").addEventListener("input", (e) => {
      params.artistCardTitle = e.target.value;
      markModifiedFn();
    });
    document.getElementById("btn-load-artist-img").addEventListener("click", () => {
      document.getElementById("artist-img-file-input").click();
    });
    document.getElementById("artist-img-file-input").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      loadArtistImageFromFile2(file);
      e.target.value = "";
      markModifiedFn();
    });
    document.getElementById("btn-clear-artist-img").addEventListener("click", () => {
      clearArtistImage2();
      markModifiedFn();
    });
    document.getElementById("ctrl-artist-card-opacity").addEventListener("input", (e) => {
      params.artistCardOpacity = parseFloat(e.target.value);
      document.getElementById("val-artist-card-opacity").textContent = params.artistCardOpacity.toFixed(1);
      markModifiedFn();
    });
    document.getElementById("ctrl-artist-card-timer-enabled").addEventListener("click", (e) => {
      params.artistCardTimerEnabled = !params.artistCardTimerEnabled;
      e.currentTarget.classList.toggle("active", params.artistCardTimerEnabled);
      document.getElementById("row-artist-card-timer-duration").style.display = params.artistCardTimerEnabled ? "" : "none";
      markModifiedFn();
    });
    document.getElementById("ctrl-artist-card-timer-duration").addEventListener("input", (e) => {
      params.artistCardTimerDuration = parseInt(e.target.value, 10);
      document.getElementById("val-artist-card-timer-duration").textContent = params.artistCardTimerDuration + "s";
      markModifiedFn();
    });
  }
  function initShortcutsModal() {
    const shortcutsModal = document.getElementById("shortcuts-modal");
    function openShortcutsModal2() {
      shortcutsModal.classList.remove("hidden");
    }
    function closeShortcutsModal2() {
      shortcutsModal.classList.add("hidden");
    }
    document.getElementById("btn-shortcuts").addEventListener("click", openShortcutsModal2);
    document.getElementById("btn-close-shortcuts").addEventListener("click", closeShortcutsModal2);
    shortcutsModal.addEventListener("click", (e) => {
      if (e.target === shortcutsModal) closeShortcutsModal2();
    });
    return { openShortcutsModal: openShortcutsModal2, closeShortcutsModal: closeShortcutsModal2 };
  }
  function initMobileDrawer(canvasWrap2, isMobileFn) {
    const sidebar = document.getElementById("sidebar");
    const drawerToggle = document.getElementById("drawer-toggle");
    const iconOpen = document.getElementById("drawer-icon-open");
    const iconClose = document.getElementById("drawer-icon-close");
    let drawerOpen = false;
    function setDrawer(open) {
      drawerOpen = open;
      sidebar.classList.toggle("open", open);
      iconOpen.style.display = open ? "none" : "";
      iconClose.style.display = open ? "" : "none";
    }
    drawerToggle.addEventListener("click", () => setDrawer(!drawerOpen));
    canvasWrap2.addEventListener("click", () => {
      if (drawerOpen && isMobileFn()) setDrawer(false);
    }, { passive: true });
  }
  function initRightPanel() {
    const host = document.getElementById("right-panel-host");
    const navBtns = Array.from(document.querySelectorAll(".nav-btn[data-panel]"));
    const sections = Array.from(document.querySelectorAll(".panel-section"));
    function closePanel() {
      host.classList.remove("panel-open");
      sections.forEach((s) => s.classList.remove("panel-active"));
      navBtns.forEach((b) => b.classList.remove("active"));
    }
    function openPanel(panelId) {
      sections.forEach((s) => s.classList.toggle("panel-active", s.id === panelId));
      host.classList.add("panel-open");
      host.scrollTop = 0;
    }
    navBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const panelId = btn.dataset.panel;
        const isActive = btn.classList.contains("active");
        navBtns.forEach((b) => b.classList.remove("active"));
        if (isActive) {
          closePanel();
        } else {
          btn.classList.add("active");
          openPanel(panelId);
        }
      });
    });
    host.addEventListener("click", (e) => {
      if (e.target.closest(".panel-close-btn")) closePanel();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Tab" || !host.classList.contains("panel-open")) return;
      const activeSection = host.querySelector(".panel-section.panel-active");
      if (!activeSection) return;
      const focusable = Array.from(activeSection.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;
      e.preventDefault();
      const idx = focusable.indexOf(document.activeElement);
      if (e.shiftKey) {
        focusable[idx <= 0 ? focusable.length - 1 : idx - 1].focus();
      } else {
        focusable[idx < 0 || idx === focusable.length - 1 ? 0 : idx + 1].focus();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && host.classList.contains("panel-open")) closePanel();
    });
    const navMode = document.getElementById("nav-mode");
    const navThemes = document.getElementById("nav-themes");
    if (navMode) navMode.dataset.hasSelection = "";
    if (navThemes) navThemes.dataset.hasSelection = "";
  }

  // js/ui/recording.js
  var recorder = null;
  var recordChunks = [];
  var isRecording = false;
  var recordStartTime = 0;
  var recTimerInterval = null;
  var recMaxTimer = null;
  var recWarnTimer = null;
  var btnRecord = document.getElementById("btn-record");
  var recBadge = document.getElementById("rec-badge");
  var recTimeEl = document.getElementById("rec-time");
  var REC_ICON_CIRCLE = `<circle cx="5" cy="5" r="5" fill="#e05050"/>`;
  var REC_ICON_STOP = `<rect x="1" y="1" width="8" height="8" rx="1" fill="currentColor"/>`;
  function formatRecTime(ms) {
    const s = Math.floor(ms / 1e3);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }
  function updateRecordTimer() {
    recTimeEl.textContent = formatRecTime(Date.now() - recordStartTime);
  }
  var _ytModeActiveGetter = null;
  var _ytGuide = null;
  function initRecording(getYtModeActive, ytGuide2) {
    _ytModeActiveGetter = getYtModeActive;
    _ytGuide = ytGuide2;
  }
  function updateRecordUI() {
    const ytModeActive2 = _ytModeActiveGetter ? _ytModeActiveGetter() : false;
    if (isRecording) {
      btnRecord.classList.add("recording");
      btnRecord.innerHTML = `<svg id="rec-icon" width="10" height="10" viewBox="0 0 10 10">${REC_ICON_STOP}</svg> Stop`;
      recBadge.classList.add("show");
      if (_ytGuide) _ytGuide.style.display = "none";
    } else {
      btnRecord.classList.remove("recording");
      btnRecord.innerHTML = `<svg id="rec-icon" width="10" height="10" viewBox="0 0 10 10">${REC_ICON_CIRCLE}</svg> Record`;
      recBadge.classList.remove("show");
      recTimeEl.textContent = "00:00";
      if (_ytGuide && ytModeActive2) _ytGuide.style.display = "block";
    }
  }
  function saveRecording() {
    if (!recordChunks.length) return;
    const blob = new Blob(recordChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const ts = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visualizer-${ts}.webm`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 6e4);
    recordChunks = [];
  }
  function stopRecording() {
    if (!isRecording || !recorder) return;
    clearInterval(recTimerInterval);
    clearTimeout(recMaxTimer);
    clearTimeout(recWarnTimer);
    recTimerInterval = null;
    recMaxTimer = null;
    recWarnTimer = null;
    isRecording = false;
    updateRecordUI();
    recorder.stop();
    recorder = null;
  }
  async function startRecording(canvas2) {
    if (!canvas2.captureStream || !window.MediaRecorder) {
      showToast("Recording not supported in this browser \u2014 try Chrome or Edge", "error");
      return;
    }
    const ytModeActive2 = _ytModeActiveGetter ? _ytModeActiveGetter() : false;
    const videoStream = canvas2.captureStream(30);
    const audioStream = AudioEngine.getAudioStream();
    let tracks = [...videoStream.getVideoTracks()];
    if (audioStream) tracks = [...tracks, ...audioStream.getAudioTracks()];
    const combined = new MediaStream(tracks);
    let recOptions = {};
    if (ytModeActive2) {
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
        recOptions = { mimeType: "video/webm;codecs=vp9", videoBitsPerSecond: 12e6 };
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
        recOptions = { mimeType: "video/webm;codecs=vp8", videoBitsPerSecond: 12e6 };
      }
    } else {
      try {
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
          recOptions = { mimeType: "video/webm;codecs=vp9,opus" };
        }
      } catch (_) {
      }
    }
    try {
      recorder = new MediaRecorder(combined, recOptions);
    } catch (err) {
      showToast("Recording not supported in this browser \u2014 try Chrome or Edge", "error");
      return;
    }
    recordChunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordChunks.push(e.data);
    };
    recorder.onstop = saveRecording;
    recorder.start(100);
    recordStartTime = Date.now();
    isRecording = true;
    updateRecordUI();
    if (params.artistCardTimerEnabled && params.artistCardEnabled) {
      startArtistCardTimer(params.artistCardTimerDuration * 1e3);
    }
    recTimerInterval = setInterval(updateRecordTimer, 500);
    recWarnTimer = setTimeout(() => {
      showToast("Recording will auto-stop in 10 seconds", "warn");
    }, 359e4);
    recMaxTimer = setTimeout(() => {
      showToast("Max recording time (60:00) reached \u2014 saving\u2026", "warn");
      stopRecording();
    }, 36e5);
  }
  function toggleRecording(canvas2) {
    if (isRecording) stopRecording();
    else startRecording(canvas2);
  }
  function initRecordButton(canvas2) {
    btnRecord.addEventListener("click", () => toggleRecording(canvas2));
  }

  // js/main.js
  var canvasWrap = document.getElementById("canvas-wrap");
  var canvas = document.getElementById("viz-canvas");
  var g = canvas.getContext("2d");
  var idleEl = document.getElementById("idle-msg");
  var logicalW = 1;
  var logicalH = 1;
  var ytModeActive = false;
  var bloomCanvas = document.createElement("canvas");
  var bloomCtx = bloomCanvas.getContext("2d");
  var vignetteGrad = null;
  var vignetteW = -1;
  var vignetteH = -1;
  function resizeCanvas() {
    if (ytModeActive) return;
    const dpr = window.devicePixelRatio || 1;
    logicalW = canvasWrap.clientWidth;
    logicalH = canvasWrap.clientHeight;
    canvas.width = Math.round(logicalW * dpr);
    canvas.height = Math.round(logicalH * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    bloomCanvas.width = canvas.width;
    bloomCanvas.height = canvas.height;
    bloomCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    vignetteW = -1;
    vignetteH = -1;
    bgState.patternW = -1;
    bgState.patternH = -1;
  }
  new ResizeObserver(resizeCanvas).observe(canvasWrap);
  resizeCanvas();
  var currentMode = "bars";
  var beatFlashStart = -Infinity;
  var MODES = ["bars", "waveform", "spectrogram", "radial", "particles", "rings", "scope", "terrain"];
  function getCurrentMode() {
    return currentMode;
  }
  function setCurrentMode(mode) {
    currentMode = mode;
  }
  function getLogicalW() {
    return logicalW;
  }
  function getLogicalH() {
    return logicalH;
  }
  function doMarkModified() {
    clearActivePresetName();
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    refreshPresetGrid();
  }
  function cycleMode() {
    const idx = MODES.indexOf(currentMode);
    const next = MODES[(idx + 1) % MODES.length];
    switchModeAnimated(next);
    doMarkModified();
  }
  function drawVignette(W, H) {
    if (vignetteW !== W || vignetteH !== H) {
      const cx = W / 2, cy = H / 2;
      const r = Math.sqrt(W * W + H * H) * 0.55;
      vignetteGrad = g.createRadialGradient(cx, cy, r * 0.25, cx, cy, r);
      vignetteGrad.addColorStop(0, "rgba(0,0,0,0)");
      vignetteGrad.addColorStop(0.6, "rgba(0,0,0,0)");
      vignetteGrad.addColorStop(1, "rgba(0,0,0,0.65)");
      vignetteW = W;
      vignetteH = H;
    }
    g.fillStyle = vignetteGrad;
    g.fillRect(0, 0, W, H);
  }
  function render(freq, time) {
    const W = logicalW;
    const H = logicalH;
    g.globalCompositeOperation = "source-over";
    if (params.trailAlpha > 0) {
      const [br, bg2, bb] = hexToRgb(THEME.bgColor);
      g.globalAlpha = 1 - params.trailAlpha;
      g.fillStyle = `rgb(${br},${bg2},${bb})`;
      g.fillRect(0, 0, W, H);
      g.globalAlpha = 1;
    } else {
      g.globalAlpha = 1;
      g.fillStyle = THEME.bgColor;
      g.fillRect(0, 0, W, H);
    }
    if (params.bgGradient) {
      drawGradientBackground(g, W, H, freq);
    } else {
      drawBackground(g, W, H);
    }
    g.globalCompositeOperation = "source-over";
    g.globalAlpha = 1;
    const vizFillAlpha = params.bgGradient || bgState.image ? 0.8 : 1;
    renderMode(g, currentMode, freq, time, W, H, vizFillAlpha, bgState, radialImageState);
    drawVignette(W, H);
    drawTextOverlay(g, W, H);
    const mt = modeTransition;
    if (mt) {
      const elapsed = performance.now() - mt.startTime;
      const alpha = Math.min(1, elapsed / 200);
      g.fillStyle = `rgba(0,0,0,${alpha})`;
      g.fillRect(0, 0, W, H);
      if (alpha >= 1) {
        switchMode(mt.target, g);
        clearModeTransition();
      }
    }
    if (BeatDetector.isEnabled()) {
      const bfElapsed = performance.now() - beatFlashStart;
      if (bfElapsed >= 0 && bfElapsed < 150) {
        g.fillStyle = `rgba(255,255,255,${0.06 * (1 - bfElapsed / 150)})`;
        g.fillRect(0, 0, W, H);
      }
    }
    if (params.bloomIntensity > 0) {
      applyBloom(g, canvas, bloomCanvas, bloomCtx, W, H);
    }
    drawProgressBar(g, W, H);
    drawElapsedTimer(g, W, H);
    drawArtistCard(g, W, H);
  }
  var fpsEl = document.getElementById("fps-counter");
  var fpsCount = 0;
  var fpsLast = performance.now();
  function tickFPS(now) {
    fpsCount++;
    const delta = now - fpsLast;
    if (delta >= 1e3) {
      fpsEl.textContent = `${Math.round(fpsCount * 1e3 / delta)} fps`;
      fpsCount = 0;
      fpsLast = now;
    }
  }
  var levelBar = document.getElementById("level-bar");
  var clipBadge = document.getElementById("clip-badge");
  var clipTimer = null;
  function updateLevelMeter(rms) {
    const pct = Math.min(100, rms * 420);
    levelBar.style.width = pct + "%";
    if (rms > 0.9) {
      clipBadge.classList.add("visible");
      clearTimeout(clipTimer);
      clipTimer = setTimeout(() => clipBadge.classList.remove("visible"), 900);
    }
  }
  var highRmsStart = 0;
  var safListenWarned = false;
  function checkSafeListen(rms) {
    if (rms > 0.85) {
      if (highRmsStart === 0) highRmsStart = performance.now();
      if (!safListenWarned && performance.now() - highRmsStart >= 3e3) {
        safListenWarned = true;
        showToast("Audio level is high \u2014 consider reducing gain", "warn");
      }
    } else {
      highRmsStart = 0;
      safListenWarned = false;
    }
  }
  var beatDotEl = document.getElementById("beat-dot");
  function flashBeatDot() {
    beatDotEl.classList.remove("beat");
    void beatDotEl.offsetWidth;
    beatDotEl.classList.add("beat");
  }
  var hasSource = false;
  function loop(now) {
    requestAnimationFrame(loop);
    tickFPS(now);
    const running = AudioEngine.getState() === "running";
    idleEl.style.display = running && hasSource ? "none" : "";
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
      setArtistCardBeatState(1.15, 0.2, 0.4);
      flashBeatDot();
    }
    render(freq, time);
    const rms = AudioEngine.getRMS();
    updateLevelMeter(rms);
    checkSafeListen(rms);
    if (AudioEngine.getSourceType() === "file" && !pbIsSeeking) {
      const dur = AudioEngine.fileGetDuration();
      const pos = AudioEngine.fileGetOffset();
      if (dur > 0) {
        pbSeekEl.value = pos;
        pbCurrentEl.textContent = formatTime2(pos);
        updateSeekBarStyle(pos, dur);
      }
    }
  }
  requestAnimationFrame(loop);
  var btnYtMode = document.getElementById("btn-yt-mode");
  var ytInner = document.getElementById("yt-inner");
  var ytGuide = document.getElementById("yt-guide");
  function applyYtModeLayout() {
    const wrapW = canvasWrap.clientWidth;
    const wrapH = canvasWrap.clientHeight;
    const scaleX = wrapW / 1920;
    const scaleY = wrapH / 1080;
    ytInner.style.transform = `scale(${Math.min(scaleX, scaleY)})`;
  }
  var ytResizeObserver = new ResizeObserver(applyYtModeLayout);
  function enableYtMode() {
    ytModeActive = true;
    btnYtMode.classList.add("active");
    ytInner.appendChild(canvas);
    canvasWrap.classList.add("yt-mode");
    canvas.width = 1920;
    canvas.height = 1080;
    g.setTransform(1, 0, 0, 1, 0, 0);
    bloomCanvas.width = 1920;
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
    if (!isRecording) ytGuide.style.display = "block";
  }
  function disableYtMode() {
    ytModeActive = false;
    btnYtMode.classList.remove("active");
    ytGuide.style.display = "none";
    ytResizeObserver.unobserve(canvasWrap);
    canvasWrap.appendChild(canvas);
    canvasWrap.classList.remove("yt-mode");
    resizeCanvas();
  }
  btnYtMode.addEventListener("click", () => {
    if (ytModeActive) disableYtMode();
    else enableYtMode();
  });
  document.getElementById("btn-yt-layout").addEventListener("click", () => {
    if (!ytModeActive) enableYtMode();
    params.artistCardEnabled = true;
    params.progressBar = true;
    params.showTimer = true;
    if (params.overlayText.trim()) {
      params.overlayEnabled = true;
      params.overlayStyle = "lower-third";
      triggerLowerThird();
    }
    syncControlsToParams(currentMode);
    doMarkModified();
    showToast("YouTube layout applied", "info");
  });
  var playbackBar = document.getElementById("playback-bar");
  var pbPlayBtn = document.getElementById("pb-play");
  var pbStopBtn = document.getElementById("pb-stop");
  var pbLoopBtn = document.getElementById("pb-loop");
  var pbSeekEl = document.getElementById("pb-seek");
  var pbCurrentEl = document.getElementById("pb-current");
  var pbDurationEl = document.getElementById("pb-duration");
  var pbSpeedEl = document.getElementById("pb-speed");
  var pbPlayIcon = document.getElementById("pb-play-icon");
  var fileInfoEl = document.getElementById("file-info");
  var fileInfoName = document.getElementById("file-info-name");
  var fileInfoDur = document.getElementById("file-info-dur");
  var pbIsSeeking = false;
  var pbLoopOn = false;
  var PB_PLAY_ICON = `<polygon points="5 3 19 12 5 21 5 3"/>`;
  var PB_PAUSE_ICON = `<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>`;
  function formatTime2(secs) {
    secs = Math.max(0, Math.floor(secs));
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  }
  function updateSeekBarStyle(pos, dur) {
    const pct = dur > 0 ? pos / dur * 100 : 0;
    pbSeekEl.style.background = `linear-gradient(to right, var(--accent-color) ${pct}%, #28282f ${pct}%)`;
  }
  function updatePbPlayIcon() {
    pbPlayIcon.innerHTML = AudioEngine.fileGetIsPlaying() ? PB_PAUSE_ICON : PB_PLAY_ICON;
  }
  function showPlaybackBar(filename) {
    const dur = AudioEngine.fileGetDuration();
    const name = filename.length > 28 ? filename.slice(0, 27) + "\u2026" : filename;
    fileInfoName.textContent = name;
    fileInfoDur.textContent = formatTime2(dur);
    fileInfoEl.classList.add("visible");
    pbSeekEl.max = dur;
    pbSeekEl.value = 0;
    pbDurationEl.textContent = formatTime2(dur);
    pbCurrentEl.textContent = "0:00";
    pbSeekEl.style.background = "#28282f";
    pbPlayIcon.innerHTML = PB_PAUSE_ICON;
    pbLoopOn = false;
    pbLoopBtn.classList.remove("active");
    pbSpeedEl.value = "1";
    AudioEngine.fileSetOnEnded(onPbFileEnded);
    playbackBar.classList.add("visible");
    canvasWrap.classList.add("with-playbar");
  }
  function hidePlaybackBar() {
    playbackBar.classList.remove("visible");
    canvasWrap.classList.remove("with-playbar");
    fileInfoEl.classList.remove("visible");
  }
  function onPbFileEnded() {
    pbPlayIcon.innerHTML = PB_PLAY_ICON;
    pbSeekEl.value = 0;
    pbCurrentEl.textContent = "0:00";
    pbSeekEl.style.background = "#28282f";
  }
  pbPlayBtn.addEventListener("click", async () => {
    if (AudioEngine.getSourceType() !== "file") return;
    if (AudioEngine.fileGetIsPlaying()) {
      AudioEngine.filePause();
    } else {
      await AudioEngine.filePlay();
    }
    updatePbPlayIcon();
  });
  pbStopBtn.addEventListener("click", () => {
    if (AudioEngine.getSourceType() !== "file") return;
    AudioEngine.fileStop();
    updatePbPlayIcon();
    pbSeekEl.value = 0;
    pbCurrentEl.textContent = "0:00";
    updateSeekBarStyle(0, AudioEngine.fileGetDuration());
  });
  pbLoopBtn.addEventListener("click", () => {
    pbLoopOn = !pbLoopOn;
    AudioEngine.fileSetLoop(pbLoopOn);
    pbLoopBtn.classList.toggle("active", pbLoopOn);
  });
  pbSpeedEl.addEventListener("change", () => {
    AudioEngine.fileSetPlaybackRate(parseFloat(pbSpeedEl.value));
  });
  pbSeekEl.addEventListener("mousedown", () => {
    pbIsSeeking = true;
  });
  pbSeekEl.addEventListener("touchstart", () => {
    pbIsSeeking = true;
  }, { passive: true });
  pbSeekEl.addEventListener("input", () => {
    const val = parseFloat(pbSeekEl.value);
    pbCurrentEl.textContent = formatTime2(val);
    updateSeekBarStyle(val, AudioEngine.fileGetDuration());
  });
  function finishSeek() {
    if (!pbIsSeeking) return;
    pbIsSeeking = false;
    AudioEngine.fileSeek(parseFloat(pbSeekEl.value));
  }
  pbSeekEl.addEventListener("mouseup", finishSeek);
  pbSeekEl.addEventListener("touchend", finishSeek);
  pbSeekEl.addEventListener("change", finishSeek);
  var btnMic = document.getElementById("btn-mic");
  var btnFile = document.getElementById("btn-file");
  var fileInput = document.getElementById("file-input");
  var srcLabel = document.getElementById("source-label");
  var tapOver = document.getElementById("tap-overlay");
  var MIC_HTML = `
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8"  y1="23" x2="16" y2="23"/>
  </svg>
  Use Mic`;
  var FILE_HTML = `
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 18V5l12-2v13"/>
    <circle cx="6"  cy="18" r="3"/>
    <circle cx="18" cy="16" r="3"/>
  </svg>
  Load File`;
  function setActive(which) {
    btnMic.classList.toggle("active", which === "mic");
    btnFile.classList.toggle("active", which === "file");
  }
  btnMic.addEventListener("click", async () => {
    btnMic.disabled = true;
    btnMic.textContent = "Connecting\u2026";
    try {
      await AudioEngine.connectMic();
      setActive("mic");
      srcLabel.textContent = "Microphone active";
      tapOver.classList.remove("show");
      hasSource = true;
      hidePlaybackBar();
    } catch (err) {
      console.error("[AudioEngine] mic error:", err);
      srcLabel.textContent = "Mic error: " + (err.message || String(err));
      setActive(null);
    } finally {
      btnMic.disabled = false;
      btnMic.innerHTML = MIC_HTML;
    }
  });
  btnFile.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;
    btnFile.disabled = true;
    btnFile.textContent = "Loading\u2026";
    try {
      await AudioEngine.connectFile(file);
      setActive("file");
      srcLabel.textContent = "\u25B6 " + file.name;
      tapOver.classList.remove("show");
      hasSource = true;
      showPlaybackBar(file.name);
    } catch (err) {
      console.error("[AudioEngine] file error:", err);
      srcLabel.textContent = "Error: " + (err.message || String(err));
      setActive(null);
    } finally {
      btnFile.disabled = false;
      btnFile.innerHTML = FILE_HTML;
      fileInput.value = "";
    }
  });
  function isMobile() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }
  if (isMobile()) tapOver.classList.add("show");
  async function resumeOnGesture() {
    const ac = AudioEngine.getContext();
    if (ac && ac.state === "suspended") await AudioEngine.resume();
    if (AudioEngine.getState() === "running") tapOver.classList.remove("show");
  }
  document.addEventListener("touchstart", resumeOnGesture, { passive: true, once: false });
  document.addEventListener("click", resumeOnGesture, { passive: true, once: false });
  var swipeStartX = 0;
  var swipeStartY = 0;
  canvas.addEventListener("touchstart", (e) => {
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
  }, { passive: true });
  canvas.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - swipeStartX;
    const dy = e.changedTouches[0].clientY - swipeStartY;
    if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy)) return;
    const idx = MODES.indexOf(currentMode);
    const next = dx < 0 ? MODES[(idx + 1) % MODES.length] : MODES[(idx + MODES.length - 1) % MODES.length];
    switchModeAnimated(next);
    doMarkModified();
  }, { passive: true });
  function loadArtistImageFromFile(file) {
    if (artistCardState.objectUrl) URL.revokeObjectURL(artistCardState.objectUrl);
    const url = URL.createObjectURL(file);
    artistCardState.objectUrl = url;
    const img = new Image();
    img.onload = () => {
      artistCardState.image = img;
      const thumb = document.getElementById("artist-img-thumbnail");
      thumb.src = url;
      thumb.classList.add("visible");
      document.getElementById("btn-clear-artist-img").style.display = "";
    };
    img.src = url;
  }
  function clearArtistImage() {
    if (artistCardState.objectUrl) {
      URL.revokeObjectURL(artistCardState.objectUrl);
      artistCardState.objectUrl = null;
    }
    artistCardState.image = null;
    const thumb = document.getElementById("artist-img-thumbnail");
    thumb.classList.remove("visible");
    thumb.src = "";
    document.getElementById("btn-clear-artist-img").style.display = "none";
  }
  var { openShortcutsModal, closeShortcutsModal } = initShortcutsModal();
  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
      case " ":
        e.preventDefault();
        if (AudioEngine.getSourceType() === "file") {
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
            if (ac.state === "running") await ac.suspend();
            else if (ac.state === "suspended") await ac.resume();
          })();
        }
        break;
      case "ArrowLeft":
        if (AudioEngine.getSourceType() === "file") {
          e.preventDefault();
          AudioEngine.fileSeek(AudioEngine.fileGetOffset() - 5);
        }
        break;
      case "ArrowRight":
        if (AudioEngine.getSourceType() === "file") {
          e.preventDefault();
          AudioEngine.fileSeek(AudioEngine.fileGetOffset() + 5);
        }
        break;
      case "m":
      case "M":
        cycleMode();
        break;
      case "r":
      case "R":
        toggleRecording(canvas);
        break;
      case "?":
        openShortcutsModal();
        break;
      case "Escape":
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
  document.getElementById("btn-copy-link").addEventListener("click", async () => {
    const btn = document.getElementById("btn-copy-link");
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (_) {
      const ta = document.createElement("textarea");
      ta.value = window.location.href;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    btn.textContent = "Copied!";
    setTimeout(() => {
      btn.textContent = "Copy link";
    }, 1800);
  });
  (function initPWA() {
    const manifest = {
      name: "Audio Visualizer",
      short_name: "Visualizer",
      start_url: location.href,
      display: "standalone",
      background_color: "#0f0f11",
      theme_color: "#1a1a1f",
      icons: []
    };
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
    const manifestUrl = URL.createObjectURL(manifestBlob);
    const linkEl = document.createElement("link");
    linkEl.rel = "manifest";
    linkEl.href = manifestUrl;
    document.head.appendChild(linkEl);
    if (!("serviceWorker" in navigator)) return;
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
    const swBlob = new Blob([SW], { type: "text/javascript" });
    const swUrl = URL.createObjectURL(swBlob);
    navigator.serviceWorker.register(swUrl, { scope: "./" }).then(() => URL.revokeObjectURL(swUrl)).catch(() => URL.revokeObjectURL(swUrl));
  })();
  setThemeModule(themes_exports);
  function doApplyTheme(index) {
    applyTheme(index, canvasWrap);
    vignetteW = -1;
    vignetteH = -1;
  }
  initControls({
    getCurrentMode,
    setCurrentMode,
    getLogicalW,
    getLogicalH,
    getCanvasWrap: () => canvasWrap,
    applyTheme: doApplyTheme,
    markModified: doMarkModified,
    toggleRecording: () => toggleRecording(canvas),
    cycleMode
  });
  initPresets({
    applyTheme: doApplyTheme,
    switchMode: (mode) => switchMode(mode, g),
    syncControlsToParams: () => syncControlsToParams(currentMode),
    markModified: doMarkModified
  });
  initRecording(() => ytModeActive, ytGuide);
  initRecordButton(canvas);
  buildSwatches((index) => {
    doApplyTheme(index);
    doMarkModified();
  });
  initModeButtons(switchModeAnimated, doMarkModified);
  initAnalyzerControls(doMarkModified);
  initVisualControls(doMarkModified);
  initBeatControls(doMarkModified, () => beatFlashStart, (v) => {
    beatFlashStart = v;
  });
  initTextOverlayControls(doMarkModified);
  initBackgroundControls(doMarkModified);
  initArtistCardControls(doMarkModified, loadArtistImageFromFile, clearArtistImage);
  initMobileDrawer(canvasWrap, isMobile);
  initRightPanel();
  initSavePresetButton(() => currentMode);
  refreshPresetGrid();
  doApplyTheme(0);
  switchMode("bars", g);
  syncControlsToParams(currentMode);
  (function initFromHash() {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const preset = decodePreset(hash);
    if (preset) applyPreset(preset, false);
  })();
})();
