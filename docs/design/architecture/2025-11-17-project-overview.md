# 项目概览

## 项目基本信息

- **项目名称**: @liuyongdi/compressorjs
- **项目类型**: JavaScript 图片压缩库
- **版本**: 1.2.6
- **构建工具**: Rollup
- **主要技术栈**: 
  - JavaScript (ES6+)
  - Web Worker
  - OffscreenCanvas
  - Canvas API

## 项目定位

compressorjs-worker-version 是一个基于 compressorjs 的增强版本，专注于通过 Web Worker 优化图片压缩性能，避免主线程阻塞。

## 核心功能

1. **图片压缩**: 支持 JPEG、PNG、WebP 等格式的图片压缩
2. **Worker 模式**: 在后台线程中执行图片解码和压缩，避免主线程阻塞
3. **尺寸调整**: 支持最大/最小尺寸限制、宽高比调整
4. **EXIF 处理**: 支持读取和保留图片 EXIF 信息
5. **方向校正**: 自动处理图片方向信息

## 项目结构

```
compressorjs-worker-version/
├── src/                    # 源代码目录
│   ├── index.js            # 主入口文件，包含 Compressor 类和 WorkerManager
│   ├── defaults.js          # 默认配置选项
│   ├── utilities.js         # 工具函数集合
│   ├── constants.js         # 常量定义
│   └── worker/              # Worker 实现
│       └── image-compress.worker.js  # Worker 脚本
├── test/                    # 测试文件
│   ├── specs/              # 测试用例
│   │   ├── Compressor.spec.js
│   │   ├── options/       # 选项测试
│   │   ├── methods/       # 方法测试
│   │   └── performance/   # 性能测试
│   ├── karma.conf.js      # Karma 测试配置
│   └── helpers.js         # 测试辅助函数
├── dist/                   # 构建输出目录
├── docs/                   # 文档和示例
├── types/                  # TypeScript 类型定义
└── rollup.config.js        # Rollup 构建配置
```

## 技术架构

### 核心类

1. **Compressor**: 主压缩类
   - 负责图片加载、解码、压缩流程
   - 支持 Worker 模式和主线程模式
   - 处理配置选项和回调

2. **WorkerManager**: Worker 管理器
   - 管理 Worker 生命周期
   - 处理 Worker 消息通信
   - 管理任务队列和超时

### 工作流程

1. **初始化阶段**:
   - 检查浏览器支持（OffscreenCanvas、Worker）
   - 根据配置决定是否使用 Worker
   - 初始化 Worker（如需要）

2. **图片加载阶段**:
   - Worker 模式：将原始数据（File/Blob/ArrayBuffer）发送到 Worker
   - 主线程模式：使用 Image 对象加载图片

3. **图片处理阶段**:
   - Worker 模式：在 Worker 线程中解码图片、执行 Canvas 操作、压缩
   - 主线程模式：在主线程中执行所有操作

4. **结果返回阶段**:
   - 调用 success 回调返回压缩结果
   - 或调用 error 回调处理错误

## 关键特性

### Worker 模式优势

- **主线程不阻塞**: 图片解码和压缩在后台线程执行
- **性能优化**: 使用可转移对象减少数据传输开销
- **自动降级**: 浏览器不支持时自动降级到主线程模式

### 浏览器兼容性

- **现代浏览器**: Chrome 50+, Firefox 42+, Safari 15+
- **Worker 支持**: 需要支持 OffscreenCanvas 和 Worker
- **降级方案**: 不支持 Worker 时自动使用主线程模式

## 依赖关系

### 核心依赖
- `blueimp-canvas-to-blob`: Canvas 转 Blob 工具
- `is-blob`: Blob 类型检查工具

### 开发依赖
- `rollup`: 模块打包工具
- `babel`: JavaScript 转译工具
- `eslint`: 代码检查工具
- `karma`: 测试运行器
- `mocha`: 测试框架
- `chai`: 断言库

## 构建输出

- `dist/compressor.js`: UMD 格式，浏览器直接使用
- `dist/compressor.common.js`: CommonJS 格式
- `dist/compressor.esm.js`: ES Module 格式
- `docs/js/compressor.js`: 文档版本

## 使用场景

1. **图片上传前压缩**: 减少上传文件大小
2. **图片预览优化**: 生成缩略图
3. **批量图片处理**: 使用 Worker 模式处理多张图片
4. **移动端优化**: 减少主线程阻塞，提升用户体验

## 性能指标

- **主线程阻塞**: Worker 模式下主线程不阻塞
- **内存管理**: 自动清理 Blob URL，防止内存泄漏
- **任务超时**: Worker 任务 30 秒超时机制
- **数据传输**: 使用可转移对象优化性能
