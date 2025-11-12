# Compressor.js 性能审计报告

**审计日期**: 2024年  
**审计范围**: 图片压缩模块（Worker 实现）  
**审计目标**: 排除内存泄漏、Worker 未启动、解码回退主线程三类致命缺陷

---

## A. 缺陷清单

### P0 - 致命缺陷（必须修复）

#### P0-1: 全局 WorkerManager 单例永不释放导致内存泄漏
**现象**: 
- `workerManager` 作为全局变量（`src/index.js:120`）在首次使用后永久驻留内存
- 即使所有 Compressor 实例销毁，Worker 线程和 Blob URL 仍占用资源
- 长期运行的应用中内存持续增长

**根因**:
```120:120:src/index.js
let workerManager = null;
```
- 全局单例模式，无引用计数机制
- `WorkerManager.terminate()` 方法存在但从未被调用
- 缺少 Compressor 实例销毁时的清理逻辑

**修复建议**:
```javascript
// 方案1: 添加引用计数
let workerManager = null;
let workerManagerRefCount = 0;

// 在 Compressor 构造函数中增加引用
// 在 Compressor 销毁时减少引用，引用为0时调用 terminate()

// 方案2: 添加静态清理方法
Compressor.cleanup = () => {
  if (workerManager) {
    workerManager.terminate();
    workerManager = null;
  }
};
```

**Commit 建议**: `fix(memory): add worker manager cleanup mechanism`

---

#### P0-2: Image 对象事件监听器未完全清理
**现象**:
- `abort()` 方法仅设置 `image.onload = null`（`src/index.js:746`）
- `image.onabort` 和 `image.onerror` 监听器未清理
- 可能导致内存泄漏和意外回调执行

**根因**:
```746:747:src/index.js
this.image.onload = null;
this.image.onabort();
```
- 只清理了 `onload`，其他事件处理器未置空
- `onabort()` 调用可能触发错误处理逻辑

**修复建议**:
```javascript
if (this.reader) {
  this.reader.abort();
} else if (!this.image.complete) {
  this.image.onload = null;
  this.image.onabort = null;  // 添加
  this.image.onerror = null;  // 添加
  // 移除 this.image.onabort() 调用
} else {
  this.fail(new Error("The compression process has been aborted."));
}
```

**Commit 建议**: `fix(memory): cleanup all image event listeners on abort`

---

#### P0-3: Worker 内联代码字符串可能导致打包失败
**现象**:
- Worker 代码通过字符串内联（`src/index.js:327-330`）
- 使用 `getInlineWorkerCode()` 返回硬编码的压缩字符串
- Rollup 打包时无法正确处理 Worker 依赖

**根因**:
```327:330:src/index.js
getInlineWorkerCode() {
  // Return the worker code as a string
  // This will be replaced with actual worker code during build or runtime
  return `self.onmessage=async function(e){...}`;
}
```
- 字符串内联方式无法利用 Rollup 的代码分割
- Worker 文件 `src/worker/image-compress.worker.js` 未被 Rollup 处理
- `rollup.config.js` 中无 Worker 相关配置

**修复建议**:
1. 使用 Rollup 插件 `@rollup/plugin-worker` 或 `rollup-plugin-web-worker-loader`
2. 或使用 `new URL('./worker/image-compress.worker.js', import.meta.url)` 方式
3. 在构建时注入 Worker 代码

**Commit 建议**: `fix(worker): use proper worker bundling with rollup plugin`

---

### P1 - 严重缺陷（建议修复）

#### P1-1: 主线程可能提前解码图片导致 Worker 解码回退
**现象**:
- `proceedWithLoad()` 中 `image.src = data.url` 会触发主线程解码
- Worker 中再次使用 `new Image()` 解码，可能重复解码
- 如果主线程已解码，Worker 中的解码可能回退到主线程

**根因**:
```271:296:src/index.js
image.onload = () => {
  this.draw({
    ...data,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
  });
};
// ...
image.src = data.url;
```
- 主线程先加载 Image 获取尺寸
- Worker 模式中仍需要 data URL，但 Image 已在主线程解码

