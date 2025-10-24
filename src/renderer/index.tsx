import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { notification } from 'antd';

// Monaco Editor configuration for Electron
if (typeof global === 'undefined') {
  (window as any).global = globalThis;
}
if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
}





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

// Panel system interfaces (VSCode-like)
interface EditorPanel {
  id: string;
  tabs: FileTab[];
  activeTabId?: string;
}

interface SplitLayout {
  leftPanel: EditorPanel;
  rightPanel?: EditorPanel;
  bottomPanel?: EditorPanel;
  splitRatio: number; // 0-100, percentage for left panel
  bottomSplitRatio: number; // 0-100, percentage for top area
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
  activeTabId?: string; // Add this to force updates when tab changes
  onEditorMount?: (editor: any) => void;
  onSelectionChange?: (selectionInfo: {
    selectedText: string;
    selectedLength: number;
    cursorPosition: { line: number; column: number };
  }) => void;
}> = ({ value, onChange, language, theme, minimapEnabled, wordWrapEnabled, activeTabId, onEditorMount, onSelectionChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<any>(null);
  const [monaco, setMonaco] = useState<any>(null);
  const lastActiveTabId = useRef<string | undefined>(activeTabId);

  useEffect(() => {
    if (editorRef.current && !editor) {
      // Dynamically import Monaco Editor
      import('monaco-editor').then((monacoModule) => {
        setMonaco(monacoModule);
        
        // Completely disable TypeScript/JavaScript language services to prevent worker errors
        monacoModule.languages.typescript.typescriptDefaults.setWorkerOptions({
          customWorkerPath: undefined
        });
        monacoModule.languages.typescript.javascriptDefaults.setWorkerOptions({
          customWorkerPath: undefined
        });
        
        // Disable all TypeScript/JavaScript diagnostics and features that require workers
        monacoModule.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSyntaxValidation: true,
          noSemanticValidation: true,
          noSuggestionDiagnostics: true
        });
        
        monacoModule.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
          noSyntaxValidation: true,
          noSemanticValidation: true,
          noSuggestionDiagnostics: true
        });
        
        // Disable compiler options that might trigger worker usage
        monacoModule.languages.typescript.typescriptDefaults.setCompilerOptions({
          noLib: true,
          allowNonTsExtensions: true
        });
        
        monacoModule.languages.typescript.javascriptDefaults.setCompilerOptions({
          noLib: true,
          allowNonTsExtensions: true
        });

        const newEditor = monacoModule.editor.create(editorRef.current!, {
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
          // Disable features that might use workers
          quickSuggestions: false,
          acceptSuggestionOnCommitCharacter: false,
          acceptSuggestionOnEnter: 'off',
          tabCompletion: 'off',
          // Find and replace
          find: {
            seedSearchStringFromSelection: 'always',
            autoFindInSelection: 'never'
          },
          // Disable hover and language features that require workers
          hover: {
            enabled: false
          },
          parameterHints: {
            enabled: false
          },
          suggestOnTriggerCharacters: false,
          wordBasedSuggestions: 'off',
          // Keep basic editor functionality
          contextmenu: true,
          mouseWheelZoom: true
        });

        newEditor.onDidChangeModelContent(() => {
          const newValue = newEditor.getValue();
          onChange(newValue);
        });

        // Listen for cursor position and selection changes
        newEditor.onDidChangeCursorPosition((e) => {
          if (onSelectionChange) {
            const position = newEditor.getPosition();
            const selection = newEditor.getSelection();
            const selectedText = selection ? newEditor.getModel()?.getValueInRange(selection) || '' : '';
            
            onSelectionChange({
              selectedText: selectedText,
              selectedLength: selectedText.length,
              cursorPosition: {
                line: position?.lineNumber || 1,
                column: position?.column || 1
              }
            });
          }
        });

        newEditor.onDidChangeCursorSelection((e) => {
          if (onSelectionChange) {
            const position = newEditor.getPosition();
            const selection = newEditor.getSelection();
            const selectedText = selection ? newEditor.getModel()?.getValueInRange(selection) || '' : '';
            
            onSelectionChange({
              selectedText: selectedText,
              selectedLength: selectedText.length,
              cursorPosition: {
                line: position?.lineNumber || 1,
                column: position?.column || 1
              }
            });
          }
        });

        setEditor(newEditor);
        if (onEditorMount) {
          onEditorMount(newEditor);
        }
        
        // Ensure initial value is set correctly
        if (value && value !== newEditor.getValue()) {
          newEditor.setValue(value);
        }
      });
    }

    return () => {
      if (editor) {
        editor.dispose();
      }
    };
  }, []);

  // Force update when activeTabId changes (tab switching)
  useEffect(() => {
    if (editor && activeTabId !== lastActiveTabId.current) {
      lastActiveTabId.current = activeTabId;
      
      // Create a completely new model for each tab switch
      if (monaco) {
        const oldModel = editor.getModel();
        const newModel = monaco.editor.createModel(value || '', language);
        
        editor.setModel(newModel);
        editor.setPosition({ lineNumber: 1, column: 1 });
        
        // Dispose old model to prevent memory leaks
        if (oldModel) {
          oldModel.dispose();
        }
      } else {
        // Fallback if monaco is not available
        editor.setValue(value || '');
        editor.setPosition({ lineNumber: 1, column: 1 });
      }
      
      // Force focus and layout update
      setTimeout(() => {
        editor.focus();
        editor.layout();
      }, 0);
    }
  }, [activeTabId, editor, value, language, monaco]);

  // Update editor content when value changes (normal editing)
  useEffect(() => {
    if (editor && activeTabId === lastActiveTabId.current) {
      const currentValue = editor.getValue();
      if (value !== currentValue) {
        // Save cursor position for normal editing
        const position = editor.getPosition();
        
        // Update value
        editor.setValue(value);
        
        // Restore position if valid
        try {
          if (position && value.length > 0) {
            editor.setPosition(position);
          }
        } catch {
          editor.setPosition({ lineNumber: 1, column: 1 });
        }
      }
    }
  }, [value, editor, activeTabId]);

  // Handle language changes - completely avoid Monaco's language service activation
  useEffect(() => {
    if (editor && monaco) {
      const currentModel = editor.getModel();
      if (currentModel) {
        const currentLanguage = currentModel.getLanguageId();
        
        if (currentLanguage !== language) {
          // Instead of changing language on existing model, create a new one
          // This avoids triggering Monaco's language service worker system
          const content = currentModel.getValue();
          const newModel = monaco.editor.createModel(content, language);
          
          // Preserve cursor position
          const position = editor.getPosition();
          
          // Set the new model
          editor.setModel(newModel);
          
          // Restore cursor position
          if (position) {
            editor.setPosition(position);
          }
          
          // Dispose the old model to prevent memory leaks
          currentModel.dispose();
        }
      }
    }
  }, [language, editor, monaco]);

  return <div ref={editorRef} style={{ 
    width: '100%', 
    height: '100%',
    border: 'none',
    borderTop: 'none',
    borderBottom: 'none',
    outline: 'none'
  }} />;
};

