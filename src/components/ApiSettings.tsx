import React, { useState, useEffect } from 'react';
import { getApiSettings, saveApiSettings, DEFAULT_API_BASE } from '../config';

interface ApiSettingsProps {
  onSettingsSaved: () => void;
}

const ApiSettings: React.FC<ApiSettingsProps> = ({ onSettingsSaved }) => {
  const [apiBase, setApiBase] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // 从localStorage获取保存的设置
    const settings = getApiSettings();
    setApiBase(settings.apiBase);
    setApiKey(settings.apiKey);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveApiSettings(apiBase, apiKey);
    setIsSaved(true);
    onSettingsSaved();
    setTimeout(() => {
      setIsSaved(false);
      setShowSettings(false);
    }, 2000);
  };

  return (
    <div className="api-settings-container">
      <button 
        className="api-settings-toggle"
        onClick={() => setShowSettings(!showSettings)}
        title="API设置"
      >
        <i className="fas fa-cog"></i>
        <span>API设置</span>
      </button>

      {showSettings && (
        <div className="api-settings-modal">
          <div className="api-settings-content">
            <div className="api-settings-header">
              <h3><i className="fas fa-cog"></i> API设置</h3>
              <button 
                className="close-btn"
                onClick={() => setShowSettings(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="api-base">
                  <i className="fas fa-link"></i> API Base URL:
                </label>
                <input
                  type="text"
                  id="api-base"
                  value={apiBase}
                  onChange={(e) => setApiBase(e.target.value)}
                  placeholder={DEFAULT_API_BASE}
                />
                <small>例如: https://api.deepseek.com</small>
              </div>

              <div className="form-group">
                <label htmlFor="api-key">
                  <i className="fas fa-key"></i> API Key:
                </label>
                <input
                  type="password"
                  id="api-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入你的API密钥"
                />
                <small>请提供有效的API密钥以使用服务</small>
              </div>

              <div className="form-group">
                <button type="submit" className="settings-save-btn">
                  <i className="fas fa-save"></i> 保存设置
                </button>
                {isSaved && (
                  <span className="settings-saved-message">
                    <i className="fas fa-check-circle"></i> 设置已保存
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiSettings; 