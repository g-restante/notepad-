import React from 'react';
import { Tabs, Button, Tooltip } from 'antd';
import { CloseOutlined, FileTextOutlined } from '@ant-design/icons';
import { useEditorStore } from '../store/editorStore';

export const TabBar: React.FC = () => {
  const { 
    tabs, 
    activeTabId, 
    setActiveTab, 
    closeTab, 
    isDarkMode 
  } = useEditorStore();

  if (tabs.length === 0) {
    return null;
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  const tabItems = tabs.map(tab => ({
    key: tab.id,
    label: (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 6,
        maxWidth: 200,
      }}>
        <FileTextOutlined style={{ fontSize: 12 }} />
        <span style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {tab.title}
          {tab.isDirty && <span style={{ color: '#ff4d4f' }}>*</span>}
        </span>
        <Tooltip title="Close">
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined />}
            onClick={(e) => handleTabClose(e, tab.id)}
            style={{
              width: 16,
              height: 16,
              minWidth: 16,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </Tooltip>
      </div>
    ),
    children: null, // Content will be handled by EditorPanel
  }));

  return (
    <div className="tab-bar" style={{
      borderBottom: `1px solid ${isDarkMode ? '#303030' : '#d9d9d9'}`,
      background: isDarkMode ? '#1f1f1f' : '#fafafa',
    }}>
      <Tabs
        type="editable-card"
        activeKey={activeTabId || undefined}
        onChange={handleTabChange}
        items={tabItems}
        hideAdd
        size="small"
        tabBarStyle={{
          margin: 0,
          padding: '0 16px',
        }}
        tabBarGutter={0}
      />
    </div>
  );
};