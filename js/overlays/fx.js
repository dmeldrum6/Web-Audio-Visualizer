
/* ═══════════════════════════════════════════════════════════════
   AESTHETIC FX — post-processing passes on the main canvas
   Modes: vhs | crt | grain | glitch | chroma
═══════════════════════════════════════════════════════════════ */

/* Grain: cached noise canvas refreshed every other frame */
let _grainCanvas = null;
let _grainCtx    = null;
let _grainFrame  = 0;

function _ensureGrain(W, H) {
  if (!_grainCanvas || _grainCanvas.width !== W || _grainCanvas.height !== H) {
    _grainCanvas = document.createElement('canvas');
    _grainCanvas.width  = W;
    _grainCanvas.height = H;
    _grainCtx = _grainCanvas.getContext('2d');
    _grainFrame = 0;
  }
}

function _buildGrain(W, H) {
  const id = _grainCtx.createImageData(W, H);
  const d  = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const v   = (Math.random() * 255) | 0;
    d[i]      = v;
    d[i + 1]  = v;
    d[i + 2]  = v;
    d[i + 3]  = (Math.random() * 80) | 0;
  }
  _grainCtx.putImageData(id, 0, 0);
}

/* Glitch: working canvas for row-slice displacement */
let _glitchCanvas = null;
let _glitchCtx    = null;
let _glitchNext   = 0;   /* timestamp for next glitch event */
let _glitchActive = false;
let _glitchEnd    = 0;

function _ensureGlitch(W, H) {
  if (!_glitchCanvas || _glitchCanvas.width !== W || _glitchCanvas.height !== H) {
    _glitchCanvas = document.createElement('canvas');
    _glitchCanvas.width  = W;
    _glitchCanvas.height = H;
    _glitchCtx = _glitchCanvas.getContext('2d');
  }
}

/* ── VHS ──────────────────────────────────────────────────── */
function _applyVHS(ctx, W, H, intensity) {
  ctx.save();

  /* Scanlines */
  ctx.globalCompositeOperation = 'source-over';
  for (let y = 0; y < H; y += 3) {
    ctx.globalAlpha = 0.18 * intensity;
    ctx.fillStyle   = '#000';
    ctx.fillRect(0, y, W, 1);
  }

  /* Horizontal noise tape stripe */
  if (Math.random() < 0.25 * intensity) {
    const ny = Math.random() * H;
    const nh = 1 + Math.random() * 4;
    ctx.globalAlpha = 0.15 * intensity;
    ctx.fillStyle   = '#fff';
    ctx.fillRect(0, ny, W * (0.3 + Math.random() * 0.7), nh);
  }

  /* Horizontal noise tear — random offset stripe */
  if (Math.random() < 0.08 * intensity) {
    const ty  = Math.random() * H;
    const th  = 1 + Math.random() * 6;
    ctx.globalAlpha              = 0.4 * intensity;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle                = `hsl(${Math.random()*360},80%,70%)`;
    ctx.fillRect(0, ty, W * Math.random(), th);
  }

  /* Colour bleed — shift cyan layer slightly right */
  ctx.globalAlpha              = 0.06 * intensity;
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle                = `hsl(180,100%,60%)`;
  ctx.fillRect(2 * intensity, 0, W, H);

  /* Vignette darkening at edges */
  ctx.globalAlpha              = 0.25 * intensity;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.fillRect(0, 0, W * 0.015, H);
  ctx.fillRect(W * 0.985, 0, W * 0.015, H);

  ctx.restore();
}

/* ── CRT ──────────────────────────────────────────────────── */
function _applyCRT(ctx, W, H, intensity) {
  ctx.save();

  /* Phosphor dot matrix — draw a repeating semi-transparent grid */
  const dot = Math.max(2, Math.round(W / 640));
  const gap = dot * 3;
  ctx.globalAlpha              = 0.08 * intensity;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle                = '#000';
  for (let x = 0; x < W; x += gap) {
    for (let y = 0; y < H; y += gap) {
      ctx.fillRect(x, y, dot, dot);
    }
  }

  /* Scanlines — slightly thicker than VHS */
  ctx.globalAlpha = 0.12 * intensity;
  ctx.fillStyle   = '#000';
  for (let y = 0; y < H; y += 2) {
    ctx.fillRect(0, y, W, 1);
  }

  /* Phosphor green tint */
  ctx.globalAlpha              = 0.06 * intensity;
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle                = '#00ff44';
  ctx.fillRect(0, 0, W, H);

  /* Curved-screen corner vignette */
  ctx.globalAlpha              = 0.55 * intensity;
  ctx.globalCompositeOperation = 'source-over';
  const cr  = Math.min(W, H) * 0.15;
  const vg  = ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.35, W/2, H/2, Math.sqrt(W*W+H*H)*0.6);
  vg.addColorStop(0,   'rgba(0,0,0,0)');
  vg.addColorStop(0.75,'rgba(0,0,0,0)');
  vg.addColorStop(1,   'rgba(0,0,0,1)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  void cr;
  ctx.restore();
}

