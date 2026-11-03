/* ═══════════════════════════════════════════════════════════════
   BLOOM — blurred copy of the frame added back with 'lighter'.

   The blur runs on a quarter-resolution copy: a glow is low-detail by
   nature, so upscaling it is visually identical while costing ~1/16th
   of a full-resolution blur (the difference between dropping frames
   and not at 1440p/4K).
═══════════════════════════════════════════════════════════════ */
const BLOOM_DOWNSCALE = 4;

let _bloomCanvas = null;
let _bloomCtx    = null;

function applyBloom(outputCtx, sourceCanvas, W, H) {
  if (params.bloomIntensity <= 0) return;

  const N          = params.bloomIntensity;
  const blurPx     = 4 + (N - 1) * 3.5;              /* in logical px */
  const baseAlpha  = 0.3 + (N - 1) * 0.05;
  const energy     = BeatDetector.beatEnergy();
  const finalAlpha = Math.min(1, baseAlpha * (1 + energy * 0.5));

  const bw = Math.max(1, Math.ceil(sourceCanvas.width  / BLOOM_DOWNSCALE));
  const bh = Math.max(1, Math.ceil(sourceCanvas.height / BLOOM_DOWNSCALE));
  if (!_bloomCanvas) {
    _bloomCanvas = document.createElement('canvas');
    _bloomCtx    = _bloomCanvas.getContext('2d');
  }
  if (_bloomCanvas.width !== bw || _bloomCanvas.height !== bh) {
    _bloomCanvas.width  = bw;
    _bloomCanvas.height = bh;
  }

  /* Logical px → bloom-canvas px */
  const scale = bw / W;
  _bloomCtx.setTransform(1, 0, 0, 1, 0, 0);
  _bloomCtx.clearRect(0, 0, bw, bh);
  _bloomCtx.filter = `blur(${Math.max(0.5, blurPx * scale).toFixed(2)}px)`;
  _bloomCtx.drawImage(sourceCanvas, 0, 0, bw, bh);
  _bloomCtx.filter = 'none';

  outputCtx.save();
  outputCtx.globalAlpha = finalAlpha;
  outputCtx.globalCompositeOperation = 'lighter';
  outputCtx.imageSmoothingEnabled = true;
  outputCtx.imageSmoothingQuality = 'medium';
  outputCtx.drawImage(_bloomCanvas, 0, 0, W, H);
  outputCtx.restore();
}
