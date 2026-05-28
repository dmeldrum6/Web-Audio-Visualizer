
const RING_BANDS = [
  { lo: 0,   hi: 3   },  // sub-bass
  { lo: 4,   hi: 10  },  // bass
  { lo: 11,  hi: 25  },  // low-mid
  { lo: 26,  hi: 60  },  // mid
  { lo: 61,  hi: 120 },  // high-mid
  { lo: 121, hi: -1  },  // treble (hi = -1 → end of useful range)
];
const ringValues  = new Float32Array(6);   // smoothed band values 0–1
const ringRipples = [];                    // { r, startTime }

function renderRings(ctx, freq, W, H, vizFillAlpha = 1) {
  const cx     = W / 2;
  const cy     = H / 2;
  const minDim = Math.min(W, H);
  const innerR = minDim * 0.08;
  const outerR = minDim * 0.46;
  const nBands = RING_BANDS.length;
  const smoothK = 0.08 + 0.14 * params.motionAmount;

  /* Update smoothed band values */
  for (let b = 0; b < nBands; b++) {
    let rawVal = 0;
    if (freq) {
      const lo  = RING_BANDS[b].lo;
      const hi  = RING_BANDS[b].hi === -1 ? Math.min(freq.length - 1, 200) : RING_BANDS[b].hi;
      const end = Math.min(hi + 1, freq.length);
      let sum   = 0;
      for (let i = lo; i < end; i++) sum += freq[i];
      rawVal = (end > lo) ? sum / ((end - lo) * 255) : 0;
    }
    ringValues[b] += (rawVal - ringValues[b]) * smoothK;
  }

  /* Emit ripple on beat */
  if (BeatDetector.isBeat()) {
    ringRipples.push({ r: innerR, startTime: performance.now() });
  }

  /* Subtle aura: filled circle at outerR with theme accent at 3% opacity */
  const [ar, ag2, ab] = hexToRgb(THEME.accent);
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${ar},${ag2},${ab},0.03)`;
  ctx.fill();

  /* Ghost rings — thin, low opacity to show structure during silence */
  ctx.globalAlpha = 0.12 * vizFillAlpha;
  for (let b = 0; b < nBands; b++) {
    const r = innerR + (outerR - innerR) * (b / (nBands - 1));
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgb(${ar},${ag2},${ab})`;
    ctx.lineWidth   = 0.5;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  /* Active rings — width and color driven by band energy */
  for (let b = 0; b < nBands; b++) {
    const v   = ringValues[b];
    const r   = innerR + (outerR - innerR) * (b / (nBands - 1));
    const cv  = Math.min(255, Math.floor(v * 255));
    const lw  = 2 + v * 14;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${heatR[cv]},${heatG[cv]},${heatB[cv]},${vizFillAlpha})`;
    ctx.lineWidth   = lw;
    ctx.stroke();
  }

  /* Ripples */
  const RIPPLE_DURATION = 600;
  const now = performance.now();
  for (let i = ringRipples.length - 1; i >= 0; i--) {
    const rip     = ringRipples[i];
    const elapsed = now - rip.startTime;
    if (elapsed > RIPPLE_DURATION) { ringRipples.splice(i, 1); continue; }
    const progress = elapsed / RIPPLE_DURATION;
    const rr       = innerR + (outerR - innerR) * progress;
    const alpha    = (1 - progress) * 0.6 * vizFillAlpha;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${ar},${ag2},${ab},${alpha})`;
    ctx.lineWidth   = 1;
    ctx.stroke();
  }
}
