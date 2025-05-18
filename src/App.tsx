import { useState, useEffect } from 'react';
import { API_URL } from './config';
import './index.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import InputForm from './components/InputForm';
import CodeOutput from './components/CodeOutput';
import Footer from './components/Footer';
import ApiSettings from './components/ApiSettings';

// Define types for history item and supported file formats
interface HistoryItem {
  timestamp: string;
  query: string;
  model: string;
  code: string;
  file?: string;
  tokens?: number;
}

function App() {
  // State variables
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('# 代码将在这里显示');
  const [supportedFormats, setSupportedFormats] = useState<string[]>([]);
  const [currentTokens, setCurrentTokens] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [showModelNotification, setShowModelNotification] = useState(false);
  const [currentModel, setCurrentModel] = useState('');

  // Fetch history and supported formats on component mount
  useEffect(() => {
    fetchHistory();
    fetchSupportedFormats();
    // 设置初始滚动位置为240px
    window.scrollTo(0, 240);
  }, []);

  // Fetch history from API
  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/history`);
      if (!response.ok) {
        // 如果API返回错误，只在控制台记录，不设置错误状态
        console.warn(`获取历史记录返回非200状态: ${response.status}`);
        setHistory([]);
        return;
      }
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      // 捕获网络错误等，只在控制台记录，不设置错误状态
      console.error('加载历史记录错误:', err);
      setHistory([]);
    }
  };

  // Fetch supported file formats from API
  const fetchSupportedFormats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/supported_formats`);
      if (!response.ok) {
        throw new Error(`获取支持格式失败: ${response.statusText}`);
      }
      const formats = await response.json();
      setSupportedFormats(formats);
    } catch (err) {
      console.error('加载支持格式错误:', err);
    }
  };

  // Generate code from user query
  const handleGenerateCode = async (model: string, query: string, file: File | null) => {
    setError(null);
    setIsLoading(true);
    setGeneratedCode('# 正在生成代码...');
    
    // Start progress animation
    startProgressAnimation();

    try {
      const formData = new FormData();
      formData.append('model', model);
      formData.append('query', query);
      
      if (file) {
        formData.append('csv_file', file);
      }

      // Add instruction to generate standard Pandas code
      formData.append('preference', 'standard_pandas');

      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '代码生成失败');
      }

      const result = await response.json();
      
      // Process the code to ensure it's standard Pandas format
      let processedCode = result.code || '# 未生成代码';
      
      // Add Pandas import if it's missing
      if (processedCode && !processedCode.includes('import pandas')) {
        processedCode = 'import pandas as pd\n\n' + processedCode;
      }
      
      // Add matplotlib import if it contains plotting commands
      if (processedCode && processedCode.includes('plt.') && !processedCode.includes('import matplotlib')) {
        processedCode = 'import matplotlib.pyplot as plt\nimport numpy as np\n\n' + processedCode;
      }
      
      setGeneratedCode(processedCode);
      setCurrentTokens(result.tokens || 0);
      completeProgress();
      
      // Refresh history
      fetchHistory();
    } catch (err: unknown) {
      console.error('生成代码错误:', err);
      if (err instanceof Error) {
        setError(err.message || '生成代码时出现错误');
      } else {
        setError('生成代码时出现未知错误');
      }
      setGeneratedCode('# 生成代码错误');
      completeProgress();
    } finally {
      setIsLoading(false);
    }
  };

  // Clear history
  const handleClearHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/clear_history`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('清除历史记录失败');
      }
      
      setHistory([]);
    } catch (err) {
      console.error('清除历史记录错误:', err);
      // 不再设置错误状态
    }
  };

  // Load history item to current view
  const loadHistoryItem = (item: HistoryItem) => {
    setGeneratedCode(item.code || '# 没有可用代码');
    setCurrentTokens(item.tokens || 0);
  };

  // Handle model change
  const handleModelChange = (model: string) => {
    setCurrentModel(model);
    console.log(`模型已切换为: ${model}`);
    
    // 显示模型切换通知
    setShowModelNotification(true);
    
    // Hide notification after delay
    setTimeout(() => {
      setShowModelNotification(false);
    }, 3000);
  };

  // Progress animation functions
  let progressInterval: number | undefined;
  
  const startProgressAnimation = () => {
    // Reset progress
    setProgress(0);
    
    // Clear any existing interval
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    
    // Start new interval
    progressInterval = window.setInterval(() => {
      setProgress(prev => {
        // Simulate progress with decreasing speed
        let increment = 0;
        if (prev < 30) increment = 1.5;
        else if (prev < 60) increment = 0.8;
        else if (prev < 85) increment = 0.3;
        else if (prev < 95) increment = 0.1;
        
        const newProgress = prev + increment;
        
        // Cap at 95%
        if (newProgress >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        
        return newProgress;
      });
    }, 100);
  };
  
  const completeProgress = () => {
    // Clear interval
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    
    // Set to 100%
    setProgress(100);
    
    // Hide progress after a delay
    setTimeout(() => {
      setProgress(0);
    }, 1000);
  };

  // Handle code copy
  const handleCopyCode = () => {
    if (generatedCode && generatedCode !== '# 代码将在这里显示' && generatedCode !== '# 生成代码错误' && generatedCode !== '# 正在生成代码...') {
      navigator.clipboard.writeText(generatedCode)
        .then(() => {
          // Show notification
          setShowCopyNotification(true);
          
          // Hide notification after delay
          setTimeout(() => {
            setShowCopyNotification(false);
          }, 3000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          // Fallback copy mechanism
          const textarea = document.createElement('textarea');
          textarea.value = generatedCode;
          textarea.style.position = 'fixed';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          
          setShowCopyNotification(true);
          setTimeout(() => {
            setShowCopyNotification(false);
          }, 3000);
        });
    }
  };

  return (
    <div className="app-container">
      {/* History Sidebar */}
      <Sidebar 
        history={history} 
        onLoadHistoryItem={loadHistoryItem}
        onClearHistory={handleClearHistory}
      />

      <div className="main-content">
        <div className="container">
          {/* Header */}
          <Header />

          {/* Copy Notification */}
          <div className={`copy-notification ${showCopyNotification ? 'show' : ''}`}>
            <div className="copy-notification-content">
              <i className="fas fa-check-circle"></i>
              <div className="copy-text">
                <div className="copy-title">代码已复制到剪贴板</div>
                <div className="copy-details">可以直接粘贴到 Python 环境中运行</div>
              </div>
            </div>
          </div>
          
          {/* Model Change Modal */}
          <div className={`model-modal-overlay ${showModelNotification ? 'show' : ''}`} onClick={() => setShowModelNotification(false)}>
            <div className="model-modal" onClick={e => e.stopPropagation()}>
              <div className="model-modal-header">
                <i className="fas fa-exchange-alt"></i>
                <h3>模型已切换</h3>
              </div>
              <div className="model-modal-body">
                <p>当前使用的模型:<span className="model-name">{currentModel}</span></p>
              </div>
            </div>
          </div>

          <main>
            {/* Input Section */}
            <InputForm 
              onGenerateCode={handleGenerateCode}
              supportedFormats={supportedFormats}
              isLoading={isLoading}
              onModelChange={handleModelChange}
            />

            {/* Output Section */}
            <CodeOutput
              code={generatedCode}
              isLoading={isLoading}
              error={error}
              progress={progress}
              tokens={currentTokens}
              onCopyCode={handleCopyCode}
            />
          </main>

          {/* Footer */}
          <Footer />
          
          {/* API Settings component */}
          <ApiSettings onSettingsSaved={() => console.log('API Settings updated')} />
        </div>
      </div>
    </div>
  );
}

export default App;
