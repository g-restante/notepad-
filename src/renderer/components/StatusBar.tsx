import React, { useState, useEffect } from 'react';
import { Space, Typography, Divider } from 'antd';
import { 
  FileTextOutlined, 
  EyeOutlined, 
  CodeOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import { useEditorStore } from '../store/editorStore';

const { Text } = Typography;

export const StatusBar: React.FC = () => {
  const { 
    tabs, 
    activeTabId, 
    isDarkMode,
    fontSize,
    tabSize,
    insertSpaces 
  } = useEditorStore();
  
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [encoding, setEncoding] = useState('UTF-8');
  const [eol, setEol] = useState('LF');

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  
  const getLanguageDisplayName = (language: string) => {
    const languageMap: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      json: 'JSON',
      markdown: 'Markdown',
      python: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      plaintext: 'Plain Text',
    };
    return languageMap[language] || language.charAt(0).toUpperCase() + language.slice(1);
  };

  const getContentStats = () => {
    if (!activeTab) return { lines: 0, characters: 0, words: 0 };
    
    const content = activeTab.content;
    const lines = content.split('\n').length;
    const characters = content.length;
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
    
    return { lines, characters, words };
  };

  const stats = getContentStats();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '4px 16px',
      height: 28,
      background: isDarkMode ? '#007acc' : '#007acc',
      color: '#ffffff',
      fontSize: 12,
      borderTop: `1px solid ${isDarkMode ? '#3e3e42' : '#d9d9d9'}`,
    }}>
      <Space size={16}>
        {/* File Info */}
        {activeTab && (
          <Space size={4} style={{ color: '#ffffff' }}>
            <FileTextOutlined />
            <Text style={{ color: '#ffffff', fontSize: 12 }}>
              {activeTab.title}
              {activeTab.isDirty && ' •'}
            </Text>
          </Space>
        )}

        {/* Language */}
        {activeTab && (
          <Space size={4} style={{ color: '#ffffff' }}>
            <CodeOutlined />
            <Text style={{ color: '#ffffff', fontSize: 12 }}>
              {getLanguageDisplayName(activeTab.language)}
            </Text>
          </Space>
        )}
      </Space>

      <Space size={16}>
        {/* Content Stats */}
        {activeTab && (
          <Space size={8} style={{ color: '#ffffff' }}>
            <Text style={{ color: '#ffffff', fontSize: 12 }}>
              Lines: {stats.lines}
            </Text>
            <Text style={{ color: '#ffffff', fontSize: 12 }}>
              Words: {stats.words}
            </Text>
            <Text style={{ color: '#ffffff', fontSize: 12 }}>
              Characters: {stats.characters}
            </Text>
          </Space>
        )}

        {/* Encoding and EOL */}
        <Space size={8} style={{ color: '#ffffff' }}>
          <Text style={{ color: '#ffffff', fontSize: 12 }}>
            {encoding}
          </Text>
          <Text style={{ color: '#ffffff', fontSize: 12 }}>
            {eol}
          </Text>
        </Space>

        {/* Editor Settings */}
        <Space size={8} style={{ color: '#ffffff' }}>
          <Text style={{ color: '#ffffff', fontSize: 12 }}>
            Font: {fontSize}px
          </Text>
          <Text style={{ color: '#ffffff', fontSize: 12 }}>
            Tab: {tabSize} {insertSpaces ? 'spaces' : 'tabs'}
          </Text>
        </Space>

        {/* Cursor Position */}
        <Space size={4} style={{ color: '#ffffff' }}>
          <EyeOutlined />
          <Text style={{ color: '#ffffff', fontSize: 12 }}>
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </Text>
        </Space>
      </Space>
    </div>
  );
};