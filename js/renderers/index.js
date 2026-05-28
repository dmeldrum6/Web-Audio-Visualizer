
/* bgState and radialImageState are passed from main for renderers that need them */
function renderMode(ctx, mode, freq, time, W, H, vizFillAlpha, bgState, radialImageState) {
  switch (mode) {
    case 'bars':        renderBars(ctx, freq, W, H, vizFillAlpha);                               break;
    case 'waveform':    renderWaveform(ctx, time, W, H, vizFillAlpha);                           break;
    case 'spectrogram': renderSpectrogram(ctx, freq, W, H, vizFillAlpha);                        break;
    case 'radial':      renderRadial(ctx, freq, W, H, vizFillAlpha, bgState, radialImageState);  break;
    case 'particles':   renderParticles(ctx, time, W, H, vizFillAlpha);                          break;
    case 'rings':       renderRings(ctx, freq, W, H, vizFillAlpha);                              break;
    case 'scope':       renderScope(ctx, time, W, H, vizFillAlpha);                              break;
    case 'terrain':     renderTerrain(ctx, freq, W, H, vizFillAlpha);                            break;
  }
}
