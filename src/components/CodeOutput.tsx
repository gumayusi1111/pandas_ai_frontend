import React, { useEffect, useState, useRef } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.min.css';
import { API_URL } from '../config';

interface CodeOutputProps {
  code: string;
  isLoading: boolean;
  error: string | null;
  progress: number;
  tokens: number;
  onCopyCode: () => void;
  initialChartUrl?: string | null;
}

const CodeOutput: React.FC<CodeOutputProps> = ({
  code,
  isLoading,
  error,
  progress,
  tokens,
  onCopyCode,
  initialChartUrl
}) => {
  // Added chart state
  const [chartUrl, setChartUrl] = useState<string | null>(initialChartUrl || null);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [showLargeChart, setShowLargeChart] = useState(false);
  const [chartFileName, setChartFileName] = useState<string | null>(null);
  const codeRef = useRef<HTMLPreElement>(null);

  // 当initialChartUrl变化时更新chartUrl
  useEffect(() => {
    if (initialChartUrl) {
      setChartUrl(initialChartUrl);
      // 从URL中提取文件名
      const urlParts = initialChartUrl.split('/');
      setChartFileName(urlParts[urlParts.length - 1]);
    }
  }, [initialChartUrl]);

  // 当代码变化时应用语法高亮并检查是否有图表
  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current.querySelector('code') as HTMLElement);
    }

    // 如果没有initialChartUrl且代码包含plt.，尝试从API获取图表
    if (!initialChartUrl && code && code.includes('plt.')) {
      setIsChartLoading(true);
      // Check if we have a chart from latest code execution
      fetch(`${API_URL}/api/latest_chart`)
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error('No chart available');
        })
        .then(data => {
          if (data.chartUrl) {
            setChartUrl(data.chartUrl);
            setChartFileName(data.fileName || null);
            console.log("Chart URL received:", data.chartUrl);
          } else {
            setChartUrl(null);
            setChartFileName(null);
          }
        })
        .catch(err => {
          console.error('Error fetching chart:', err);
          setChartUrl(null);
          setChartFileName(null);
        })
        .finally(() => {
          setIsChartLoading(false);
        });
    } else if (!initialChartUrl && (!code || !code.includes('plt.'))) {
      setChartUrl(null);
      setChartFileName(null);
    }
  }, [code, initialChartUrl]);

  // Handle chart download
  const handleDownloadChart = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡到父元素
    
    if (chartUrl) {
      // 创建一个新的标签页下载图表而不是直接在当前页面打开
      const link = document.createElement('a');
      link.href = chartUrl;
      link.download = chartFileName || `chart-${Date.now()}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 点击图表时放大显示
  const handleChartClick = () => {
    setShowLargeChart(true);
  };

  // 关闭放大的图表
  const handleCloseLargeChart = () => {
    setShowLargeChart(false);
  };

  // Enhanced copy code function
  const handleCopyCode = () => {
    if (code) {
      onCopyCode();
    }
  };

  return (
    <section className="output-section ">
      <div className="output-header">
        <h2>
          <i className="fas fa-laptop-code"></i> 生成的 Pandas 代码
        </h2>
        <div className="output-actions">
          <button 
            onClick={handleCopyCode} 
            disabled={isLoading || !code || code === '# 代码将在这里显示' || code === '# 正在生成代码...'}
            className="copy-btn"
            title="将代码复制到剪贴板"
          >
            <i className="fas fa-copy"></i> 复制代码
          </button>
        </div>
      </div>

      {/* 进度条 */}
      {progress > 0 && (
        <div className="progress-container active">
          <div className="progress-info">
            <div className="progress-status">
              <i className="fas fa-spinner fa-spin"></i> 正在生成代码...
            </div>
            <div className="progress-details">
              <span>{Math.round(progress)}%</span>
              <span>{Math.round((progress / 100) * 1000)} tokens</span>
            </div>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 代码容器 */}
      <div className="code-container">
        <pre ref={codeRef} className="code-block">
          <code className="language-python">
            {code}
          </code>
        </pre>
      </div>

      {/* 图表显示 */}
      {isChartLoading && (
        <div className="chart-loading">
          <i className="fas fa-spinner fa-spin"></i> 正在生成图表...
        </div>
      )}
      
      {chartUrl && (
        <div className="chart-container">
          <h3><i className="fas fa-chart-bar"></i> 生成的图表</h3>
          <div className="chart-image" onClick={handleChartClick}>
            <img 
              src={chartUrl} 
              alt="生成的数据图表" 
              style={{ cursor: 'pointer' }} 
              title="点击查看大图"
            />
          </div>
          <div className="chart-actions">
            <button 
              onClick={handleDownloadChart} 
              className="download-btn"
              title="下载图表"
            >
              <i className="fas fa-download"></i> 下载图表
            </button>
          </div>
        </div>
      )}

      {/* 大图预览模态框 */}
      {showLargeChart && chartUrl && (
        <div className="chart-modal-overlay" onClick={handleCloseLargeChart}>
          <div className="chart-modal">
            <div className="chart-modal-content" onClick={e => e.stopPropagation()}>
              <button className="chart-modal-close" onClick={handleCloseLargeChart}>
                <i className="fas fa-times"></i>
              </button>
              <img src={chartUrl} alt="图表大图" className="chart-modal-image" />
              <div className="chart-modal-actions">
                <button 
                  onClick={handleDownloadChart} 
                  className="download-btn"
                  title="下载图表"
                >
                  <i className="fas fa-download"></i> 下载图表
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 错误显示 */}
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {/* 代码信息 */}
      {!isLoading && !error && tokens > 0 && (
        <div className="code-info">
          <p>
            <i className="fas fa-info-circle"></i> 代码生成完成，使用了 {tokens} tokens。
            代码已转换为标准 Pandas 格式，可直接复制使用。
          </p>
        </div>
      )}
    </section>
  );
};

export default CodeOutput; 