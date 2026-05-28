
let barsGrad  = null;
let barsGradH = -1;

function invalidateBarsGrad() {
  barsGradH = -1;
}

const barHeights = new Float32Array(256);

function renderBars(ctx, freq, W, H, vizFillAlpha = 1) {
  if (!freq) return;

  if (barsGradH !== H) {
    barsGrad  = ctx.createLinearGradient(0, H, 0, 0);
    barsGrad.addColorStop(0, THEME.accent);
    barsGrad.addColorStop(1, THEME.highlight);
    barsGradH = H;
  }

  const barCount = params.barCount;
  const binCount = freq.length;
  const barW     = W / barCount;
  const drawW    = Math.max(1, barW - 1);
  const centerY  = H * 0.5;
  const maxBarH  = centerY * 0.95;
  const smoothK  = 0.08 + 0.14 * params.motionAmount;

  ctx.globalAlpha = vizFillAlpha;
  ctx.fillStyle   = barsGrad;

  for (let i = 0; i < barCount; i++) {
    const srcI = (params.mirror && i >= barCount / 2) ? barCount - 1 - i : i;
    const lo = Math.floor(srcI       * binCount / barCount);
    const hi = Math.floor((srcI + 1) * binCount / barCount);
    let sum = 0;
    for (let b = lo; b < hi; b++) sum += freq[b];
    const newVal = (hi > lo) ? sum / ((hi - lo) * 255) : freq[lo] / 255;

    barHeights[i] += (newVal - barHeights[i]) * smoothK;
    const bh = barHeights[i] * maxBarH;
    const x  = i * barW;

    ctx.fillRect(x, centerY - bh, drawW, bh);
    ctx.fillRect(x, centerY,      drawW, bh);
  }

  ctx.globalAlpha = 1;
}
