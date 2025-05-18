'use client'; // This page involves client-side interactivity and state

import React, { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react'; // Corrected import
import { API_URL } from '../../../config'; // Assuming config.ts is 3 levels up
import styles from './AIProviderSettingsPage.module.css'; // Import CSS Module

// Interface for a single AI Configuration item in the list
interface AIConfigItem {
  id: string;
  name: string;
  apiBaseUrl: string;
  apiKey: string;
  modelName: string;
  isActive: boolean; // This will be derived or set based on activeConfigId
}

// Interface for the backend response when fetching all configs
interface AllAIConfigsResponse {
  configurations: AIConfigItem[];
  activeConfigId: string | null;
}

// Interface for POST/PUT responses (individual config)
interface MutateConfigResponse {
  message?: string;
  config?: AIConfigItem; // The newly created or updated config
  allConfigs?: AllAIConfigsResponse; // Sometimes the backend might return all configs
  error?: string;
  activeConfigId?: string; // Added for set-active response
  configurations?: AIConfigItem[]; // Added for set-active response
}

// Form data for adding/editing a configuration
interface ConfigFormData {
  name: string;
  apiBaseUrl: string;
  apiKey: string;
  modelName: string;
}

const initialNewConfigFormData: ConfigFormData = {
  name: '',
  apiBaseUrl: '',
  apiKey: '',
  modelName: '',
};

export default function AIProviderSettingsPage() {
  const [configurations, setConfigurations] = useState<AIConfigItem[]>([]);
  const [newConfigForm, setNewConfigForm] = useState<ConfigFormData>(initialNewConfigFormData);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null); // For scrolling
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // For specific actions like add, set active
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [configToDelete, setConfigToDelete] = useState<AIConfigItem | null>(null);

  const [isApiKeyVisible, setIsApiKeyVisible] = useState<boolean>(false); // State for API key visibility

  // Fetch all configurations
  const fetchConfigurations = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/ai-configs`);
      if (!response.ok) {
        const errorData: MutateConfigResponse = await response.json().catch(() => ({ error: `HTTP 错误！状态: ${response.status}` }));
        throw new Error(errorData.error || `HTTP 错误！状态: ${response.status}`);
      }
      const data: AllAIConfigsResponse = await response.json();
      setConfigurations(data.configurations.map(c => ({ ...c, isActive: c.id === data.activeConfigId })));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发生未知错误';
      console.error('获取AI配置失败:', errorMessage);
      setError(errorMessage);
      setConfigurations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const handleFormInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setNewConfigForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    if (!newConfigForm.name || !newConfigForm.apiKey || !newConfigForm.modelName) {
      setError("名称、API密钥和模型名称为必填项。");
      setIsSubmitting(false);
      return;
    }

    const url = editingConfigId 
      ? `${API_URL}/api/ai-configs/${editingConfigId}` 
      : `${API_URL}/api/ai-configs`;
    const method = editingConfigId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfigForm),
      });
      const result: MutateConfigResponse = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `HTTP 错误！状态: ${response.status}`);
      }
      setSuccessMessage(result.message || `配置已成功${editingConfigId ? '更新' : '添加'}！`);
      setNewConfigForm(initialNewConfigFormData);
      setEditingConfigId(null);
      await fetchConfigurations(); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发生未知错误';
      console.error(`未能${editingConfigId ? '更新' : '添加'}AI配置:`, errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetActive = async (id: string) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/ai-configs/${id}/set-active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      const result: MutateConfigResponse = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `HTTP 错误！状态: ${response.status}`);
      }
      setSuccessMessage(result.message || '配置已激活！');
      await fetchConfigurations(); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发生未知错误';
      console.error('激活AI配置失败:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (config: AIConfigItem) => {
    setConfigToDelete(config);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setConfigToDelete(null);
    setShowDeleteModal(false);
  };

  const confirmDeleteHandler = async () => {
    if (!configToDelete) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/ai-configs/${configToDelete.id}`, {
        method: 'DELETE',
      });
      const result: MutateConfigResponse = await response.json(); 
      if (!response.ok) {
        throw new Error(result.error || `HTTP 错误！状态: ${response.status}`);
      }
      setSuccessMessage(result.message || '配置已成功删除！');
      await fetchConfigurations(); 
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '发生未知错误';
      console.error('删除AI配置失败:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal(); // Close modal regardless of outcome
    }
  };

  const handleEdit = (config: AIConfigItem) => {
    setEditingConfigId(config.id);
    setNewConfigForm({
      name: config.name,
      apiBaseUrl: config.apiBaseUrl,
      apiKey: config.apiKey, // Consider not pre-filling API key for security, or use placeholder
      modelName: config.modelName,
    });
    setError(null); // Clear previous errors
    setSuccessMessage(null); // Clear previous success messages
    setIsApiKeyVisible(false); // Reset API key visibility when starting an edit
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cancelEdit = () => {
    setEditingConfigId(null);
    setNewConfigForm(initialNewConfigFormData);
    setError(null);
    setSuccessMessage(null);
    setIsApiKeyVisible(false); // Reset API key visibility on cancel
  };

  const toggleApiKeyVisibility = () => {
    setIsApiKeyVisible(!isApiKeyVisible);
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>
        {/* Optional: Add an icon here if you have one, e.g., <i className="fas fa-cogs"></i> */}
        AI 提供商配置
      </h1>

      {isLoading && !isSubmitting && <p className={styles.loadingMessage}>正在加载配置...</p>}
      {error && <p className={styles.errorMessage}><i className="fas fa-exclamation-circle mr-2"></i>错误: {error}</p>}
      {successMessage && <p className={styles.successMessage}><i className="fas fa-check-circle mr-2"></i>{successMessage}</p>}

      <section ref={formRef} className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {editingConfigId ? '编辑配置' : '添加新配置'}
        </h2>
        <form onSubmit={handleSubmitForm} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>配置名称:</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={newConfigForm.name} 
              onChange={handleFormInputChange} 
              required 
              className={styles.input} 
              disabled={isSubmitting}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="apiBaseUrl" className={styles.label}>API 基础 URL (可选):</label>
            <input 
              type="text" 
              id="apiBaseUrl" 
              name="apiBaseUrl" 
              value={newConfigForm.apiBaseUrl} 
              onChange={handleFormInputChange} 
              placeholder="例如：https://api.openai.com/v1" 
              className={styles.input}
              disabled={isSubmitting}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="apiKey" className={styles.label}>API 密钥:</label>
            <div className="flex items-center gap-2">
              <input 
                type={isApiKeyVisible ? 'text' : 'password'} 
                id="apiKey" 
                name="apiKey" 
                value={newConfigForm.apiKey} 
                onChange={handleFormInputChange} 
                required 
                placeholder={editingConfigId ? "留空以保持当前密钥" : "输入 API 密钥"} 
                className={`${styles.input} flex-grow`} 
                disabled={isSubmitting}
              />
              <button 
                type="button" 
                onClick={toggleApiKeyVisibility} 
                disabled={isSubmitting}
                className={styles.apiKeyToggle}
                title={isApiKeyVisible ? "隐藏 API 密钥" : "显示 API 密钥"}
              >
                {isApiKeyVisible ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
              </button>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="modelName" className={styles.label}>默认模型名称:</label>
            <input 
              type="text" 
              id="modelName" 
              name="modelName" 
              value={newConfigForm.modelName} 
              onChange={handleFormInputChange} 
              required 
              placeholder="例如：gpt-4, deepseek-chat"
              className={styles.input} 
              disabled={isSubmitting}
            />
          </div>
          <div className={styles.buttonGroup}>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              {isSubmitting ? '处理中...' : (editingConfigId ? '保存更改' : '添加配置')}
            </button>
            {editingConfigId && (
              <button 
                type="button" 
                onClick={cancelEdit} 
                disabled={isSubmitting} 
                className={`${styles.button} ${styles.buttonSecondary}`}
              >
                取消编辑
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Section to Display Existing Configurations */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>已保存的配置</h2>
        {configurations.length === 0 && !isLoading && (
          <p className="text-gray-500">未找到任何配置。请使用上面的表单添加一个。</p>
        )}
        {configurations.length > 0 && (
          <ul className={styles.configList}>
            {configurations.map((config) => (
              <li 
                key={config.id} 
                className={`${styles.configCard} ${config.isActive ? styles.configCardActive : ''}`}
              >
                <div> 
                  <h3 className={styles.configCardHeader}>
                    {config.name} {config.isActive && <span className={styles.activeBadge}>当前活动</span>}
                  </h3>
                  <p className={styles.configDetail}><strong className={styles.configDetailKey}>API URL:</strong> {config.apiBaseUrl || '未设置'}</p>
                  <p className={styles.configDetail}><strong className={styles.configDetailKey}>模型:</strong> {config.modelName}</p>
                  <p className={`${styles.configDetail} mb-3`}><strong className={styles.configDetailKey}>API 密钥:</strong> <span className="font-mono select-none">********</span></p>
                </div>
                <div className={styles.configActions}>
                  {!config.isActive && (
                    <button 
                      onClick={() => handleSetActive(config.id)} 
                      disabled={isSubmitting} 
                      className={`${styles.button} ${styles.buttonSuccess}`}
                    >
                      {isSubmitting ? <><i className="fas fa-spinner fa-spin mr-1"></i>处理中</> : '设为活动'}
                    </button>
                  )}
                  <button 
                    onClick={() => handleEdit(config)} 
                    disabled={isSubmitting} 
                    className={`${styles.button} ${styles.buttonWarning}`}
                  >
                    编辑
                  </button>
                  <button 
                    onClick={() => openDeleteModal(config)} 
                    disabled={isSubmitting || config.isActive} 
                    title={config.isActive ? "无法删除活动配置" : "删除配置"} 
                    className={`${styles.button} ${styles.buttonDanger}`}
                  >
                    {isSubmitting ? <><i className="fas fa-spinner fa-spin mr-1"></i>...</> : '删除'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && configToDelete && (
        <div className={`${styles.modalOverlay} ${showDeleteModal ? styles.modalOverlayVisible : ''}`}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>确认删除</h3>
            <p className={styles.modalText}>您确定要删除配置 " <strong className="font-medium">{configToDelete.name}</strong> " 吗？</p>
            <div className={styles.modalActions}>
              <button 
                onClick={closeDeleteModal} 
                disabled={isSubmitting} 
                className={`${styles.button} ${styles.buttonSecondary}`}
              >
                取消
              </button>
              <button 
                onClick={confirmDeleteHandler} 
                disabled={isSubmitting} 
                className={`${styles.button} ${styles.buttonDanger}`}
              >
                {isSubmitting ? <><i className="fas fa-spinner fa-spin mr-1"></i>正在删除...</> : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get the base API URL (if needed outside component, otherwise define inline or in a service file)
// const getApiUrl = () => {
//   return import.meta.env.PROD ? '' : 'http://localhost:3001'; // Adjust port if needed
// }; 