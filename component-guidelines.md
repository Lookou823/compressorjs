# 组件/类设计规范

本文档定义了 compressorjs-worker-version 项目中类和模块的设计规范。

## 1. 类设计原则

### 1.1 Compressor 类

**职责**:
- 图片压缩的主要入口类
- 管理压缩流程（加载、解码、压缩）
- 处理配置选项和回调

**设计规范**:
- 使用构造函数初始化，立即调用 `init()` 方法
- 所有异步操作使用 `async/await`
- 提供清晰的错误处理机制

**示例**:
```javascript
export default class Compressor {
  constructor(file, options) {
    this.file = file;
    this.options = { ...DEFAULTS, ...options };
    this.init();
  }
  
  init() {
    // 验证输入
    // 初始化 Worker（如需要）
    // 开始处理流程
  }
}
```

### 1.2 WorkerManager 类

**职责**:
- 管理 Web Worker 生命周期
- 处理 Worker 消息通信
- 管理任务队列和超时

**设计规范**:
- 单例模式（通过模块级变量管理）
- 使用 Map 管理 pending tasks
- 提供超时机制防止内存泄漏

**示例**:
```javascript
class WorkerManager {
  constructor() {
    this.worker = null;
    this.taskId = 0;
    this.pendingTasks = new Map();
  }
  
  compress(data) {
    return new Promise((resolve, reject) => {
      const taskId = ++this.taskId;
      const timeout = setTimeout(() => {
        if (this.pendingTasks.has(taskId)) {
          this.pendingTasks.delete(taskId);
          reject(new Error('Worker task timeout'));
        }
      }, 30000);
      // ...
    });
  }
}
```

## 2. 模块组织

### 2.1 核心模块 (src/index.js)

**包含内容**:
- Compressor 类
- WorkerManager 类
- 辅助函数（如 `isOffscreenCanvasSupported`）

**导入规范**:
```javascript
import DEFAULTS from './defaults';
import { WINDOW } from './constants';
import { isImageType, getAdjustedSizes } from './utilities';
```

### 2.2 工具模块 (src/utilities.js)

**包含内容**:
- 纯函数工具
- 无副作用函数
- 可复用的业务逻辑

**导出规范**:
```javascript
export function isPositiveNumber(value) { ... }
export function isImageType(value) { ... }
export function getAdjustedSizes({ aspectRatio, height, width }, type) { ... }
```

### 2.3 Worker 模块 (src/worker/image-compress.worker.js)

**包含内容**:
- Worker 消息处理逻辑
- 图片解码函数
- Canvas 操作逻辑

**设计规范**:
- 不能使用 ES6 import（Worker 限制）
- 所有函数必须在 Worker 文件内定义
- 使用 `self.onmessage` 处理消息

## 3. 方法设计

### 3.1 公共方法

**命名规范**:
- 使用动词开头（如 `compress`, `abort`, `setDefaults`）
- 使用 camelCase
- 方法名应清晰表达功能

**参数规范**:
- 使用对象解构接收多个参数
- 提供默认值
- 示例：
```javascript
async drawWithWorker({
  naturalWidth,
  naturalHeight,
  rotate = 0,
  scaleX = 1,
  scaleY = 1,
}) {
  // ...
}
```

### 3.2 私有方法

**命名规范**:
- 使用描述性名称
- 无需特殊前缀（JavaScript 没有真正的私有方法）

**示例**:
```javascript
async prepareDataForWorker(data) { ... }
async initializeWorker() { ... }
handleCompressionResult(blob, { naturalWidth, naturalHeight, isJPEGImage }) { ... }
```

### 3.3 静态方法

**使用场景**:
- 工具方法
- 不依赖实例状态的方法

**示例**:
```javascript
static getInlineWorkerCode() {
  return "...";
}
```

## 4. 属性设计

### 4.1 实例属性

**初始化**:
- 在构造函数中初始化
- 使用有意义的默认值

**示例**:
```javascript
constructor(file, options) {
  this.file = file;
  this.exif = [];
  this.image = new Image();
  this.options = { ...DEFAULTS, ...options };
  this.aborted = false;
  this.result = null;
  this.useWorker = false;
  this.workerInitialized = false;
}
```

### 4.2 状态管理

**状态属性**:
- `aborted`: 是否已中止
- `useWorker`: 是否使用 Worker
- `workerInitialized`: Worker 是否已初始化
- `result`: 压缩结果

**状态转换**:
- 状态变更必须有明确的触发条件
- 状态变更后必须执行相应的清理操作

## 5. 错误处理

### 5.1 错误抛出

**规范**:
- 使用 `Error` 对象
- 提供有意义的错误消息
- 包含上下文信息

**示例**:
```javascript
if (!imageData) {
  throw new Error('Worker image data not available. This indicates a bug in Worker initialization.');
}
```

### 5.2 错误回调

**规范**:
- 通过 `options.error` 回调通知错误
- 不抛出未捕获的异常

**示例**:
```javascript
this.fail(new Error('The first argument must be a File or Blob object.'));
```

## 6. 生命周期管理

### 6.1 初始化流程

1. 构造函数接收参数
2. 调用 `init()` 验证输入
3. 根据配置决定是否初始化 Worker
4. 开始图片加载流程

### 6.2 清理流程

**必须清理的资源**:
- Blob URL: `URL.revokeObjectURL(blobURL)`
- Worker: `worker.terminate()`
- Pending tasks: `pendingTasks.clear()`
- 事件监听器: 设置为 `null`

**示例**:
```javascript
destroy() {
  if (this.workerURL) {
    URL.revokeObjectURL(this.workerURL);
    this.workerURL = null;
  }
  if (this.worker) {
    this.worker.terminate();
    this.worker = null;
  }
  this.image.onload = null;
  this.image.onabort = null;
  this.image.onerror = null;
}
```

## 7. 依赖注入

### 7.1 外部依赖

**通过参数注入**:
- 配置选项通过构造函数参数注入
- 回调函数通过 options 注入

**示例**:
```javascript
new Compressor(file, {
  quality: 0.8,
  success: (result) => { ... },
  error: (err) => { ... },
});
```

### 7.2 内部依赖

**通过模块导入**:
- 工具函数通过 import 导入
- 常量通过 import 导入

## 8. 可扩展性

### 8.1 钩子函数

**支持的钩子**:
- `beforeDraw`: 绘制前钩子
- `drew`: 绘制后钩子

**使用规范**:
```javascript
if (options.beforeDraw) {
  options.beforeDraw.call(this, context, canvas);
}
```

### 8.2 配置扩展

**扩展方式**:
- 通过 `options` 对象传递
- 通过 `setDefaults` 静态方法设置全局默认值

## 9. 测试友好设计

### 9.1 可测试性

**设计原则**:
- 方法职责单一
- 减少副作用
- 提供测试入口

### 9.2 模拟支持

**设计考虑**:
- 允许注入模拟对象
- 提供测试辅助方法

