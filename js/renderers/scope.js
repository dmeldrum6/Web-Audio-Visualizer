import { params } from '../params.js';
import { THEME, hexToRgb } from '../themes.js';

/* Scope state — circular buffer of the last 8 frames of (x,y) pairs */
const SCOPE_TRAIL_FRAMES = 8;
export const scopeTrail = [];  // array of Float32Array pairs [xs, ys]

export function renderScope(ctx, time, W, H, vizFillAlpha = 1) {
  if (!time) return;

  const half = Math.floor(time.length / 2);
  const n    = half;

  /* Build this frame's (x, y) coordinate arrays */
  const xs = new Float32Array(n);
  const ys = new Float32Array(n);

  if (params.scopeMonoDelay) {
    /* Mono phase-delay mode: same buffer for both axes with a 64-sample offset */
    const delay = 64;
    for (let i = 0; i < n; i++) {
      xs[i] = W / 2 + ((time[i] - 128) / 128) * W * 0.42;
      const j = Math.min(i + delay, time.length - 1);
      ys[i] = H / 2 + ((time[j] - 128) / 128) * H * 0.42;
    }
  } else {
    /* Split-buffer mode: first half → X axis, second half → Y axis */
    for (let i = 0; i < n; i++) {
      xs[i] = W / 2 + ((time[i]        - 128) / 128) * W * 0.42;
      ys[i] = H / 2 + ((time[i + half] - 128) / 128) * H * 0.42;
    }
  }

  /* Push this frame into the circular trail buffer */
  scopeTrail.push({ xs, ys });
  if (scopeTrail.length > SCOPE_TRAIL_FRAMES) scopeTrail.shift();

  const [ar, ag2, ab] = hexToRgb(THEME.accent);

  /* Draw crosshair */
  ctx.save();
  ctx.globalAlpha = 0.15 * vizFillAlpha;
  ctx.strokeStyle = `rgb(${ar},${ag2},${ab})`;
  ctx.lineWidth   = 0.5;
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);   ctx.lineTo(W / 2, H);
  ctx.moveTo(0, H / 2);   ctx.lineTo(W, H / 2);
  ctx.stroke();
  ctx.restore();

  /* Draw trail frames — oldest at lowest opacity, newest at full */
  const total = scopeTrail.length;
  for (let f = 0; f < total; f++) {
    const frame    = scopeTrail[f];
    const t        = (f + 1) / total;           // 0 → oldest … 1 → newest
    const alpha    = (0.05 + 0.95 * t) * vizFillAlpha;
    const lw       = f === total - 1 ? 1.5 : 0.5;

    ctx.beginPath();
    ctx.moveTo(frame.xs[0], frame.ys[0]);
    for (let i = 1; i < frame.xs.length; i++) {
      ctx.lineTo(frame.xs[i], frame.ys[i]);
    }
    ctx.strokeStyle = `rgba(${ar},${ag2},${ab},${alpha})`;
    ctx.lineWidth   = lw;
    ctx.stroke();
  }
}
