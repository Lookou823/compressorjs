# 编码规范

本文档定义了 compressorjs-worker-version 项目的编码规范和最佳实践。

## 1. 代码风格

### 1.1 引号使用
- **必须使用单引号**：所有字符串使用单引号包裹
- 示例：
```javascript
const message = 'Hello World';
const url = 'https://example.com';
```

### 1.2 缩进和格式
- 使用 **2 个空格** 进行缩进
- 使用 ESLint 自动格式化（airbnb-base 配置）
- 行尾不允许有多余空格

### 1.3 命名规范
- **类名**：使用 PascalCase（如 `Compressor`, `WorkerManager`）
- **函数/方法名**：使用 camelCase（如 `compressImage`, `getImageData`）
- **常量**：使用 UPPER_SNAKE_CASE（如 `WINDOW`, `IS_BROWSER`）
- **私有属性**：使用 `this.` 前缀，无需特殊标记（如 `this.file`, `this.options`）

### 1.4 变量声明
- 优先使用 `const`，需要重新赋值时使用 `let`
- 避免使用 `var`
- 示例：
```javascript
const file = this.file;
let imageData = null;
```

## 2. 注释规范

### 2.1 JSDoc 注释
- **所有公共方法必须使用 JSDoc 注释**
- 包含参数说明、返回值说明、示例（如适用）
- 示例：
```javascript
/**
 * Compress image using worker
 * @param {Object} data - Compression data
 * @param {Blob|string} data.imageData - Image data (Blob, data URL, or URL)
 * @param {string} data.imageMimeType - Image MIME type
 * @param {number} data.rotate - Rotation angle in degrees
 * @param {number} data.scaleX - Horizontal scale factor
 * @param {number} data.scaleY - Vertical scale factor
 * @param {Object} data.options - Compression options
 * @returns {Promise<Blob>} Promise that resolves with compressed image blob
 */
async compress(data) {
  // ...
}
```

### 2.2 行内注释
- 复杂逻辑必须添加注释说明
- 使用 `//` 进行单行注释
- 注释应解释"为什么"而非"是什么"
- 示例：
```javascript
// In Worker mode, we must avoid ANY image decoding in main thread
// This includes: Image.onload, fetch(data URL), or any operation that triggers decoding
```

## 3. 异步处理

### 3.1 Promise 和 async/await
- 优先使用 `async/await` 语法
- 正确处理错误，使用 `try/catch`
- 示例：
```javascript
async function processImage() {
  try {
    const result = await workerManager.compress(data);
    return result;
  } catch (error) {
    console.error('Compression failed:', error);
    throw error;
  }
}
```

### 3.2 Worker 通信
- Worker 的 `postMessage` 必须过滤掉不可序列化的对象（如函数）
- 使用可转移对象（Transferable Objects）优化性能
- 示例：
```javascript
// 过滤函数
const { success, error, beforeDraw, drew, ...serializableOptions } = options;

// 使用可转移对象
const transferList = [];
if (data.imageData instanceof ArrayBuffer) {
  transferList.push(data.imageData);
}
this.worker.postMessage(data, transferList);
```

## 4. 错误处理

### 4.1 错误抛出
- 使用有意义的错误消息
- 包含上下文信息
- 示例：
```javascript
if (!imageData) {
  throw new Error('Worker image data not available. This indicates a bug in Worker initialization.');
}
```

### 4.2 错误捕获
- 所有异步操作必须包含错误处理
- Worker 错误必须回退到主线程（除非 `useWorker: true`）
- 示例：
```javascript
try {
  const result = await workerManager.compress(data);
  // ...
} catch (error) {
  if (this.options.useWorker === true) {
    this.fail(new Error(`Worker compression failed: ${error.message}`));
  } else {
    // Fallback to main thread
    this.useWorker = false;
    return this.drawOnMainThread({...});
  }
}
```

## 5. 性能优化

### 5.1 Worker 使用
- 图片解码必须在 Worker 线程中进行，避免主线程阻塞
- 使用 `createImageBitmap` 优先于 `new Image()`
- 使用可转移对象减少数据传输开销
- 示例：
```javascript
// 优先使用 createImageBitmap
if (typeof createImageBitmap !== 'undefined') {
  const imageBitmap = await createImageBitmap(blob);
  return { imageBitmap, width: imageBitmap.width, height: imageBitmap.height };
}
```

