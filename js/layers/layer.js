class Layer {
  constructor({ mode = 'bars', opacity = 1.0, blendMode = 'source-over', themeIndex = null } = {}) {
    this.id = crypto.randomUUID();
    this.mode = mode;
    this.opacity = opacity;
    this.blendMode = blendMode;
    this.themeIndex = themeIndex; // null = use global theme
    this.visible = true;
    this.canvas = null;
    this.ctx = null;
  }

  ensureCanvas(W, H) {
    if (!this.canvas || this.canvas.width !== W || this.canvas.height !== H) {
      this.canvas = document.createElement('canvas');  // NOT OffscreenCanvas — better browser compat
      this.canvas.width = W;
      this.canvas.height = H;
      this.ctx = this.canvas.getContext('2d');
    }
  }
}
