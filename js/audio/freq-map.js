/* ═══════════════════════════════════════════════════════════════
   FREQUENCY MAPPING — FFT bins ↔ Hz, and display bands on a
   logarithmic (musical) or linear frequency axis.

   On a linear axis nearly all the bass, kick and vocal energy lands in
   the first few percent of bars. The log axis spreads 30 Hz – 16 kHz
   evenly per octave, the way we hear it.
═══════════════════════════════════════════════════════════════ */
const FREQ_MIN_HZ = 30;
const FREQ_MAX_HZ = 16000;

function getAnalysisSampleRate() {
  const ac = AudioEngine.getContext();
  return ac ? ac.sampleRate : 48000;
}

/* Fractional FFT bin index for a frequency (binCount = fftSize / 2) */
function hzToBin(hz, binCount) {
  const nyquist = getAnalysisSampleRate() / 2;
  return (hz / nyquist) * binCount;
}

/* Average of freq[] over the given Hz range, normalised to 0–1 */
function bandEnergyHz(freq, loHz, hiHz) {
  const n  = freq.length;
  const lo = Math.max(0, Math.floor(hzToBin(loHz, n)));
  const hi = Math.min(n, Math.max(lo + 1, Math.ceil(hzToBin(hiHz, n))));
  let sum = 0;
  for (let i = lo; i < hi; i++) sum += freq[i];
  return sum / ((hi - lo) * 255);
}

/* Cache of band edges (in fractional bins) per layout */
const _bandEdgeCache = new Map();

function getBandEdges(count, binCount) {
  const scale = params.freqScale === 'linear' ? 'linear' : 'log';
  const sr    = getAnalysisSampleRate();
  const key   = `${scale}|${count}|${binCount}|${sr}`;
  let edges   = _bandEdgeCache.get(key);
  if (edges) return edges;

  edges = new Float32Array(count + 1);
  if (scale === 'linear') {
    for (let i = 0; i <= count; i++) edges[i] = i * binCount / count;
  } else {
    const nyquist = sr / 2;
    const fMax    = Math.min(FREQ_MAX_HZ, nyquist);
    const ratio   = fMax / FREQ_MIN_HZ;
    for (let i = 0; i <= count; i++) {
      const hz = FREQ_MIN_HZ * Math.pow(ratio, i / count);
      edges[i] = Math.min(binCount, (hz / nyquist) * binCount);
    }
  }
  if (_bandEdgeCache.size > 32) _bandEdgeCache.clear();
  _bandEdgeCache.set(key, edges);
  return edges;
}

/* Linear interpolation of freq[] at a fractional bin, normalised to 0–1 */
function sampleBin(freq, pos) {
  const n  = freq.length;
  const i0 = Math.min(n - 1, Math.max(0, Math.floor(pos)));
  const i1 = Math.min(n - 1, i0 + 1);
  const f  = pos - Math.floor(pos);
  return (freq[i0] * (1 - f) + freq[i1] * f) / 255;
}

/* Value 0–1 of band i (edges from getBandEdges) */
function bandValue(freq, edges, i) {
  const a = edges[i];
  const b = edges[i + 1];
  /* Narrower than one bin (low end of a log axis): interpolate */
  if (b - a < 1) return sampleBin(freq, (a + b) / 2);
  const lo = Math.floor(a);
  const hi = Math.min(freq.length, Math.max(lo + 1, Math.floor(b)));
  let sum = 0;
  for (let k = lo; k < hi; k++) sum += freq[k];
  return sum / ((hi - lo) * 255);
}
