# Web-Audio-Visualizer

A browser-based audio visualizer that reacts in real time to your microphone or local audio files. Create live visuals, record clips for YouTube and social media, or use it as an ambient display. Plain HTML, CSS and JavaScript: no build step and nothing to install.

<img width="1917" height="901" alt="image" src="https://github.com/user-attachments/assets/068002af-dc16-4fbb-9466-bbd4da53ada8" />
*Radial mode with ember theme*

---

## Features

- **Eight visualizer modes** — spectrum bars, oscilloscope waveform, scrolling spectrogram, radial bars, particle system, frequency rings, Lissajous scope, and 3D terrain
- **Layer compositor** — stack 2–4 visualizer modes with independent opacity and blend mode controls for richly layered results
- **BPM Lock / Tempo Sync** — tap-tempo or manual BPM entry, with subdivision control (whole / half / quarter / eighth note) so beat events fire locked to the tempo rather than chasing peaks
- **Aesthetic FX** — five post-processing passes (VHS, CRT, Film Grain, Glitch, Chromatic Aberration) with intensity control, applied after all rendering and bloom
- **Per-element audio bindings** — four independent canvas elements (circle, bar strip, ring, label) each individually bound to bass / mids / highs with configurable amplitude range
- **Frame-perfect MP4 export** — render a whole song offline, frame by frame, at 1080p / 1440p / 4K and 30 or 60 fps. No dropped frames whatever the effects, and the original audio is carried over untouched
- **Record Song** — one click rewinds, records the full track in real time, and saves automatically when it ends
- **4K / custom resolution export** — choose 1080p, 1440p, or 4K (2160p) from the top bar before recording; canvas and bitrate scale automatically
- **Musical (log) frequency axis** — bars, radial, terrain and spectrogram spread 30 Hz – 16 kHz evenly per octave, so bass and vocals get as much space as treble
- **Two audio inputs** — microphone or local audio file
- **Full file playback controls** — play, pause, stop, seek, loop, and variable playback speed
- **Beat detection** — real-time onset detection drives flash effects, particle bursts, and ring ripples
- **Bloom / glow effect** — post-processing glow composited over the visualizer each frame
- **Motion trail** — persistent canvas decay for ghost-echo and smear effects
- **Text overlay system** — seven animation styles composited directly onto the canvas, including a broadcast-style lower third
- **Audio-reactive background gradient** — procedural background that shifts hue and saturation with the music
- **YouTube Mode** — 16:9 canvas lock at the chosen export resolution, high-bitrate recording
- **Theme engine** — sixteen built-in color themes, applied instantly, with per-layer overrides
- **Preset system** — eight built-in presets plus save/load via localStorage
- **URL sharing** — encode any preset as a shareable link via URL hash
- **PWA support** — installable and works offline

---

## Quick Start

1. Download or clone the whole repository (`visualizer.html` loads the `css/` and `js/` folders next to it)
2. Open `visualizer.html` in Chrome or Edge
3. Click **Use Mic** or **Load File** to begin
4. Pick a visualizer mode and theme from the sidebar
5. Click **Export MP4** to render the whole song, or **Record** / **Record Song** to capture in real time

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
| Gain | 0.1 – 4.0 | How strongly the visuals react. Affects the analysis only, not the audio you hear or record |
| Log Frequency Scale | on / off | On (default): 30 Hz – 16 kHz spaced evenly per octave. Off: the original linear axis |

Beat detection and the Rings bands are defined in Hz (kick: 30–150 Hz, hats/snare: 6–14 kHz), so they behave the same at every FFT size.

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

## BPM Lock / Tempo Sync

The **Beat** panel includes a BPM Clock section beneath the standard onset detector.

| Control | Description |
|---|---|
| Enable BPM Clock | When on, replaces reactive beat detection with a precise metronome |
| Tap Tempo | Click in rhythm to derive BPM from inter-tap intervals (averages last 8 taps) |
| BPM field | Type a value directly (40 – 250) |
| Subdivision | Whole / Half / Quarter / Eighth — controls how many pulses fire per bar |

When the BPM Clock is enabled it drives the same beat-flash, radial pulse, ring ripple, and particle burst effects as onset detection, but locked to the chosen tempo. This is particularly effective with AI-generated music that has a steady, quantised rhythm.

---

## Layer Compositor

Open the **Layers** panel (🗂) from the navigation strip to stack multiple visualizer modes.

