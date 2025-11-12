# Worker 主线程解码问题修复 v2

## 问题描述

用户反馈：在别的工程安装最新版后，设置 `useWorker: true`，但还是发现会在主线程使用图片解码，占据了主线程几百毫秒。

## 根本原因分析

经过检查，发现了**关键问题**：

### 问题 1: 内联 Worker 代码缺少 `getDimensions` action 处理

**位置**: `src/index.js:486-490` - `getInlineWorkerCode()` 方法

**问题**: 内联 Worker 代码（默认使用的 Worker 代码）没有包含 `getDimensions` action 的处理逻辑。当调用 `getImageDimensionsFromWorker` 时，Worker 收到消息但没有处理，导致失败并降级到主线程。

**证据**:
```bash
# 检查内联代码
node -e "const code = require('fs').readFileSync('src/index.js', 'utf8'); 
const match = code.match(/getInlineWorkerCode\(\)[\s\S]*?return\s+\`([^\`]+)\`/); 
console.log('Contains action:', match[1].includes('action')); 
console.log('Contains getDimensions:', match[1].includes('getDimensions'));"
# 输出: Contains action: false, Contains getDimensions: false
```

### 问题 2: WorkerManager 消息处理可能冲突

WorkerManager 的 `onmessage` 只处理压缩任务，没有处理 `getDimensions` 响应，可能导致消息丢失。

## 修复方案

### 修复 1: 更新内联 Worker 代码

在 `getInlineWorkerCode()` 中添加 `getDimensions` action 处理：

```javascript
return `self.onmessage=async function(e){
  const{action,imageDataURL,naturalWidth,naturalHeight,...}=e.data;
  
  // 添加 getDimensions 处理
  if(action==='getDimensions'){
    try{
      const img=new Image();
      await new Promise((r,j)=>{img.onload=r;img.onerror=j;img.src=imageDataURL});
      self.postMessage({taskId,dimensions:{width:img.naturalWidth,height:img.naturalHeight}});
      return
    }catch(e){
      self.postMessage({taskId,error:e.message||'Failed to get dimensions'});
      return
    }
  }
  
  // 原有的压缩逻辑...
}`;
```

### 修复 2: 改进 WorkerManager 消息处理

在 WorkerManager 的 `onmessage` 中添加对 `dimensions` 响应的识别，避免与压缩任务冲突。

### 修复 3: 增强错误处理

在 `getImageDimensionsForWorker` 中添加 Worker 就绪检查，确保 Worker 可用后再调用。

## 验证方法

### 1. 代码验证

```bash
# 检查构建后的代码是否包含 getDimensions
node -e "const code = require('fs').readFileSync('dist/compressor.js', 'utf8'); 
console.log('Contains getDimensions:', code.includes('getDimensions')); 
console.log('Contains action===:', code.includes('action==='));"
```

### 2. 运行时验证

使用 Chrome DevTools Performance 面板：

1. 打开 DevTools → Performance
2. 开始录制
3. 执行压缩操作：
   ```javascript
   new Compressor(file, {
     useWorker: true,
     quality: 0.8,
     success(result) {
       console.log('压缩完成');
     }
   });
   ```
4. 停止录制
5. 检查主线程（Main）：
   - **不应该有** Image decode 任务
   - **不应该有** 几百毫秒的阻塞
6. 检查 Worker 线程：
   - **应该有** Image decode 任务
   - **应该有** OffscreenCanvas 操作

### 3. 控制台验证

如果 Worker 正常工作，不应该看到警告信息：
- ❌ "Worker dimension detection failed, falling back to main thread"
- ❌ "Worker not initialized"

## 修复后的流程

1. **初始化**: Worker 异步初始化
2. **获取尺寸**: 调用 `getImageDimensionsFromWorker`，Worker 在后台线程解码并返回尺寸
3. **压缩**: 使用获取到的尺寸，在 Worker 中完成压缩
4. **结果**: 主线程完全不被阻塞

## 注意事项

1. **首次使用**: Worker 初始化需要几毫秒，这是正常的
2. **降级机制**: 如果 Worker 失败，会自动降级到主线程（这是预期的降级行为）
3. **浏览器兼容**: 需要支持 OffscreenCanvas（Chrome 69+, Firefox 105+, Safari 16.4+）

## 测试建议

在真实项目中测试：

```javascript
// 测试代码
const file = ...; // 你的图片文件

console.time('压缩时间');
new Compressor(file, {
  useWorker: true,
  quality: 0.8,
  success(result) {
    console.timeEnd('压缩时间');
    console.log('压缩完成，检查 Performance 面板确认主线程未被阻塞');
  }
});
```

**预期结果**:
- 主线程无 Image decode 任务
- UI 保持流畅，无卡顿
- Worker 线程中有 decode 和 canvas 操作

