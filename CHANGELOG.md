# Changelog

## 1.2.5 (Dec 2024)

### 🐛 Bug 修复

- **修复 Worker 模式下 postMessage 无法克隆函数对象的问题**
  - 过滤掉 options 中的回调函数（success、error、beforeDraw、drew），只传递可序列化的选项
  - 解决了 `Failed to execute 'postMessage' on 'Worker': function could not be cloned` 错误

- **修复主线程模式 quality 参数未正确应用的问题**
  - 确保 quality 参数只在 JPEG 和 WebP 格式时传递
  - 修复了主线程模式下图片压缩质量不生效的问题

- **修复 ImageDecoder API 使用错误**
  - 修复了 Worker 中使用 ImageDecoder 时重复调用 createImageBitmap 的问题
  - 正确处理 ImageDecoder 返回的 ImageBitmap 对象

- **修复 data URL 转换兼容性问题**
  - 改进 data URL 到 ArrayBuffer 的转换逻辑，支持更多格式
  - 优化 Worker 数据传输，使用可转移对象提升性能

### 🚀 性能优化

- **优化 Worker 数据传输**
  - 使用 ArrayBuffer 作为可转移对象，避免数据复制
  - 减少主线程和 Worker 之间的数据传输开销

### 📝 代码质量

- **修复所有 ESLint 缩进错误**
  - 统一代码缩进格式，符合项目规范

## 1.2.4 (Nov 12, 2024)

### 🐛 Bug 修复

- **修复 process.env.NODE_ENV 在浏览器中未定义的问题**
  - 修复了 `ReferenceError: process is not defined` 错误
  - 在 Rollup 配置中添加了 `process.env.NODE_ENV` 的替换
  - 确保浏览器环境中不会出现 process 相关错误

### 🔧 调试改进

- **添加详细的 Worker 初始化日志**
  - 添加 Worker 检查日志，显示浏览器支持情况和配置选项
  - 添加 Worker 初始化过程日志，便于排查问题
  - 添加 Worker 错误详情日志，包含完整的错误信息
  - 添加降级到主线程模式的日志提示

### 📝 技术改进

- 改进 Worker 错误处理逻辑，确保错误能被正确捕获和报告
- 优化日志输出，使用统一的日志前缀 `[Compressor]` 和 `[WorkerManager]`

## 1.2.3 (Nov 12, 2024)

### 🔧 代码质量改进

- **修复所有格式化错误**
  - 统一使用单引号（符合 ESLint 配置）
  - 修复所有尾随逗号问题
  - 修复操作符位置（`&&` 和 `||` 放在行首）
  - 修复对象解构和赋值的换行问题
  - 代码完全符合项目 ESLint 规范

### 📝 技术改进

- 运行 ESLint 自动修复，确保代码风格一致性
- 所有格式化问题已解决，构建通过

## 1.2.2 (Nov 12, 2024)

### 🔧 代码质量改进

- **修复所有格式化错误**
  - 统一使用单引号（符合 ESLint 配置）
  - 修复所有尾随逗号问题
  - 修复操作符位置（`&&` 和 `||` 放在行首）
  - 修复对象解构和赋值的换行问题
  - 代码完全符合项目 ESLint 规范

### 📝 技术改进

- 运行 ESLint 自动修复，确保代码风格一致性
- 所有格式化问题已解决，构建通过

## 1.2.1-5 (Nov 12, 2024)

### 🔧 代码质量改进

- **修复所有格式化错误**
  - 统一使用单引号（符合 ESLint 配置）
  - 修复所有尾随逗号问题
  - 修复操作符位置（`&&` 和 `||` 放在行首）
  - 修复对象解构和赋值的换行问题
  - 代码完全符合项目 ESLint 规范

### 📝 技术改进

- 运行 ESLint 自动修复，确保代码风格一致性
- 所有格式化问题已解决，构建通过

## 1.2.1-4 (Nov 12, 2024)

### 🔒 Worker 严格模式

- **确保 useWorker: true 时绝不回退主线程**
  - 修复了所有降级路径，当 `useWorker: true` 时，图片解析和压缩**一定**在 Worker 中进行
  - Worker 初始化失败、尺寸获取失败、压缩失败时，不再降级到主线程，直接抛出错误
  - 确保主线程完全不被阻塞，UI 保持流畅响应

### 🔧 技术改进

- 修复 Worker 初始化失败处理：`useWorker: true` 时直接失败，不降级
- 修复 Worker 尺寸获取失败处理：`useWorker: true` 时直接失败，不降级
- 修复 Worker 压缩失败处理：`useWorker: true` 时直接失败，不降级
- 修复 Worker 数据 URL 缺失处理：`useWorker: true` 时直接抛出错误

### 📝 文档

- 新增 `WORKER_STRICT_MODE.md`：详细说明 Worker 严格模式的行为和使用方法

## 1.2.1-3 (Nov 12, 2024)

### 🐛 关键修复

- **修复内联 Worker 代码缺少 getDimensions 处理**
  - 修复了内联 Worker 代码（默认使用的 Worker）缺少 `getDimensions` action 处理的问题
  - 这是导致 Worker 模式下仍在主线程解码的根本原因
  - 现在内联 Worker 代码完整支持 `getDimensions` action，图片真正在 Worker 线程中解码