- **Add Layer** — pick a mode from the dropdown and add it to the stack (up to 4 layers)
- Each layer has its own **mode**, **opacity** (0.05 – 1.0), and **blend mode** (source-over, screen, multiply, overlay, and more)
- Layers can be **reordered** (▲ / ▼) and individually **toggled** or **deleted**
- Enable the **Use Layers** toggle to activate compositor mode; when off, the single mode selected in the Mode panel is used instead

Classic combinations:
- Terrain (back, multiply) + Radial (mid, source-over 0.8) + Particles (top, screen 0.6)
- Waveform (back, overlay) + Scope (top, lighter 0.5)
- Bars + Rings (screen blend) for a layered frequency read

---

## Aesthetic FX

Open the **FX** panel (🎞) to apply a post-processing pass after all rendering (including bloom).

| Mode | Effect |
|---|---|
| **VHS** | Horizontal scanlines, tape noise strips, cyan color bleed, edge vignette |
| **CRT** | Phosphor dot-matrix overlay, scanlines, green phosphor tint, curved-screen corner darkening |
| **Film Grain** | Per-frame seeded noise overlay refreshed every other frame for subtle animation |
| **Glitch** | Periodic row-slice displacement bursts with RGB channel flash artifacts |
| **Chromatic Aberration** | Red and blue channel copies drawn at slight offsets to create colour fringing |

The **Intensity** slider (0.1 – 1.0) scales every effect. FX are included in recordings.

---

## Per-Element Audio Bindings

Open the **Bind** panel (🔗) to configure up to four independent canvas elements, each driven by a specific frequency band.

| Element | What it draws |
|---|---|
| **Circle** | Outlined circle at canvas centre, radius driven by selected band |
| **Bar Strip** | Horizontal capsule bar at the bottom third, width driven by selected band |
| **Ring** | Dashed ring at canvas centre, radius driven by selected band |
| **Label** | Text label centred near the top, opacity and scale driven by selected band |

Per element you can set:
- **Enable** toggle — show or hide the element
- **Band** — Bass, Mids, or Highs
- **Color** — custom color picker (defaults to theme accent)
- **Range** — min and max value sliders control the amplitude mapping
- **Label text** — (Label element only) the string to display

Bindings draw on top of the visualizer and bloom but beneath progress bar, timer, and artist card, so they are included in recordings.

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

Plus Arctic, Plasma, Toxic, Inferno, Ocean, Rose, Copper, Void, Solar and Glacier. Each layer in the compositor can override the global theme.

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

## Exporting Video

There are three ways to get a video out. All of them carry the song's audio **exactly as loaded**: the Gain slider and analyser only drive the visuals and are never applied to the recorded sound.

### Export MP4 (recommended for finished songs)

Click **Export MP4** (requires a loaded file), pick resolution and frame rate, then **Start export**.

- The song is rendered **offline, frame by frame**: an `OfflineAudioContext` replays it through an analyser with your current FFT size, smoothing and gain, and the normal render pipeline draws each frame at exactly 1/60 s steps of song time
- No dropped frames, however heavy the layers, bloom or FX. A slow machine simply takes longer. Progress, speed and time left are shown while it runs
- Output: MP4. Video is H.264 (falling back to VP9 or AV1 if needed); audio is AAC 320 kbps where the browser can encode AAC, otherwise Opus 256 kbps
- In Chrome/Edge you choose where to save before rendering starts, and the file is **streamed to disk**, so memory stays flat even for long 4K renders. Elsewhere the file is built in memory and downloaded at the end
- The file is named after the song, e.g. `My Song - 2160p-60fps.mp4`
- Requires WebCodecs (Chrome / Edge 94+). Use **Record Song** in other browsers

### Record Song

Click **Record Song** (requires a loaded file). It rewinds to 0:00, starts recording, plays the track after a 0.5 s lead-in, and stops and saves automatically 0.75 s after the song ends. Loop is suspended during the take and restored afterwards. Clicking **Stop** ends the take early.

### Record

Click **Record** (or press `R`) to capture whatever is happening, from mic or file, until you stop.

Real-time recording details (Record and Record Song):

