
/* ═══════════════════════════════════════════════════════════════
   PER-ELEMENT AUDIO BINDINGS
   Four independent canvas elements each bound to a frequency
   band (bass / mids / highs) and driven by a mapped property.

   Elements:  circle | bar | ring | label
   Bands:     bass | mids | highs
   Properties:
     circle → size (radius fraction of min(W,H))
     bar    → width fraction of W
     ring   → radius + opacity
     label  → opacity + scale
═══════════════════════════════════════════════════════════════ */

const BINDING_DEFAULTS = {
  circle: {
    enabled: false, band: 'bass',
    minVal: 0.04, maxVal: 0.18,
    color: '', label: '',
  },
  bar: {
    enabled: false, band: 'mids',
    minVal: 0.1,  maxVal: 0.9,
    color: '', label: '',
  },
  ring: {
    enabled: false, band: 'highs',
    minVal: 0.15, maxVal: 0.45,
    color: '', label: '',
  },
  label: {
    enabled: false, band: 'bass',
    minVal: 0.2,  maxVal: 1.0,
    color: '', label: 'LIVE',
  },
};

/* Stored in params so presets can snapshot bindings */
if (!params.bindings) {
  params.bindings = JSON.parse(JSON.stringify(BINDING_DEFAULTS));
}

/* ── Frequency band energy (0..1) ────────────────────────── */
function _bandEnergy(freq, band) {
  if (!freq || !freq.length) return 0;
  const len = freq.length;
  let s, e;
  switch (band) {
    case 'bass':  s = 0;                   e = Math.floor(len * 0.07); break;
    case 'mids':  s = Math.floor(len * 0.07); e = Math.floor(len * 0.40); break;
    case 'highs': s = Math.floor(len * 0.40); e = Math.floor(len * 0.85); break;
    default: return 0;
  }
  let sum = 0;
  for (let i = s; i < e; i++) sum += freq[i];
  return sum / ((e - s) * 255);
}

function _map(energy, minVal, maxVal) {
  return minVal + energy * (maxVal - minVal);
}

/* ── Draw ─────────────────────────────────────────────────── */
function drawBindings(ctx, W, H, freq) {
  const b = params.bindings;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  /* — Circle — */
  if (b.circle.enabled) {
    const e = _bandEnergy(freq, b.circle.band);
    const r = _map(e, b.circle.minVal, b.circle.maxVal) * Math.min(W, H);
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
    ctx.strokeStyle = b.circle.color || THEME.accent;
    ctx.lineWidth   = Math.max(2, r * 0.06);
    ctx.globalAlpha = 0.75 + e * 0.25;
    ctx.stroke();
  }

  /* — Bar Strip — */
  if (b.bar.enabled) {
    const e    = _bandEnergy(freq, b.bar.band);
    const barW = _map(e, b.bar.minVal, b.bar.maxVal) * W;
    const barH = Math.max(4, H * 0.012);
    const x    = (W - barW) / 2;
    const y    = H * 0.88;
    ctx.globalAlpha = 0.6 + e * 0.4;
    ctx.fillStyle   = b.bar.color || THEME.highlight;
    const r = barH / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barW - r, y);
    ctx.arc(x + barW - r, y + r, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(x + r, y + barH);
    ctx.arc(x + r, y + r, r, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    ctx.fill();
  }

  /* — Ring — */
  if (b.ring.enabled) {
    const e = _bandEnergy(freq, b.ring.band);
    const r = _map(e, b.ring.minVal, b.ring.maxVal) * Math.min(W, H);
    ctx.globalAlpha = 0.3 + e * 0.6;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
    ctx.strokeStyle = b.ring.color || THEME.mid;
    ctx.lineWidth   = 2;
    ctx.setLineDash([6, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /* — Label — */
  if (b.label.enabled) {
    const e     = _bandEnergy(freq, b.label.band);
    const alpha = _map(e, b.label.minVal, b.label.maxVal);
    const scale = 0.85 + e * 0.3;
    const text  = b.label.label || 'LIVE';
    const size  = Math.round(H * 0.06);

    ctx.globalAlpha = alpha;
    ctx.font        = `700 ${size}px sans-serif`;
    ctx.fillStyle   = b.label.color || THEME.highlight;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.translate(W / 2, H * 0.12);
    ctx.scale(scale, scale);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  ctx.restore();
}
