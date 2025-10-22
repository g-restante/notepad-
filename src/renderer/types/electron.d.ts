export interface ElectronAPI {
  showOpenDialog: () => Promise<Electron.OpenDialogReturnValue>;
  showSaveDialog: () => Promise<Electron.SaveDialogReturnValue>;
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  onMenuAction: (callback: (action: string) => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};