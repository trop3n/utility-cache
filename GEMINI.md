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