### 5.2 内存管理
- 及时清理 Blob URL：`URL.revokeObjectURL(blobURL)`
- Worker 任务必须有超时机制
- 清理 pending tasks 防止内存泄漏
- 示例：
```javascript
const timeout = setTimeout(() => {
  if (this.pendingTasks.has(taskId)) {
    this.pendingTasks.delete(taskId);
    reject(new Error('Worker task timeout after 30 seconds'));
  }
}, 30000);
```

## 6. 代码组织

### 6.1 文件结构
- 核心逻辑：`src/index.js`
- 工具函数：`src/utilities.js`
- 常量定义：`src/constants.js`
- 默认配置：`src/defaults.js`
- Worker 实现：`src/worker/image-compress.worker.js`

### 6.2 导入导出
- 使用 ES6 `import/export` 语法
- 默认导出用于主要类/对象
- 命名导出用于工具函数
- 示例：
```javascript
// 导入
import DEFAULTS from './defaults';
import { isImageType, getAdjustedSizes } from './utilities';

// 导出
export default class Compressor { ... }
export function isPositiveNumber(value) { ... }
```

## 7. ESLint 规则

### 7.1 必须遵守的规则
- `no-console`: 生产环境禁用 console，使用 `eslint-disable-next-line no-console` 注释
- `prefer-destructuring`: 优先使用解构赋值
- `valid-jsdoc`: JSDoc 注释必须有效
- `no-param-reassign`: 允许参数重新赋值（已配置为 off）

### 7.2 特殊规则
- Worker 中使用 `self.postMessage` 需要添加 `eslint-disable-next-line no-restricted-globals`
- 示例：
```javascript
// eslint-disable-next-line no-restricted-globals
self.postMessage({ taskId, success: true, ... });
```

## 8. 类型安全

### 8.1 类型检查
- 使用 `instanceof` 检查对象类型
- 使用 `typeof` 检查基本类型
- 使用工具函数进行类型验证（如 `isBlob`, `isImageType`）
- 示例：
```javascript
if (imageData instanceof Blob || imageData instanceof File) {
  blob = imageData;
} else if (imageData instanceof ArrayBuffer) {
  blob = new Blob([imageData], { type: mimeType });
}
```

## 9. 浏览器兼容性

### 9.1 特性检测
- 使用特性检测而非用户代理检测
- 提供降级方案
- 示例：
```javascript
function isOffscreenCanvasSupported() {
  return (
    typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined'
  );
}
```

### 9.2 环境变量
- 使用 `process.env.NODE_ENV` 进行环境判断（构建时替换）
- 浏览器环境检查：`typeof window !== 'undefined'`
- 示例：
```javascript
if (process.env.NODE_ENV !== 'production') {
  console.warn('Worker data preparation failed');
}
```

## 10. 测试规范

### 10.1 测试文件组织
- 测试文件位于 `test/specs/` 目录
- 按功能模块组织测试文件
- 使用 Mocha + Chai 进行测试

### 10.2 测试覆盖
- 核心功能必须有测试覆盖
- Worker 功能需要端到端测试
- 性能测试需要验证主线程不阻塞

## 11. Git 提交规范

### 11.1 提交消息格式
- 使用 Conventional Commits 格式
- 类型：`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- 示例：
```
fix(worker): filter out functions from options to avoid postMessage clone error
perf(worker): use transferable objects for ArrayBuffer
```

## 12. 文档规范

### 12.1 README
- 包含项目介绍、安装、使用方法
- 包含配置选项说明
- 包含示例代码

### 12.2 CHANGELOG
- 每个版本记录变更
- 分类：Bug 修复、新功能、性能优化、代码质量

## 13. 特殊注意事项

### 13.1 Worker 模式
- **禁止在主线程解码图片**：Worker 模式下，图片解码必须在 Worker 线程完成
- **禁止传递函数到 Worker**：`postMessage` 无法序列化函数，必须过滤
- **必须处理 Worker 失败**：提供降级到主线程的方案（除非 `useWorker: true`）

### 13.2 图片处理
- quality 参数只在 JPEG 和 WebP 格式时有效
- PNG 格式不支持 quality 参数
- 大文件自动转换为 JPEG（根据 `convertSize` 配置）

### 13.3 内存管理
- Blob URL 使用后必须调用 `URL.revokeObjectURL()`
- Worker 任务必须有超时机制
- 及时清理 pending tasks

