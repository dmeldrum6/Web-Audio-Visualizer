
let spectroCanvas    = null;
let spectroCtx2      = null;
let spectroStripData = null;
let spectroSW        = 0;
let spectroSH        = 0;

function ensureSpectrogram(W, H) {
  if (spectroCanvas && spectroSW === W && spectroSH === H) return;
  spectroCanvas = document.createElement('canvas');
  spectroCanvas.width  = W;
  spectroCanvas.height = H;
  spectroCtx2 = spectroCanvas.getContext('2d');
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

/* Row → FFT bin span lookup, rebuilt when height, FFT size or scale changes.
   Each row covers [rowLo, rowHi) in fractional bins; row 0 is the top. */
let spectroRowLo = null, spectroRowHi = null, spectroRowKey = '';

function ensureSpectroRows(sh, binCount) {
  const key = `${sh}|${binCount}|${params.freqScale}|${getAnalysisSampleRate()}`;
  if (key === spectroRowKey) return;
  const edges  = getBandEdges(sh, binCount);   /* edges[0] = lowest freq */
  spectroRowLo = new Float32Array(sh);
  spectroRowHi = new Float32Array(sh);
  for (let y = 0; y < sh; y++) {
    const band = sh - 1 - y;                    /* low frequencies at the bottom */
    spectroRowLo[y] = edges[band];
    spectroRowHi[y] = edges[band + 1];
  }
  spectroRowKey = key;
}

function renderSpectrogram(ctx, freq, W, H, vizFillAlpha = 1) {
  ensureSpectrogram(W, H);

  if (freq) {
    const binCount = freq.length;
    const sh = spectroSH;
    const sd = spectroStripData;
    ensureSpectroRows(sh, binCount);

    for (let y = 0; y < sh; y++) {
      const a = spectroRowLo[y], b = spectroRowHi[y];
      let val;
      if (b - a < 1) {
        val = Math.round(sampleBin(freq, (a + b) / 2) * 255);
      } else {
        /* Several bins per row (top of the spectrum): take the peak */
        const hi = Math.min(binCount, Math.max(Math.floor(a) + 1, Math.floor(b)));
        val = 0;
        for (let k = Math.floor(a); k < hi; k++) if (freq[k] > val) val = freq[k];
      }
      const p   = y * 8;
      sd.data[p]     = heatR[val]; sd.data[p + 1] = heatG[val];
      sd.data[p + 2] = heatB[val]; sd.data[p + 3] = 255;
      sd.data[p + 4] = heatR[val]; sd.data[p + 5] = heatG[val];
      sd.data[p + 6] = heatB[val]; sd.data[p + 7] = 255;
    }

    spectroCtx2.drawImage(spectroCanvas, -2, 0);
    spectroCtx2.putImageData(sd, spectroSW - 2, 0);
  }

  ctx.globalAlpha = vizFillAlpha;
  ctx.drawImage(spectroCanvas, 0, 0, W, H);
  ctx.globalAlpha = 1;
}
