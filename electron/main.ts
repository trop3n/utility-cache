import { app, BrowserWindow, ipcMain } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.ts'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Required for SharedArrayBuffer (used by ffmpeg.wasm)
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Cross-Origin-Opener-Policy': ['same-origin'],
        'Cross-Origin-Embedder-Policy': ['require-corp'],
      },
    });
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function findFFmpeg(): string {
  const candidates = [
    '/usr/local/bin/ffmpeg',
    '/usr/bin/ffmpeg',
    '/opt/homebrew/bin/ffmpeg',
    path.join(os.homedir(), 'bin', 'ffmpeg'),
  ];
  
  if (process.platform === 'win32') {
    const winCandidates = [
      'C:\\ffmpeg\\bin\\ffmpeg.exe',
      path.join(os.homedir(), 'ffmpeg', 'bin', 'ffmpeg.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'ffmpeg', 'bin', 'ffmpeg.exe'),
      path.join(process.env.PROGRAMFILES || '', 'ffmpeg', 'bin', 'ffmpeg.exe'),
    ];
    candidates.push(...winCandidates);
  }
  
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  
  return 'ffmpeg';
}

ipcMain.handle('ffmpeg:checkAvailable', async (): Promise<{ available: boolean; hasHap: boolean; path: string }> => {
  const ffmpegPath = findFFmpeg();
  
  return new Promise((resolve) => {
    const proc = spawn(ffmpegPath, ['-encoders']);
    let output = '';
    
    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', (data) => { output += data.toString(); });
    
    proc.on('close', (code) => {
      const hasHap = output.includes('hap');
      resolve({ available: code === 0, hasHap, path: ffmpegPath });
    });
    
    proc.on('error', () => {
      resolve({ available: false, hasHap: false, path: ffmpegPath });
    });
  });
});

const tempDir = path.join(os.tmpdir(), 'utility-cache-ffmpeg');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

let fileCounter = 0;

ipcMain.handle('ffmpeg:writeTempFile', async (_event, data: ArrayBuffer): Promise<string> => {
  const id = `${Date.now()}-${++fileCounter}`;
  const filePath = path.join(tempDir, `input-${id}`);
  fs.writeFileSync(filePath, Buffer.from(data));
  return filePath;
});

ipcMain.handle('ffmpeg:readTempFile', async (_event, filePath: string): Promise<ArrayBuffer> => {
  const buffer = fs.readFileSync(filePath);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
});

ipcMain.handle('ffmpeg:deleteTempFile', async (_event, filePath: string): Promise<void> => {
  try {
    fs.unlinkSync(filePath);
  } catch {
    // File may not exist, ignore
  }
});

ipcMain.handle('ffmpeg:encodeWithFile', async (_event, args: {
  inputPath: string;
  ffmpegArgs: string[];
  outputExtension: string;
}): Promise<{ success: boolean; outputPath?: string; error?: string }> => {
  const ffmpegPath = findFFmpeg();
  const outputId = `${Date.now()}-${++fileCounter}`;
  const outputPath = path.join(tempDir, `output-${outputId}.${args.outputExtension}`);
  
  return new Promise((resolve) => {
    const allArgs = ['-i', args.inputPath, ...args.ffmpegArgs, '-y', outputPath];
    const proc = spawn(ffmpegPath, allArgs);
    
    let stderr = '';
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      const win = BrowserWindow.getAllWindows()[0];
      win?.webContents.send('ffmpeg:progress', { stderr: stderr.slice(-2000) });
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, outputPath });
      } else {
        resolve({ success: false, error: stderr.slice(-1000) });
      }
    });
    
    proc.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
});