**修复建议**:
- 使用 `ImageDecoder` API（Chrome 94+）在 Worker 中直接解码
- 或延迟主线程 Image 加载，仅在非 Worker 模式加载

**Commit 建议**: `perf(worker): avoid duplicate image decoding in main thread`

---

#### P1-2: Blob URL 清理不完整
**现象**:
- `done()` 方法中清理了 `image.src` 的 Blob URL（`src/index.js:682`）
- 但 `abort()` 时未清理
- Worker 中创建的临时 Blob URL 可能未清理

**根因**:
```681:683:src/index.js
if (URL && image.src.indexOf("blob:") === 0) {
  URL.revokeObjectURL(image.src);
}
```
- 仅在成功完成时清理
- `abort()` 和错误路径未清理

**修复建议**:
```javascript
// 在 Compressor 类中添加清理方法
cleanup() {
  if (URL && this.image && this.image.src && this.image.src.indexOf("blob:") === 0) {
    URL.revokeObjectURL(this.image.src);
  }
  // 清理事件监听器
  if (this.image) {
    this.image.onload = null;
    this.image.onabort = null;
    this.image.onerror = null;
  }
}

// 在 abort() 和 fail() 中调用
```

**Commit 建议**: `fix(memory): ensure blob URLs are cleaned up in all code paths`

---

#### P1-3: pendingTasks Map 可能累积未完成的任务
**现象**:
- `WorkerManager.pendingTasks` 在任务完成时删除（`src/index.js:62`）
- 但如果 Worker 崩溃或网络错误，任务可能永远留在 Map 中
- 导致内存泄漏

**根因**:
```57:69:src/index.js
this.worker.onmessage = (e) => {
  const { taskId, success, arrayBuffer, mimeType, error } = e.data;
  const task = this.pendingTasks.get(taskId);

  if (task) {
    this.pendingTasks.delete(taskId);
    // ...
  }
};
```
- 无超时机制
- Worker 错误时可能不发送消息，任务永远挂起

**修复建议**:
```javascript
compress(data) {
  return new Promise((resolve, reject) => {
    // ...
    const taskId = ++this.taskId;
    const timeout = setTimeout(() => {
      this.pendingTasks.delete(taskId);
      reject(new Error('Worker task timeout'));
    }, 30000); // 30秒超时
    
    this.pendingTasks.set(taskId, { 
      resolve: (result) => {
        clearTimeout(timeout);
        resolve(result);
      }, 
      reject: (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    });
    // ...
  });
}
```

**Commit 建议**: `fix(worker): add timeout for pending tasks to prevent memory leak`

---

### P2 - 一般缺陷（可选修复）

#### P2-1: 未使用 ImageDecoder API
**现象**:
- 代码使用传统 `Image` 对象解码
- 未利用 Chrome 94+ 的 `ImageDecoder` API
- 无法在 Worker 中直接解码，需要 data URL

**根因**:
- Worker 中使用 `new Image()` 和 data URL
- 主线程也可能先解码

**修复建议**:
- 检测 `ImageDecoder` 支持
- 在 Worker 中使用 `ImageDecoder` 直接解码 ArrayBuffer
- 避免 data URL 转换开销

**Commit 建议**: `feat(worker): use ImageDecoder API for better performance`

---

#### P2-2: Worker 错误处理不完善
**现象**:
- `worker.onerror` 在初始化时设置，但错误后未清理 pending tasks
- Worker 崩溃后，所有 pending tasks 永远挂起

**根因**:
```72:74:src/index.js
this.worker.onerror = (error) => {
  reject(error);
};
```
- 仅 reject 初始化 Promise
- 运行时的 Worker 错误未处理

**修复建议**:
```javascript
this.worker.onerror = (error) => {
  // 清理所有 pending tasks
  this.pendingTasks.forEach((task) => {
    task.reject(new Error('Worker error: ' + error.message));
  });
  this.pendingTasks.clear();
  // 重置 worker
  this.worker = null;
  if (this.workerURL) {
    URL.revokeObjectURL(this.workerURL);
    this.workerURL = null;
  }
  reject(error);
};
```

