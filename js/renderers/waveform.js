import { params } from '../params.js';
import { THEME } from '../themes.js';

let wavePhase = 0;
let waveYBuf  = new Float32Array(4096);

export function renderWaveform(ctx, time, W, H, vizFillAlpha = 1) {
  if (!time) return;

  wavePhase = (wavePhase + 0.004 * params.motionAmount) % 1;
  const tLen    = time.length;
  const phShift = Math.floor(wavePhase * tLen);
  const centerY = H * 0.5;
  const amp     = H * 0.42;
  const [wr, wg2, wb] = THEME.waveRGB;

  if (W > waveYBuf.length) waveYBuf = new Float32Array(W * 2);
  for (let i = 0; i < W; i++) {
    const idx = (phShift + Math.floor(i * tLen / W)) % tLen;
    waveYBuf[i] = centerY + ((time[idx] - 128) / 128) * amp;
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

  /* Strokes are unaffected by vizFillAlpha per spec */
  ctx.beginPath();
  ctx.moveTo(0, waveYBuf[0]);
  for (let i = 1; i < W; i++) ctx.lineTo(i, waveYBuf[i]);
  ctx.strokeStyle = `rgba(${wr},${wg2},${wb},0.15)`;
  ctx.lineWidth   = 6;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, waveYBuf[0]);
  for (let i = 1; i < W; i++) ctx.lineTo(i, waveYBuf[i]);
  ctx.strokeStyle = `rgb(${wr},${wg2},${wb})`;
  ctx.lineWidth   = 2;
  ctx.stroke();
}
