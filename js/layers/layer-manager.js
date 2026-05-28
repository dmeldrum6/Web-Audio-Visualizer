import { Layer } from './layer.js';
import { renderMode } from '../renderers/index.js';

export class LayerManager {
  constructor() {
    this.layers = [];
  }

  addLayer(options) {
    const layer = new Layer(options);
    this.layers.push(layer);
    return layer;
  }

  removeLayer(id) {
    this.layers = this.layers.filter(l => l.id !== id);
  }

  moveUp(id) {
    const idx = this.layers.findIndex(l => l.id === id);
    if (idx > 0) {
      [this.layers[idx - 1], this.layers[idx]] = [this.layers[idx], this.layers[idx - 1]];
    }
  }

  moveDown(id) {
    const idx = this.layers.findIndex(l => l.id === id);
    if (idx >= 0 && idx < this.layers.length - 1) {
      [this.layers[idx], this.layers[idx + 1]] = [this.layers[idx + 1], this.layers[idx]];
    }
  }

  render(outputCtx, freq, time, W, H, vizFillAlpha, bgState, radialImageState) {
    for (const layer of this.layers) {
      if (!layer.visible) continue;
      layer.ensureCanvas(W, H);
      layer.ctx.clearRect(0, 0, W, H);
      renderMode(layer.ctx, layer.mode, freq, time, W, H, vizFillAlpha, bgState, radialImageState);
      outputCtx.globalAlpha = layer.opacity;
      outputCtx.globalCompositeOperation = layer.blendMode;
      outputCtx.drawImage(layer.canvas, 0, 0);
    }
    outputCtx.globalAlpha = 1;
    outputCtx.globalCompositeOperation = 'source-over';
  }
}
