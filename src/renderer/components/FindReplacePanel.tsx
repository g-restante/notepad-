import React, { useState, useEffect } from 'react';
import { Input, Button, Space, Checkbox } from 'antd';
import { 
  SearchOutlined, 
  CloseOutlined, 
  ArrowDownOutlined, 
  ArrowUpOutlined,
  SwapOutlined 
} from '@ant-design/icons';
import { useEditorStore } from '../store/editorStore';
import type { editor } from 'monaco-editor';

interface FindReplacePanelProps {
  editor: editor.IStandaloneCodeEditor | null;
}

export const FindReplacePanel: React.FC<FindReplacePanelProps> = ({ editor }) => {
  const {
    searchTerm,
    replaceTerm,
    showReplacePanel,
    setSearchTerm,
    setReplaceTerm,
    toggleFindPanel,
    toggleReplacePanel,
    isDarkMode,
  } = useEditorStore();

  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  const findNext = () => {
    if (editor && searchTerm) {
      const action = editor.getAction('actions.findNext');
      if (action) {
        action.run();
      }
    }
  };

  const findPrevious = () => {
    if (editor && searchTerm) {
      const action = editor.getAction('actions.findPrevious');
      if (action) {
        action.run();
      }
    }
  };

  const replaceNext = () => {
    if (editor && searchTerm) {
      const action = editor.getAction('editor.action.replaceOne');
      if (action) {
        action.run();
      }
    }
  };

  const replaceAll = () => {
    if (editor && searchTerm) {
      const action = editor.getAction('editor.action.replaceAll');
      if (action) {
        action.run();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        findPrevious();
      } else {
        findNext();
      }
    } else if (e.key === 'Escape') {
      toggleFindPanel();
    }
  };

  useEffect(() => {
    if (editor) {
      // Trigger find when search term changes
      if (searchTerm) {
        editor.getAction('actions.find')?.run();
      }
    }
  }, [editor, searchTerm, matchCase, wholeWord, useRegex]);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      zIndex: 1000,
      background: isDarkMode ? '#2d2d30' : '#f3f3f3',
      border: `1px solid ${isDarkMode ? '#3e3e42' : '#cccccc'}`,
      borderRadius: 6,
      padding: 12,
      minWidth: 400,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Find Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input
            placeholder="Find"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            prefix={<SearchOutlined />}
            style={{ flex: 1, minWidth: 200 }}
            size="small"
          />
          
          <Space size="small">
            <Button
              size="small"
              icon={<ArrowUpOutlined />}
              onClick={findPrevious}
              disabled={!searchTerm}
            />
            <Button
              size="small"
              icon={<ArrowDownOutlined />}
              onClick={findNext}
              disabled={!searchTerm}
            />
            
            <Button
              size="small"
              icon={<SwapOutlined />}
              onClick={toggleReplacePanel}
              type={showReplacePanel ? 'primary' : 'default'}
            />
            
            <Button
              size="small"
              icon={<CloseOutlined />}
              onClick={toggleFindPanel}
            />
          </Space>
        </div>

        {/* Replace Row */}
        {showReplacePanel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Input
              placeholder="Replace"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ flex: 1, minWidth: 200 }}
              size="small"
            />
            
            <Space size="small">
              <Button
                size="small"
                onClick={replaceNext}
                disabled={!searchTerm}
              >
                Replace
              </Button>
              <Button
                size="small"
                onClick={replaceAll}
                disabled={!searchTerm}
              >
                Replace All
              </Button>
            </Space>
          </div>
        )}

        {/* Options Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
          <Checkbox
            checked={matchCase}
            onChange={(e) => setMatchCase(e.target.checked)}
          >
            Match Case
          </Checkbox>
          
          <Checkbox
            checked={wholeWord}
            onChange={(e) => setWholeWord(e.target.checked)}
          >
            Whole Word
          </Checkbox>
          
          <Checkbox
            checked={useRegex}
            onChange={(e) => setUseRegex(e.target.checked)}
          >
            Regex
          </Checkbox>

          {totalMatches > 0 && (
            <span style={{ 
              marginLeft: 'auto', 
              color: isDarkMode ? '#cccccc' : '#666666',
              fontSize: 11 
            }}>
              {currentMatch} of {totalMatches}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};