// Monaco Diff Editor Component
const MonacoDiffEditor: React.FC<{
  leftContent: string;
  rightContent: string;
  leftName: string;
  rightName: string;
  theme: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
  onExitCompare: () => void;
}> = ({ leftContent, rightContent, leftName, rightName, theme, onExitCompare }) => {
  const diffEditorRef = useRef<HTMLDivElement>(null);
  const [diffEditor, setDiffEditor] = useState<any>(null);
  const [monaco, setMonaco] = useState<any>(null);

  useEffect(() => {
    if (diffEditorRef.current) {
      // Dynamically import Monaco Editor
      import('monaco-editor').then((monacoModule) => {
        setMonaco(monacoModule);
        
        const originalModel = monacoModule.editor.createModel(leftContent, 'plaintext');
        const modifiedModel = monacoModule.editor.createModel(rightContent, 'plaintext');
        
        const diffEditor = monacoModule.editor.createDiffEditor(diffEditorRef.current!, {
          theme: theme,
          renderSideBySide: true,
          readOnly: true,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          minimap: { enabled: false },
        });
        
        diffEditor.setModel({
          original: originalModel,
          modified: modifiedModel
        });
        
        setDiffEditor(diffEditor);

        return () => {
          if (diffEditor) {
            diffEditor.dispose();
          }
          originalModel.dispose();
          modifiedModel.dispose();
        };
      });
    }
  }, []);

  // Update theme
  useEffect(() => {
    if (diffEditor && monaco) {
      monaco.editor.setTheme(theme);
    }
  }, [theme, diffEditor, monaco]);

  // Update content
  useEffect(() => {
    if (diffEditor && monaco) {
      const model = diffEditor.getModel();
      if (model) {
        const originalModel = monaco.editor.createModel(leftContent, 'plaintext');
        const modifiedModel = monaco.editor.createModel(rightContent, 'plaintext');
        
        diffEditor.setModel({
          original: originalModel,
          modified: modifiedModel
        });
        
        // Dispose old models
        if (model.original) model.original.dispose();
        if (model.modified) model.modified.dispose();
      }
    }
  }, [leftContent, rightContent, diffEditor, monaco]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with file names and exit button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '8px 16px',
        borderBottom: '1px solid #ccc',
        backgroundColor: theme === 'vs-dark' ? '#2d2d30' : '#f3f3f3'
      }}>
        <div style={{ display: 'flex', flex: 1 }}>
          <div style={{ flex: 1, fontWeight: 'bold', color: theme === 'vs-dark' ? '#cccccc' : '#333333' }}>
            {leftName}
          </div>
          <div style={{ flex: 1, fontWeight: 'bold', color: theme === 'vs-dark' ? '#cccccc' : '#333333' }}>
            {rightName}
          </div>
        </div>
        <button
          onClick={onExitCompare}
          style={{
            padding: '4px 12px',
            backgroundColor: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Exit Compare
        </button>
      </div>
      
      {/* Diff Editor */}
      <div ref={diffEditorRef} style={{ flex: 1 }} />
    </div>
  );
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

  // Load tabs from localStorage
  const loadTabs = (): FileTab[] => {
    try {
      const saved = localStorage.getItem('notepad-tabs');
      if (saved) {
        const parsedTabs = JSON.parse(saved) as FileTab[];
        // Validate that the tabs have the required structure
        return parsedTabs.filter(tab => 
          tab.id && tab.title && typeof tab.content === 'string' && 
          typeof tab.isDirty === 'boolean' && tab.language
        );
      }
    } catch (error) {
      console.warn('Failed to load tabs:', error);
    }
    // Return default tab if no saved tabs or error
    return [{
      id: '1',
      title: 'untitled',
      content: '',
      isDirty: false,
      language: 'plaintext'
    }];
  };

  // Save tabs to localStorage
  const saveTabs = (tabsToSave: FileTab[]) => {
    try {
      localStorage.setItem('notepad-tabs', JSON.stringify(tabsToSave));
    } catch (error) {
      console.warn('Failed to save tabs:', error);
    }
  };

  // Save active tab ID to localStorage
  const saveActiveTabId = (tabId: string) => {
    try {
      localStorage.setItem('notepad-active-tab', tabId);
    } catch (error) {
      console.warn('Failed to save active tab ID:', error);
    }
  };

  // Load active tab ID from localStorage
  const loadActiveTabId = (availableTabs: FileTab[]): string => {
    try {
      const saved = localStorage.getItem('notepad-active-tab');
      if (saved && availableTabs.some(tab => tab.id === saved)) {
        return saved;
      }
    } catch (error) {
      console.warn('Failed to load active tab ID:', error);
    }
    return availableTabs.length > 0 ? availableTabs[0].id : '1';
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
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareFiles, setCompareFiles] = useState<{left?: string, right?: string, leftName?: string, rightName?: string}>({});
  const [showTabSelector, setShowTabSelector] = useState(false);
  const [selectedLeftTab, setSelectedLeftTab] = useState<string>('');
  const [selectedRightTab, setSelectedRightTab] = useState<string>('');
  const [isHandlingCompare, setIsHandlingCompare] = useState(false);
  const lastCompareTime = useRef<number>(0);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  
  const [tabs, setTabs] = useState<FileTab[]>(() => {
    const loadedTabs = loadTabs();
    return loadedTabs;
  });
  const [activeTabId, setActiveTabId] = useState(() => {
    const loadedTabs = loadTabs();
    return loadActiveTabId(loadedTabs);
  });

  // Split layout state (VSCode-like)
  const [splitLayout, setSplitLayout] = useState<SplitLayout>(() => {
    const loadedTabs = loadTabs();
    const loadedActiveTabId = loadActiveTabId(loadedTabs);
    return {
      leftPanel: {
        id: 'left',
        tabs: loadedTabs,
        activeTabId: loadedActiveTabId
      },
      splitRatio: 50, // percentage for left panel
      bottomSplitRatio: 70 // percentage for top area
    };
  });

  // Drag and drop state
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedTab?: FileTab;
    draggedFromPanel?: string;
    dropZone?: 'left' | 'right' | 'bottom' | null;
  }>({
    isDragging: false,
    dropZone: null
  });
  const [selectionInfo, setSelectionInfo] = useState<{
    selectedText: string;
    selectedLength: number;
    cursorPosition: { line: number; column: number };
  }>({
    selectedText: '',
    selectedLength: 0,
    cursorPosition: { line: 1, column: 1 }
  });
  
  const editorInstanceRef = useRef<any>(null);

  // Update theme when settings change
  useEffect(() => {
    const newTheme = getEffectiveTheme(userSettings);
    setCurrentTheme(newTheme);
    saveSettings(userSettings);
  }, [userSettings]);

  // Auto-save tabs and active tab
  useEffect(() => {
    saveTabs(tabs);
  }, [tabs]);

  useEffect(() => {
    saveActiveTabId(activeTabId);
  }, [activeTabId]);

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

  // Setup native wheel event listener for tabs to avoid passive event issues
  useEffect(() => {
    const tabsContainer = tabsContainerRef.current;
    
    const handleWheelEvent = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault();
        const scrollAmount = e.deltaY > 0 ? 50 : -50;
        tabsContainer!.scrollLeft += scrollAmount;
      }
    };
    
    if (tabsContainer) {
      // Add non-passive event listener
      tabsContainer.addEventListener('wheel', handleWheelEvent, { passive: false });
      
      return () => {
        tabsContainer.removeEventListener('wheel', handleWheelEvent);
      };
    }
  }, []);

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
          case 'menu-compare':
            handleCompareFiles();
            break;
          case 'menu-exit-compare':
            setIsCompareMode(false);
            setCompareFiles({});
            // Exit compare mode by resetting to single panel view
            setSplitLayout(prev => ({
              ...prev,
              leftPanel: {
                ...prev.leftPanel,
                tabs: [
                  ...prev.leftPanel.tabs,
                  ...(prev.rightPanel?.tabs || []),
                  ...(prev.bottomPanel?.tabs || [])
                ],
                activeTabId: prev.leftPanel.activeTabId
              },
              rightPanel: undefined,
              bottomPanel: undefined
            }));
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

  // Extract filename from full path, handling both Windows and Unix separators
  const extractFileName = (filePath: string): string => {
    return filePath.split(/[/\\]/).pop() || 'Unknown';
  };

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
    
    // Add to global cache
    setTabs(prevTabs => [...prevTabs, newTab]);
    
    // Add to left panel
    setSplitLayout(prev => ({
      ...prev,
      leftPanel: {
        ...prev.leftPanel,
        tabs: [...prev.leftPanel.tabs, newTab],
        activeTabId: newTab.id
      }
    }));
  };

  const handleSplitRight = () => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    if (!activeTab) return;

    // Move current tab to right panel and sync with left
    setSplitLayout(prev => ({
      ...prev,
      rightPanel: {
        id: 'right',
        tabs: [activeTab], // Same tab, not a copy
        activeTabId: activeTab.id
      }
    }));

    // Remove from main tabs since it's now managed in panels
    setTabs(prev => prev.filter(t => t.id !== activeTab.id));
  };

  // Drag and drop handlers
  const handleTabDragStart = (tab: FileTab, fromPanel: string) => {
    // Force save all editor contents before drag
    // We'll use a different approach - store editor refs
    setDragState({
      isDragging: true,
      draggedTab: tab,
      draggedFromPanel: fromPanel,
      dropZone: null
    });
  };

  const handleTabDragEnd = () => {
    setDragState({
      isDragging: false,
      dropZone: null
    });
  };

  const handleDropZoneEnter = (zone: 'left' | 'right' | 'bottom') => {
    if (dragState.isDragging) {
      setDragState(prev => ({ ...prev, dropZone: zone }));
    }
  };

  const handleDropZoneLeave = () => {
    setDragState(prev => ({ ...prev, dropZone: null }));
  };

  const handleTabDrop = (toPanel: string) => {
    if (!dragState.draggedTab || !dragState.draggedFromPanel) return;

    // Get the updated tab with current content from the source panel
    let sourceTab: FileTab | undefined;
    if (dragState.draggedFromPanel === 'left') {
      sourceTab = splitLayout.leftPanel.tabs.find(t => t.id === dragState.draggedTab!.id);
    } else if (dragState.draggedFromPanel === 'right' && splitLayout.rightPanel) {
      sourceTab = splitLayout.rightPanel.tabs.find(t => t.id === dragState.draggedTab!.id);
    } else if (dragState.draggedFromPanel === 'bottom' && splitLayout.bottomPanel) {
      sourceTab = splitLayout.bottomPanel.tabs.find(t => t.id === dragState.draggedTab!.id);
    }
    
    if (!sourceTab) return; // Tab not found
    
    // Use the tab as is from the source panel (it already has the current content)
    const tab: FileTab = sourceTab;
    
    if (toPanel === 'right') {
      // Create or add to right panel
      setSplitLayout(prev => ({
        ...prev,
        rightPanel: {
          id: 'right',
          tabs: prev.rightPanel ? [...prev.rightPanel.tabs, tab] : [tab],
          activeTabId: tab.id
        }
      }));

      // Remove from source panel
      if (dragState.draggedFromPanel === 'left') {
        setSplitLayout(prev => ({
          ...prev,
          leftPanel: {
            ...prev.leftPanel,
            tabs: prev.leftPanel.tabs.filter(t => t.id !== tab.id),
            activeTabId: prev.leftPanel.tabs.filter(t => t.id !== tab.id)[0]?.id
          }
        }));
      } else if (dragState.draggedFromPanel === 'right') {
        setSplitLayout(prev => ({
          ...prev,
          rightPanel: prev.rightPanel ? {
            ...prev.rightPanel,
            tabs: prev.rightPanel.tabs.filter(t => t.id !== tab.id),
            activeTabId: prev.rightPanel.tabs.filter(t => t.id !== tab.id)[0]?.id
          } : undefined
        }));
      }
    } else if (toPanel === 'left') {
      // Move to left panel
      setSplitLayout(prev => {
        // Salva il contenuto attuale del pannello sinistro
        const currentLeftTabs = prev.leftPanel.tabs;
        
        // Se stiamo trascinando da sinistra stesso, dobbiamo splitare
        if (dragState.draggedFromPanel === 'left') {
          // Rimuovi il tab trascinato dal pannello sinistro
          const remainingLeftTabs = currentLeftTabs.filter(t => t.id !== tab.id);
          
          return {
            ...prev,
            leftPanel: {
              ...prev.leftPanel,
              tabs: [tab],
              activeTabId: tab.id
            },
            rightPanel: remainingLeftTabs.length > 0 ? {
              id: 'right',
              tabs: remainingLeftTabs,
              activeTabId: remainingLeftTabs[0]?.id
            } : prev.rightPanel
          };
        }
        
        // Crea il nuovo pannello sinistro con SOLO il tab trascinato
        const newLeftPanel = {
          ...prev.leftPanel,
          tabs: [tab],
          activeTabId: tab.id
        };
        
        // Determina cosa va nel pannello destro
        let newRightTabs: EditorPanel['tabs'] = [];
        
        if (dragState.draggedFromPanel === 'right' && prev.rightPanel) {
          // Tab dal pannello destro: tutti i tab del sinistro + tab rimanenti del destro
          const remainingRightTabs = prev.rightPanel.tabs.filter(t => t.id !== tab.id);
          newRightTabs = [...currentLeftTabs, ...remainingRightTabs];
        } else if (dragState.draggedFromPanel === 'bottom') {
          // Tab dal pannello inferiore: solo i tab del sinistro vanno a destra
          newRightTabs = currentLeftTabs;
        }
        
        return {
          ...prev,
          leftPanel: newLeftPanel,
          rightPanel: newRightTabs.length > 0 ? {
            id: 'right',
            tabs: newRightTabs,
            activeTabId: newRightTabs[0]?.id
          } : prev.rightPanel
        };
      });

      // Rimuovi dalla sorgente
      if (dragState.draggedFromPanel === 'bottom') {
        setSplitLayout(prev => {
          const remainingTabs = prev.bottomPanel!.tabs.filter(t => t.id !== tab.id);
          return {
            ...prev,
            bottomPanel: remainingTabs.length > 0 ? {
              ...prev.bottomPanel!,
              tabs: remainingTabs,
              activeTabId: remainingTabs[0]?.id
            } : undefined
          };
        });
      }
    } else if (toPanel === 'bottom') {
      // Create or add to bottom panel
      setSplitLayout(prev => ({
        ...prev,
        bottomPanel: {
          id: 'bottom',
          tabs: prev.bottomPanel ? [...prev.bottomPanel.tabs, tab] : [tab],
          activeTabId: tab.id
        }
      }));

      // Remove from source panel
      if (dragState.draggedFromPanel === 'left') {
        setSplitLayout(prev => ({
          ...prev,
          leftPanel: {
            ...prev.leftPanel,
            tabs: prev.leftPanel.tabs.filter(t => t.id !== tab.id),
            activeTabId: prev.leftPanel.tabs.filter(t => t.id !== tab.id)[0]?.id
          }
        }));
      } else if (dragState.draggedFromPanel === 'right') {
        setSplitLayout(prev => {
          const remainingTabs = prev.rightPanel!.tabs.filter(t => t.id !== tab.id);
          return {
            ...prev,
            rightPanel: remainingTabs.length > 0 ? {
              ...prev.rightPanel!,
              tabs: remainingTabs,
              activeTabId: remainingTabs[0]?.id
            } : undefined
          };
        });
      } else if (dragState.draggedFromPanel === 'bottom') {
        setSplitLayout(prev => {
          const remainingTabs = prev.bottomPanel!.tabs.filter(t => t.id !== tab.id);
          return {
            ...prev,
            bottomPanel: remainingTabs.length > 0 ? {
              ...prev.bottomPanel!,
              tabs: remainingTabs,
              activeTabId: remainingTabs[0]?.id
            } : undefined
          };
        });
      }
    }

    handleTabDragEnd();
  };

  // Resize handlers
  const handleVerticalResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const containerRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!containerRect) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const containerWidth = containerRect.width;
      const newSplitRatio = Math.max(20, Math.min(80, 
        ((startX - containerRect.left + deltaX) / containerWidth) * 100
      ));

      setSplitLayout(prev => ({
        ...prev,
        splitRatio: newSplitRatio
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleHorizontalResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const containerRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!containerRect) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const containerHeight = containerRect.height;
      const newBottomSplitRatio = Math.max(20, Math.min(80, 
        ((startY - containerRect.top + deltaY) / containerHeight) * 100
      ));

      setSplitLayout(prev => ({
        ...prev,
        bottomSplitRatio: newBottomSplitRatio
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleOpen = async () => {
    if (!window.electronAPI) {
      notification.warning({
        message: 'File Operations Unavailable',
        description: 'File operations are not available in this environment.',
        placement: 'topRight',
      });
      return;
    }

    try {
      const result = await window.electronAPI.showOpenDialog();
      if (result.canceled || !result.filePaths?.length) return;

      const filePath = result.filePaths[0];
      const fileResult = await window.electronAPI.readFile(filePath);
      
      if (fileResult.success && fileResult.content !== undefined) {
        const fileName = extractFileName(filePath);
        const language = detectLanguageFromFileName(fileName);
        
        const newTab: FileTab = {
          id: Date.now().toString(),
          title: fileName,
          content: fileResult.content,
          filePath: filePath,
          isDirty: false,
          language: language
        };
        
        // Add to global cache
        setTabs([...tabs, newTab]);
        setActiveTabId(newTab.id);
        
        // Add to left panel
        setSplitLayout(prev => ({
          ...prev,
          leftPanel: {
            ...prev.leftPanel,
            tabs: [...prev.leftPanel.tabs, newTab],
            activeTabId: newTab.id
          }
        }));
      } else {
        notification.error({
          message: 'File Read Error',
          description: `Error reading file: ${fileResult.error}`,
          placement: 'topRight',
        });
      }
    } catch (error) {
      notification.error({
        message: 'File Open Error',
        description: `Error opening file: ${error}`,
        placement: 'topRight',
      });
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
          notification.error({
            message: 'File Save Error',
            description: `Error saving file: ${result.error}`,
            placement: 'topRight',
          });
        }
      } else {
        // Save as new file
        handleSaveAs();
      }
    } catch (error) {
      notification.error({
        message: 'File Save Error',
        description: `Error saving file: ${error}`,
        placement: 'topRight',
      });
    }
  };

  const handleSaveAs = async () => {
    if (!activeTab || !window.electronAPI) return;

    try {
      const result = await window.electronAPI.showSaveDialog();
      if (result.canceled || !result.filePath) return;

      const saveResult = await window.electronAPI.writeFile(result.filePath, activeTab.content);
      if (saveResult.success) {
        const fileName = extractFileName(result.filePath);
        const detectedLanguage = detectLanguageFromFileName(fileName);
        
        updateTab(activeTab.id, { 
          title: fileName,
          filePath: result.filePath,
          isDirty: false,
          language: detectedLanguage
        });
      } else {
        notification.error({
          message: 'File Save Error',
          description: `Error saving file: ${saveResult.error}`,
          placement: 'topRight',
        });
      }
    } catch (error) {
      notification.error({
        message: 'File Save Error',
        description: `Error saving file: ${error}`,
        placement: 'topRight',
      });
    }
  };

  const handleCompareFiles = async () => {
    // Prevent multiple calls (debounce with 500ms)
    const now = Date.now();
    if (isHandlingCompare || (now - lastCompareTime.current) < 500) {
      return;
    }
    lastCompareTime.current = now;
    setIsHandlingCompare(true);
    
    try {
      // Use global cache as source of truth for all tabs
      const allTabs = tabs;
      
      // Check if we have at least 2 tabs open
      if (allTabs.length < 2) {
        notification.warning({
          message: 'Compare Error',
          description: 'You need at least 2 files/documents open to compare. Create new files or open existing ones.',
          placement: 'topRight',
        });
        return;
      }

      // If we have exactly 2 tabs, compare them automatically
      if (allTabs.length === 2) {
        const leftTab = allTabs[0];
        const rightTab = allTabs[1];
        
        setSplitLayout(prev => ({
          ...prev,
          leftPanel: {
            ...prev.leftPanel,
            tabs: [leftTab],
            activeTabId: leftTab.id
          },
          rightPanel: {
            id: 'right',
            tabs: [rightTab],
            activeTabId: rightTab.id
          }
        }));
        
        setIsCompareMode(true);
        setCompareFiles({
          left: leftTab.content,
          right: rightTab.content,
          leftName: leftTab.title,
          rightName: rightTab.title
        });
        
        notification.success({
          message: 'Compare Mode',
          description: `Comparing "${leftTab.title}" (left) with "${rightTab.title}" (right).`,
          placement: 'topRight',
        });
        return;
      }

      // If we have more than 2 tabs, show tab selector
      setSelectedLeftTab(allTabs[0].id);
      setSelectedRightTab(allTabs[1].id);
      setShowTabSelector(true);

    } catch (error) {
      notification.error({
        message: 'Compare Error',
        description: `Error during comparison: ${error}`,
        placement: 'topRight',
      });
    } finally {
      setIsHandlingCompare(false);
    }
  };

  const startTabComparison = () => {
    const leftTab = tabs.find(tab => tab.id === selectedLeftTab);
    const rightTab = tabs.find(tab => tab.id === selectedRightTab);
    
    if (!leftTab || !rightTab) {
      notification.error({
        message: 'Compare Error',
        description: 'Selected tabs not found',
        placement: 'topRight',
      });
      return;
    }
    
    if (leftTab.id === rightTab.id) {
      notification.warning({
        message: 'Compare Error',
        description: 'Cannot compare a file with itself. Please select different files.',
        placement: 'topRight',
      });
      return;
    }
    
    // Create split screen with selected tabs
    setSplitLayout(prev => ({
      ...prev,
      leftPanel: {
        ...prev.leftPanel,
        tabs: [leftTab],
        activeTabId: leftTab.id
      },
      rightPanel: {
        id: 'right',
        tabs: [rightTab],
        activeTabId: rightTab.id
      }
    }));
    
    setShowTabSelector(false);
    setIsCompareMode(true);
    setCompareFiles({
      left: leftTab.content,
      right: rightTab.content,
      leftName: leftTab.title,
      rightName: rightTab.title
    });
    
    notification.success({
      message: 'Compare Mode',
      description: `Comparing "${leftTab.title}" (left) with "${rightTab.title}" (right).`,
      placement: 'topRight',
    });
  };

  // Function to close a tab from any panel and sync with global cache
  const closeTabFromPanel = (tabId: string, fromPanel: 'left' | 'right' | 'bottom') => {
    // Remove from the specific panel
    setSplitLayout(prev => {
      const updatedLayout = { ...prev };
      
      if (fromPanel === 'left') {
        const remainingTabs = prev.leftPanel.tabs.filter(t => t.id !== tabId);
        updatedLayout.leftPanel = {
          ...prev.leftPanel,
          tabs: remainingTabs,
          activeTabId: remainingTabs[0]?.id
        };
      } else if (fromPanel === 'right' && prev.rightPanel) {
        const remainingTabs = prev.rightPanel.tabs.filter(t => t.id !== tabId);
        updatedLayout.rightPanel = remainingTabs.length > 0 ? {
          ...prev.rightPanel,
          tabs: remainingTabs,
          activeTabId: remainingTabs[0]?.id
        } : undefined;
      } else if (fromPanel === 'bottom' && prev.bottomPanel) {
        const remainingTabs = prev.bottomPanel.tabs.filter(t => t.id !== tabId);
        updatedLayout.bottomPanel = remainingTabs.length > 0 ? {
          ...prev.bottomPanel,
          tabs: remainingTabs,
          activeTabId: remainingTabs[0]?.id
        } : undefined;
      }
      
      return updatedLayout;
    });
    
    // Check if tab exists in other panels, if not remove from global cache
    setTimeout(() => {
      setSplitLayout(current => {
        const allPanelTabs = [
          ...current.leftPanel.tabs,
          ...(current.rightPanel?.tabs || []),
          ...(current.bottomPanel?.tabs || [])
        ];
        
        const tabExistsInPanels = allPanelTabs.some(t => t.id === tabId);
        
        if (!tabExistsInPanels) {
          // Remove from global cache only if not in any panel
          setTabs(prevTabs => prevTabs.filter(t => t.id !== tabId));
        }
        
        return current;
      });
    }, 0);
  };

  const updateTab = (tabId: string, updates: Partial<FileTab>) => {
    // Update global cache - this is our source of truth for all tabs
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
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = currentTheme.accentColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.9)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: currentTheme.foregroundColor,
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0',
                borderRadius: '4px',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px'
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
    <div className="app-container" style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: userSettings.fontFamily,
      background: currentTheme.backgroundColor,
      border: 'none',
      outline: 'none'
    }}>
      {/* CSS to hide tab scrollbars */}
      <style>{`
        .tab-bar::-webkit-scrollbar {
          display: none;
        }
        .tab-bar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>



      {/* VSCode-like Editor Layout or Compare View */}
      <div className="editor-layout" style={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Compare Mode View */}
        {isCompareMode ? (
          <MonacoDiffEditor
            leftContent={compareFiles.left || ''}
            rightContent={compareFiles.right || ''}
            leftName={compareFiles.leftName || 'File 1'}
            rightName={compareFiles.rightName || 'File 2'}
            theme={currentTheme.monacoTheme}
            onExitCompare={() => {
              setIsCompareMode(false);
              setCompareFiles({});
            }}
          />
        ) : (
          <>
            {/* Normal Split Screen Layout */}
            {/* Top area (left + right panels) */}
            <div style={{ 
              flex: splitLayout.bottomPanel ? `${splitLayout.bottomSplitRatio}%` : '1',
              display: 'flex',
              overflow: 'hidden'
            }}>
            {/* Left Panel */}
            <div style={{ 
              width: splitLayout.rightPanel ? `${splitLayout.splitRatio}%` : '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
          {/* Left Panel Tab Bar */}
          <div 
            ref={tabsContainerRef}
            style={{
              height: '32px',
              background: currentTheme.tabBackgroundColor,
              display: 'flex',
              alignItems: 'center',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              borderBottom: `1px solid ${currentTheme.borderColor}`
            }}
          >
            {splitLayout.leftPanel.tabs.map(tab => (
              <div
                key={tab.id}
                draggable={true}
                onClick={() => setSplitLayout(prev => ({...prev, leftPanel: {...prev.leftPanel, activeTabId: tab.id}}))}
                onDragStart={() => handleTabDragStart(tab, 'left')}
                onDragEnd={handleTabDragEnd}
                style={{
                  height: '100%',
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  background: tab.id === splitLayout.leftPanel.activeTabId ? currentTheme.tabActiveColor : 'transparent',
                  borderRight: `1px solid ${currentTheme.borderColor}`,
                  cursor: 'pointer',
                  color: currentTheme.foregroundColor,
                  fontSize: '13px',
                  minWidth: '100px',
                  maxWidth: '180px',
                  opacity: dragState.draggedTab?.id === tab.id ? 0.5 : 1
                }}
              >
                <span style={{ 
                  marginRight: '8px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: '1'
                }}>
                  {tab.title}{tab.isDirty ? ' •' : ''}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTabFromPanel(tab.id, 'left');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: currentTheme.foregroundColor,
                    cursor: 'pointer',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.7
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            
            {/* Bottone + subito dopo l'ultima tab */}
            <button onClick={handleNew} style={{ 
              padding: '0 8px', 
              background: 'transparent', 
              border: 'none', 
              color: currentTheme.foregroundColor, 
              cursor: 'pointer',
              fontSize: '16px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              opacity: 0.7
            }}>+</button>
            
            {/* Spacer per spingere il bottone split a destra */}
            <div style={{ flex: 1 }}></div>
            
            {/* Bottone split ancorato a destra */}
            <button onClick={handleSplitRight} style={{ 
              padding: '0 8px', 
              background: 'transparent', 
              border: 'none', 
              color: currentTheme.foregroundColor, 
              cursor: 'pointer',
              fontSize: '14px',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              borderLeft: `1px solid ${currentTheme.borderColor}`
            }}>⚏</button>
          </div>

          {/* Left Panel Editor - One editor per tab */}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            {splitLayout.leftPanel.tabs.map(tab => (
              <div
                key={tab.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: tab.id === splitLayout.leftPanel.activeTabId ? 'block' : 'none'
                }}
              >
                <MonacoEditor
                  value={tab.content}
                  onChange={(newValue) => {
                    // Update global cache (source of truth)
                    updateTab(tab.id, { content: newValue, isDirty: true });
                    
                    // Update split layout for immediate UI update
                    setSplitLayout(prev => ({
                      ...prev,
                      leftPanel: {
                        ...prev.leftPanel,
                        tabs: prev.leftPanel.tabs.map(t => 
                          t.id === tab.id ? {...t, content: newValue, isDirty: true} : t
                        )
                      }
                    }));
                  }}
                  language={tab.language}
                  theme={currentTheme.monacoTheme}
                  minimapEnabled={userSettings.minimapEnabled}
                  wordWrapEnabled={userSettings.wordWrapEnabled}
                  activeTabId={tab.id}
                  onSelectionChange={setSelectionInfo}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Resize Handle */}
        {splitLayout.rightPanel && (
          <div 
            style={{
              width: '3px',
              background: currentTheme.borderColor,
              cursor: 'col-resize'
            }}
            onMouseDown={handleVerticalResize}
          />
        )}

        {/* Right Panel */}
        {splitLayout.rightPanel && (
          <div style={{ 
            width: `${100 - splitLayout.splitRatio}%`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderLeft: `1px solid ${currentTheme.borderColor}`
          }}>
            {/* Right Panel Tab Bar */}
            <div style={{
              height: '32px',
              background: currentTheme.tabBackgroundColor,
              display: 'flex',
              alignItems: 'center',
              borderBottom: `1px solid ${currentTheme.borderColor}`
            }}>
              {splitLayout.rightPanel.tabs.map(tab => (
                <div
                  key={tab.id}
                  draggable={true}
                  onClick={() => setSplitLayout(prev => ({...prev, rightPanel: {...prev.rightPanel!, activeTabId: tab.id}}))}
                  onDragStart={() => handleTabDragStart(tab, 'right')}
                  onDragEnd={handleTabDragEnd}
                  style={{
                    height: '100%',
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    background: tab.id === splitLayout.rightPanel?.activeTabId ? currentTheme.tabActiveColor : 'transparent',
                    borderRight: `1px solid ${currentTheme.borderColor}`,
                    cursor: 'pointer',
                    color: currentTheme.foregroundColor,
                    fontSize: '13px',
                    opacity: dragState.draggedTab?.id === tab.id ? 0.5 : 1
                  }}
                >
                  <span>{tab.title}{tab.isDirty ? ' •' : ''}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Close right panel if no tabs left
                      const remainingTabs = splitLayout.rightPanel!.tabs.filter(t => t.id !== tab.id);
                      if (remainingTabs.length === 0) {
                        setSplitLayout(prev => ({...prev, rightPanel: undefined}));
                      } else {
                        setSplitLayout(prev => ({
                          ...prev,
                          rightPanel: {
                            ...prev.rightPanel!,
                            tabs: remainingTabs,
                            activeTabId: remainingTabs[0]?.id
                          }
                        }));
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: currentTheme.foregroundColor,
                      cursor: 'pointer',
                      marginLeft: '8px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Right Panel Editor - One editor per tab */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              {splitLayout.rightPanel?.tabs.map(tab => (
                <div
                  key={tab.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: tab.id === splitLayout.rightPanel?.activeTabId ? 'block' : 'none'
                  }}
                >
                  <MonacoEditor
                    value={tab.content}
                    onChange={(newValue) => {
                      // Update global cache (source of truth)
                      updateTab(tab.id, { content: newValue, isDirty: true });
                      
                      // Update split layout for immediate UI update
                      setSplitLayout(prev => ({
                        ...prev,
                        rightPanel: prev.rightPanel ? {
                          ...prev.rightPanel,
                          tabs: prev.rightPanel.tabs.map(t => 
                            t.id === tab.id ? {...t, content: newValue, isDirty: true} : t
                          )
                        } : undefined
                      }));
                    }}
                    language={tab.language}
                    theme={currentTheme.monacoTheme}
                    minimapEnabled={userSettings.minimapEnabled}
                    wordWrapEnabled={userSettings.wordWrapEnabled}
                    activeTabId={tab.id}
                    onSelectionChange={setSelectionInfo}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        </div>

        {/* Bottom Panel Resize Handle */}
        {splitLayout.bottomPanel && (
          <div 
            style={{
              height: '3px',
              background: currentTheme.borderColor,
              cursor: 'row-resize',
              borderTop: `1px solid ${currentTheme.borderColor}`,
              borderBottom: `1px solid ${currentTheme.borderColor}`
            }}
            onMouseDown={handleHorizontalResize}
          />
        )}

        {/* Bottom Panel */}
        {splitLayout.bottomPanel && (
          <div style={{ 
            height: `${100 - splitLayout.bottomSplitRatio}%`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderTop: `1px solid ${currentTheme.borderColor}`
          }}>
            {/* Bottom Panel Tab Bar */}
            <div style={{
              height: '32px',
              background: currentTheme.tabBackgroundColor,
              display: 'flex',
              alignItems: 'center',
              borderBottom: `1px solid ${currentTheme.borderColor}`
            }}>
              {splitLayout.bottomPanel.tabs.map(tab => (
                <div
                  key={tab.id}
                  draggable={true}
                  onClick={() => setSplitLayout(prev => ({...prev, bottomPanel: {...prev.bottomPanel!, activeTabId: tab.id}}))}
                  onDragStart={() => handleTabDragStart(tab, 'bottom')}
                  onDragEnd={handleTabDragEnd}
                  style={{
                    height: '100%',
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    background: tab.id === splitLayout.bottomPanel?.activeTabId ? currentTheme.tabActiveColor : 'transparent',
                    borderRight: `1px solid ${currentTheme.borderColor}`,
                    cursor: 'pointer',
                    color: currentTheme.foregroundColor,
                    fontSize: '13px',
                    opacity: dragState.draggedTab?.id === tab.id ? 0.5 : 1
                  }}
                >
                  <span>{tab.title}{tab.isDirty ? ' •' : ''}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Close bottom panel if no tabs left
                      const remainingTabs = splitLayout.bottomPanel!.tabs.filter(t => t.id !== tab.id);
                      if (remainingTabs.length === 0) {
                        setSplitLayout(prev => ({...prev, bottomPanel: undefined}));
                      } else {
                        setSplitLayout(prev => ({
                          ...prev,
                          bottomPanel: {
                            ...prev.bottomPanel!,
                            tabs: remainingTabs,
                            activeTabId: remainingTabs[0]?.id
                          }
                        }));
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: currentTheme.foregroundColor,
                      cursor: 'pointer',
                      marginLeft: '8px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Bottom Panel Editor - One editor per tab */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              {splitLayout.bottomPanel?.tabs.map(tab => (
                <div
                  key={tab.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: tab.id === splitLayout.bottomPanel?.activeTabId ? 'block' : 'none'
                  }}
                >
                  <MonacoEditor
                    value={tab.content}
                    onChange={(newValue) => {
                      // Update global cache (source of truth)
                      updateTab(tab.id, { content: newValue, isDirty: true });
                      
                      // Update split layout for immediate UI update
                      setSplitLayout(prev => ({
                        ...prev,
                        bottomPanel: prev.bottomPanel ? {
                          ...prev.bottomPanel,
                          tabs: prev.bottomPanel.tabs.map(t => 
                            t.id === tab.id ? {...t, content: newValue, isDirty: true} : t
                          )
                        } : undefined
                      }));
                    }}
                    language={tab.language}
                    theme={currentTheme.monacoTheme}
                    minimapEnabled={userSettings.minimapEnabled}
                    wordWrapEnabled={userSettings.wordWrapEnabled}
                    activeTabId={tab.id}
                    onSelectionChange={setSelectionInfo}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        </>
      )}
      </div>

      {/* Drag and Drop Zones */}
      {dragState.isDragging && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 1000
        }}>
          {/* Drop zone sinistra */}
          <div
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '100px',
              height: '100px',
              backgroundColor: dragState.dropZone === 'left' 
                ? `${currentTheme.accentColor}40` 
                : `${currentTheme.borderColor}40`,
              border: `2px dashed ${dragState.dropZone === 'left' 
                ? currentTheme.accentColor 
                : currentTheme.borderColor}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: currentTheme.foregroundColor,
              fontWeight: 'bold',
              pointerEvents: 'auto'
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => handleDropZoneEnter('left')}
            onDragLeave={handleDropZoneLeave}
            onDrop={() => handleTabDrop('left')}
          >
            ←
          </div>

          {/* Drop zone destra */}
          <div
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '100px',
              height: '100px',
              backgroundColor: dragState.dropZone === 'right' 
                ? `${currentTheme.accentColor}40` 
                : `${currentTheme.borderColor}40`,
              border: `2px dashed ${dragState.dropZone === 'right' 
                ? currentTheme.accentColor 
                : currentTheme.borderColor}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: currentTheme.foregroundColor,
              fontWeight: 'bold',
              pointerEvents: 'auto'
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => handleDropZoneEnter('right')}
            onDragLeave={handleDropZoneLeave}
            onDrop={() => handleTabDrop('right')}
          >
            →
          </div>

          {/* Drop zone in basso */}
          <div
            style={{
              position: 'absolute',
              bottom: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100px',
              height: '100px',
              backgroundColor: dragState.dropZone === 'bottom' 
                ? `${currentTheme.accentColor}40` 
                : `${currentTheme.borderColor}40`,
              border: `2px dashed ${dragState.dropZone === 'bottom' 
                ? currentTheme.accentColor 
                : currentTheme.borderColor}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: currentTheme.foregroundColor,
              fontWeight: 'bold',
              pointerEvents: 'auto'
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => handleDropZoneEnter('bottom')}
            onDragLeave={handleDropZoneLeave}
            onDrop={() => handleTabDrop('bottom')}
          >
            ↓
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="status-bar-compact" style={{
        height: '24px',
        background: currentTheme.accentColor,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 8px',
        fontSize: '11px',
        fontFamily: 'monospace',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      }}>
        <div className="status-section" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          minWidth: 0,
          flex: '0 0 auto'
        }}>
          {/* Language selector - clickable */}
          <select
            value={activeTab?.language || 'plaintext'}
            onChange={(e) => handleLanguageChange(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: 'none',
              padding: '1px 4px',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: 'pointer',
              maxWidth: '80px'
            }}
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value} style={{ color: 'black' }}>
                {lang.label}
              </option>
            ))}
          </select>
          
          {activeTab?.filePath && (
            <span className="hide-on-small" style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              maxWidth: '150px'
            }}>
              • {activeTab.filePath.split('/').pop()}
            </span>
          )}
          {activeTab?.isDirty && (
            <span>• Modified</span>
          )}
        </div>
        
        <div className="status-section" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          minWidth: 0,
          flex: '0 0 auto'
        }}>
          {selectionInfo.selectedLength > 0 && (
            <span>Sel: {selectionInfo.selectedLength}</span>
          )}
          <span>Ln {selectionInfo.cursorPosition.line}, Col {selectionInfo.cursorPosition.column}</span>
          <span className="hide-on-small">UTF-8</span>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal />

      {/* Tab Selector Modal for Compare */}
      {showTabSelector && (
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
          zIndex: 1001
        }}>
          <div style={{
            backgroundColor: currentTheme.backgroundColor,
            color: currentTheme.foregroundColor,
            borderRadius: '8px',
            padding: '24px',
            minWidth: '400px',
            maxWidth: '500px',
            border: `1px solid ${currentTheme.borderColor}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Compare Files</h2>
              <button
                onClick={() => setShowTabSelector(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: currentTheme.foregroundColor,
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '0',
                  borderRadius: '4px',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Left File:
              </label>
              <select
                value={selectedLeftTab}
                onChange={(e) => setSelectedLeftTab(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: `1px solid ${currentTheme.borderColor}`,
                  backgroundColor: currentTheme.backgroundColor,
                  color: currentTheme.foregroundColor,
                  fontSize: '14px'
                }}
              >
                {tabs.map(tab => (
                  <option key={tab.id} value={tab.id}>
                    {tab.title}{tab.isDirty ? ' •' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Right File:
              </label>
              <select
                value={selectedRightTab}
                onChange={(e) => setSelectedRightTab(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: `1px solid ${currentTheme.borderColor}`,
                  backgroundColor: currentTheme.backgroundColor,
                  color: currentTheme.foregroundColor,
                  fontSize: '14px'
                }}
              >
                {tabs.map(tab => (
                  <option key={tab.id} value={tab.id}>
                    {tab.title}{tab.isDirty ? ' •' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowTabSelector(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: currentTheme.foregroundColor,
                  border: `1px solid ${currentTheme.borderColor}`,
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={startTabComparison}
                style={{
                  padding: '8px 16px',
                  backgroundColor: currentTheme.accentColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Compare
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}