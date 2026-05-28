import { params } from '../params.js';
import { BeatDetector } from '../audio/beat-detector.js';

export function applyBloom(outputCtx, sourceCanvas, bloomCanvas, bloomCtx, W, H) {
  if (params.bloomIntensity <= 0) return;

  const N         = params.bloomIntensity;
  const blurPx    = 4 + (N - 1) * 3.5;
  const baseAlpha = 0.3 + (N - 1) * 0.05;
  const energy    = BeatDetector.beatEnergy();
  const finalAlpha = Math.min(1, baseAlpha * (1 + energy * 0.5));

  bloomCtx.clearRect(0, 0, W, H);
  bloomCtx.filter = `blur(${blurPx}px)`;
  bloomCtx.drawImage(sourceCanvas, 0, 0, W, H);
  bloomCtx.filter = 'none';

  outputCtx.globalAlpha = finalAlpha;
  outputCtx.globalCompositeOperation = 'lighter';
  outputCtx.drawImage(bloomCanvas, 0, 0, W, H);
  outputCtx.globalCompositeOperation = 'source-over';
  outputCtx.globalAlpha = 1;
}