### 🔧 技术改进

- 更新 `getInlineWorkerCode()` 方法：添加 `action` 参数和 `getDimensions` 处理逻辑
- 改进 WorkerManager 消息处理：识别 `dimensions` 响应，避免与压缩任务冲突
- 增强错误处理：在调用前检查 Worker 是否就绪

### 📝 文档

- 新增 `WORKER_DECODING_FIX_V2.md`：详细说明根本原因和修复方案

## 1.2.1-2 (Nov 12, 2024)

### 🐛 Bug Fixes

- **修复 Worker 模式下主线程解码问题**
  - 修复了即使设置 `useWorker: true`，图片仍在主线程解码的问题
  - 现在图片尺寸获取和压缩都在 Worker 线程中完成
  - 主线程完全不被阻塞，UI 保持流畅响应

### 🔧 技术改进

- 新增 `getImageDimensionsFromWorker` 方法：在 Worker 中获取图片尺寸
- Worker 支持 `getDimensions` action：可以单独获取尺寸而不进行完整压缩
- 优化 Worker 消息处理：避免与压缩任务冲突

### 📝 文档

- 新增 `WORKER_DECODING_FIX.md`：详细说明修复方案

## 1.2.1-1 (Nov 12, 2024)

### 🐛 Bug Fixes (P0/P1 缺陷修复)

#### 内存泄漏修复
- **P0-1**: 修复全局 WorkerManager 单例永不释放导致的内存泄漏
  - 添加引用计数机制，自动管理 Worker 生命周期
  - 新增 `Compressor.cleanup()` 静态方法用于手动清理
- **P0-2**: 修复 Image 事件监听器未完全清理
  - 在 `abort()` 中清理所有事件监听器（onload, onabort, onerror）
  - 新增 `cleanup()` 实例方法统一处理资源清理
- **P1-2**: 修复 Blob URL 清理不完整
  - 在所有代码路径（done、fail、abort）中统一清理 Blob URL

#### Worker 相关修复
- **P1-3**: 修复 pendingTasks Map 可能累积未完成的任务
  - 为每个任务添加 30 秒超时机制，防止内存泄漏
- **P2-2**: 完善 Worker 错误处理
  - 错误时清理所有 pending tasks
  - 改进错误信息，区分初始化错误和运行时错误

### ✨ 新增功能

- 新增 `cleanup()` 实例方法：统一清理 Compressor 实例的资源
- 新增 `Compressor.cleanup()` 静态方法：清理全局 WorkerManager 实例
- 自动引用计数机制：当所有 Compressor 实例销毁时自动清理 Worker

### 📝 改进

- 改进资源管理：统一的资源清理机制，防止内存泄漏
- 改进错误处理：更详细的错误信息和更完善的错误恢复机制
- 代码质量：修复所有关键 lint 错误，提升代码质量

### 📚 文档

- 新增 `PERFORMANCE_AUDIT_REPORT.md`：完整的性能审计报告
- 新增 `FIXES_APPLIED.md`：详细的修复说明文档
- 新增性能测试套件：Jest + Puppeteer 测试用例

## 1.2.1-0 (Previous version with Worker support)

- 初始 Worker 支持版本

## 1.2.1 (Feb 28, 2023)

- Fix incompatible syntax in the bundled files (#170).

## 1.2.0 (Feb 25, 2023)

- Add a new option: `retainExif` (#159).

## 1.1.1 (Oct 5, 2021)

- Fix loading error in Node.js (#137).

## 1.1.0 (Oct 1, 2021)

- Add 2 new options: `convertTypes` (#123) and `resize` (#130).
- Ignore the `strict` option when the `maxWidth/Height` option is set and its value is less than the natural width/height of the image (#134).
.

## 1.0.7 (Nov 28, 2020)

- Update the built-in dependencies for better adaptability.

## 1.0.6 (Nov 23, 2019)

- Fix the `The operation is insecure` error (#57).

## 1.0.5 (Jan 23, 2019)

- Fix the wrong generated URL when the given image's orientation is 1 (#64).

## 1.0.4 (Jan 19, 2019)

- Regenerate the initial URL only when the orientation was reset for better performance (#63).

## 1.0.3 (Dec 18, 2018)

- Convert `TypedArray` to `Array` manually instead of using Babel helpers for better browser compatibility (#60).

## 1.0.2 (Dec 10, 2018)

- Upgrade `is-blob` to v2.
- Move `examples` folder to `docs` folder.

## 1.0.1 (Oct 24, 2018)

- Simplify the state of canvas for the `beforeDraw` option.
- Ignore range error when the image does not have correct Exif information.

## 1.0.0 (Oct 15, 2018)

- Supports 15 options: `beforeDraw`, `checkOrientation`, `convertSize`, `drew`, `error`, `height`, `maxHeight`, `maxWidth`, `mimeType`, `minHeight`, `minWidth`, `quality`, `strict`, `success` and `width`.
- Support 1 method: `abort`.
- Support to compress images of `File` or `Blob` object.
- Supports to translate Exif Orientation information.
