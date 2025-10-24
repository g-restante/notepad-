import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Upload, Input, Space, Tabs, message, Row, Col } from 'antd';
import { 
  UploadOutlined, 
  SwapOutlined,
} from '@ant-design/icons';
import * as monaco from 'monaco-editor';
import { useEditorStore } from '../store/editorStore';

const { TextArea } = Input;

interface ComparePanelProps {
  visible: boolean;
  onClose: () => void;
}

export const ComparePanel: React.FC<ComparePanelProps> = ({ visible, onClose }) => {
  const { isDarkMode } = useEditorStore();
  const [leftContent, setLeftContent] = useState('');
  const [rightContent, setRightContent] = useState('');
  const [leftFileName, setLeftFileName] = useState('Left File');
  const [rightFileName, setRightFileName] = useState('Right File');
  const [compareMode, setCompareMode] = useState<'files' | 'text'>('files');
  
  const leftEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const rightEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const diffEditorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null);
  const leftContainerRef = useRef<HTMLDivElement>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);
  const diffContainerRef = useRef<HTMLDivElement>(null);
  
  const [showDiff, setShowDiff] = useState(false);

  // Initialize editors when modal opens
  useEffect(() => {
    if (visible && !showDiff) {
      initializeEditors();
    }
    return () => {
      disposeEditors();
    };
  }, [visible, showDiff, isDarkMode]);

  const initializeEditors = () => {
    // Left editor
    if (leftContainerRef.current && !leftEditorRef.current) {
      leftEditorRef.current = monaco.editor.create(leftContainerRef.current, {
        value: leftContent,
        language: 'plaintext',
        theme: isDarkMode ? 'vs-dark' : 'vs-light',
        readOnly: false,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
      });
      
      leftEditorRef.current.onDidChangeModelContent(() => {
        setLeftContent(leftEditorRef.current?.getValue() || '');
      });
    }

    // Right editor
    if (rightContainerRef.current && !rightEditorRef.current) {
      rightEditorRef.current = monaco.editor.create(rightContainerRef.current, {
        value: rightContent,
        language: 'plaintext',
        theme: isDarkMode ? 'vs-dark' : 'vs-light',
        readOnly: false,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
      });
      
      rightEditorRef.current.onDidChangeModelContent(() => {
        setRightContent(rightEditorRef.current?.getValue() || '');
      });
    }
  };

  const initializeDiffEditor = () => {
    if (diffContainerRef.current && !diffEditorRef.current) {
      const originalModel = monaco.editor.createModel(leftContent, 'plaintext');
      const modifiedModel = monaco.editor.createModel(rightContent, 'plaintext');
      
      diffEditorRef.current = monaco.editor.createDiffEditor(diffContainerRef.current, {
        theme: isDarkMode ? 'vs-dark' : 'vs-light',
        readOnly: true,
        automaticLayout: true,
        renderSideBySide: true,
      });
      
      diffEditorRef.current.setModel({
        original: originalModel,
        modified: modifiedModel,
      });
    }
  };

  const disposeEditors = () => {
    if (leftEditorRef.current) {
      leftEditorRef.current.dispose();
      leftEditorRef.current = null;
    }
    if (rightEditorRef.current) {
      rightEditorRef.current.dispose();
      rightEditorRef.current = null;
    }
    if (diffEditorRef.current) {
      diffEditorRef.current.dispose();
      diffEditorRef.current = null;
    }
  };

  const handleFileUpload = async (file: File, side: 'left' | 'right') => {
    try {
      const content = await file.text();
      if (side === 'left') {
        setLeftContent(content);
        setLeftFileName(file.name);
        if (leftEditorRef.current) {
          leftEditorRef.current.setValue(content);
        }
      } else {
        setRightContent(content);
        setRightFileName(file.name);
        if (rightEditorRef.current) {
          rightEditorRef.current.setValue(content);
        }
      }
      message.success(`File ${file.name} loaded successfully`);
    } catch (error) {
      message.error(`Failed to load file: ${error}`);
    }
    return false; // Prevent automatic upload
  };

  const handleSwapContent = () => {
    const tempContent = leftContent;
    const tempFileName = leftFileName;
    
    setLeftContent(rightContent);
    setLeftFileName(rightFileName);
    setRightContent(tempContent);
    setRightFileName(tempFileName);
    
    if (leftEditorRef.current) {
      leftEditorRef.current.setValue(rightContent);
    }
    if (rightEditorRef.current) {
      rightEditorRef.current.setValue(tempContent);
    }
  };

  const handleCompare = () => {
    if (!leftContent.trim() || !rightContent.trim()) {
      message.warning('Please provide content for both sides before comparing');
      return;
    }
    
    disposeEditors();
    setShowDiff(true);
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      initializeDiffEditor();
    }, 100);
  };

  const handleBackToEdit = () => {
    if (diffEditorRef.current) {
      diffEditorRef.current.dispose();
      diffEditorRef.current = null;
    }
    setShowDiff(false);
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      initializeEditors();
    }, 100);
  };

  const tabItems = [
    {
      key: 'files',
      label: 'Compare Files',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ fontWeight: 'bold' }}>{leftFileName}</div>
                <Upload
                  beforeUpload={(file) => handleFileUpload(file, 'left')}
                  showUploadList={false}
                  accept=".txt,.js,.ts,.jsx,.tsx,.css,.html,.json,.md,.py,.java,.cpp,.c,.h"
                >
                  <Button icon={<UploadOutlined />}>Select Left File</Button>
                </Upload>
                <div 
                  ref={leftContainerRef}
                  style={{ 
                    height: '300px', 
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px'
                  }}
                />
              </Space>
            </Col>
            <Col span={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ fontWeight: 'bold' }}>{rightFileName}</div>
                <Upload
                  beforeUpload={(file) => handleFileUpload(file, 'right')}
                  showUploadList={false}
                  accept=".txt,.js,.ts,.jsx,.tsx,.css,.html,.json,.md,.py,.java,.cpp,.c,.h"
                >
                  <Button icon={<UploadOutlined />}>Select Right File</Button>
                </Upload>
                <div 
                  ref={rightContainerRef}
                  style={{ 
                    height: '300px', 
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px'
                  }}
                />
              </Space>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'text',
      label: 'Compare Text',
      children: (
        <div style={{ padding: '16px 0' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ fontWeight: 'bold' }}>Left Text</div>
                <TextArea
                  rows={15}
                  value={leftContent}
                  onChange={(e) => setLeftContent(e.target.value)}
                  placeholder="Enter or paste text to compare..."
                />
              </Space>
            </Col>
            <Col span={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ fontWeight: 'bold' }}>Right Text</div>
                <TextArea
                  rows={15}
                  value={rightContent}
                  onChange={(e) => setRightContent(e.target.value)}
                  placeholder="Enter or paste text to compare..."
                />
              </Space>
            </Col>
          </Row>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="Compare Files/Text"
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={
        showDiff ? (
          <Space>
            <Button onClick={handleBackToEdit}>
              Back to Edit
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </Space>
        ) : (
          <Space>
            <Button icon={<SwapOutlined />} onClick={handleSwapContent}>
              Swap Sides
            </Button>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button type="primary" onClick={handleCompare}>
              Compare
            </Button>
          </Space>
        )
      }
      styles={{ body: { padding: showDiff ? '0' : '20px' } }}
    >
      {showDiff ? (
        <div 
          ref={diffContainerRef}
          style={{ height: '600px', width: '100%' }}
        />
      ) : (
        <Tabs
          activeKey={compareMode}
          onChange={(key) => setCompareMode(key as 'files' | 'text')}
          items={tabItems}
        />
      )}
    </Modal>
  );
};