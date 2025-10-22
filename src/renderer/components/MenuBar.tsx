import React from 'react';
import { Space, Button, Dropdown, Tooltip } from 'antd';
import {
  FileAddOutlined,
  FolderOpenOutlined,
  SaveOutlined,
  SettingOutlined,
  BulbOutlined,
  BulbFilled,
  SearchOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '../store/editorStore';
import type { MenuProps } from 'antd';

export const MenuBar: React.FC = () => {
  const {
    isDarkMode,
    fontSize,
    toggleTheme,
    setFontSize,
    newFile,
    openFile,
    saveFile,
    toggleFindPanel,
    showLineNumbers,
    showMinimap,
    wordWrap,
    toggleLineNumbers,
    toggleMinimap,
    toggleWordWrap,
  } = useEditorStore();

  const handleNewFile = () => {
    newFile();
  };

  const handleOpenFile = () => {
    openFile();
  };

  const handleSave = () => {
    saveFile();
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(8, Math.min(72, fontSize + delta));
    setFontSize(newSize);
  };

  const viewMenuItems: MenuProps['items'] = [
    {
      key: 'line-numbers',
      label: 'Show Line Numbers',
      onClick: toggleLineNumbers,
      icon: showLineNumbers ? '✓' : '',
    },
    {
      key: 'minimap',
      label: 'Show Minimap',
      onClick: toggleMinimap,
      icon: showMinimap ? '✓' : '',
    },
    {
      key: 'word-wrap',
      label: 'Word Wrap',
      onClick: toggleWordWrap,
      icon: wordWrap ? '✓' : '',
    },
    { type: 'divider' },
    {
      key: 'zoom-in',
      label: 'Zoom In',
      onClick: () => handleFontSizeChange(2),
      icon: <ZoomInOutlined />,
    },
    {
      key: 'zoom-out',
      label: 'Zoom Out',
      onClick: () => handleFontSizeChange(-2),
      icon: <ZoomOutOutlined />,
    },
  ];

  return (
    <div className="menu-bar" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 8, 
      padding: '0 16px',
      borderBottom: `1px solid ${isDarkMode ? '#303030' : '#d9d9d9'}`,
      background: isDarkMode ? '#141414' : '#ffffff'
    }}>
      <Space size="small">
        <Tooltip title="New File (Ctrl+N)">
          <Button
            type="text"
            icon={<FileAddOutlined />}
            onClick={handleNewFile}
          />
        </Tooltip>
        
        <Tooltip title="Open File (Ctrl+O)">
          <Button
            type="text"
            icon={<FolderOpenOutlined />}
            onClick={handleOpenFile}
          />
        </Tooltip>
        
        <Tooltip title="Save (Ctrl+S)">
          <Button
            type="text"
            icon={<SaveOutlined />}
            onClick={handleSave}
          />
        </Tooltip>
      </Space>

      <div style={{ width: 1, height: 24, background: isDarkMode ? '#303030' : '#d9d9d9' }} />

      <Space size="small">
        <Tooltip title="Find (Ctrl+F)">
          <Button
            type="text"
            icon={<SearchOutlined />}
            onClick={toggleFindPanel}
          />
        </Tooltip>

        <Dropdown menu={{ items: viewMenuItems }} placement="bottomLeft">
          <Button type="text" icon={<SettingOutlined />} />
        </Dropdown>

        <Tooltip title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}>
          <Button
            type="text"
            icon={isDarkMode ? <BulbFilled /> : <BulbOutlined />}
            onClick={toggleTheme}
          />
        </Tooltip>
      </Space>

      <div style={{ marginLeft: 'auto', fontSize: 12, color: isDarkMode ? '#8c8c8c' : '#595959' }}>
        Font Size: {fontSize}px
      </div>
    </div>
  );
};