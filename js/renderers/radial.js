
let radialAngle    = 0;
let radialBeatTime = -Infinity;
function setRadialBeatTime(t) { radialBeatTime = t; }

/* Returns the distance from center to the boundary of a regular n-gon
   (circumradius R, first vertex at vertex0Angle) at polar angle phi. */
function polygonBoundaryRadius(n, R, vertex0Angle, phi) {
  const segAngle    = (2 * Math.PI) / n;
  const phiRel      = ((phi - vertex0Angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const phiInSector = phiRel % segAngle - segAngle / 2;
  return R * Math.cos(Math.PI / n) / Math.cos(phiInSector);
}

/* Traces a path for the center-well shape (used for fill + image clip). */
function radialCenterPath(ctx, shape, cx, cy, r, angle) {
  ctx.beginPath();
  if (shape === 'square') {
    for (let i = 0; i < 4; i++) {
      const a = angle + Math.PI / 4 + (i / 4) * Math.PI * 2;
      if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      else         ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    ctx.closePath();
  } else if (shape === 'triangle') {
    for (let i = 0; i < 3; i++) {
      const a = angle - Math.PI / 2 + (i / 3) * Math.PI * 2;
      if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      else         ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    ctx.closePath();
  } else {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
  }
}

function renderRadial(ctx, freq, W, H, vizFillAlpha, bgState, radialImageState) {
  if (!freq) return;

  const cx        = W / 2;
  const cy        = H / 2;
  const minDim    = Math.min(W, H);
  const innerBase = minDim * 0.18;
  const outerMax  = minDim * 0.46;

  /* Beat pulse: scale inner radius up 8%, lerp back over 200 ms */
  const beatElapsed = performance.now() - radialBeatTime;
  const beatScale   = beatElapsed < 200
    ? 1.0 + 0.08 * (1 - beatElapsed / 200)
    : 1.0;
  const innerRadius = innerBase * beatScale;

  /* Slow per-frame rotation */
  radialAngle += 0.001 * params.motionAmount;

  const barCount = params.barCount;
  const binCount = freq.length;
  const smoothK  = 0.08 + 0.14 * params.motionAmount;
  const shape    = params.radialShape || 'circle';

  /* Constant bar width derived from base radius so it doesn't change with beat pulse */
  const barWidth = Math.max(1, (2 * Math.PI * innerBase / barCount) * 0.75);

  /* ── Draw radiating bars ── */
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(radialAngle);
  ctx.globalAlpha = vizFillAlpha;

  for (let i = 0; i < barCount; i++) {
    const srcI = (params.mirror && i >= barCount / 2) ? barCount - 1 - i : i;

    const lo = Math.floor(srcI       * binCount / barCount);
    const hi = Math.floor((srcI + 1) * binCount / barCount);
    let sum = 0;
    for (let b = lo; b < hi; b++) sum += freq[b];
    const newVal = (hi > lo) ? sum / ((hi - lo) * 255) : freq[lo] / 255;

    barHeights[i] += (newVal - barHeights[i]) * smoothK;
    const barH = barHeights[i] * (outerMax - innerRadius);
    if (barH <= 0.5) continue;

    /* Angle of this bar within the (already-rotated) frame */
    const angle = (i / barCount) * Math.PI * 2;
    const cv    = Math.min(255, Math.max(0, Math.floor(barHeights[i] * 255)));

    /* For shaped modes: compute how far from center the shape boundary is at this angle.
       polygonBoundaryRadius uses the same vertex0 angles as radialCenterPath so bars
       align perfectly with the rendered shape. */
    let startR = innerRadius;
    if (shape === 'square') {
      startR = polygonBoundaryRadius(4, innerRadius, Math.PI / 4, angle);
    } else if (shape === 'triangle') {
      startR = polygonBoundaryRadius(3, innerRadius, -Math.PI / 2, angle);
    }

    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = `rgb(${heatR[cv]},${heatG[cv]},${heatB[cv]})`;
    ctx.fillRect(startR, -barWidth / 2, barH, barWidth);
    ctx.restore();
  }

  ctx.globalAlpha = 1;
  ctx.restore();

  /* ── Centre well ── */
  radialCenterPath(ctx, shape, cx, cy, innerRadius, radialAngle);
  ctx.fillStyle = THEME.bgColor;
  ctx.fill();

  /* Clip-draw the center image: radial-specific image takes priority over background */
  const centerImg     = radialImageState.image || bgState.image;
  const centerOpacity = radialImageState.image ? params.radialImgOpacity : params.bgOpacity;
  if (centerImg) {
    const d     = innerRadius * 2;
    const scale = Math.max(d / centerImg.naturalWidth, d / centerImg.naturalHeight);
    const dw    = centerImg.naturalWidth  * scale;
    const dh    = centerImg.naturalHeight * scale;

    ctx.save();
    radialCenterPath(ctx, shape, cx, cy, innerRadius, radialAngle);
    ctx.clip();
    ctx.globalAlpha = centerOpacity;
    ctx.drawImage(centerImg, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
