import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface EditorTab {
  id: string;
  title: string;
  content: string;
  filePath?: string;
  isDirty: boolean;
  language: string;
}

interface EditorState {
  // Tabs management
  tabs: EditorTab[];
  activeTabId: string | null;
  
  // UI State
  isDarkMode: boolean;
  showLineNumbers: boolean;
  showMinimap: boolean;
  fontSize: number;
  wordWrap: boolean;
  
  // Editor settings
  tabSize: number;
  insertSpaces: boolean;
  
  // Find/Replace
  searchTerm: string;
  replaceTerm: string;
  showFindPanel: boolean;
  showReplacePanel: boolean;
  
  // Actions
  addTab: (tab: Omit<EditorTab, 'id'>) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  updateTabTitle: (tabId: string, title: string) => void;
  setTabFilePath: (tabId: string, filePath: string) => void;
  markTabDirty: (tabId: string, isDirty: boolean) => void;
  
  // UI Actions
  toggleTheme: () => void;
  setFontSize: (size: number) => void;
  toggleLineNumbers: () => void;
  toggleMinimap: () => void;
  toggleWordWrap: () => void;
  
  // Editor Actions
  setTabSize: (size: number) => void;
  setInsertSpaces: (insertSpaces: boolean) => void;
  
  // Find/Replace Actions
  setSearchTerm: (term: string) => void;
  setReplaceTerm: (term: string) => void;
  toggleFindPanel: () => void;
  toggleReplacePanel: () => void;
  
  // File operations
  newFile: () => void;
  openFile: () => Promise<void>;
  saveFile: (tabId?: string) => Promise<void>;
  saveFileAs: (tabId?: string) => Promise<void>;
}