**Commit 建议**: `fix(worker): handle runtime worker errors and cleanup pending tasks`

---

## B. 内存泄漏审计报告

### 可疑全局变量

1. **`workerManager`** (P0-1)
   - 位置: `src/index.js:120`
   - 问题: 全局单例，永不释放
   - 影响: 高 - Worker 线程和 Blob URL 永久占用内存

### 事件监听器泄漏点

1. **Image 对象监听器** (P0-2)
   - 位置: `src/index.js:271-283`
   - 问题: `abort()` 时未完全清理
   - 影响: 中 - 每个未清理的实例占用内存

2. **FileReader 监听器**
   - 位置: `src/index.js:188-231`
   - 状态: ✅ 已正确清理（`onloadend` 中设置 `this.reader = null`）

3. **Worker 监听器**
   - 位置: `src/index.js:57-74`
   - 问题: Worker 终止时监听器未显式移除（浏览器会自动清理，但显式移除更安全）

### WASM 实例未释放点

- **无**: 本项目未使用 WASM

### Blob URL 未释放点

1. **Worker Blob URL** (P0-1)
   - 位置: `src/index.js:54`
   - 问题: `workerManager` 不释放，Blob URL 不释放
   - 影响: 高

2. **Image Blob URL** (P1-2)
   - 位置: `src/index.js:182, 215, 682`
   - 问题: `abort()` 时未清理
   - 影响: 中

### Heap Snapshot Diff 步骤

1. **准备阶段**:
   ```javascript
   // 在测试页面中
   const compressors = [];
   for (let i = 0; i < 100; i++) {
     compressors.push(new Compressor(file, { useWorker: true }));
   }
   // 等待所有完成
   // 清理所有引用
   compressors.length = 0;
   ```

2. **录制步骤**:
   - 打开 Chrome DevTools → Memory → Heap Snapshot
   - 录制初始快照（Snapshot 1）
   - 执行 1000 次压缩操作
   - 等待 10 秒（GC）
   - 录制结束快照（Snapshot 2）
   - 对比两个快照

3. **判定阈值**:
   - **正常**: 内存增长 < 10%
   - **可疑**: 内存增长 10-30%
   - **泄漏**: 内存增长 > 30%

4. **检查项**:
   - `Worker` 对象数量（应为 0 或 1）
   - `Blob` 对象数量
   - `Image` 对象数量
   - `FileReader` 对象数量
   - `Compressor` 对象数量（应为 0）

---

## C. Worker 启动失败诊断

### Rollup 打包配置检查

**当前状态**: ❌ Worker 文件未被 Rollup 处理

**问题**:
- `rollup.config.js` 中无 Worker 相关插件
- Worker 代码通过字符串内联，无法利用代码分割
- 无法使用 `import.meta.url` 方式加载

**修复方案**:

1. **安装插件**:
   ```bash
   npm install --save-dev rollup-plugin-web-worker-loader
   ```

2. **修改 rollup.config.js**:
   ```javascript
   const workerLoader = require('rollup-plugin-web-worker-loader');

   module.exports = {
     // ...
     plugins: [
       workerLoader({
         targetPlatform: 'browser',
         pattern: /^.*\.worker\.(js|ts)$/,
       }),
       // ... 其他插件
     ],
   };
   ```

3. **修改 src/index.js**:
   ```javascript
   import WorkerCode from './worker/image-compress.worker.js?worker';

   getInlineWorkerCode() {
     // 使用打包后的 Worker 代码
     return WorkerCode;
   }
   ```

### Worker 加载方式验证

**当前实现**: ✅ 使用 Blob URL 方式
```javascript
const blob = new Blob([workerCode], { type: "application/javascript" });
this.workerURL = URL.createObjectURL(blob);
this.worker = new Worker(this.workerURL);
```

