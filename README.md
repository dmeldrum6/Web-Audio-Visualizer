# Web-Audio-Visualizer

A browser-based audio visualizer that reacts in real time to your microphone or local audio files. Create live visuals, record clips for social media, or use it as an ambient display — all from a single HTML file with no install required.

<img width="1916" height="908" alt="image" src="https://github.com/user-attachments/assets/6fd87d62-e433-467e-8fd5-316090911c64" />
*Bars mode with the Midnight theme*

---

## Features

- **Three visualizer modes** — spectrum bars, oscilloscope waveform, and scrolling spectrogram
- **Two audio inputs** — microphone or local audio file
- **Full file playback controls** — play, pause, stop, seek, loop, and variable playback speed
- **Text overlay system** — six animation styles composited directly onto the canvas
- **Theme engine** — six built-in color themes, applied instantly
- **Preset system** — eight built-in presets plus save/load via localStorage
- **URL sharing** — encode any preset as a shareable link via URL hash
- **1080p WebM recording** — canvas + audio mixed and exported directly from the browser
- **PWA support** — installable and works offline
- **Single file** — no build step, no dependencies, no server required

---

## Quick Start

1. Download `visualizer.html`
2. Open it in Chrome or Edge
3. Click **Use Mic** or **Load File** to begin
4. Pick a visualizer mode and theme from the sidebar
5. Hit **Record** when you're ready to capture

> Safari has limited recording support. For best results use Chrome or Edge.

---

## Interface

### Layout

The interface has three regions:

- **Top bar** — app title, loaded file name, and the Record button
- **Sidebar** — all controls, collapsible by section
- **Canvas** — the visualizer output, fills the remaining space and resizes with the window

---

## Audio Input

Select your source from the top of the sidebar:

| Control | Description |
|---|---|
| Use Mic | Requests microphone access and begins streaming |
| Load File | Opens a file picker (accepts any audio format) |
| Level meter | Displays RMS level in real time |
| CLIP badge | Appears in red when the signal exceeds 90% of maximum |

---

## Playback Controls

The playback bar appears automatically when a file is loaded. It is hidden during mic input.

| Control | Description |
|---|---|
| Play / Pause | Toggle playback (also mapped to **Space**) |
| Stop | Stop and reset position to 0:00 |
| Seek bar | Scrub to any position in the file |
| Loop | Repeat the file continuously when enabled |
| Speed | Playback rate: 0.5×, 0.75×, 1×, 1.25×, 1.5×, 2× |

**Keyboard shortcuts** (when a file is loaded):

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `←` / `→` | Seek −5 / +5 seconds |

---

## Visualizer Modes

Switch modes from the sidebar or press **M** to cycle through them. Switching fades the canvas to black before the new mode starts.

### Bars
<img width="1658" height="779" alt="image" src="https://github.com/user-attachments/assets/9f43263c-9e54-43f4-99e8-7ec6b0572761" />
*Spectrum bars with mirror and the Neon theme*

Frequency spectrum rendered as vertical bars growing from the center. Supports mirror mode (left/right symmetry) and a configurable bar count.

### Waveform
<img width="1234" height="662" alt="image" src="https://github.com/user-attachments/assets/a0386db3-6acd-447f-8d93-c2d18b395ae9" />
*Oscilloscope waveform with fill enabled*

Time-domain signal drawn as a continuous polyline. Optional area fill between the waveform and center line.

### Spectrogram
<img width="1236" height="663" alt="image" src="https://github.com/user-attachments/assets/9fcb93dc-85a2-42f0-9bab-82ec7eb95cec" />
*Scrolling spectrogram with the Ember theme*

Frequency content scrolls left over time. Color maps dB values through a heatmap palette (black → purple → red → yellow → white). Useful for spotting pitch, harmonics, and transients.

---

## Analyzer Controls

| Control | Range | Description |
|---|---|---|
| FFT size | 2048 – 32768 | Frequency resolution. Higher = more detail, more CPU |
| Smoothing | 0 – 0.95 | Temporal averaging. Higher = slower, smoother response |
| Gain | 0.1 – 4.0 | Input amplification before analysis |

---

## Visual Controls

| Control | Description |
|---|---|
| Motion amount | Scales all animation speeds and effect intensities |
| Mirror | Bars mode: reflects the spectrum left/right |
| Fill | Waveform mode: toggles the area fill |
| Bar count | Bars mode: 32 – 256 bars |

---

## Themes

Click any swatch to apply a theme instantly. The active theme is shown with a white ring.

| Theme | Character |
|---|---|
| Midnight | Deep blue and cyan |
| Ember | Dark background, orange and red |
| Forest | Dark background, greens |
| Neon | Black, magenta, and cyan |
| Monochrome | Grayscale |
| Sunrise | Dark background, pink and gold |

---

## Presets

Presets capture the full visualizer state: mode, analyzer settings, theme, and text overlay.

### Built-in presets (keyboard: `1` – `8`)