- Format: MP4 (H.264 + AAC) where the browser supports it, otherwise WebM (VP9/VP8 + Opus)
- Frame rate: 30 or 60 fps, from the selector next to the resolution dropdown
- Video bitrate scales with pixel rate (~12 Mbps at 1080p30, ~50 Mbps at 4K30, max 80 Mbps); audio 320 kbps
- Canvas enters the selected resolution mode automatically at record-start and restores on stop
- Max duration: 60 minutes (auto-stops with a warning at 59:50)
- Real-time capture can drop frames if rendering can't keep up (heavy effects at 4K), and stalls if the tab is hidden. **Export MP4** avoids both
- Mic input is recorded but no longer played back through the speakers, which prevents feedback

> **Safari:** MediaRecorder support is limited, and there is no WebCodecs export. For best results use Chrome or Edge.

---

## Export Resolution

Select a resolution and frame rate from the dropdowns in the top bar before hitting **Record** or **YT Mode**:

| Option | Canvas size | Bitrate (30 fps / 60 fps) |
|---|---|---|
| 1080p | 1920 × 1080 | ~12 / 25 Mbps |
| 1440p | 2560 × 1440 | ~22 / 44 Mbps |
| 4K (2160p) | 3840 × 2160 | ~50 / 80 Mbps |
| Native | Window size | scaled to window size (min 8 Mbps) |

The YT Mode button shows the currently selected resolution. When you start recording in a non-native resolution the canvas resizes automatically; when recording stops it returns to window-fit mode.

> YouTube rewards 4K uploads with a better codec tier even for non-4K source content, so uploading at 2160p can improve perceived quality.

---

## YouTube Mode

Click the **YT** resolution button in the top bar to lock the canvas to a fixed 16:9 frame before recording.

| Behaviour | Detail |
|---|---|
| Canvas aspect ratio | Locked to 16:9. Canvas scales to fill the window with black bars if needed |
| Internal resolution | Set by the resolution selector (1080p default) |
| Recording bitrate | Scales with resolution and frame rate |
| Composition guide | A faint dashed border shows the capture area while YT Mode is active. The guide hides during recording |

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
| Chrome | ✅ | ✅ | Recommended — Export MP4 supported |
| Edge | ✅ | ✅ | Export MP4 supported |
| Firefox | ✅ | ✅ | WebM recording; Export MP4 depends on WebCodecs support |
| Safari | ✅ | ⚠️ | Limited MediaRecorder; no Export MP4 |
| iOS Safari | ✅ | ⚠️ | Tap-to-unlock required |

---

### Audio graph

```
                      ┌─→ GainNode → AnalyserNode ─→ (muted) → destination     visuals only
MediaStream (mic) ────┤                  └─→ BeatDetector / renderers
                      └─────────────────────────→ MediaStreamDestination      recording

                      ┌─→ GainNode → AnalyserNode ─→ (muted) → destination     visuals only
BufferSource (file) ──┼─→ monitor bus ───────────→ AudioContext.destination  speakers
                      └─────────────────────────→ MediaStreamDestination      recording
```

Export MP4 builds the same analysis chain in an `OfflineAudioContext` and encodes the decoded file's samples directly.

---

## Suggested Workflow for YouTube Music Videos

1. Load an audio file and use the **playback controls** to find your start point
2. Select **4K (2160p)** from the resolution dropdown for maximum upload quality, then click the YT button to lock the 16:9 frame
3. Open **Layers** (🗂) and stack 2–3 modes — e.g. Terrain at back + Radial at 0.8 opacity + Particles at screen-blend on top
4. Set a **theme** and optionally enable the **Gradient** background for a fully reactive look
5. If the track has a steady tempo, enable **BPM Clock** in the Beat panel and tap the tempo — this locks visual pulses to the beat grid rather than peak-chasing
6. Apply a subtle **FX** pass — **Film Grain** or **VHS** at 0.3 intensity adds filmic texture without overwhelming the visuals
7. Use **Audio Bindings** to bind a circle or bar strip to bass so those elements pulse independently from the main visualizer
8. Add a **Lower Third** overlay with the song title and artist name; adjust Duration or leave it always visible
9. Enable the **Progress Bar** overlay so viewers can see where they are in the track
10. Dial in **Bloom** and **Trail** to taste — a little of both goes a long way
11. Click **Export MP4**, choose 4K and 30 or 60 fps, and pick where to save
12. Upload the MP4 to YouTube. The audio is the original song with no processing, encoded once at a high bitrate

(If your browser doesn't support Export MP4, use **Record Song** instead: it rewinds, records, and saves automatically when the song ends.)

---

## License

MIT — do whatever you like with it.
