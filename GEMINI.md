# Utility Suite

## Project Overview

**Utility Suite** is a desktop application built with Electron, React, TypeScript, and Vite. It serves as a collection of standalone utility tools designed to help with common tasks.

### Key Technologies
*   **Runtime:** [Electron](https://www.electronjs.org/)
*   **Frontend Framework:** [React](https://react.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Bundler:** [Vite](https://vitejs.dev/)

### Current Features
The application currently includes the following tools:
1.  **Text Case Converter:** Convert text to UPPERCASE, lowercase, or Title Case.
2.  **Image Resizer:** Resize images by defining width and height (maintaining aspect ratio).
3.  **QR Code Generator:** Generate custom QR codes from text or URLs with color customization.
4.  **Video Converter:** Convert video files to MP4, WebM, MKV, or GIF using FFmpeg.wasm.
5.  **Video Trimmer:** Trim video clips by start and end timestamps.
6.  **Video Muter:** Remove audio tracks from videos.
7.  **Video to Audio:** Extract audio (MP3/WAV) from video files.
8.  **Video Compressor:** Reduce video file size by adjusting CRF quality settings.
9.  **Video Speed Changer:** Speed up or slow down video (0.5x to 2.0x) including audio pitch adjustment.
10. **Video Resizer:** Change video dimensions (width/height).
11. **Video Rotator:** Rotate (90/180/270) or flip (horizontal/vertical) videos.
12. **Screen & Camera Recorder:** Capture screen output or webcam with audio directly.
13. **Audio Cutter:** Trim or cut audio clips.
14. **Audio Converter:** Convert audio between multiple formats (MP3, WAV, OGG, AAC).
15. **Volume Changer:** Adjust audio volume level.
16. **Audio Joiner:** Merge multiple audio files into a single track.
17. **Audio Speed & Pitch:** Independently adjust playback speed and pitch.
18. **Reverse Audio:** Play audio backwards.
19. **Voice Recorder:** Record audio directly from microphone.
20. **Audio Equalizer:** 10-band equalizer with presets (Bass Boost, Pop, Rock, etc.).
21. **PDF Merge:** Combine multiple PDF documents into one.
22. **PDF Split:** Extract specific pages or split a PDF into individual page files.
23. **PDF Rotate:** Rotate PDF document pages.
24. **Images to PDF:** Convert multiple images into a single PDF.
25. **PDF to Images:** Convert PDF pages into individual PNG images.
26. **Protect PDF:** Encrypt PDF with a password.
27. **Unlock PDF:** Remove password protection from a PDF.
28. **Add Page Numbers:** Insert page numbers into a PDF document.

## Architecture

### Routing
The application uses `react-router-dom` with `HashRouter`. 
- **Why HashRouter?** It ensures compatibility across both web hosting (no server-side config needed for paths) and Electron (works with `file://` protocol).

### UI Layout
- `src/components/Layout.tsx`: Provides the persistent shell (Header, Nav, Footer).
- `src/components/Home.tsx`: The dashboard showing all available tools.

## Building and Running

### Prerequisites
Ensure you have Node.js installed on your system.

### Installation
Install project dependencies:
```bash
npm install
```

### Development
To run the application in development mode:

**Full Electron App (Recommended):**
```bash
npm run electron:dev
```

**Web-Only Mode:**
```bash
npm run dev
```

## Development Conventions

### Adding a New Tool
1.  Create a folder in `src/tools/NameOfTool/`.
2.  Implement the tool component.
3.  Add a route for the tool in `src/App.tsx`.
4.  Add the tool to the `tools` array in `src/components/Home.tsx` to display it on the dashboard.
5.  Add the tool to the `navItems` in `src/components/Layout.tsx` (optional, for header nav).

### Styling
- Use classes defined in `src/App.css` and `src/index.css`.
- Avoid inline styles where possible to ensure theme consistency (Light/Dark mode).
- Use `button.primary` or `button.success` for standard actions.
