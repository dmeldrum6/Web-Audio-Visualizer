import { THEME, heatR, heatG, heatB } from '../themes.js';

let spectroCanvas    = null;
let spectroCtx2      = null;
let spectroStripData = null;
let spectroSW        = 0;
let spectroSH        = 0;

export function ensureSpectrogram(W, H) {
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

export function clearSpectrogramCanvas() {
  if (spectroCtx2) {
    spectroCtx2.fillStyle = THEME.bgColor;
    spectroCtx2.fillRect(0, 0, spectroSW, spectroSH);
  }
}

export function renderSpectrogram(ctx, freq, W, H, vizFillAlpha = 1) {
  ensureSpectrogram(W, H);

  if (freq) {
    const binCount = freq.length;
    const sh = spectroSH;
    const sd = spectroStripData;

    for (let y = 0; y < sh; y++) {
      const binIdx = Math.min(binCount - 1, Math.floor((1 - y / sh) * binCount));
      const val = freq[binIdx];
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