export const useEditorStore = create<EditorState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    tabs: [],
    activeTabId: null,
    isDarkMode: false,
    showLineNumbers: true,
    showMinimap: true,
    fontSize: 14,
    wordWrap: false,
    tabSize: 4,
    insertSpaces: true,
    searchTerm: '',
    replaceTerm: '',
    showFindPanel: false,
    showReplacePanel: false,

    // Tab management
    addTab: (tabData) => {
      const id = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newTab: EditorTab = {
        id,
        ...tabData,
      };
      
      set((state) => ({
        tabs: [...state.tabs, newTab],
        activeTabId: id,
      }));
    },

    closeTab: (tabId) => {
      set((state) => {
        const newTabs = state.tabs.filter((tab) => tab.id !== tabId);
        let newActiveTabId = state.activeTabId;
        
        if (state.activeTabId === tabId) {
          if (newTabs.length > 0) {
            const currentIndex = state.tabs.findIndex((tab) => tab.id === tabId);
            const nextIndex = Math.max(0, Math.min(currentIndex, newTabs.length - 1));
            newActiveTabId = newTabs[nextIndex]?.id || null;
          } else {
            newActiveTabId = null;
          }
        }
        
        return {
          tabs: newTabs,
          activeTabId: newActiveTabId,
        };
      });
    },

    setActiveTab: (tabId) => {
      set({ activeTabId: tabId });
    },

    updateTabContent: (tabId, content) => {
      set((state) => ({
        tabs: state.tabs.map((tab) =>
          tab.id === tabId ? { ...tab, content, isDirty: true } : tab
        ),
      }));
    },

    updateTabTitle: (tabId, title) => {
      set((state) => ({
        tabs: state.tabs.map((tab) =>
          tab.id === tabId ? { ...tab, title } : tab
        ),
      }));
    },

    setTabFilePath: (tabId, filePath) => {
      set((state) => ({
        tabs: state.tabs.map((tab) =>
          tab.id === tabId ? { ...tab, filePath } : tab
        ),
      }));
    },

    markTabDirty: (tabId, isDirty) => {
      set((state) => ({
        tabs: state.tabs.map((tab) =>
          tab.id === tabId ? { ...tab, isDirty } : tab
        ),
      }));
    },

    // UI Actions
    toggleTheme: () => {
      set((state) => ({ isDarkMode: !state.isDarkMode }));
    },

    setFontSize: (size) => {
      set({ fontSize: size });
    },

    toggleLineNumbers: () => {
      set((state) => ({ showLineNumbers: !state.showLineNumbers }));
    },

    toggleMinimap: () => {
      set((state) => ({ showMinimap: !state.showMinimap }));
    },

    toggleWordWrap: () => {
      set((state) => ({ wordWrap: !state.wordWrap }));
    },

    // Editor Actions
    setTabSize: (size) => {
      set({ tabSize: size });
    },

    setInsertSpaces: (insertSpaces) => {
      set({ insertSpaces });
    },

    // Find/Replace Actions
    setSearchTerm: (term) => {
      set({ searchTerm: term });
    },

    setReplaceTerm: (term) => {
      set({ replaceTerm: term });
    },

    toggleFindPanel: () => {
      set((state) => ({ showFindPanel: !state.showFindPanel }));
    },

    toggleReplacePanel: () => {
      set((state) => ({ showReplacePanel: !state.showReplacePanel }));
    },

    // File operations
    newFile: () => {
      const { addTab } = get();
      addTab({
        title: 'Untitled',
        content: '',
        isDirty: false,
        language: 'plaintext',
      });
    },

    openFile: async () => {
      if (!window.electronAPI) return;
      
      try {
        const result = await window.electronAPI.showOpenDialog();
        if (result.canceled || !result.filePaths.length) return;
        
        const filePath = result.filePaths[0];
        const fileResult = await window.electronAPI.readFile(filePath);
        
        if (fileResult.success && fileResult.content !== undefined) {
          const fileName = filePath.split('/').pop() || 'Unknown';
          const extension = fileName.split('.').pop()?.toLowerCase() || '';
          
          // Basic language detection
          let language = 'plaintext';
          const languageMap: Record<string, string> = {
            js: 'javascript',
            jsx: 'javascript',
            ts: 'typescript',
            tsx: 'typescript',
            html: 'html',
            css: 'css',
            scss: 'scss',
            json: 'json',
            md: 'markdown',
            py: 'python',
            java: 'java',
            cpp: 'cpp',
            c: 'c',
          };
          
          if (languageMap[extension]) {
            language = languageMap[extension];
          }
          
          const { addTab } = get();
          addTab({
            title: fileName,
            content: fileResult.content,
            filePath,
            isDirty: false,
            language,
          });
        }
      } catch (error) {
        console.error('Error opening file:', error);
      }
    },

    saveFile: async (tabId) => {
      if (!window.electronAPI) return;
      
      const { tabs, activeTabId } = get();
      const targetTabId = tabId || activeTabId;
      if (!targetTabId) return;
      
      const tab = tabs.find((t) => t.id === targetTabId);
      if (!tab) return;
      
      try {
        if (tab.filePath) {
          // Save existing file
          const result = await window.electronAPI.writeFile(tab.filePath, tab.content);
          if (result.success) {
            const { markTabDirty } = get();
            markTabDirty(targetTabId, false);
          }
        } else {
          // Save as new file
          const { saveFileAs } = get();
          saveFileAs(targetTabId);
        }
      } catch (error) {
        console.error('Error saving file:', error);
      }
    },

    saveFileAs: async (tabId) => {
      if (!window.electronAPI) return;
      
      const { tabs, activeTabId } = get();
      const targetTabId = tabId || activeTabId;
      if (!targetTabId) return;
      
      const tab = tabs.find((t) => t.id === targetTabId);
      if (!tab) return;
      
      try {
        const result = await window.electronAPI.showSaveDialog();
        if (result.canceled || !result.filePath) return;
        
        const saveResult = await window.electronAPI.writeFile(result.filePath, tab.content);
        if (saveResult.success) {
          const fileName = result.filePath.split('/').pop() || 'Unknown';
          const { setTabFilePath, updateTabTitle, markTabDirty } = get();
          
          setTabFilePath(targetTabId, result.filePath);
          updateTabTitle(targetTabId, fileName);
          markTabDirty(targetTabId, false);
        }
      } catch (error) {
        console.error('Error saving file as:', error);
      }
    },
  }))
);