
let textOverlayStartTime = performance.now();
let overlaySpotCanvas = null, overlaySpotCtx = null, overlaySpotW = -1, overlaySpotH = -1;

/* Lower-third animation state */
const LOWER_THIRD_ANIM_MS = 400;
let lowerThirdPhase     = 'hidden'; // 'hidden' | 'in' | 'visible' | 'out'
let lowerThirdAnimStart = 0;

function triggerLowerThird() {
  lowerThirdPhase     = 'in';
  lowerThirdAnimStart = performance.now();
}

function resetOverlayTimer() {
  textOverlayStartTime = performance.now();
}

function overlaySeededRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function overlaySetBase(ctx, cr, cg, cb) {
  ctx.shadowBlur  = 8;
  ctx.shadowColor = `rgba(${cr},${cg},${cb},0.5)`;
}

function drawScrollOverlay(ctx, text, t, W, H, cr, cg, cb) {
  ctx.font         = `${params.overlayFontSize}px ${params.overlayFontFamily}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign    = 'left';
  ctx.fillStyle    = `rgba(${cr},${cg},${cb},${params.overlayOpacity})`;
  const tw    = ctx.measureText(text).width;
  const speed = 80 * (W / 800);
  const cycle = tw + W;
  const x     = W - ((t * speed) % cycle);
  ctx.fillText(text, x, H / 2);
}

function drawFadeOverlay(ctx, text, t, W, H, cr, cg, cb) {
  const sine    = (Math.sin(t * 0.8) + 1) / 2;
  const opacity = Math.max(0.15, params.overlayOpacity * sine);
  const scl     = 0.96 + sine * 0.08;
  ctx.font         = `${params.overlayFontSize * scl}px ${params.overlayFontFamily}`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = `rgba(${cr},${cg},${cb},${opacity})`;
  ctx.fillText(text, W / 2, H / 2);
}

function drawTypewriterOverlay(ctx, text, t, W, H, cr, cg, cb) {
  const REVEAL = 3.0, HOLD1 = 2.0, WIPE = 1.5, HOLD2 = 1.0;
  const cycle  = REVEAL + HOLD1 + WIPE + HOLD2;
  const phase  = t % cycle;
  const n      = text.length;
  let charCount;
  if      (phase < REVEAL)                 charCount = Math.floor((phase / REVEAL) * n);
  else if (phase < REVEAL + HOLD1)         charCount = n;
  else if (phase < REVEAL + HOLD1 + WIPE)  charCount = Math.floor(n * (1 - (phase - REVEAL - HOLD1) / WIPE));
  else                                      charCount = 0;
  if (charCount <= 0) return;
  const visible = text.slice(0, charCount);
  ctx.font         = `${params.overlayFontSize}px ${params.overlayFontFamily}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign    = 'left';
  ctx.fillStyle    = `rgba(${cr},${cg},${cb},${params.overlayOpacity})`;
  const fullW = ctx.measureText(text).width;
  ctx.fillText(visible, W / 2 - fullW / 2, H / 2);
}

