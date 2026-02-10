import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // We can add IPC communication here later
});
