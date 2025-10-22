import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Monaco Editor configuration for Electron
if (typeof global === 'undefined') {
  (window as any).global = globalThis;
}
if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
}

// Configure Monaco Environment for Electron
(window as any).MonacoEnvironment = {
  getWorkerUrl: function (moduleId: string, label: string) {
    // Disable workers in Electron environment
    return 'data:text/javascript;charset=utf-8,;';
  }
};

// Electron API interface
interface ElectronAPI {
  showOpenDialog: () => Promise<any>;
  showSaveDialog: () => Promise<any>;
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

// File Tab interface
interface FileTab {
  id: string;
  title: string;
  content: string;
  filePath?: string;
  isDirty: boolean;
  language: string;
}

// Theme system interfaces
interface AppTheme {
  id: string;
  name: string;
  monacoTheme: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
  backgroundColor: string;
  foregroundColor: string;
  accentColor: string;
  borderColor: string;
  tabBackgroundColor: string;
  tabActiveColor: string;
  statusBarColor: string;
  buttonColor: string;
  buttonHoverColor: string;
}

interface UserSettings {
  themeId: string;
  autoDetectTheme: boolean;
  minimapEnabled: boolean;
  wordWrapEnabled: boolean;
  fontSize: number;
  fontFamily: string;
  customAccentColor?: string;
}

// Predefined themes
const themes: Record<string, AppTheme> = {
  light: {
    id: 'light',
    name: 'Light',
    monacoTheme: 'vs',
    backgroundColor: '#ffffff',
    foregroundColor: '#333333',
    accentColor: '#007acc',
    borderColor: '#e5e5e5',
    tabBackgroundColor: '#f8f8f8',
    tabActiveColor: '#ffffff',
    statusBarColor: '#f0f0f0',
    buttonColor: '#e1e1e1',
    buttonHoverColor: '#d4d4d4'
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    monacoTheme: 'vs-dark',
    backgroundColor: '#1e1e1e',
    foregroundColor: '#d4d4d4',
    accentColor: '#007acc',
    borderColor: '#3e3e3e',
    tabBackgroundColor: '#2d2d30',
    tabActiveColor: '#1e1e1e',
    statusBarColor: '#252526',
    buttonColor: '#3c3c3c',
    buttonHoverColor: '#464647'
  },
  highContrast: {
    id: 'highContrast',
    name: 'High Contrast',
    monacoTheme: 'hc-black',
    backgroundColor: '#000000',
    foregroundColor: '#ffffff',
    accentColor: '#ffff00',
    borderColor: '#ffffff',
    tabBackgroundColor: '#000000',
    tabActiveColor: '#1a1a1a',
    statusBarColor: '#000000',
    buttonColor: '#333333',
    buttonHoverColor: '#555555'
  },
  auto: {
    id: 'auto',
    name: 'Auto (Follow System)',
    monacoTheme: 'vs-dark', // This will be set dynamically
    backgroundColor: '#1e1e1e',
    foregroundColor: '#d4d4d4',
    accentColor: '#007acc',
    borderColor: '#3e3e3e',
    tabBackgroundColor: '#2d2d30',
    tabActiveColor: '#1e1e1e',
    statusBarColor: '#252526',
    buttonColor: '#3c3c3c',
    buttonHoverColor: '#464647'
  }
};

// Default settings
const defaultSettings: UserSettings = {
  themeId: 'auto',
  autoDetectTheme: true,
  minimapEnabled: true,
  wordWrapEnabled: false,
  fontSize: 14,
  fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace"
};

// Monaco Editor Web Component
const MonacoEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  language: string;
  theme: string;
  minimapEnabled: boolean;
  wordWrapEnabled: boolean;
  onEditorMount?: (editor: any) => void;
}> = ({ value, onChange, language, theme, minimapEnabled, wordWrapEnabled, onEditorMount }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<any>(null);

  useEffect(() => {
    if (editorRef.current && !editor) {
      // Dynamically import Monaco Editor
      import('monaco-editor').then((monaco) => {
        // Configure Monaco to work without workers
        monaco.languages.typescript.typescriptDefaults.setWorkerOptions({
          customWorkerPath: undefined
        });
        monaco.languages.typescript.javascriptDefaults.setWorkerOptions({
          customWorkerPath: undefined
        });

        const newEditor = monaco.editor.create(editorRef.current!, {
          value: value,
          language: language,
          theme: theme,
          fontSize: 14, // Will be updated by useEffect
          fontFamily: "'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Monaco', monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          minimap: { 
            enabled: minimapEnabled,
            side: 'right',
            showSlider: 'always',
            renderCharacters: true
          },
          wordWrap: wordWrapEnabled ? 'on' : 'off',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderWhitespace: 'selection',
          cursorBlinking: 'smooth',
          folding: true,
          foldingStrategy: 'indentation',
          showFoldingControls: 'always',
          // Advanced features
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true
          },
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          // Find and replace
          find: {
            seedSearchStringFromSelection: 'always',
            autoFindInSelection: 'never'
          },
        });

        newEditor.onDidChangeModelContent(() => {
          const newValue = newEditor.getValue();
          onChange(newValue);
        });

        setEditor(newEditor);
        if (onEditorMount) {
          onEditorMount(newEditor);
        }
      });
    }

    return () => {
      if (editor) {
        editor.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (editor && value !== editor.getValue()) {
      editor.setValue(value);
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor) {
      import('monaco-editor').then((monaco) => {
        const currentValue = editor.getValue();
        // Dispose the current model and create a new one with the correct language
        const model = editor.getModel();
        if (model) {
          model.dispose();
        }
        const newModel = monaco.editor.createModel(currentValue, language);
        editor.setModel(newModel);
      });
    }
  }, [language, editor]);

  return <div ref={editorRef} style={{ width: '100%', height: '100%' }} />;
};

