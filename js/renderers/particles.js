
/* Particle pool — reused across frames */
const particlePool = [];

/* Spawn a single particle, reusing the first dead slot or creating a new one
   up to the current density cap. */
function spawnParticle(px, py, vx, vy, size) {
  const maxPool = params.particleDensity;
  let p = null;
  for (let i = 0; i < particlePool.length; i++) {
    if (particlePool[i].life <= 0) { p = particlePool[i]; break; }
  }
  if (!p) {
    if (particlePool.length >= maxPool) return;
    p = {};
    particlePool.push(p);
  }
  const accentHue = hexToHue(THEME.accent);
  const vMag      = Math.sqrt(vx * vx + vy * vy);
  p.x   = px;  p.y   = py;
  p.vx  = vx;  p.vy  = vy;
  p.life = 1;
  p.size = size;
  p.hue  = (accentHue + (vMag / 8) * 60) % 360;
  p.lifeDecay = 1 / (60 + Math.random() * 120);
}

function renderParticles(ctx, time, W, H, vizFillAlpha) {
  const cx = W / 2;
  const cy = H / 2;

  /* Subtle waveform behind particles */
  ctx.save();
  ctx.globalAlpha = 0.3;
  renderWaveform(ctx, time, W, H, vizFillAlpha);
  ctx.restore();

  /* Continuous drizzle from centre scaled by RMS */
  const rms      = computeRMS(time);
  const baseVel  = 0.5 + rms * 4;
  const nSpawn   = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < nSpawn; i++) {
    const angle = Math.random() * Math.PI * 2;
    const vel   = baseVel * (0.5 + Math.random() * 0.5);
    spawnParticle(cx, cy, Math.cos(angle) * vel, Math.sin(angle) * vel,
                  2 + Math.random() * 3);
  }

  /* Beat burst from centre; bass energy scales count 30–60 */
  if (BeatDetector.isBeat()) {
    const bassEnergy = BeatDetector.beatEnergy();
    const burst = Math.round(30 + bassEnergy * 30);
    for (let i = 0; i < burst; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel   = 3 + Math.random() * 5;
      spawnParticle(cx, cy, Math.cos(angle) * vel, Math.sin(angle) * vel,
                    2.5 + Math.random() * 2.5);
    }
  }

  /* Hit: 15–25 smaller fast particles from random edge positions inward */
  if (BeatDetector.isHit()) {
    const hitCount = 15 + Math.floor(Math.random() * 11);
    for (let i = 0; i < hitCount; i++) {
      const edge = Math.floor(Math.random() * 4);
      let px, py;
      if      (edge === 0) { px = Math.random() * W; py = 0; }
      else if (edge === 1) { px = Math.random() * W; py = H; }
      else if (edge === 2) { px = 0;                 py = Math.random() * H; }
      else                 { px = W;                 py = Math.random() * H; }
      const dx   = cx - px;
      const dy   = cy - py;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const vel  = 3 + Math.random() * 4;
      spawnParticle(px, py, (dx / dist) * vel, (dy / dist) * vel,
                    1.5 + Math.random() * 1.5);
    }
  }

  /* Update physics and draw live particles */
  for (let i = 0; i < particlePool.length; i++) {
    const p = particlePool[i];
    if (p.life <= 0) continue;

    p.vy   += 0.04;
    p.x    += p.vx;
    p.y    += p.vy;
    p.vx   *= 0.97;
    p.vy   *= 0.97;
    p.life -= p.lifeDecay;
    if (p.life < 0) p.life = 0;
    if (p.life === 0) continue;

    const drawSize = p.size * p.life;
    if (drawSize < 0.5) continue;

    ctx.beginPath();
    ctx.arc(p.x, p.y, drawSize, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue},100%,65%,${Math.sqrt(p.life) * vizFillAlpha})`;
    ctx.fill();
  }
}