function drawGlitchOverlay(ctx, text, t, W, H, cr, cg, cb) {
  const segId      = Math.floor(t / 0.4);
  const rng        = overlaySeededRng(segId * 137 + 42);
  const numEffects = Math.floor(rng() * 4);

  ctx.font         = `${params.overlayFontSize}px ${params.overlayFontFamily}`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  /* Effect 1 — contrasting color duplicate with x/y offset */
  if (numEffects >= 1) {
    const ox = (rng() - 0.5) * 12;
    const oy = (rng() - 0.5) * 8;
    ctx.fillStyle = rng() > 0.5 ? 'rgba(255,0,0,0.45)' : 'rgba(0,255,238,0.45)';
    ctx.fillText(text, W / 2 + ox, H / 2 + oy);
  }

  /* Effect 3 — character substitution (evaluated before effect 2 clip) */
  let displayText = text;
  if (numEffects >= 3) {
    const chars     = text.split('');
    const numSub    = 1 + Math.floor(rng() * 2);
    const glitchSet = '!@#$%^&*<>?/\\|{}[]~';
    for (let s = 0; s < numSub; s++) {
      const idx  = Math.floor(rng() * chars.length);
      chars[idx] = glitchSet[Math.floor(rng() * glitchSet.length)];
    }
    displayText = chars.join('');
  }

  /* Effect 2 — horizontal slice clipped and shifted */
  if (numEffects >= 2) {
    const sliceY  = H * (0.3 + rng() * 0.4);
    const sliceH2 = params.overlayFontSize * (0.2 + rng() * 0.3);
    const sliceX  = (rng() - 0.5) * 24;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, sliceY - sliceH2 / 2, W, sliceH2);
    ctx.clip();
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${params.overlayOpacity})`;
    ctx.fillText(displayText, W / 2 + sliceX, H / 2);
    ctx.restore();
  }

  /* Main draw */
  ctx.fillStyle = `rgba(${cr},${cg},${cb},${params.overlayOpacity})`;
  ctx.fillText(displayText, W / 2, H / 2);
}

function drawWaveOverlay(ctx, text, t, W, H, cr, cg, cb) {
  ctx.font         = `${params.overlayFontSize}px ${params.overlayFontFamily}`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = `rgba(${cr},${cg},${cb},${params.overlayOpacity})`;
  const amplitude = params.overlayFontSize * 0.3;
  const advances  = [];
  let totalWidth  = 0;
  for (let i = 0; i < text.length; i++) {
    const w = ctx.measureText(text[i]).width;
    advances.push(w);
    totalWidth += w;
  }
  let x = W / 2 - totalWidth / 2;
  for (let i = 0; i < text.length; i++) {
    const y = H / 2 + Math.sin(t * 2 + i * 0.4) * amplitude;
    ctx.fillText(text[i], x, y);
    x += advances[i];
  }
}

function drawSpotlightOverlay(ctx, text, t, W, H, cr, cg, cb) {
  const lx = W / 2 + W * 0.3 * Math.sin(t * 0.5);
  const ly = H / 2 + H * 0.25 * Math.sin(t * 0.3);

  ctx.font         = `${params.overlayFontSize}px ${params.overlayFontFamily}`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  /* Unlit base at 0.08 opacity */
  ctx.globalAlpha = 0.08 * params.overlayOpacity;
  ctx.fillStyle   = `rgb(${cr},${cg},${cb})`;
  ctx.fillText(text, W / 2, H / 2);
  ctx.globalAlpha = 1;

  /* Lit portion via offscreen canvas */
  const iW = Math.ceil(W), iH = Math.ceil(H);
  if (overlaySpotW !== iW || overlaySpotH !== iH) {
    overlaySpotCanvas        = document.createElement('canvas');
    overlaySpotCanvas.width  = iW;
    overlaySpotCanvas.height = iH;
    overlaySpotCtx           = overlaySpotCanvas.getContext('2d');
    overlaySpotW = iW; overlaySpotH = iH;
  }
  const sc = overlaySpotCtx;
  sc.clearRect(0, 0, iW, iH);
  sc.font         = `${params.overlayFontSize}px ${params.overlayFontFamily}`;
  sc.textAlign    = 'center';
  sc.textBaseline = 'middle';
  sc.shadowBlur   = 8;
  sc.shadowColor  = `rgba(${cr},${cg},${cb},0.5)`;
  sc.fillStyle    = `rgba(${cr},${cg},${cb},${params.overlayOpacity})`;
  sc.fillText(text, W / 2, H / 2);

  /* Spotlight radial gradient mask */
  const spotR = Math.max(W, H) * 0.28;
  const grad  = sc.createRadialGradient(lx, ly, 0, lx, ly, spotR);
  grad.addColorStop(0,    'rgba(255,255,255,1)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.7)');
  grad.addColorStop(1,    'rgba(255,255,255,0)');
  sc.globalCompositeOperation = 'destination-in';
  sc.fillStyle = grad;
  sc.fillRect(0, 0, iW, iH);
  sc.globalCompositeOperation = 'source-over';

  ctx.drawImage(overlaySpotCanvas, 0, 0);
}

function drawLowerThirdOverlay(ctx, W, H, cr, cg, cb) {
  const now = performance.now();

  /* Advance animation phase */
  if (lowerThirdPhase === 'in') {
    if (now - lowerThirdAnimStart >= LOWER_THIRD_ANIM_MS) {
      lowerThirdPhase     = 'visible';
      lowerThirdAnimStart = now;
    }
  } else if (lowerThirdPhase === 'visible' && params.overlayDuration > 0) {
    if (now - lowerThirdAnimStart >= params.overlayDuration * 1000) {
      lowerThirdPhase     = 'out';
      lowerThirdAnimStart = now;
    }
  } else if (lowerThirdPhase === 'out') {
    if (now - lowerThirdAnimStart >= LOWER_THIRD_ANIM_MS) {
      lowerThirdPhase = 'hidden';
    }
  }

  if (lowerThirdPhase === 'hidden') return;

  /* Compute eased progress (0 = off-screen below, 1 = resting position) */
  let progress;
  const elapsed = now - lowerThirdAnimStart;
  if (lowerThirdPhase === 'in') {
    const raw = Math.min(elapsed / LOWER_THIRD_ANIM_MS, 1);
    progress  = 1 - Math.pow(1 - raw, 3); // ease-out cubic
  } else if (lowerThirdPhase === 'visible') {
    progress = 1;
  } else {
    const raw = Math.min(elapsed / LOWER_THIRD_ANIM_MS, 1);
    progress  = Math.pow(1 - raw, 3); // ease-in cubic (reverse)
  }

  /* Bar geometry: top at H*0.82, height ~14% of H */
  const restingY = H * 0.82;
  const barH     = H * 0.14;
  const barY     = H + (restingY - H) * progress; // lerp from H to restingY

  /* Semi-transparent gradient background */
  ctx.shadowBlur = 0;
  const grad = ctx.createLinearGradient(0, barY, 0, barY + barH);
  grad.addColorStop(0, 'rgba(0,0,0,0.45)');
  grad.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, barY, W, barH);

  /* Accent vertical stripe (left edge) */
  const accentHex = params.overlayColor;
  ctx.fillStyle   = accentHex;
  ctx.fillRect(0, barY, 6, barH);

  /* Text positioning */
  const textX  = 6 + 32;
  const line1Y = barY + barH * 0.35;
  const line2Y = barY + barH * 0.72;

  /* Line 1 — song title (white, large, weight 600) */
  const title = params.overlayText.trim();
  if (title) {
    ctx.font         = `600 ${params.overlayFontSize * 1.2}px ${params.overlayFontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'left';
    ctx.fillStyle    = `rgba(255,255,255,${params.overlayOpacity})`;
    ctx.fillText(title, textX, line1Y);
  }

  /* Line 2 — subtitle (accent color, smaller) */
  const sub = params.overlaySubtext.trim();
  if (sub) {
    ctx.font      = `${params.overlayFontSize * 0.72}px ${params.overlayFontFamily}`;
    ctx.fillStyle = accentHex;
    ctx.globalAlpha = params.overlayOpacity;
    ctx.fillText(sub, textX, line2Y);
    ctx.globalAlpha = 1;
  }
}

