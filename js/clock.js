/* ═══════════════════════════════════════════════════════════════
   CLOCK — single time source for every animation / timing check.

   Live: wall-clock time (performance.now()).
   Export: a virtual time stepped frame-by-frame by the offline
   renderer, so animations advance exactly 1/60 s per frame no matter
   how long each frame takes to render and encode.

   The clock is monotonic across the switch back to live time, so
   timestamps stored during an export never end up in the future.
═══════════════════════════════════════════════════════════════ */
const Clock = (() => {
  let _virtual = null;  /* ms, or null when running live */
  let _offset  = 0;     /* added to performance.now() after an export */

  return {
    now() {
      return _virtual !== null ? _virtual : performance.now() + _offset;
    },
    /* Freeze time at the current live value and return it */
    beginVirtual() {
      _virtual = performance.now() + _offset;
      return _virtual;
    },
    setVirtual(ms) { _virtual = ms; },
    endVirtual() {
      if (_virtual === null) return;
      _offset  = Math.max(_offset, _virtual - performance.now());
      _virtual = null;
    },
    isVirtual() { return _virtual !== null; },
  };
})();