**问题**:
- 内联字符串方式，无法利用浏览器缓存
- 无法使用 source map 调试

**建议**: 使用 `new URL(..., import.meta.url)` 方式（需要 Rollup 插件支持）

### 同源策略检查

**当前状态**: ✅ 无问题
- 使用 Blob URL，无跨域问题
- 外部 Worker 文件需要 CORS 支持（`workerPath` 选项）

**验证步骤**:
```javascript
// 测试 Worker 启动
const compressor = new Compressor(file, { useWorker: true });
// 检查 workerManager.worker 是否存在
console.log(workerManager?.worker); // 应为 Worker 实例
```

---

## D. 解码线程回退原因

### ImageDecoder 使用情况

**当前状态**: ❌ 未使用 ImageDecoder API

**代码证据**:
- Worker 中使用 `new Image()` 和 data URL（`src/worker/image-compress.worker.js:169-174`）
- 主线程中也使用 `new Image()`（`src/index.js:135, 271`）

### 主线程提前解码检查

**问题位置**: `src/index.js:271-296`

**流程**:
1. `proceedWithLoad()` 设置 `image.src = data.url`
2. 主线程开始解码图片
3. `image.onload` 触发，调用 `draw()`
4. Worker 模式中，再次将 data URL 发送到 Worker
5. Worker 中 `new Image()` 再次解码

**影响**:
- 图片在主线程解码一次（获取尺寸）
- 在 Worker 中解码一次（实际处理）
- 重复解码浪费资源

### 修复建议

**方案1: 延迟主线程 Image 加载（Worker 模式）**
```javascript
proceedWithLoad(data) {
  if (this.useWorker) {
    // Worker 模式：不加载 Image，直接使用 data URL
    this.draw({
      ...data,
      naturalWidth: 0, // 从 data URL 解析或使用其他方式
      naturalHeight: 0,
    });
  } else {
    // 主线程模式：正常加载
    image.onload = () => { /* ... */ };
    image.src = data.url;
  }
}
```

**方案2: 使用 ImageDecoder API（推荐）**
```javascript
// 在 Worker 中
if (typeof ImageDecoder !== 'undefined') {
  const decoder = new ImageDecoder({
    data: arrayBuffer, // 直接使用 ArrayBuffer
    type: 'image/jpeg'
  });
  const { image } = await decoder.decode();
  // 使用 image 对象
} else {
  // 降级到 Image + data URL
}
```

**Commit 建议**: `perf(worker): avoid duplicate image decoding`

---

## E. 最小可复现单元测试

测试文件将创建在 `test/specs/performance/` 目录下。

### 测试要求

1. **解码不在主线程**: 验证 performance entry 中主线程无 decode 任务
2. **无内存增长 > 10%**: 1000 次压缩后内存增长 < 10%
3. **Worker 线程存活**: Worker 线程存在且 postMessage 往返 < 50ms

### 测试环境

- Jest + Puppeteer
- Chrome ≥ 96
- Node ≥ 16

---

## 总结

### 关键发现

1. **P0 缺陷 3 个**: 必须修复
   - 全局 WorkerManager 不释放
   - Image 事件监听器未完全清理
   - Worker 打包配置缺失

2. **P1 缺陷 3 个**: 建议修复
   - 主线程提前解码
   - Blob URL 清理不完整
   - pendingTasks 无超时机制

3. **P2 缺陷 2 个**: 可选优化
   - 未使用 ImageDecoder API
   - Worker 错误处理不完善

### 修复优先级

1. **立即修复** (P0): WorkerManager 清理、Image 监听器清理、Worker 打包
2. **尽快修复** (P1): Blob URL 清理、pendingTasks 超时、避免重复解码
3. **计划优化** (P2): ImageDecoder API、Worker 错误处理

### 兼容性

- ✅ Chrome ≥ 96: 支持 OffscreenCanvas 和 ImageDecoder
- ✅ Node ≥ 16: 支持所有 ES6+ 特性
- ⚠️ 需要添加降级方案以支持旧浏览器

