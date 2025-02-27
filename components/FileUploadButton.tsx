'use client';

import React, { useState, useRef } from 'react';
import { Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

interface FileUploadButtonProps {
  onFileUploaded?: (fileInfo: {
    name: string;
    url: string;
    type: string;
    recordId?: string;
  }) => void;
  disabled?: boolean;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({ 
  onFileUploaded = () => {},
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      // 显示上传中消息
      const loadingMessage = message.loading('正在上传文件...', 0);
      
      // 上传过程有两种选择:
      
      // 方法1: 使用 /api/upload API 先上传文件，然后文本内容
      // 这种方法适合二进制文件，因为后端需要处理文件上传
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.detail || '文件上传失败');
      }
      
      const result = await uploadResponse.json();
      
      // 关闭loading消息
      loadingMessage();
      
      console.log("文件上传返回结果:", result);
      
      // 区分文件上传和记录创建两个阶段
      if (result.success) {
        // 文件上传成功
        
        if (result.record_created && result.record_id) {
          // 文件上传和记录创建都成功
          message.success('文件上传成功，论文记录已创建！');
          
          // 将文件信息传递给父组件
          onFileUploaded({
            name: file.name,
            url: result.record_id, // 使用记录ID作为URL
            type: file.type,
            recordId: result.record_id
          });
          
          console.log('记录创建成功，ID:', result.record_id);
        } else {
          // 文件上传成功，但记录创建失败
          console.warn('记录创建失败详情:', result.message);
          
          // 显示更详细的错误信息
          message.warning(`文件已上传，但记录创建失败。原因: ${result.message || '未知错误'}`);
          
          // 仍然传递文件信息
          onFileUploaded({
            name: file.name,
            url: result.data?.url || result.data?.file_token || "",
            type: file.type
          });
        }
      } else {
        throw new Error(result.message || '上传失败');
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      message.error(`上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setUploading(false);
      // 重置文件输入以允许再次上传同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload-button">
      <Button 
        icon={<UploadOutlined />} 
        onClick={handleClick}
        loading={uploading}
        disabled={disabled || uploading}
      >
        {uploading ? '上传中...' : '上传附件'}
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".pdf,.doc,.docx,.txt"
      />
      <style jsx>{`
        .file-upload-button {
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
};

export default FileUploadButton;