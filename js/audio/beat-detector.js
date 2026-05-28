/* ═══════════════════════════════════════════════════════════════
   BEAT DETECTOR
═══════════════════════════════════════════════════════════════ */
const BeatDetector = (() => {
  const HISTORY  = 40;
  const COOLDOWN = 200; /* ms between triggers */

  let _enabled    = true;
  let _multiplier = 1.4;

  /* Bass state — bins 0–10 (sub-bass / bass) */
  const _bassHist = new Float32Array(HISTORY);
  let _bassIdx    = 0;
  let _bassSum    = 0;
  let _bassFill   = 0;
  let _lastBeat   = -Infinity;
  let _isBeat     = false;
  let _bassNow    = 0;  /* current frame RMS */
  let _bassAvg    = 0;  /* rolling average RMS */

  /* Treble state — top quarter of FFT bins */
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

    const now      = performance.now();
    const binCount = freq.length;

    /* ── Bass ── */
    const bass  = _binRMS(freq, 0, 11);
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
    const trebLo = Math.floor(binCount * 0.75);
    const treb   = _binRMS(freq, trebLo, binCount);
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

  return {
    update,
    isBeat()       { return _isBeat; },
    isHit()        { return _isHit; },
    beatEnergy()   { return _bassAvg > 0 ? Math.min(1, _bassNow / (_bassAvg * _multiplier)) : 0; },
    setEnabled(v)  { _enabled = !!v; if (!v) { _isBeat = false; _isHit = false; } },
    setMultiplier(v) { _multiplier = v; },
    isEnabled()    { return _enabled; },
  };
})();
