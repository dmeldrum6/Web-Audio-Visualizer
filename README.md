# Web-Audio-Visualizer

A browser-based audio visualizer that reacts in real time to your microphone or local audio files. Create live visuals, record clips for YouTube and social media, or use it as an ambient display — all from a single HTML file with no install required.

<img width="1917" height="901" alt="image" src="https://github.com/user-attachments/assets/068002af-dc16-4fbb-9466-bbd4da53ada8" />
*Radial mode with ember theme*

---

## Features

- **Eight visualizer modes** — spectrum bars, oscilloscope waveform, scrolling spectrogram, radial bars, particle system, frequency rings, Lissajous scope, and 3D terrain
- **Two audio inputs** — microphone or local audio file
- **Full file playback controls** — play, pause, stop, seek, loop, and variable playback speed
- **Beat detection** — real-time onset detection drives flash effects, particle bursts, and ring ripples
- **Bloom / glow effect** — post-processing glow composited over the visualizer each frame
- **Motion trail** — persistent canvas decay for ghost-echo and smear effects
- **Text overlay system** — seven animation styles composited directly onto the canvas, including a broadcast-style lower third
- **Audio-reactive background gradient** — procedural background that shifts hue and saturation with the music
- **YouTube Mode** — 16:9 canvas lock, 12 Mbps VP9 recording, and a canvas-rendered progress bar
- **Theme engine** — six built-in color themes, applied instantly
- **Preset system** — eight built-in presets plus save/load via localStorage
- **URL sharing** — encode any preset as a shareable link via URL hash
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

- **Top bar** — app title, loaded file name, YouTube Mode toggle, and the Record button
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

Frequency spectrum rendered as vertical bars growing from the center. Supports mirror mode (left/right symmetry) and a configurable bar count.

### Waveform

Time-domain signal drawn as a continuous polyline. Optional area fill between the waveform and center line.

### Spectrogram

Frequency content scrolls left over time. Color maps dB values through a heatmap palette (black → purple → red → yellow → white). Useful for spotting pitch, harmonics, and transients.

### Radial

Frequency bars arranged in a circle, radiating outward from a central disc. If a background image is loaded it is clipped into the centre circle. Supports mirror symmetry and a slow canvas rotation that scales with the Motion Amount control. The inner radius pulses outward briefly on each detected beat.

### Particles

A physics-based particle system driven by audio energy. Particles drift outward from the canvas centre with velocity proportional to the current RMS level. Bass beats trigger large bursts from the centre; high-frequency hits scatter smaller particles inward from the edges. A subtle waveform line runs behind the particles so there is always something visible during quiet passages. Particle density is adjustable via the **Density** slider.

### Rings

Six concentric rings, each mapped to a distinct frequency band (sub-bass through treble). Ring stroke width swells with band energy. Ghost rings at fixed radii remain visible during silence so the structure is always readable. Beat events emit outward ripple circles that expand and fade over ~600 ms.

### Scope

A Lissajous / oscilloscope display. The first and second halves of the time-domain buffer are plotted against each other on the X and Y axes, producing figures that evolve as the music changes. A persistent trail of the last eight frames gives a glowing comet-tail effect. Toggle **Mono phase delay** in the sidebar to switch between split-buffer and delay-offset plotting — the delay mode works well for mono files.

### Terrain

A scrolling 3D-perspective frequency landscape rendered with Canvas 2D. Each animation frame writes the current frequency data into a 48-row circular buffer; rows are projected back to a vanishing point, producing the appearance of flying over the music. Peak height is color-mapped through the heat palette. Faint perspective grid lines reinforce the 3D effect. The **Speed** slider controls how quickly new rows scroll into view.

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
| Mirror | Bars / Radial: reflects the spectrum symmetrically |
| Fill | Waveform: toggles the area fill |
| Bar count | Bars / Radial / Terrain: 32 – 256 bars |
| Trail | Persistent canvas decay. 0 = off (standard clear each frame); higher values leave ghost echoes of previous frames |
| Bloom | Post-processing glow intensity. 0 = off; higher values composite a blurred copy of the frame back with additive blending. Glow intensity rises briefly on detected beats |
| Density | Particles mode: maximum particle pool size, 50 – 400 |

---

## Beat Detection

The beat detector monitors low-frequency and high-frequency energy each frame and fires discrete events when a significant spike is detected above the rolling average.

| Control | Description |
|---|---|
| Enable toggle | Turns beat detection on or off globally |
| Sensitivity | Detection threshold multiplier, 1.1 (fires on small spikes) – 2.0 (only hard hits). Default 1.4 |
| Beat indicator | A small circle in the sidebar that flashes on each detected bass beat |

When a bass beat fires, a brief white flash (≈150 ms, low opacity) is composited over the canvas. Beat events also trigger: radial inner-radius pulse, particle bursts, and ring ripples.

---

## Background

| Option | Description |
|---|---|
| Image | Upload any image; set fit (cover / contain / stretch / tile), opacity, and blend mode |
| Gradient | Procedural audio-reactive radial gradient. Hue drifts slowly, driven by bass energy; saturation rises with mid-frequency energy; brightness stays low so the visualizer remains readable over it. Animates even when paused |
| Solid | Plain background color from the active theme |

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

Presets capture the full visualizer state: mode, analyzer settings, visual controls, theme, beat detection settings, and text overlay.

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

