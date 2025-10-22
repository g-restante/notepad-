import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  
  // Menu events
  onMenuAction: (callback: (action: string) => void) => {
    const channels = [
      'menu-new-file', 'menu-open-file', 'menu-save', 'menu-save-as', 'menu-find', 'menu-replace',
      'menu-toggle-theme', 'menu-theme-auto', 'menu-theme-light', 'menu-theme-dark', 'menu-theme-highcontrast',
      'menu-toggle-minimap', 'menu-toggle-wordwrap', 'menu-open-settings',
      'menu-language-plaintext', 'menu-language-javascript', 'menu-language-typescript',
      'menu-language-html', 'menu-language-css', 'menu-language-json', 'menu-language-python', 'menu-language-java'
    ];
    channels.forEach(channel => {
      ipcRenderer.on(channel, () => callback(channel));
    });
  },
  
  // Remove listeners
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
});