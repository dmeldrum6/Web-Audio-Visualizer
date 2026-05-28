import { params } from '../params.js';
import { THEME, hexToRgb, hexToHsl, gradHueBase, setGradHueBase } from '../themes.js';

export const bgState = {
  image:      null,   /* HTMLImageElement | null */
  objectUrl:  null,   /* blob URL to revoke on clear */
  pattern:    null,   /* cached CanvasPattern for tile mode */
  patternImg: null,   /* image the pattern was built from */
  patternW:   -1,     /* canvas logical size at pattern creation */
  patternH:   -1,
};

export const radialImageState = {
  image:     null,   /* HTMLImageElement | null */
  objectUrl: null,   /* blob URL to revoke on clear */
};

export function drawBackground(ctx, W, H) {
  const img = bgState.image;
  if (!img) return;

  ctx.globalAlpha              = params.bgOpacity;
  ctx.globalCompositeOperation = params.bgBlend;

  switch (params.bgFit) {
    case 'cover': {
      const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const dw    = img.naturalWidth  * scale;
      const dh    = img.naturalHeight * scale;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      break;
    }
    case 'contain': {
      /* Remaining area already shows bgColor from the canvas clear */
      const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight);
      const dw    = img.naturalWidth  * scale;
      const dh    = img.naturalHeight * scale;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      break;
    }
    case 'stretch': {
      ctx.drawImage(img, 0, 0, W, H);
      break;
    }
    case 'tile': {
      if (bgState.patternImg !== img || bgState.patternW !== W || bgState.patternH !== H) {
        bgState.pattern    = ctx.createPattern(img, 'repeat');
        bgState.patternImg = img;
        bgState.patternW   = W;
        bgState.patternH   = H;
      }
      ctx.fillStyle = bgState.pattern;
      ctx.fillRect(0, 0, W, H);
      break;
    }
  }

  ctx.globalAlpha              = 1;
  ctx.globalCompositeOperation = 'source-over';
}

export function loadBackgroundFromFile(file) {
  if (bgState.objectUrl) URL.revokeObjectURL(bgState.objectUrl);
  const url = URL.createObjectURL(file);
  bgState.objectUrl = url;
  const img = new Image();
  img.onload = () => {
    bgState.image      = img;
    bgState.pattern    = null;
    bgState.patternImg = null;
    const thumb = document.getElementById('bg-thumbnail');
    thumb.src = url;
    thumb.classList.add('visible');
    document.getElementById('btn-clear-bg').style.display = '';
  };
  img.src = url;
}

export function loadBackgroundFromDataUrl(dataUrl) {
  const img = new Image();
  img.onload = () => {
    bgState.image      = img;
    bgState.pattern    = null;
    bgState.patternImg = null;
    const thumb = document.getElementById('bg-thumbnail');
    thumb.src = dataUrl;
    thumb.classList.add('visible');
    document.getElementById('btn-clear-bg').style.display = '';
  };
  img.src = dataUrl;
}

export function imageToDataUrl(img) {
  const maxDim = 1920;
  const scale  = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const c      = document.createElement('canvas');
  c.width      = Math.round(img.naturalWidth  * scale);
  c.height     = Math.round(img.naturalHeight * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.85);
}

export function clearBackground() {
  if (bgState.objectUrl) {
    URL.revokeObjectURL(bgState.objectUrl);
    bgState.objectUrl = null;
  }
  bgState.image      = null;
  bgState.pattern    = null;
  bgState.patternImg = null;

  params.bgOpacity = 1.0;
  params.bgBlend   = 'normal';
  params.bgFit     = 'cover';

  const thumb = document.getElementById('bg-thumbnail');
  thumb.classList.remove('visible');
  thumb.src = '';
  document.getElementById('btn-clear-bg').style.display = 'none';
  document.getElementById('ctrl-bg-opacity').value = '1.0';
  document.getElementById('val-bg-opacity').textContent = '1.0';
  document.getElementById('ctrl-bg-blend').value = 'normal';
  updateFitButtons('cover');
}

export function loadRadialImageFromFile(file) {
  if (radialImageState.objectUrl) URL.revokeObjectURL(radialImageState.objectUrl);
  const url = URL.createObjectURL(file);
  radialImageState.objectUrl = url;
  const img = new Image();
  img.onload = () => {
    radialImageState.image = img;
    const thumb = document.getElementById('radial-img-thumbnail');
    thumb.src = url;
    thumb.classList.add('visible');
    document.getElementById('btn-clear-radial-img').style.display = '';
  };
  img.src = url;
}

export function loadRadialImageFromDataUrl(dataUrl) {
  const img = new Image();
  img.onload = () => {
    radialImageState.image = img;
    const thumb = document.getElementById('radial-img-thumbnail');
    thumb.src = dataUrl;
    thumb.classList.add('visible');
    document.getElementById('btn-clear-radial-img').style.display = '';
  };
  img.src = dataUrl;
}

export function clearRadialImage() {
  if (radialImageState.objectUrl) {
    URL.revokeObjectURL(radialImageState.objectUrl);
    radialImageState.objectUrl = null;
  }
  radialImageState.image = null;

  params.radialImgOpacity = 1.0;

  const thumb = document.getElementById('radial-img-thumbnail');
  thumb.classList.remove('visible');
  thumb.src = '';
  document.getElementById('btn-clear-radial-img').style.display = 'none';
  document.getElementById('ctrl-radial-img-opacity').value = '1.0';
  document.getElementById('val-radial-img-opacity').textContent = '1.0';
}

export function updateFitButtons(fit) {
  document.querySelectorAll('.fit-btn[data-fit]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.fit === fit && !params.bgGradient);
  });
  const gradBtn = document.getElementById('btn-bg-gradient');
  if (gradBtn) gradBtn.classList.toggle('active', params.bgGradient);
}

/* ── Gradient Background ── */
let gradHue        = 0;
let gradBassSmooth = 0;
let gradMidSmooth  = 0;

function _gradBinRms(freq, lo, hi) {
  if (!freq || freq.length <= lo) return 0;
  const end = Math.min(hi, freq.length);
  let sum = 0;
  for (let i = lo; i < end; i++) { const v = freq[i] / 255; sum += v * v; }
  return Math.sqrt(sum / (end - lo));
}

export function drawGradientBackground(ctx, W, H, freq) {
  const bassRms = _gradBinRms(freq, 0, 11);
  const midRms  = _gradBinRms(freq, 20, 61);

  gradBassSmooth = gradBassSmooth * 0.92 + bassRms * 0.08;
  gradMidSmooth  = gradMidSmooth  * 0.88 + midRms  * 0.12;

  /* Hue drift: 0.05°/frame at idle, up to ~0.55°/frame with bass */
  gradHue = (gradHue + 0.05 + gradBassSmooth * 0.5) % 360;
  const hue = (gradHueBase + gradHue) % 360;

  /* Saturation: 10–75% driven by smoothed mid energy */
  const energy = Math.min(1, gradMidSmooth * 5);
  const sat    = 10 + 65 * energy;

  /* Lightness: 5–12% */
  const lit = 5 + 7 * energy;

  const cx = W / 2;
  const cy = H / 2;
  const r  = Math.sqrt(W * W + H * H) * 0.6;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, `hsl(${hue.toFixed(1)},${sat.toFixed(1)}%,${lit.toFixed(1)}%)`);
  grad.addColorStop(1, `hsl(${hue.toFixed(1)},10%,3%)`);

  ctx.globalAlpha              = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}
