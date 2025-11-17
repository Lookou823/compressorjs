# Web Worker 使用指南

## 概述

compressorjs 现在支持使用 Web Worker 进行图片压缩，可以将 CPU 密集型的 Canvas 操作移至后台线程，避免阻塞主线程，提升用户体验。

## 浏览器兼容性

### 支持 Web Worker 的浏览器
- Chrome 69+ ✅
- Firefox 105+ ✅
- Safari 16.4+ ✅
- Edge 79+ ✅

### 自动降级
如果浏览器不支持 OffscreenCanvas 或 Web Worker，库会自动降级到主线程模式，确保功能正常。

## 使用方法

### 基本用法（自动检测）

```javascript
import Compressor from 'compressorjs';

new Compressor(file, {
  quality: 0.8,
  // useWorker 默认为 undefined，会自动检测浏览器支持
  success(result) {
    console.log('压缩完成', result);
  },
});
```

### 显式启用 Worker

```javascript
new Compressor(file, {
  quality: 0.8,
  useWorker: true, // 强制启用 Worker（如果浏览器支持）
  success(result) {
    console.log('压缩完成', result);
  },
});
```

### 显式禁用 Worker

```javascript
new Compressor(file, {
  quality: 0.8,
  useWorker: false, // 强制使用主线程
  success(result) {
    console.log('压缩完成', result);
  },
});
```

### 使用外部 Worker 文件

如果你有自定义的 Worker 文件，可以指定路径：

```javascript
new Compressor(file, {
  quality: 0.8,
  useWorker: true,
  workerPath: '/path/to/image-compress.worker.js', // Worker 文件路径
  success(result) {
    console.log('压缩完成', result);
  },
});
```

## 性能对比

### 主线程模式（useWorker: false）
- ✅ 兼容性好，所有浏览器支持
- ❌ 大图片会阻塞 UI
- ❌ 批量处理时页面可能卡顿

### Worker 模式（useWorker: true）
- ✅ 不阻塞主线程
- ✅ 大图片处理流畅
- ✅ 批量处理性能更好
- ⚠️ 需要浏览器支持 OffscreenCanvas

## 性能测试示例

```javascript
// 测试大图片压缩
const largeFile = ...; // 10MB 图片

console.time('压缩时间');
new Compressor(largeFile, {
  quality: 0.8,
  useWorker: true,
  success(result) {
    console.timeEnd('压缩时间');
    console.log('压缩完成，主线程未被阻塞');
  },
});
```

## 注意事项

1. **Worker 初始化**：首次使用 Worker 时会进行初始化，可能需要几毫秒
2. **内存使用**：Worker 模式会复制图片数据到 Worker 线程，内存使用略高
3. **兼容性降级**：不支持 Worker 的浏览器会自动使用主线程模式
4. **beforeDraw/drew 钩子**：Worker 模式下这些钩子函数不会执行（因为 Canvas 在 Worker 中）

## 故障排除

### Worker 初始化失败
如果 Worker 初始化失败，库会自动降级到主线程模式，不会影响功能。

### 自定义 Worker 文件
如果使用自定义 Worker 文件，确保：
- Worker 文件路径正确
- Worker 文件实现了正确的消息处理逻辑
- 服务器允许加载 Worker 文件（CORS 配置）

## 技术细节

### Worker 通信协议

主线程发送给 Worker：
```javascript
{
  imageDataURL: string,      // 图片的 data URL
  naturalWidth: number,       // 原始宽度
  naturalHeight: number,      // 原始高度
  rotate: number,             // 旋转角度
  scaleX: number,            // X 轴缩放
  scaleY: number,             // Y 轴缩放
  options: object,            // 压缩选项
  taskId: number,             // 任务 ID
}
```

Worker 返回给主线程：
```javascript
{
  taskId: number,             // 任务 ID
  success: boolean,           // 是否成功
  arrayBuffer: ArrayBuffer,   // 压缩后的图片数据
  mimeType: string,           // MIME 类型
  error?: string,             // 错误信息（如果失败）
}
```

## 示例代码

完整示例请参考 `docs/examples/` 目录。
