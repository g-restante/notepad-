import { invoke } from '@tauri-apps/api/core';

export interface TauriAPI {
  openFile: () => Promise<string | null>;
  saveFile: (defaultName?: string) => Promise<string | null>;
  readFileContent: (filePath: string) => Promise<string>;
  writeFileContent: (filePath: string, content: string) => Promise<void>;
}

export const tauriAPI: TauriAPI = {
  async openFile(): Promise<string | null> {
    try {
      return await invoke<string | null>('open_file_dialog');
    } catch (error) {
      console.error('Error opening file dialog:', error);
      throw error;
    }
  },

  async saveFile(defaultName?: string): Promise<string | null> {
    try {
      return await invoke<string | null>('save_file_dialog', { 
        defaultName: defaultName || null 
      });
    } catch (error) {
      console.error('Error opening save dialog:', error);
      throw error;
    }
  },

  async readFileContent(filePath: string): Promise<string> {
    try {
      return await invoke<string>('read_file_content', { filePath });
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  },

  async writeFileContent(filePath: string, content: string): Promise<void> {
    try {
      await invoke<void>('write_file_content', { filePath, content });
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }
};

// Global API declaration for Tauri
declare global {
  interface Window {
    tauriAPI: TauriAPI;
  }
}

// Make tauriAPI globally available
if (typeof window !== 'undefined') {
  window.tauriAPI = tauriAPI;
}

export default tauriAPI;