function drawTextOverlay(ctx, logicalW, logicalH) {
  if (!params.overlayEnabled) return;
  const t            = (performance.now() - textOverlayStartTime) / 1000;
  const W            = logicalW, H = logicalH;
  const text         = params.overlayText;
  const [cr, cg, cb] = hexToRgb(params.overlayColor);

  if (params.overlayStyle === 'lower-third') {
    /* Lower-third has its own guard (phase gate) and doesn't need overlayText */
    ctx.save();
    drawLowerThirdOverlay(ctx, W, H, cr, cg, cb);
    ctx.restore();
    return;
  }

  if (!text.trim()) return;

  ctx.save();
  overlaySetBase(ctx, cr, cg, cb);

  switch (params.overlayStyle) {
    case 'scroll':     drawScrollOverlay(ctx, text, t, W, H, cr, cg, cb);     break;
    case 'fade':       drawFadeOverlay(ctx, text, t, W, H, cr, cg, cb);       break;
    case 'typewriter': drawTypewriterOverlay(ctx, text, t, W, H, cr, cg, cb); break;
    case 'glitch':     drawGlitchOverlay(ctx, text, t, W, H, cr, cg, cb);     break;
    case 'wave':       drawWaveOverlay(ctx, text, t, W, H, cr, cg, cb);       break;
    case 'spotlight':  drawSpotlightOverlay(ctx, text, t, W, H, cr, cg, cb);  break;
  }

  ctx.restore();
}
