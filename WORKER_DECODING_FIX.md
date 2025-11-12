# Worker 模式下避免主线程解码的修复

## 问题描述

即使设置了 `useWorker: true`，图片解码过程仍然在主线程运行。

## 根本原因

在 `proceedWithLoad` 方法中，无论是否使用 Worker，代码都会在主线程加载 Image 对象来获取图片尺寸（naturalWidth, naturalHeight），这会导致图片在主线程解码。

## 修复方案

### 1. Worker 模式下跳过主线程 Image 加载

在 `proceedWithLoad` 方法中，检测到 Worker 模式时，不加载主线程 Image，而是调用 `getImageDimensionsForWorker`。

### 2. 在 Worker 中获取图片尺寸

新增 `getImageDimensionsFromWorker` 方法，将图片数据发送到 Worker，让 Worker 在后台线程中解码并返回尺寸信息。

### 3. 修改 Worker 消息处理

在 Worker 中添加 `getDimensions` action 支持，可以返回图片尺寸而不进行完整压缩。

### 4. 存储 data URL 供 Worker 使用

在获取尺寸时，将 data URL 存储到 `this.workerImageDataURL`，供后续压缩使用，避免使用主线程的 `image.src`。

## 代码变更

### src/index.js

1. **proceedWithLoad**: 检测 Worker 模式，跳过主线程 Image 加载
2. **getImageDimensionsForWorker**: 新增方法，在 Worker 中获取尺寸
3. **getImageDimensionsFromWorker**: 新增方法，与 Worker 通信获取尺寸
4. **drawWithWorker**: 使用存储的 `workerImageDataURL` 而不是 `image.src`

### src/worker/image-compress.worker.js

1. **onmessage**: 添加 `getDimensions` action 处理
2. 在 Worker 中加载 Image 获取尺寸并返回

## 使用方式

```javascript
new Compressor(file, {
  useWorker: true,  // 现在图片解码真正在 Worker 线程中
  quality: 0.8,
  success(result) {
    console.log('压缩完成，主线程未被阻塞');
  }
});
```

## 验证方法

使用 Chrome DevTools Performance 面板：

1. 开始录制
2. 执行压缩操作
3. 检查主线程（Main）中是否有 Image decode 任务
4. 检查 Worker 线程中是否有 decode 任务

**预期结果**：
- 主线程：无 Image decode 任务
- Worker 线程：有 decode 任务

## 注意事项

1. **首次尺寸获取**：第一次获取尺寸时，Worker 需要解码图片，会有短暂延迟
2. **降级处理**：如果 Worker 获取尺寸失败，会自动降级到主线程模式
3. **浏览器兼容性**：需要支持 OffscreenCanvas 的浏览器（Chrome 69+, Firefox 105+, Safari 16.4+）

## 性能影响

- **之前**：主线程解码图片（阻塞 UI）
- **现在**：Worker 线程解码图片（不阻塞 UI）

对于大图片（>5MB），性能提升明显，UI 保持流畅响应。

