# API 文档规范

本文档定义了 compressorjs-worker-version 项目的 API 使用规范和文档标准。

## 1. API 概览

### 1.1 主要 API

**Compressor 类**:
```javascript
new Compressor(file, options)
```

**参数**:
- `file` (File|Blob): 要压缩的图片文件
- `options` (Object): 压缩选项（可选）

**返回值**:
- Compressor 实例（无返回值，通过回调获取结果）

### 1.2 静态方法

**setDefaults**:
```javascript
Compressor.setDefaults(options)
```

**noConflict**:
```javascript
const MyCompressor = Compressor.noConflict();
```

## 2. 配置选项 API

### 2.1 基本选项

**quality** (number, default: 0.8):
- 压缩质量，范围 0-1
- 仅对 JPEG 和 WebP 有效

**mimeType** (string, default: 'auto'):
- 输出图片的 MIME 类型
- 可选值: 'auto', 'image/jpeg', 'image/png', 'image/webp'

**useWorker** (boolean|undefined, default: undefined):
- `true`: 强制使用 Worker（不支持时失败）
- `false`: 禁用 Worker
- `undefined`: 自动检测（推荐）

### 2.2 尺寸选项

**maxWidth** (number, default: Infinity):
- 最大宽度（像素）

**maxHeight** (number, default: Infinity):
- 最大高度（像素）

**minWidth** (number, default: 0):
- 最小宽度（像素）

**minHeight** (number, default: 0):
- 最小高度（像素）

**width** (number, default: undefined):
- 目标宽度（像素）

**height** (number, default: undefined):
- 目标高度（像素）

**resize** (string, default: 'none'):
- 调整方式: 'none', 'contain', 'cover'

### 2.3 回调选项

**success** (Function):
```javascript
success(result) {
  // result: 压缩后的 File 对象
  console.log('压缩成功', result);
}
```

**error** (Function):
```javascript
error(err) {
  // err: Error 对象
  console.error('压缩失败', err.message);
}
```

**beforeDraw** (Function):
```javascript
beforeDraw(context, canvas) {
  // 绘制前可以修改 context
  context.fillStyle = '#fff';
}
```

**drew** (Function):
```javascript
drew(context, canvas) {
  // 绘制后可以应用滤镜等
  context.filter = 'grayscale(100%)';
}
```

## 3. Worker API

### 3.1 Worker 初始化

**自动初始化**:
- 当 `useWorker: undefined` 时，自动检测浏览器支持
- 支持 OffscreenCanvas 时自动启用 Worker

**手动配置**:
```javascript
new Compressor(file, {
  useWorker: true,  // 强制启用
  workerPath: '/path/to/worker.js',  // 自定义 Worker 路径
});
```

### 3.2 Worker 通信

**主线程 → Worker**:
```javascript
workerManager.compress({
  imageData: blob,  // Blob, ArrayBuffer, 或 data URL
  imageMimeType: 'image/jpeg',
  rotate: 0,
  scaleX: 1,
  scaleY: 1,
  options: { ... },  // 可序列化的选项
});
```

**Worker → 主线程**:
```javascript
self.postMessage({
  taskId,
  success: true,
  arrayBuffer,
  mimeType,
  naturalWidth,
  naturalHeight,
}, [arrayBuffer]);  // 使用可转移对象
```

## 4. 使用示例

### 4.1 基本使用

```javascript
import Compressor from '@liuyongdi/compressorjs';

const fileInput = document.getElementById('file');
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  
  new Compressor(file, {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    success(result) {
      console.log('压缩成功', result);
      // 上传 result
    },
    error(err) {
      console.error('压缩失败', err);
    },
  });
});
```

### 4.2 Worker 模式

```javascript
new Compressor(file, {
  useWorker: true,  // 强制使用 Worker
  quality: 0.8,
  success(result) {
    // Worker 模式下压缩，主线程不阻塞
    console.log('压缩成功', result);
  },
});
```