// App Component with multiple file management
const App: React.FC = () => {
  // Load settings from localStorage
  const loadSettings = (): UserSettings => {
    try {
      const saved = localStorage.getItem('notepad-settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  };

  // Save settings to localStorage
  const saveSettings = (settings: UserSettings) => {
    try {
      localStorage.setItem('notepad-settings', JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  };

  // Detect system theme preference
  const detectSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  };

  // Get effective theme based on settings
  const getEffectiveTheme = (settings: UserSettings): AppTheme => {
    if (settings.themeId === 'auto') {
      const systemTheme = detectSystemTheme();
      const baseTheme = themes[systemTheme];
      return {
        ...baseTheme,
        id: 'auto',
        name: 'Auto (Follow System)',
        accentColor: settings.customAccentColor || baseTheme.accentColor
      };
    }
    
    const selectedTheme = themes[settings.themeId] || themes.dark;
    return {
      ...selectedTheme,
      accentColor: settings.customAccentColor || selectedTheme.accentColor
    };
  };

  // State management
  const [userSettings, setUserSettings] = useState<UserSettings>(loadSettings);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => getEffectiveTheme(loadSettings()));
  const [showSettings, setShowSettings] = useState(false);
  
  const [tabs, setTabs] = useState<FileTab[]>([
    {
      id: '1',
      title: 'untitled',
      content: '',
      isDirty: false,
      language: 'plaintext'
    }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const editorInstanceRef = useRef<any>(null);

  // Update theme when settings change
  useEffect(() => {
    const newTheme = getEffectiveTheme(userSettings);
    setCurrentTheme(newTheme);
    saveSettings(userSettings);
  }, [userSettings]);

  // Update editor options when settings change
  useEffect(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.updateOptions({
        fontSize: userSettings.fontSize,
        fontFamily: userSettings.fontFamily,
        minimap: { enabled: userSettings.minimapEnabled },
        wordWrap: userSettings.wordWrapEnabled ? 'on' : 'off'
      });
    }
  }, [userSettings.fontSize, userSettings.fontFamily, userSettings.minimapEnabled, userSettings.wordWrapEnabled]);

  // Update editor theme when theme changes
  useEffect(() => {
    if (editorInstanceRef.current) {
      import('monaco-editor').then((monaco) => {
        monaco.editor.setTheme(currentTheme.monacoTheme);
      });
    }
  }, [currentTheme.monacoTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (userSettings.autoDetectTheme && userSettings.themeId === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const newTheme = getEffectiveTheme(userSettings);
        setCurrentTheme(newTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [userSettings.autoDetectTheme, userSettings.themeId]);

  // Theme switching functions
  const switchTheme = (themeId: string) => {
    setUserSettings(prev => ({ ...prev, themeId }));
  };

  const toggleMinimap = () => {
    setUserSettings(prev => ({ ...prev, minimapEnabled: !prev.minimapEnabled }));
  };

  const toggleWordWrap = () => {
    setUserSettings(prev => ({ ...prev, wordWrapEnabled: !prev.wordWrapEnabled }));
  };

  const setCustomAccentColor = (color: string) => {
    setUserSettings(prev => ({ ...prev, customAccentColor: color }));
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  // Native menu event handling
  useEffect(() => {
    if (window.electronAPI?.onMenuAction) {
      window.electronAPI.onMenuAction((action: string) => {
        switch (action) {
          case 'menu-new-file':
            handleNew();
            break;
          case 'menu-open-file':
            handleOpen();
            break;
          case 'menu-save':
            handleSave();
            break;
          case 'menu-save-as':
            handleSaveAs();
            break;
          case 'menu-find':
            if (editorInstanceRef.current) {
              editorInstanceRef.current.trigger('keyboard', 'actions.find', null);
            }
            break;
          case 'menu-replace':
            if (editorInstanceRef.current) {
              editorInstanceRef.current.trigger('keyboard', 'editor.action.startFindReplaceAction', null);
            }
            break;
          case 'menu-toggle-theme':
            toggleTheme();
            break;
          case 'menu-theme-auto':
            switchTheme('auto');
            break;
          case 'menu-theme-light':
            switchTheme('light');
            break;
          case 'menu-theme-dark':
            switchTheme('dark');
            break;
          case 'menu-theme-highcontrast':
            switchTheme('highContrast');
            break;
          case 'menu-open-settings':
            setShowSettings(true);
            break;
          case 'menu-toggle-minimap':
            toggleMinimap();
            break;
          case 'menu-toggle-wordwrap':
            toggleWordWrap();
            break;
          // Language menu actions
          case 'menu-language-plaintext':
            handleLanguageChange('plaintext');
            break;
          case 'menu-language-javascript':
            handleLanguageChange('javascript');
            break;
          case 'menu-language-typescript':
            handleLanguageChange('typescript');
            break;
          case 'menu-language-html':
            handleLanguageChange('html');
            break;
          case 'menu-language-css':
            handleLanguageChange('css');
            break;
          case 'menu-language-json':
            handleLanguageChange('json');
            break;
          case 'menu-language-python':
            handleLanguageChange('python');
            break;
          case 'menu-language-java':
            handleLanguageChange('java');
            break;
        }
      });
    }

    return () => {
      // Cleanup listeners when component unmounts
      if (window.electronAPI?.removeAllListeners) {
        ['menu-new-file', 'menu-open-file', 'menu-save', 'menu-save-as', 'menu-find', 'menu-replace', 
         'menu-toggle-theme', 'menu-toggle-minimap', 'menu-toggle-wordwrap',
         'menu-language-plaintext', 'menu-language-javascript', 'menu-language-typescript',
         'menu-language-html', 'menu-language-css', 'menu-language-json', 'menu-language-python', 'menu-language-java']
          .forEach(channel => window.electronAPI.removeAllListeners(channel));
      }
    };
  }, [tabs, activeTabId]); // Re-run when tabs or activeTabId change

  const detectLanguageFromFileName = (fileName: string): string => {
    const languageMap: { [key: string]: string } = {
      // JavaScript
      js: 'javascript',
      jsx: 'javascript',
      mjs: 'javascript',
      // TypeScript
      ts: 'typescript',
      tsx: 'typescript',
      // Web
      html: 'html',
      htm: 'html',
      css: 'css',
      scss: 'css',
      sass: 'css',
      // Data
      json: 'json',
      // Python
      py: 'python',
      pyw: 'python',
      // Java
      java: 'java',
      // C/C++
      c: 'c',
      cpp: 'cpp',
      h: 'c',
      hpp: 'cpp',
      // Other
      md: 'markdown',
      xml: 'xml',
      sql: 'sql',
      sh: 'shell',
      bat: 'bat',
      ps1: 'powershell',
      txt: 'plaintext',
      log: 'plaintext'
    };

    // Try to extract meaningful extension from filename
    // For files like "prova.js.txt", we want to detect "js" not "txt"
    const parts = fileName.toLowerCase().split('.');
    
    // If there are multiple extensions, try the second-to-last first
    if (parts.length > 2) {
      const possibleExt = parts[parts.length - 2];
      if (languageMap[possibleExt]) {
        return languageMap[possibleExt];
      }
    }
    
    // Fall back to the last extension
    const extension = parts[parts.length - 1] || '';
    return languageMap[extension] || 'plaintext';
  };

  const handleNew = () => {
    const newTab: FileTab = {
      id: Date.now().toString(),
      title: 'untitled',
      content: '',
      isDirty: false,
      language: 'plaintext'
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleOpen = async () => {
    if (!window.electronAPI) {
      alert('File operations not available in this environment');
      return;
    }

    try {
      const result = await window.electronAPI.showOpenDialog();
      if (result.canceled || !result.filePaths?.length) return;

      const filePath = result.filePaths[0];
      const fileResult = await window.electronAPI.readFile(filePath);
      
      if (fileResult.success && fileResult.content !== undefined) {
        const fileName = filePath.split('/').pop() || 'Unknown';
        const language = detectLanguageFromFileName(fileName);
        
        const newTab: FileTab = {
          id: Date.now().toString(),
          title: fileName,
          content: fileResult.content,
          filePath: filePath,
          isDirty: false,
          language: language
        };
        
        setTabs([...tabs, newTab]);
        setActiveTabId(newTab.id);
      } else {
        alert('Error reading file: ' + fileResult.error);
      }
    } catch (error) {
      alert('Error opening file: ' + error);
    }
  };

  const handleSave = async () => {
    if (!activeTab || !window.electronAPI) return;

    try {
      if (activeTab.filePath) {
        // Save existing file
        const result = await window.electronAPI.writeFile(activeTab.filePath, activeTab.content);
        if (result.success) {
          updateTab(activeTab.id, { isDirty: false });
        } else {
          alert('Error saving file: ' + result.error);
        }
      } else {
        // Save as new file
        handleSaveAs();
      }
    } catch (error) {
      alert('Error saving file: ' + error);
    }
  };

  const handleSaveAs = async () => {
    if (!activeTab || !window.electronAPI) return;

    try {
      const result = await window.electronAPI.showSaveDialog();
      if (result.canceled || !result.filePath) return;

      const saveResult = await window.electronAPI.writeFile(result.filePath, activeTab.content);
      if (saveResult.success) {
        const fileName = result.filePath.split('/').pop() || 'Unknown';
        const detectedLanguage = detectLanguageFromFileName(fileName);
        
        updateTab(activeTab.id, { 
          title: fileName,
          filePath: result.filePath,
          isDirty: false,
          language: detectedLanguage
        });
      } else {
        alert('Error saving file: ' + saveResult.error);
      }
    } catch (error) {
      alert('Error saving file: ' + error);
    }
  };

  const updateTab = (tabId: string, updates: Partial<FileTab>) => {
    setTabs(prevTabs => {
      const newTabs = prevTabs.map(tab => 
        tab.id === tabId ? { ...tab, ...updates } : tab
      );
      return newTabs;
    });
  };

  const handleContentChange = (content: string) => {
    if (activeTab) {
      updateTab(activeTab.id, { content, isDirty: true });
    }
  };

  const handleLanguageChange = (newLang: string) => {
    if (activeTab) {
      updateTab(activeTab.id, { language: newLang });
    }
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return; // Keep at least one tab
    
    const updatedTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(updatedTabs);
    
    if (activeTabId === tabId && updatedTabs.length > 0) {
      setActiveTabId(updatedTabs[0].id);
    }
  };

  const toggleTheme = () => {
    const currentThemeId = userSettings.themeId;
    const themeIds = Object.keys(themes);
    const currentIndex = themeIds.indexOf(currentThemeId);
    const nextIndex = (currentIndex + 1) % themeIds.length;
    switchTheme(themeIds[nextIndex]);
  };

  const languages = [
    { label: 'Plain Text', value: 'plaintext' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'HTML', value: 'html' },
    { label: 'CSS', value: 'css' },
    { label: 'JSON', value: 'json' },
    { label: 'Python', value: 'python' },
    { label: 'Java', value: 'java' },
  ];

  // Detect if we're on macOS
  const isMac = navigator.userAgent.includes('Macintosh');

  // Settings Modal Component
  const SettingsModal = () => {
    if (!showSettings) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: currentTheme.backgroundColor,
          color: currentTheme.foregroundColor,
          borderRadius: '8px',
          padding: '24px',
          minWidth: '500px',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          border: `1px solid ${currentTheme.borderColor}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Settings</h2>
            <button
              onClick={() => setShowSettings(false)}
              style={{
                background: 'none',
                border: 'none',
                color: currentTheme.foregroundColor,
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>

          {/* Theme Selection */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '500' }}>Theme</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {Object.entries(themes).map(([id, theme]) => (
                <button
                  key={id}
                  onClick={() => switchTheme(id)}
                  style={{
                    padding: '12px',
                    backgroundColor: userSettings.themeId === id ? currentTheme.accentColor : currentTheme.buttonColor,
                    color: userSettings.themeId === id ? 'white' : currentTheme.foregroundColor,
                    border: `1px solid ${currentTheme.borderColor}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: userSettings.themeId === id ? '600' : '400'
                  }}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          {/* Editor Settings */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '500' }}>Editor</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={userSettings.minimapEnabled}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, minimapEnabled: e.target.checked }))}
                  style={{ accentColor: currentTheme.accentColor }}
                />
                Enable Minimap
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={userSettings.wordWrapEnabled}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, wordWrapEnabled: e.target.checked }))}
                  style={{ accentColor: currentTheme.accentColor }}
                />
                Enable Word Wrap
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={userSettings.autoDetectTheme}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, autoDetectTheme: e.target.checked }))}
                  style={{ accentColor: currentTheme.accentColor }}
                />
                Auto-detect system theme
              </label>
            </div>
          </div>

          {/* Font Settings */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '500' }}>Font</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                Font Size
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={userSettings.fontSize}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                  style={{ accentColor: currentTheme.accentColor }}
                />
                <span style={{ fontSize: '12px', opacity: 0.7 }}>{userSettings.fontSize}px</span>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                Font Family
                <select
                  value={userSettings.fontFamily}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, fontFamily: e.target.value }))}
                  style={{
                    backgroundColor: currentTheme.buttonColor,
                    color: currentTheme.foregroundColor,
                    border: `1px solid ${currentTheme.borderColor}`,
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="'Fira Code', 'Consolas', 'Monaco', monospace">Fira Code</option>
                  <option value="'JetBrains Mono', 'Consolas', 'Monaco', monospace">JetBrains Mono</option>
                  <option value="'Source Code Pro', 'Consolas', 'Monaco', monospace">Source Code Pro</option>
                  <option value="'Consolas', 'Monaco', monospace">Consolas</option>
                  <option value="'Monaco', monospace">Monaco</option>
                  <option value="monospace">System Monospace</option>
                </select>
              </label>
            </div>
          </div>

          {/* Custom Accent Color */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '500' }}>Accent Color</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="color"
                value={userSettings.customAccentColor || currentTheme.accentColor}
                onChange={(e) => setCustomAccentColor(e.target.value)}
                style={{
                  width: '40px',
                  height: '40px',
                  border: `2px solid ${currentTheme.borderColor}`,
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              />
              <button
                onClick={() => setUserSettings(prev => ({ ...prev, customAccentColor: undefined }))}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentTheme.buttonColor,
                  color: currentTheme.foregroundColor,
                  border: `1px solid ${currentTheme.borderColor}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Reset to Default
              </button>
            </div>
          </div>

          {/* Close Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowSettings(false)}
              style={{
                padding: '10px 20px',
                backgroundColor: currentTheme.accentColor,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: userSettings.fontFamily,
      background: currentTheme.backgroundColor,
      paddingTop: isMac ? '28px' : '0' // Space for macOS title bar
    }}>

      {/* Tab bar */}
      <div style={{
        height: '32px',
        background: isMac && currentTheme.monacoTheme === 'vs-dark' 
          ? currentTheme.tabBackgroundColor
          : isMac 
          ? '#e8e8e8'  // Match macOS light title bar better
          : currentTheme.tabBackgroundColor,
        borderBottom: `1px solid ${currentTheme.borderColor}`,
        display: 'flex',
        alignItems: 'center',
        overflow: 'auto'
      }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            style={{
              height: '100%',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              background: tab.id === activeTabId 
                ? currentTheme.tabActiveColor
                : 'transparent',
              borderRight: `1px solid ${currentTheme.borderColor}`,
              cursor: 'pointer',
              color: currentTheme.foregroundColor,
              fontSize: '13px',
              minWidth: '120px',
              position: 'relative'
            }}
          >
            <span style={{ marginRight: '8px' }}>
              {tab.title}{tab.isDirty ? ' •' : ''}
            </span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentTheme.foregroundColor,
                  cursor: 'pointer',
                  padding: '2px',
                  fontSize: '12px',
                  opacity: 0.7
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Area di editing con Monaco */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {activeTab && (
          <MonacoEditor
            value={activeTab.content}
            onChange={handleContentChange}
            language={activeTab.language}
            theme={currentTheme.monacoTheme}
            minimapEnabled={userSettings.minimapEnabled}
            wordWrapEnabled={userSettings.wordWrapEnabled}
            onEditorMount={(editor) => {
              editorInstanceRef.current = editor;
            }}
          />
        )}
      </div>

      {/* Status bar */}
      <div style={{
        height: '24px',
        background: currentTheme.accentColor,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <span>
          {activeTab?.language.toUpperCase() || 'PLAINTEXT'}
          {activeTab?.filePath && ` • ${activeTab.filePath.split('/').pop()}`}
          {activeTab?.isDirty && ' • Modified'}
        </span>
        <span>
          UTF-8 | Ln {activeTab?.content.split('\n').length || 0} | Ch {activeTab?.content.length || 0}
        </span>
      </div>

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}