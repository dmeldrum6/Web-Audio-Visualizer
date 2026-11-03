/* ═══════════════════════════════════════════════════════════════
   BEAT DETECTOR
═══════════════════════════════════════════════════════════════ */
const BeatDetector = (() => {
  const HISTORY  = 40;
  const COOLDOWN = 200; /* ms between triggers */

  let _enabled    = true;
  let _multiplier = 1.4;

  /* Detection bands in Hz — independent of FFT size and sample rate */
  const BASS_LO_HZ = 30,   BASS_HI_HZ = 150;    /* kick drum / bass */
  const TREB_LO_HZ = 6000, TREB_HI_HZ = 14000;  /* hats / cymbals / snare snap */

  /* Bass state */
  const _bassHist = new Float32Array(HISTORY);
  let _bassIdx    = 0;
  let _bassSum    = 0;
  let _bassFill   = 0;
  let _lastBeat   = -Infinity;
  let _isBeat     = false;
  let _bassNow    = 0;  /* current frame RMS */
  let _bassAvg    = 0;  /* rolling average RMS */

  /* Treble state */
  const _trebHist = new Float32Array(HISTORY);
  let _trebIdx    = 0;
  let _trebSum    = 0;
  let _trebFill   = 0;
  let _lastHit    = -Infinity;
  let _isHit      = false;

  function _binRMS(freq, lo, hi) {
    let sum = 0;
    for (let i = lo; i < hi; i++) { const v = freq[i] / 255; sum += v * v; }
    return Math.sqrt(sum / (hi - lo));
  }

  function update(freq) {
    _isBeat = false;
    _isHit  = false;
    if (!_enabled || !freq || freq.length < 12) return;

    const now      = Clock.now();
    const binCount = freq.length;
    const bassLo   = Math.floor(hzToBin(BASS_LO_HZ, binCount));
    const bassHi   = Math.max(bassLo + 2, Math.ceil(hzToBin(BASS_HI_HZ, binCount)));

    /* ── Bass ── */
    const bass  = _binRMS(freq, bassLo, Math.min(binCount, bassHi));
    _bassNow    = bass;
    _bassSum   -= _bassHist[_bassIdx];
    _bassHist[_bassIdx] = bass;
    _bassSum   += bass;
    _bassIdx    = (_bassIdx + 1) % HISTORY;
    if (_bassFill < HISTORY) _bassFill++;
    _bassAvg    = _bassSum / _bassFill;

    if (_bassAvg > 0 && bass > _bassAvg * _multiplier && now - _lastBeat >= COOLDOWN) {
      _isBeat   = true;
      _lastBeat = now;
    }

    /* ── Treble ── */
    const trebLo = Math.min(binCount - 1, Math.floor(hzToBin(TREB_LO_HZ, binCount)));
    const trebHi = Math.min(binCount, Math.max(trebLo + 1, Math.ceil(hzToBin(TREB_HI_HZ, binCount))));
    const treb   = _binRMS(freq, trebLo, trebHi);
    _trebSum    -= _trebHist[_trebIdx];
    _trebHist[_trebIdx] = treb;
    _trebSum    += treb;
    _trebIdx     = (_trebIdx + 1) % HISTORY;
    if (_trebFill < HISTORY) _trebFill++;
    const trebAvg = _trebSum / _trebFill;

    if (trebAvg > 0 && treb > trebAvg * _multiplier && now - _lastHit >= COOLDOWN) {
      _isHit   = true;
      _lastHit = now;
    }
  }

  /* Forget history — used when an export starts from the top of a song */
  function reset() {
    _bassHist.fill(0); _bassIdx = 0; _bassSum = 0; _bassFill = 0;
    _trebHist.fill(0); _trebIdx = 0; _trebSum = 0; _trebFill = 0;
    _lastBeat = -Infinity; _lastHit = -Infinity;
    _isBeat = false; _isHit = false; _bassNow = 0; _bassAvg = 0;
  }

  return {
    update, reset,
    isBeat()       { return _isBeat; },
    isHit()        { return _isHit; },
    beatEnergy()   { return _bassAvg > 0 ? Math.min(1, _bassNow / (_bassAvg * _multiplier)) : 0; },
    setEnabled(v)  { _enabled = !!v; if (!v) { _isBeat = false; _isHit = false; } },
    setMultiplier(v) { _multiplier = v; },
    isEnabled()    { return _enabled; },
  };
})();
