// API configuration
export const API_URL = import.meta.env.PROD
  ? 'https://pandas-ai-backend.onrender.com' // Render后端URL
  : 'http://localhost:3001'; // Development API URL

// Default API settings
export const DEFAULT_API_BASE = 'https://api.deepseek.com'; // 默认API基础URL
export const DEFAULT_API_KEY = ''; // 默认为空，用户需要填写

// Check if API settings exist in localStorage
export const getApiSettings = () => {
  const savedApiBase = localStorage.getItem('api_base');
  const savedApiKey = localStorage.getItem('api_key');
  
  return {
    apiBase: savedApiBase || DEFAULT_API_BASE,
    apiKey: savedApiKey || DEFAULT_API_KEY
  };
};

// Save API settings to localStorage
export const saveApiSettings = (apiBase: string, apiKey: string) => {
  localStorage.setItem('api_base', apiBase);
  localStorage.setItem('api_key', apiKey);
};

// Supported model options
export const SUPPORTED_MODELS = [
  { value: 'deepseek-chat', label: 'deepseek-chat' },
  { value: 'deepseek-r1', label: 'deepseek-r1' },
];

// Default values
export const DEFAULT_MODEL = 'deepseek-chat';
export const DEFAULT_QUERY = '找出销量最高的产品类别并计算各类别的平均销量';

// 支持的文件格式
export const SUPPORTED_FORMATS = [
  'csv', 'xlsx', 'xls', 'json', 'parquet', 
  'feather', 'pickle', 'pkl'
]; 