import React, { useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { Empty, Spin } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { useEditorStore } from '../store/editorStore';
import { FindReplacePanel } from './FindReplacePanel';
import type { editor } from 'monaco-editor';
import * as monaco from 'monaco-editor';

export const EditorPanel: React.FC = () => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const {
    tabs,
    activeTabId,
    isDarkMode,
    fontSize,
    showLineNumbers,
    showMinimap,
    wordWrap,
    tabSize,
    insertSpaces,
    updateTabContent,
    markTabDirty,
    showFindPanel,
    saveFile,
    toggleFindPanel,
  } = useEditorStore();

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      fontSize,
      lineNumbers: showLineNumbers ? 'on' : 'off',
      minimap: { enabled: showMinimap },
      wordWrap: wordWrap ? 'on' : 'off',
      tabSize,
      insertSpaces,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      contextmenu: true,
      mouseWheelZoom: true,
      folding: true,
      foldingHighlight: true,
      foldingImportsByDefault: false,
      unfoldOnClickAfterEndOfLine: false,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
      suggest: {
        showKeywords: true,
        showSnippets: true,
      },
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true,
      },
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save command will be handled by the store
      saveFile();
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      toggleFindPanel();
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (activeTab && value !== undefined) {
      updateTabContent(activeTab.id, value);
      markTabDirty(activeTab.id, true);
    }
  };

  // Update editor options when settings change
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize,
        lineNumbers: showLineNumbers ? 'on' : 'off',
        minimap: { enabled: showMinimap },
        wordWrap: wordWrap ? 'on' : 'off',
        tabSize,
        insertSpaces,
      });
    }
  }, [fontSize, showLineNumbers, showMinimap, wordWrap, tabSize, insertSpaces]);

  if (!activeTab) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDarkMode ? '#1e1e1e' : '#ffffff',
      }}>
        <Empty
          image={<FileTextOutlined style={{ fontSize: 64, color: isDarkMode ? '#434343' : '#d9d9d9' }} />}
          description={
            <span style={{ color: isDarkMode ? '#8c8c8c' : '#595959' }}>
              No file open. Create a new file or open an existing one.
            </span>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100%', 
      position: 'relative',
      background: isDarkMode ? '#1e1e1e' : '#ffffff',
    }}>
      {showFindPanel && (
        <FindReplacePanel editor={editorRef.current} />
      )}
      
      <Editor
        height="100%"
        language={activeTab.language}
        value={activeTab.content}
        theme={isDarkMode ? 'vs-dark' : 'vs-light'}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        loading={<Spin size="large" />}
        options={{
          selectOnLineNumbers: true,
          automaticLayout: true,
        }}
      />
    </div>
  );
};