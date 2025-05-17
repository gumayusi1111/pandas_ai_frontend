import React, { useState, useRef } from 'react';
import { DEFAULT_MODEL, DEFAULT_QUERY, SUPPORTED_MODELS } from '../config';

interface InputFormProps {
  onGenerateCode: (model: string, query: string, file: File | null) => void;
  supportedFormats: string[];
  isLoading: boolean;
  onModelChange: (model: string) => void;
}

const InputForm: React.FC<InputFormProps> = ({ 
  onGenerateCode, 
  supportedFormats, 
  isLoading,
  onModelChange
}) => {
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('拖拽或点击上传文件');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerateCode(model, query, file);
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      
      // 检查文件扩展名是否支持
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      if (!supportedFormats.includes(fileExtension)) {
        alert(`警告: 文件格式 .${fileExtension} 可能不被支持。支持的格式: ${supportedFormats.join(', ')}`);
      }
    }
  };

  // 处理模型切换
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setModel(newModel);
    onModelChange(newModel);
  };

  // 处理文件拖放
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0] || null;
    if (droppedFile) {
      setFile(droppedFile);
      setFileName(droppedFile.name);
      
      // 检查文件扩展名是否支持
      const fileExtension = droppedFile.name.split('.').pop()?.toLowerCase() || '';
      if (!supportedFormats.includes(fileExtension)) {
        alert(`警告: 文件格式 .${fileExtension} 可能不被支持。支持的格式: ${supportedFormats.join(', ')}`);
      }
    }
  };

  // 处理拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
  };

  // 清空表单字段
  const handleClear = () => {
    setQuery('');
    setFile(null);
    setFileName('拖拽或点击上传文件');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section className="input-section">
      <form onSubmit={handleSubmit} id="generate-form">
        <div className="form-group">
          <label htmlFor="model">
            <i className="fas fa-robot"></i> 选择模型:
          </label>
          <select
            id="model"
            value={model}
            onChange={handleModelChange}
            disabled={isLoading}
          >
            {SUPPORTED_MODELS.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group file-upload">
          <label htmlFor="file-input">
            <i className="fas fa-file-upload"></i> 上传数据文件:
          </label>
          <div 
            className="file-upload-wrapper"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              id="file-input" 
              className="hidden-file-input"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={supportedFormats.map(format => `.${format}`).join(',')}
              disabled={isLoading}
            />
            <div className="file-upload-label">
              <i className="fas fa-cloud-upload-alt"></i>
              <span>{fileName}</span>
            </div>
          </div>
          <small>
            <i className="fas fa-info-circle"></i>
            支持的格式: {supportedFormats.join(', ')}。
            如不上传文件，将使用示例数据。
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="query">
            <i className="fas fa-comment-alt"></i> 自然语言查询:
          </label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            placeholder="示例: 找出销量最高的产品类别并计算各类别的平均销量"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group button-group">
          <button 
            type="submit" 
            disabled={isLoading || !query.trim()}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> 正在生成...
              </>
            ) : (
              <>
                <i className="fas fa-code"></i> 生成代码
              </>
            )}
          </button>
          
          <button 
            type="button" 
            onClick={handleClear}
            disabled={isLoading}
            className="clear-btn"
          >
            <i className="fas fa-eraser"></i> 清空
          </button>
        </div>
      </form>
    </section>
  );
};

export default InputForm; 