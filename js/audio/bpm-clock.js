
/* ═══════════════════════════════════════════════════════════════
   BPM CLOCK — tap-tempo detection + tempo-sync beat subdivision
═══════════════════════════════════════════════════════════════ */
const BPMClock = (() => {
  let _enabled      = false;
  let _bpm          = 120;
  let _subdivision  = 1;   /* beats per bar: 1=whole, 2=half, 4=quarter, 8=eighth */
  let _tapTimes     = [];
  let _startTime    = performance.now();
  let _lastBeatIdx  = -1;

  function tap() {
    const now = performance.now();
    _tapTimes.push(now);
    if (_tapTimes.length > 8) _tapTimes.shift();
    if (_tapTimes.length >= 2) {
      let sum = 0;
      for (let i = 1; i < _tapTimes.length; i++) sum += _tapTimes[i] - _tapTimes[i - 1];
      const avg = sum / (_tapTimes.length - 1);
      _bpm = Math.max(40, Math.min(250, 60000 / avg));
    }
    /* Align clock to the tap so the first beat fires immediately */
    _startTime = now;
  }

  function reset() {
    _tapTimes  = [];
    _startTime = performance.now();
    _lastBeatIdx = -1;
  }

  /* Called every frame */
  function update() {
    /* nothing stateful to tick — getPhase() is computed on demand */
  }

  /* 0..1 position within the current subdivision pulse */
  function getPhase() {
    if (!_enabled) return 0;
    const beatMs = 60000 / _bpm;
    const subMs  = beatMs / _subdivision;
    const elapsed = performance.now() - _startTime;
    return (elapsed % subMs) / subMs;
  }

  /* true once per subdivision pulse — call once per frame */
  function isTick() {
    if (!_enabled) return false;
    const beatMs  = 60000 / _bpm;
    const subMs   = beatMs / _subdivision;
    const elapsed = performance.now() - _startTime;
    const idx     = Math.floor(elapsed / subMs);
    if (idx !== _lastBeatIdx) {
      _lastBeatIdx = idx;
      return true;
    }
    return false;
  }

  function setEnabled(v)     { _enabled = v; if (v) reset(); }
  function isEnabled()       { return _enabled; }
  function getBPM()          { return _bpm; }
  function setBPM(v)         { _bpm = Math.max(40, Math.min(250, +v)); reset(); }
  function getSubdivision()  { return _subdivision; }
  function setSubdivision(v) { _subdivision = +v; reset(); }

  return { tap, reset, update, getPhase, isTick,
           setEnabled, isEnabled, getBPM, setBPM,
           getSubdivision, setSubdivision };
})();