### 4.3 自动模式（推荐）

```javascript
new Compressor(file, {
  useWorker: undefined,  // 自动检测
  quality: 0.8,
  success(result) {
    // 自动选择最佳模式
    console.log('压缩成功', result);
  },
});
```

## 5. 错误处理 API

### 5.1 错误类型

**初始化错误**:
- `The first argument must be a File or Blob object.`
- `The first argument must be an image File or Blob object.`
- `The current browser does not support image compression.`

**Worker 错误**:
- `Worker not initialized.`
- `Worker initialization failed: ...`
- `Worker compression failed: ...`
- `Worker task timeout after 30 seconds`

**处理错误**:
- `Failed to load the image.`
- `Aborted to load the image.`
- `Failed to read the image with FileReader.`

### 5.2 错误处理示例

```javascript
new Compressor(file, {
  error(err) {
    if (err.message.includes('Worker')) {
      // Worker 相关错误
      console.error('Worker 错误:', err);
      // 可以降级到主线程模式
    } else {
      // 其他错误
      console.error('压缩错误:', err);
    }
  },
});
```

## 6. 实例方法 API

### 6.1 abort()

**功能**: 中止压缩操作

**使用**:
```javascript
const compressor = new Compressor(file, { ... });

// 中止压缩
compressor.abort();
```

### 6.2 内部方法（不推荐直接调用）

- `init()`: 初始化
- `load(data)`: 加载图片
- `draw()`: 绘制图片
- `drawWithWorker()`: Worker 模式绘制
- `drawOnMainThread()`: 主线程模式绘制

## 7. 类型定义

### 7.1 TypeScript 类型

```typescript
interface CompressorOptions {
  quality?: number;
  mimeType?: string;
  useWorker?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
  width?: number;
  height?: number;
  resize?: 'none' | 'contain' | 'cover';
  success?: (result: File) => void;
  error?: (err: Error) => void;
  beforeDraw?: (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void;
  drew?: (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void;
}

class Compressor {
  constructor(file: File | Blob, options?: CompressorOptions);
  abort(): void;
  static setDefaults(options: CompressorOptions): void;
  static noConflict(): typeof Compressor;
}
```

## 8. 浏览器兼容性 API

### 8.1 特性检测

**自动检测**:
- OffscreenCanvas 支持
- Worker 支持
- FileReader 支持
- ArrayBuffer 支持

**手动检测**:
```javascript
function isOffscreenCanvasSupported() {
  return (
    typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined'
  );
}
```

### 8.2 降级策略

**自动降级**:
- Worker 不支持时自动使用主线程模式
- 某些特性不支持时自动禁用相关功能

**手动控制**:
```javascript
// 强制使用主线程模式
new Compressor(file, {
  useWorker: false,
  // ...
});
```

## 9. 性能 API

### 9.1 Worker 性能优化

**可转移对象**:
```javascript
// 自动使用可转移对象优化性能
const transferList = [];
if (data.imageData instanceof ArrayBuffer) {
  transferList.push(data.imageData);
}
worker.postMessage(data, transferList);
```

**任务超时**:
```javascript
// 自动超时机制（30秒）
const timeout = setTimeout(() => {
  if (this.pendingTasks.has(taskId)) {
    this.pendingTasks.delete(taskId);
    reject(new Error('Worker task timeout'));
  }
}, 30000);
```

## 10. 最佳实践

### 10.1 推荐配置

```javascript
new Compressor(file, {
  useWorker: undefined,  // 自动检测
  quality: 0.8,  // 平衡质量和大小
  maxWidth: 1920,  // 限制最大尺寸
  maxHeight: 1080,
  success(result) {
    // 处理结果
  },
  error(err) {
    // 处理错误
  },
});
```

### 10.2 避免的做法

**不要**:
- 在主线程模式下处理大图片（会阻塞）
- 传递函数到 Worker（无法序列化）
- 忽略错误处理
- 不清理 Blob URL（内存泄漏）
