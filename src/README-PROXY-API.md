# 如何使用代理API解决CORS问题

为了解决在访问第三方API（如extensions.aitopia.ai）时遇到的CORS问题，我们已经在后端实现了一个代理路由，并提供了前端工具函数来使用这个代理。

## 代理API工具使用方法

我们在 `src/utils/proxyApi.ts` 中添加了几个工具函数来简化API调用：

### 1. 基础代理API调用

```typescript
import { proxyAitopiaApi } from '../utils/proxyApi';

// 简单的GET请求
proxyAitopiaApi('some/path')
  .then(data => console.log(data))
  .catch(error => console.error(error));

// POST请求带数据
proxyAitopiaApi('some/path', 'POST', { key: 'value' })
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

### 2. 使用封装的API端点

```typescript
import { aitopiaEndpoints } from '../utils/proxyApi';

// 获取提示
aitopiaEndpoints.getPrompts()
  .then(data => console.log(data))
  .catch(error => console.error(error));

// 获取语言配置
aitopiaEndpoints.getLanguages()
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

### 3. 如何替换现有的API调用

如果您在代码中有直接访问extensions.aitopia.ai的请求，可以用以下模式替换：
```typescript
fetch('https://extensions.aitopia.ai/some/path', {
  method: 'POST',
  body: JSON.stringify({ param1: 'value1' }),
  headers: { 'Content-Type': 'application/json' }
})
```

替换为：
```typescript
import { proxyAitopiaApi } from '../utils/proxyApi';

proxyAitopiaApi('some/path', 'POST', { param1: 'value1' })
```

## 后端代理工作原理

后端代理工作流程：
1. 前端调用我们的代理端点 `/proxy/aitopia/[path]`
2. 后端接收请求并转发到 `https://extensions.aitopia.ai/[path]`
3. 后端接收响应并添加正确的CORS头
4. 后端将响应返回给前端

这样可以避免浏览器的CORS限制，因为请求现在来自同一个域。

## 添加新的API端点

如果需要访问其他还未封装的API端点，可以在 `src/utils/proxyApi.ts` 文件中的 `aitopiaEndpoints` 对象中添加新的方法：

```typescript
export const aitopiaEndpoints = {
  // 现有端点...
  
  // 添加新端点
  newEndpoint: (param1: string) => fetchAitopiaApi('new/endpoint/path', { param1 }),
};
``` 