Text is drawn directly onto the visualizer canvas each frame, so it is automatically included in recordings.

### Options

| Option | Description |
|---|---|
| Text | Up to 80 characters (used as the song title in Lower Third style) |
| Subtitle | Secondary line shown beneath the title in Lower Third style (artist name, genre, etc.) |
| Enable toggle | Show or hide the overlay without clearing the text |
| Font size | 24 – 120px |
| Font family | Sans-serif, Serif, Monospace, Impact, Cursive |
| Color | Native color picker |
| Opacity | 0.1 – 1.0 |
| Style | One of seven animation styles |
| Duration | Lower Third only: seconds before the bar slides back out. 0 = always visible |
| Show Lower Third | Triggers the slide-in animation manually — useful for timing it after recording starts |

### Animation styles

| Style | Description |
|---|---|
| **Scroll** | Text moves right-to-left continuously across the canvas, looping seamlessly |
| **Fade** | Text pulses in and out with a slow sine wave; font size breathes subtly in sync |
| **Typewriter** | Characters appear one at a time, hold, then wipe — repeating on a cycle |
| **Glitch** | Periodic color offsets, horizontal slices, and random character substitutions |
| **Wave** | Each character bobs on an individual sine wave, phase-offset from its neighbors |
| **Spotlight** | Text is stationary; a radial light source drifts in a figure-eight path across it |
| **Lower Third** | A broadcast-style bar at the bottom of the canvas. A solid accent-colored stripe runs on the left edge; the Text field renders as a large title and the Subtitle field renders smaller beneath it in the accent color. The bar slides up from below on trigger and optionally auto-hides after the set Duration |

Text overlay settings are saved as part of presets and encoded in shared URLs.

---

## Recording

Click **Record** in the top bar to begin. The canvas and audio are mixed together into a single WebM file.

- Format: WebM (VP9 + Opus), falling back to VP8 if VP9 is unavailable
- Standard resolution: up to 1080p at 30 fps, ~5 Mbps
- YouTube Mode resolution: 1920 × 1080 at 12 Mbps VP9 — see below
- Max duration: 5 minutes (auto-stops at 5:00 with a warning at 4:50)
- Output: auto-downloaded as `visualizer-{timestamp}.webm`

> **Safari:** MediaRecorder support is limited. Recording is available in Chrome and Edge. Safari users will see a notification with instructions for screen capture instead.

---

## YouTube Mode

Click **YT 1080p** in the top bar to enable YouTube Mode before recording.

| Behaviour | Detail |
|---|---|
| Canvas aspect ratio | Locked to 16:9. If your monitor is not 16:9 the canvas scales down with black bars filling the remainder |
| Internal resolution | Always 1920 × 1080, regardless of window size |
| Recording bitrate | 12 Mbps VP9 (VP8 fallback) — high enough that YouTube's re-encode retains quality |
| Composition guide | A faint dashed border shows the exact 16:9 capture area while YouTube Mode is active. The guide is hidden during recording |

YouTube Mode is designed to be paired with the **Lower Third** overlay and the **Progress Bar** for a complete music-video presentation.

---

## Progress Bar Overlay

Enable **Progress Bar** in the sidebar to draw a playback timeline directly onto the canvas (and therefore into recordings).

- A 4 px bar runs across the very top of the canvas, filled in the current theme accent color
- A faint full-width track shows the total duration at 15% opacity behind it
- A small glowing dot marks the playhead
- Elapsed and remaining timestamps (MM:SS) appear at the top corners in a small monospace font
- Only visible when a file is loaded; hidden during mic input

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
├── BeatDetector         Per-frame energy spike detection for bass and treble bands
├── Render loop          requestAnimationFrame at 60fps; typed arrays reused each frame
├── Visualizers          Canvas 2D: Bars, Waveform, Spectrogram, Radial, Particles, Rings, Scope, Terrain
├── PostProcessing       Bloom (off-screen canvas + additive blend), motion trail (persistent clear)
├── TextOverlay          Seven animation styles drawn onto the canvas post-visualizer
├── ThemeEngine          Six themes; applies to all canvas draw calls
├── PresetSystem         JSON schema; localStorage; URL hash encode/decode
└── Recorder             canvas.captureStream + MediaStreamDestination → MediaRecorder → WebM
```

### Audio graph

```
MediaStream (mic)  ─┐
                    ├─→ GainNode → AnalyserNode → DynamicsCompressor → AudioContext.destination
BufferSource (file)─┘       │            │
                            │            └─→ BeatDetector (reads frequency + time-domain data)
                            └─→ MediaStreamDestination (for recording)
```

---

## Suggested Workflow for YouTube Music Videos

1. Load an audio file and use the **playback controls** to find your start point
2. Enable **YouTube Mode** (YT 1080p) in the top bar to lock the 16:9 frame
3. Pick a visualizer mode — **Radial** or **Particles** work well for most music
4. Set a **theme** and optionally enable the **Gradient** background for a fully reactive look
5. Add a **Lower Third** overlay with the song title and artist name; adjust Duration or leave it always visible
6. Enable the **Progress Bar** overlay so viewers can see where they are in the track
7. Dial in **Bloom** and **Trail** to taste — a little of both goes a long way
8. Hit **Record**, let the track play from the beginning, then stop
9. The WebM downloads automatically — ready to upload directly to YouTube or trim in your editor

---

## License

MIT — do whatever you like with it.
