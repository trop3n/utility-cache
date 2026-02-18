import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  ffmpeg: {
    checkAvailable: () => ipcRenderer.invoke('ffmpeg:checkAvailable'),
    writeTempFile: (data: ArrayBuffer) => ipcRenderer.invoke('ffmpeg:writeTempFile', data),
    readTempFile: (filePath: string) => ipcRenderer.invoke('ffmpeg:readTempFile', filePath),
    deleteTempFile: (filePath: string) => ipcRenderer.invoke('ffmpeg:deleteTempFile', filePath),
    encodeWithFile: (args: {
      inputPath: string;
      ffmpegArgs: string[];
      outputExtension: string;
    }) => ipcRenderer.invoke('ffmpeg:encodeWithFile', args),
    onProgress: (callback: (data: { stderr: string }) => void) => {
      const handler = (_event: unknown, data: { stderr: string }) => callback(data);
      ipcRenderer.on('ffmpeg:progress', handler);
      return () => ipcRenderer.removeListener('ffmpeg:progress', handler);
    },
  },
});
