
const artistCardState = {
  image:     null,   /* HTMLImageElement | null */
  objectUrl: null,   /* blob URL to revoke on clear */
};

/* Artist card beat-pulse state (1.0 = rest, 1.15 = peak) */
let artistCardBeatPulse    = 1.0;   // drives image scale
let artistCardBgBeatAlpha  = 0.0;   // extra bg alpha on beat (0 = rest)
let artistCardGlowAlpha    = 0.0;   // glow text alpha (0 = rest)

function setArtistCardBeatState(pulse, bgAlpha, glowAlpha) {
  artistCardBeatPulse   = pulse;
  artistCardBgBeatAlpha = bgAlpha;
  artistCardGlowAlpha   = glowAlpha;
}

/* Artist card record-timer state */
let artistCardTimerActive  = false;
let artistCardTimerEndTime = 0;

function startArtistCardTimer(durationMs) {
  artistCardTimerActive  = true;
  artistCardTimerEndTime = Date.now() + durationMs;
}

function drawArtistCard(ctx, W, H) {
  if (!params.artistCardEnabled) return;

  /* Timer-driven fade-out triggered by record start */
  let timerAlpha = 1.0;
  if (artistCardTimerActive) {
    const remaining = artistCardTimerEndTime - Date.now();
    if (remaining <= 0) {
      artistCardTimerActive = false;
      return;
    }
    const FADE_MS = 1000;
    timerAlpha = remaining < FADE_MS ? remaining / FADE_MS : 1.0;
  }

  /* Decay beat-pulse state toward rest values each frame */
  artistCardBeatPulse   = artistCardBeatPulse   + (1.0 - artistCardBeatPulse)   * 0.12;
  artistCardBgBeatAlpha = artistCardBgBeatAlpha + (0.0 - artistCardBgBeatAlpha) * 0.12;
  artistCardGlowAlpha   = artistCardGlowAlpha   + (0.0 - artistCardGlowAlpha)   * 0.12;

  const PANEL_W = 220;
  const PAD     = 16;
  const IMG_D   = 160;
  const IMG_R   = IMG_D / 2;
  const NAME_SZ = 22;
  const TITLE_SZ = 16;
  const GAP_IMG_NAME  = 14;
  const GAP_NAME_TITLE = 6;

  /* Vertical center for the three-element group */
  const groupH = IMG_D + GAP_IMG_NAME + NAME_SZ + GAP_NAME_TITLE + TITLE_SZ;
  const groupY = (H - groupH) / 2;
  const cx     = PANEL_W / 2;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = params.artistCardOpacity * timerAlpha;

  /* Semi-transparent panel background — brightens on beat */
  const bgAlpha = 0.45 + artistCardBgBeatAlpha;
  ctx.fillStyle = `rgba(0,0,0,${bgAlpha})`;
  ctx.fillRect(0, 0, PANEL_W, H);

  /* Circular image crop — scales outward on beat */
  const pulse  = artistCardBeatPulse;
  const imgCx  = cx;
  const imgCy  = groupY + IMG_R;
  const pulseR = IMG_R * pulse;
  const pulseD = IMG_D * pulse;

  ctx.save();
  ctx.beginPath();
  ctx.arc(imgCx, imgCy, pulseR, 0, Math.PI * 2);
  ctx.clip();

  if (artistCardState.image) {
    /* Draw image scaled to fill the (pulsed) circle */
    const img  = artistCardState.image;
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx   = (img.naturalWidth  - side) / 2;
    const sy   = (img.naturalHeight - side) / 2;
    ctx.drawImage(img, sx, sy, side, side, imgCx - pulseR, imgCy - pulseR, pulseD, pulseD);
  } else {
    /* Placeholder: accent-colored circle with music note */
    ctx.fillStyle = THEME.accent;
    ctx.fillRect(imgCx - pulseR, imgCy - pulseR, pulseD, pulseD);
    ctx.font         = `bold ${pulseR * 0.9}px sans-serif`;
    ctx.fillStyle    = '#ffffff';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♪', imgCx, imgCy);
  }

  ctx.restore();

  /* Artist name — bold, theme accent/highlight color */
  const nameY  = groupY + IMG_D + GAP_IMG_NAME + NAME_SZ / 2;
  ctx.font         = `bold ${NAME_SZ}px system-ui,-apple-system,sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  const nameText = params.artistCardName.trim() || 'Artist Name';

  /* Glow pass — accent color at decaying alpha, offset 1px down */
  if (artistCardGlowAlpha > 0.005) {
    const [ar, ag2, ab] = hexToRgb(THEME.accent);
    ctx.fillStyle = `rgba(${ar},${ag2},${ab},${artistCardGlowAlpha})`;
    ctx.fillText(nameText, cx, nameY + 1, PANEL_W - PAD * 2);
  }

  /* Normal name pass */
  ctx.fillStyle = THEME.highlight;
  ctx.fillText(nameText, cx, nameY, PANEL_W - PAD * 2);

  /* Track title — smaller, white at 70% opacity */
  if (params.artistCardTitle.trim()) {
    const titleY = nameY + NAME_SZ / 2 + GAP_NAME_TITLE + TITLE_SZ / 2;
    ctx.font         = `${TITLE_SZ}px system-ui,-apple-system,sans-serif`;
    ctx.fillStyle    = 'rgba(255,255,255,0.7)';
    ctx.fillText(params.artistCardTitle.trim(), cx, titleY, PANEL_W - PAD * 2);
  }

  ctx.restore();
}
