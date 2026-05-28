import { params } from '../params.js';
import { THEME } from '../themes.js';
import { AudioEngine } from '../audio/engine.js';

function formatTime(secs) {
  secs = Math.max(0, Math.floor(secs));
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
}

export function drawProgressBar(ctx, W, H) {
  if (!params.progressBar) return;
  if (AudioEngine.getSourceType() !== 'file') return;
  const dur = AudioEngine.fileGetDuration();
  if (dur <= 0) return;

  const pos      = AudioEngine.fileGetOffset();
  const progress = Math.min(1, pos / dur);
  const fillW    = progress * W;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  /* Background track — 15% opacity */
  ctx.globalAlpha = 0.15;
  ctx.fillStyle   = THEME.accent;
  ctx.fillRect(0, 0, W, 4);

  /* Filled portion — full opacity */
  if (fillW > 0) {
    ctx.globalAlpha = 1;
    ctx.fillStyle   = THEME.accent;
    ctx.fillRect(0, 0, fillW, 4);

    /* Glowing dot at right edge */
    const cx = fillW;
    const cy = 2;
    /* Bloom halo — radius 8, 20% opacity */
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = THEME.accent;
    ctx.fill();
    /* Opaque core — radius 4 */
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = THEME.accent;
    ctx.fill();
  }

  /* Time labels — only when canvas is tall enough */
  if (H > 300) {
    const elapsed   = formatTime(pos);
    const remaining = '-' + formatTime(dur - pos);
    ctx.globalAlpha   = 0.55;
    ctx.fillStyle     = '#ffffff';
    ctx.font          = '11px monospace';
    ctx.textBaseline  = 'top';
    ctx.textAlign     = 'left';
    ctx.fillText(elapsed, 6, 8);
    ctx.textAlign = 'right';
    ctx.fillText(remaining, W - 6, 8);
  }

  ctx.restore();
}

export function drawElapsedTimer(ctx, W, H) {
  if (!params.showTimer) return;

  const pos = AudioEngine.getSourceType() === 'file'
    ? AudioEngine.fileGetOffset()
    : 0;

  const mins = Math.floor(pos / 60);
  const secs = Math.floor(pos) % 60;
  const label = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

  const pad = 16;
  /* Sit above the progress bar (4 px) when it is visible */
  const bottomOffset = params.progressBar ? 4 : 0;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.8;
  ctx.font        = '18px monospace';
  ctx.fillStyle   = THEME.highlight;
  ctx.textBaseline = 'bottom';
  ctx.textAlign    = 'right';
  ctx.fillText(label, W - pad, H - pad - bottomOffset);
  ctx.restore();
}
