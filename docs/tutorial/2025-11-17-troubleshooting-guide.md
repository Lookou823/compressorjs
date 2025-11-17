# Worker 主线程解码问题排查清单

## 最小可复现排查步骤（10步）

1. **检查浏览器控制台**：是否有 "Worker dimension detection failed" 或 "Worker not initialized" 警告
2. **验证 Worker 初始化**：在 DevTools Console 执行 `new Compressor(file, {useWorker:true})` 后，检查 `workerManager?.worker` 是否存在
3. **检查内联 Worker 代码**：在 `getInlineWorkerCode()` 返回的字符串中搜索 `getDimensions`，确认是否存在
4. **验证 Worker 消息处理**：在 Worker 中打断点，确认收到 `action: 'getDimensions'` 消息
5. **检查 Performance 面板**：录制压缩过程，查看主线程是否有 "Decode Image" 任务
6. **验证 OffscreenCanvas 支持**：执行 `typeof OffscreenCanvas !== 'undefined'` 确认浏览器支持
7. **检查 Worker 错误**：监听 `worker.onerror`，确认是否有 Worker 初始化或运行时错误
8. **验证消息格式**：检查发送给 Worker 的消息是否包含 `action: 'getDimensions'` 和 `imageDataURL`
9. **检查降级逻辑**：在 `getImageDimensionsForWorker` 的 catch 块打断点，确认是否触发降级
10. **验证构建产物**：检查 `dist/compressor.js` 中是否包含 `getDimensions` 字符串

## 最常见 3 个根因及修复

### 根因 1: 内联 Worker 代码缺少 getDimensions 处理

**现象**: Worker 收到消息但不响应，超时后降级主线程

**修复代码**:
```javascript
getInlineWorkerCode() {
  return `self.onmessage=async function(e){
    const{action,imageDataURL,naturalWidth,naturalHeight,rotate=0,scaleX=1,scaleY=1,options,taskId}=e.data;
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
    // 原有压缩逻辑...
  }`;
}
```

### 根因 2: Worker 未初始化完成就调用 getDimensions

**现象**: `getImageDimensionsFromWorker` 抛出 "Worker not initialized" 错误

**修复代码**:
```javascript
async getImageDimensionsForWorker(data) {
  // 确保 Worker 就绪
  if (!workerManager || !workerManager.worker) {
    this.useWorker = false;
    this.workerInitialized = true;
    this.proceedWithLoad(data);
    return;
  }
  // 继续处理...
}
```

### 根因 3: WorkerManager 消息处理冲突，dimensions 响应被忽略

**现象**: Worker 返回 dimensions 但主线程未收到

**修复代码**:
```javascript
this.worker.onmessage = (e) => {
  const { taskId, success, arrayBuffer, mimeType, error, dimensions } = e.data;
  
  // 识别 getDimensions 响应
  if (dimensions !== undefined && !success && !arrayBuffer) {
    return; // 由 getImageDimensionsFromWorker 处理
  }
  
  // 处理压缩任务...
};
```
