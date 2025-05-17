import React from 'react';

interface HistoryItem {
  timestamp: string;
  query: string;
  model: string;
  code: string;
  file?: string;
  tokens?: number;
}

interface SidebarProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onLoadHistoryItem: (item: HistoryItem) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  history, 
  onClearHistory, 
  onLoadHistoryItem 
}) => {
  // 将时间戳格式化为更易读的格式
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN');
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="sidebar-history">
      <div className="history-header">
        <h2><i className="fas fa-history"></i> 历史记录</h2>
        <button onClick={onClearHistory} className="clear-history-btn">
          <i className="fas fa-trash-alt"></i> 清除
        </button>
      </div>
      
      <div className="history-list">
        {history.length === 0 ? (
          <div className="no-history">
            暂无历史记录。生成代码后将显示在这里。
          </div>
        ) : (
          history.map((item, index) => (
            <div 
              key={index} 
              className="history-item"
              onClick={() => onLoadHistoryItem(item)}
            >
              <div className="history-meta">
                <span className="history-time">{formatTimestamp(item.timestamp)}</span>
                <span className="history-model">{item.model}</span>
              </div>
              <div className="history-query">{item.query}</div>
              {item.file && <div className="history-file">文件: {item.file}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar; 