/* ── FILM GRAIN ───────────────────────────────────────────── */
function _applyFilmGrain(ctx, W, H, intensity) {
  _ensureGrain(W, H);
  /* Rebuild noise every 2 frames for subtle animation */
  if (++_grainFrame % 2 === 0) _buildGrain(W, H);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha              = 0.18 * intensity;
  ctx.drawImage(_grainCanvas, 0, 0);
  ctx.restore();
}

/* ── GLITCH ───────────────────────────────────────────────── */
function _applyGlitch(ctx, W, H, intensity) {
  _ensureGlitch(W, H);
  const now = performance.now();

  if (now > _glitchNext) {
    /* Schedule next glitch event */
    _glitchActive = true;
    _glitchEnd    = now + 80 + Math.random() * 120;
    _glitchNext   = now + 400 / intensity + Math.random() * 1200 / intensity;
  }
  if (_glitchActive && now > _glitchEnd) {
    _glitchActive = false;
  }
  if (!_glitchActive) return;

  ctx.save();

  /* Grab current frame */
  _glitchCtx.clearRect(0, 0, W, H);
  _glitchCtx.drawImage(ctx.canvas, 0, 0);

  const slices = 3 + Math.floor(Math.random() * 4 * intensity);
  for (let s = 0; s < slices; s++) {
    const sy     = Math.random() * H;
    const sh     = 2 + Math.random() * (H * 0.06);
    const dx     = (Math.random() - 0.5) * 40 * intensity;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha              = 0.85 + Math.random() * 0.15;
    ctx.drawImage(_glitchCanvas,
      0, sy, W, sh,
      dx, sy, W, sh);
  }

  /* RGB channel split flash */
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha              = 0.15 * intensity;
  ctx.fillStyle                = `hsl(${Math.random() * 360},100%,60%)`;
  ctx.fillRect(0, 0, W, H);

  ctx.restore();
}

/* ── CHROMATIC ABERRATION ─────────────────────────────────── */
let _chromaCanvas = null, _chromaCtx = null;

function _ensureChroma(W, H) {
  if (!_chromaCanvas || _chromaCanvas.width !== W || _chromaCanvas.height !== H) {
    _chromaCanvas = document.createElement('canvas');
    _chromaCanvas.width  = W;
    _chromaCanvas.height = H;
    _chromaCtx = _chromaCanvas.getContext('2d');
  }
}

function _applyChroma(ctx, W, H, intensity) {
  _ensureChroma(W, H);
  /* Copy current frame */
  _chromaCtx.clearRect(0, 0, W, H);
  _chromaCtx.drawImage(ctx.canvas, 0, 0);

  const shift = Math.round(4 * intensity);

  ctx.save();
  /* Red channel shifted right */
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha              = 0.45;
  ctx.filter                   = 'saturate(10) hue-rotate(0deg)';
  ctx.drawImage(_chromaCanvas, shift, 0);

  /* Blue channel shifted left */
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha              = 0.35;
  ctx.filter                   = 'saturate(10) hue-rotate(240deg)';
  ctx.drawImage(_chromaCanvas, -shift, 0);

  ctx.filter  = 'none';
  ctx.restore();
}

/* ── Public API ───────────────────────────────────────────── */
function applyFX(ctx, W, H, mode, intensity) {
  if (!mode || mode === 'none' || !intensity) return;
  switch (mode) {
    case 'vhs':    _applyVHS(ctx, W, H, intensity);        break;
    case 'crt':    _applyCRT(ctx, W, H, intensity);        break;
    case 'grain':  _applyFilmGrain(ctx, W, H, intensity);  break;
    case 'glitch': _applyGlitch(ctx, W, H, intensity);     break;
    case 'chroma': _applyChroma(ctx, W, H, intensity);     break;
  }
}
