import { API_URL } from '../config';

/**
 * 通过代理访问aitopia.ai API
 * @param path - API路径
 * @param method - HTTP方法
 * @param body - 请求体数据
 * @returns Promise with API响应
 */
export async function proxyAitopiaApi(path: string, method: 'GET' | 'POST' = 'GET', body?: any) {
  const url = `${API_URL}/proxy/aitopia/${path}`;
  
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
    };
    
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.statusText}`);
    }
    
    // 尝试解析为JSON，如果失败则返回文本
    try {
      return await response.json();
    } catch (e) {
      return await response.text();
    }
  } catch (error) {
    console.error('代理请求失败:', error);
    throw error;
  }
}

/**
 * 包装API请求，自动添加前端常见参数
 * @param path - API路径
 * @param body - 请求体数据
 * @returns Promise with API响应
 */
export async function fetchAitopiaApi(path: string, body: any = {}) {
  // 添加aitopia请求通常需要的参数
  const enrichedBody = {
    ...body,
    lang: 'en',
    v: '5.8.0',
    ri: 'becfinhbfclcgokjlobojlnldbfillpf',
    bt: 'self',
  };
  
  return proxyAitopiaApi(path, 'POST', enrichedBody);
}

/**
 * 常用API端点
 */
export const aitopiaEndpoints = {
  getPrompts: () => fetchAitopiaApi('ai/prompts'),
  getLanguages: (language = 'en') => fetchAitopiaApi('languages/lang/get/lang/en', { language }),
  getModelSettings: () => fetchAitopiaApi('ai/model_settings'),
  getAppKey: (params: any) => fetchAitopiaApi('extensions/app/get_key', params),
}; 