| # | Name | Mode | Theme |
|---|---|---|---|
| 1 | Classic Bars | Bars | Midnight |
| 2 | Deep Waveform | Waveform | Neon |
| 3 | Heat Map | Spectrogram | Ember |
| 4 | Mirror Dance | Bars | Sunrise |
| 5 | Forensic | Spectrogram | Monochrome |
| 6 | Minimal Wave | Waveform | Monochrome |
| 7 | Forest Pulse | Bars | Forest |
| 8 | Neon Storm | Bars | Neon |

### Saving and sharing

- **Save current** — prompts for a name and stores to localStorage
- **Copy link** — encodes the current preset as a URL hash and copies it to the clipboard
- Loading a shared URL applies the preset automatically before the first frame renders

---

## Text Overlay
<img width="1228" height="655" alt="image" src="https://github.com/user-attachments/assets/d312f89d-de23-4f76-942e-f95c5e3faa0f" />

Text is drawn directly onto the visualizer canvas each frame, so it is automatically included in recordings.

### Options

| Option | Description |
|---|---|
| Text | Up to 80 characters |
| Enable toggle | Show or hide the overlay without clearing the text |
| Font size | 24 – 120px |
| Font family | Sans-serif, Serif, Monospace, Impact, Cursive |
| Color | Native color picker |
| Opacity | 0.1 – 1.0 |
| Style | One of six animation styles |

### Animation styles

| Style | Description |
|---|---|
| **Scroll** | Text moves right-to-left continuously across the canvas, looping seamlessly |
| **Fade** | Text pulses in and out with a slow sine wave; font size breathes subtly in sync |
| **Typewriter** | Characters appear one at a time, hold, then wipe — repeating on a cycle |
| **Glitch** | Periodic color offsets, horizontal slices, and random character substitutions |
| **Wave** | Each character bobs on an individual sine wave, phase-offset from its neighbors |
| **Spotlight** | Text is stationary; a radial light source drifts in a figure-eight path across it |

Text overlay settings are saved as part of presets and encoded in shared URLs.

---

## Recording

Click **Record** in the top bar to begin. The canvas and audio are mixed together into a single WebM file.

- Format: WebM (VP9 + Opus)
- Max resolution: 1080p at 30fps
- Max duration: 5 minutes (auto-stops at 5:00 with a warning at 4:50)
- Output: auto-downloaded as `visualizer-{timestamp}.webm`

> **Safari:** MediaRecorder support is limited. Recording is available in Chrome and Edge. Safari users will see a notification with instructions for screen capture instead.

---

## Keyboard Shortcuts

Press `?` anywhere in the app to open the shortcut reference.

| Key | Action |
|---|---|
| `Space` | Play / Pause (file mode) |
| `M` | Cycle visualizer mode |
| `R` | Start / Stop recording |
| `1` – `8` | Load preset by number |
| `←` / `→` | Seek −5 / +5 seconds (file mode) |

---

## Mobile

On screens narrower than 768px the sidebar collapses into a bottom drawer. Tap the toggle button (bottom-right) to open and close it. Swipe left or right on the canvas to cycle visualizer modes.

> iOS requires a tap to unlock the AudioContext. A brief overlay prompts for this on first load.

---

## Browser Support

| Browser | Visualizer | Recording | Notes |
|---|---|---|---|
| Chrome | ✅ | ✅ | Recommended |
| Edge | ✅ | ✅ | |
| Firefox | ✅ | ✅ | WebM supported |
| Safari | ✅ | ⚠️ | No MediaRecorder for WebM |
| iOS Safari | ✅ | ⚠️ | Tap-to-unlock required |

---

## Architecture

The app is a single self-contained HTML file. No framework, no build step, no network requests.

```
visualizer.html
├── AudioEngine          Web Audio API graph (source → gain → analyser → compressor → destination)
├── Render loop          requestAnimationFrame at 60fps; typed arrays reused each frame
├── Visualizers          Canvas 2D: Bars, Waveform, Spectrogram
├── TextOverlay          Six animation styles drawn onto the canvas post-visualizer
├── ThemeEngine          Six themes; applies to all canvas draw calls
├── PresetSystem         JSON schema; localStorage; URL hash encode/decode
└── Recorder             canvas.captureStream + MediaStreamDestination → MediaRecorder → WebM
```

### Audio graph

```
MediaStream (mic)  ─┐
                    ├─→ GainNode → AnalyserNode → DynamicsCompressor → AudioContext.destination
BufferSource (file)─┘                │
                                     └─→ MediaStreamDestination (for recording)
```

---

## Suggested Workflow for Social Clips

1. Load an audio file and use the **playback controls** to find the section you want
2. Pick a visualizer mode and preset that suits the track's energy
3. Add a **text overlay** (artist name, track title, or lyric snippet)
4. Hit **Record**, let it run for 15–60 seconds, then stop
5. The WebM downloads automatically — ready to upload or trim in your editor

---

## License

MIT — do whatever you like with it.
