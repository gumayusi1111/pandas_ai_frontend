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
}

const CodeOutput: React.FC<CodeOutputProps> = ({
  code,
  isLoading,
  error,
  progress,
  tokens,
  onCopyCode
}) => {
  // Added chart state
  const [chartUrl, setChartUrl] = useState<string | null>(null);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const codeRef = useRef<HTMLPreElement>(null);

  // 当代码变化时应用语法高亮并检查是否有图表
  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current.querySelector('code') as HTMLElement);
    }

    // Check for matplotlib chart in code
    if (code && code.includes('plt.')) {
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
          } else {
            setChartUrl(null);
          }
        })
        .catch(err => {
          console.error('Error fetching chart:', err);
          setChartUrl(null);
        })
        .finally(() => {
          setIsChartLoading(false);
        });
    } else {
      setChartUrl(null);
    }
  }, [code]);

  // Handle chart download
  const handleDownloadChart = () => {
    if (chartUrl) {
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = chartUrl;
      link.download = `chart-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Enhanced copy code function
  const handleCopyCode = () => {
    if (code) {
      // Use clipboard API
      try {
        navigator.clipboard.writeText(code).then(() => {
          onCopyCode();
        });
      } catch (err) {
        console.error('Failed to copy: ', err);
        // Fallback copy mechanism
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        onCopyCode();
      }
    }
  };

  return (
    <section className="output-section">
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
          <div className="chart-image">
            <img src={chartUrl} alt="生成的数据图表" />
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