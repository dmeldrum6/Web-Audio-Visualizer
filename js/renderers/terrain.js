
const TERRAIN_ROWS = 48;
let terrainBuf      = null;   // Float32Array of TERRAIN_ROWS * barCount
let terrainBufCount = 0;      // barCount the buffer was built for
let terrainHead     = 0;      // next write row in circular buffer

function ensureTerrainBuffer(barCount) {
  if (terrainBuf && terrainBufCount === barCount) return;
  terrainBuf      = new Float32Array(TERRAIN_ROWS * barCount);
  terrainBufCount = barCount;
  terrainHead     = 0;
}

function renderTerrain(ctx, freq, W, H, vizFillAlpha = 1) {
  const barCount = params.barCount;
  ensureTerrainBuffer(barCount);

  /* Advance buffer by terrainSpeed rows, writing current freq data */
  const steps = Math.max(1, Math.round(params.terrainSpeed));
  for (let s = 0; s < steps; s++) {
    const rowOff = terrainHead * barCount;
    if (freq) {
      const edges = getBandEdges(barCount, freq.length);
      for (let i = 0; i < barCount; i++) {
        terrainBuf[rowOff + i] = bandValue(freq, edges, i);
      }
    } else {
      terrainBuf.fill(0, rowOff, rowOff + barCount);
    }
    terrainHead = (terrainHead + 1) % TERRAIN_ROWS;
  }

  const vpY   = H * 0.38;   // vanishing point Y
  const nearY = H * 0.92;   // nearest row Y

  /* Draw grid lines first (wireframe aesthetic, very low opacity) */
  ctx.save();
  ctx.globalAlpha = 0.08 * vizFillAlpha;
  ctx.strokeStyle = `rgb(${heatR[180]},${heatG[180]},${heatB[180]})`;
  ctx.lineWidth   = 0.5;

  const nearScale = 1;
  const farT      = (TERRAIN_ROWS - 1) / (TERRAIN_ROWS - 1); // = 1
  const farScale  = 1 - ((TERRAIN_ROWS - 1) / TERRAIN_ROWS) * 0.92;
  const farY      = vpY + (nearY - vpY) * farT;  // = vpY (farthest row y ≈ vanishing point)

  for (let i = 0; i <= barCount; i++) {
    const nx = (i / barCount) * W * nearScale + (W - W * nearScale) / 2;
    const fx = (i / barCount) * W * farScale  + (W - W * farScale)  / 2;
    ctx.beginPath();
    ctx.moveTo(nx, nearY);
    ctx.lineTo(fx, farY);
    ctx.stroke();
  }
  ctx.restore();

  /* Draw rows back-to-front (farthest = r=47 first, nearest = r=0 last) */
  for (let r = TERRAIN_ROWS - 1; r >= 0; r--) {
    const t     = r / (TERRAIN_ROWS - 1);                     // 0=nearest … 1=farthest
    const scale = 1 - (r / TERRAIN_ROWS) * 0.92;
    const rowY  = nearY + (vpY - nearY) * t;
    const rowW  = W * scale;
    const rowX0 = (W - rowW) / 2;
    const barW  = rowW / barCount;
    const alpha = Math.pow(scale, 1.5) * vizFillAlpha;

    /* Circular buffer: r=0 is newest row, r=47 is oldest */
    const bufRow = ((terrainHead - 1 - r) + TERRAIN_ROWS * 4) % TERRAIN_ROWS;
    const rowOff = bufRow * barCount;

    /* Find peak value in this row for heat LUT */
    let maxVal = 0;
    for (let i = 0; i < barCount; i++) {
      if (terrainBuf[rowOff + i] > maxVal) maxVal = terrainBuf[rowOff + i];
    }
    const heatIdx = Math.min(255, Math.floor(maxVal * 255));

    /* Build filled polygon: baseline → bar tops → baseline */
    ctx.beginPath();
    ctx.moveTo(rowX0, rowY);

    /* Left edge up to first bar top */
    const firstH = terrainBuf[rowOff] * H * 0.3 * scale;
    ctx.lineTo(rowX0, rowY - firstH);

    /* Bar tops across the row */
    for (let i = 0; i < barCount; i++) {
      const bh = terrainBuf[rowOff + i] * H * 0.3 * scale;
      const x  = rowX0 + (i + 0.5) * barW;
      ctx.lineTo(x, rowY - bh);
    }

    /* Right edge down to baseline */
    const lastH = terrainBuf[rowOff + barCount - 1] * H * 0.3 * scale;
    ctx.lineTo(rowX0 + rowW, rowY - lastH);
    ctx.lineTo(rowX0 + rowW, rowY);
    ctx.closePath();

    ctx.fillStyle = `rgba(${heatR[heatIdx]},${heatG[heatIdx]},${heatB[heatIdx]},${alpha})`;
    ctx.fill();
  }
}
