# 发布说明 - v1.2.1-5

**发布日期**: 2024年11月12日  
**版本**: 1.2.1-5

## 🎯 本次发布重点

### 🔧 代码质量改进

**修复**: 修复了所有格式化错误，确保代码完全符合 ESLint 规范

**改进内容**:
- ✅ 统一使用单引号（符合 ESLint 配置）
- ✅ 修复所有尾随逗号问题
- ✅ 修复操作符位置（`&&` 和 `||` 放在行首）
- ✅ 修复对象解构和赋值的换行问题
- ✅ 代码完全符合项目 ESLint 规范

**影响**: 
- 代码风格统一，更易维护
- 构建通过，无 lint 错误
- 提升代码质量

---

# 发布说明 - v1.2.1-4

**发布日期**: 2024年11月12日  
**版本**: 1.2.1-4

## 🎯 本次发布重点

### 🔒 Worker 严格模式：确保绝不回退主线程

**问题**: 即使设置了 `useWorker: true`，在某些错误情况下（Worker 初始化失败、尺寸获取失败、压缩失败）仍会降级到主线程，导致主线程被阻塞。

**修复**: 
- ✅ 当 `useWorker: true` 时，所有错误情况都不再降级到主线程
- ✅ Worker 初始化失败 → 直接抛出错误，不降级
- ✅ Worker 尺寸获取失败 → 直接抛出错误，不降级
- ✅ Worker 压缩失败 → 直接抛出错误，不降级
- ✅ Worker 数据 URL 缺失 → 直接抛出错误

**行为变化**:

| 场景 | useWorker: true | useWorker: undefined |
|------|----------------|---------------------|
| Worker 初始化失败 | ❌ 抛出错误，不降级 | ✅ 降级到主线程 |
| Worker 尺寸获取失败 | ❌ 抛出错误，不降级 | ✅ 降级到主线程 |
| Worker 压缩失败 | ❌ 抛出错误，不降级 | ✅ 降级到主线程 |

**使用建议**:

```javascript
// 严格 Worker 模式（推荐用于性能关键场景）
new Compressor(file, {
  useWorker: true,  // 严格模式：绝不回退主线程
  quality: 0.8,
  success(result) {
    // 压缩完成
  },
  error(err) {
    // 如果 Worker 失败，会调用 error 回调
    console.error('Worker failed:', err);
  }
});
```

**验证方法**: 
1. 使用 Chrome DevTools Performance 面板
2. 设置 `useWorker: true`
3. 主线程（Main）中**不应有** Image decode 任务
4. Worker 线程中**应有** decode 和 canvas 操作

---

# 发布说明 - v1.2.1-3

**发布日期**: 2024年11月12日  
**版本**: 1.2.1-3

## 🎯 本次发布重点

### 🔥 关键修复：内联 Worker 代码缺少 getDimensions 处理

**问题**: 内联 Worker 代码（默认使用的 Worker）缺少 `getDimensions` action 处理，导致 Worker 模式下仍在主线程解码。

**根本原因**: 
- 内联 Worker 代码没有包含 `getDimensions` action 的处理逻辑
- 当调用 `getImageDimensionsFromWorker` 时，Worker 收到消息但没有处理
- 导致失败并降级到主线程，在主线程解码图片

**修复**: 
- ✅ 更新内联 Worker 代码，添加 `action` 参数和 `getDimensions` 处理
- ✅ 改进 WorkerManager 消息处理，识别 `dimensions` 响应
- ✅ 增强错误处理，确保 Worker 就绪后再调用

**验证方法**: 
1. 使用 Chrome DevTools Performance 面板
2. 主线程（Main）中**不应有** Image decode 任务
3. Worker 线程中**应有** decode 和 canvas 操作

---

# 发布说明 - v1.2.1-2

**发布日期**: 2024年11月12日  
**版本**: 1.2.1-2

## 🎯 本次发布重点

### 修复 Worker 模式下主线程解码问题

**问题**: 即使设置了 `useWorker: true`，图片解码过程仍然在主线程运行，导致 UI 阻塞。

**修复**: 
- 图片尺寸获取现在在 Worker 线程中完成
- 图片压缩完全在 Worker 线程中执行
- 主线程完全不被阻塞，UI 保持流畅响应

**验证方法**: 使用 Chrome DevTools Performance 面板，主线程中不应有 Image decode 任务。

---

# 发布说明 - v1.2.1-1

**发布日期**: 2024年11月12日  
**版本**: 1.2.1-1

## 📦 构建产物

本次发布包含以下构建文件：

```
dist/
├── compressor.js          (66K)  - UMD 格式，浏览器使用
├── compressor.min.js      (25K)  - UMD 格式，压缩版本
├── compressor.common.js   (62K)  - CommonJS 格式
└── compressor.esm.js      (62K)  - ES Module 格式
```

## 🎯 本次发布重点

### 内存泄漏修复（P0 级别）

本次发布修复了所有 P0 和 P1 级别的内存泄漏问题：

1. **全局 WorkerManager 单例永不释放** ✅
   - 添加引用计数机制
   - 自动清理 Worker 资源
   - 新增 `Compressor.cleanup()` 静态方法

2. **Image 事件监听器未完全清理** ✅
   - 完善事件监听器清理
   - 新增 `cleanup()` 实例方法

3. **Blob URL 清理不完整** ✅
   - 统一资源清理机制
   - 所有代码路径都会清理

### Worker 稳定性提升

1. **pendingTasks 超时机制** ✅
   - 30 秒超时，防止任务累积
   
2. **Worker 错误处理** ✅
   - 完善的错误恢复机制
   - 自动清理 pending tasks

## 🆕 新增 API

### 实例方法

```javascript
const compressor = new Compressor(file, options);

// 手动清理资源（通常不需要，会自动清理）
compressor.cleanup();
```

### 静态方法

```javascript
// 清理全局 WorkerManager 实例
// 在应用退出或不再需要压缩功能时调用
Compressor.cleanup();
```

## 📊 性能改进

- **内存使用**: 修复内存泄漏，长期运行不再累积内存
- **资源管理**: 自动清理机制，无需手动管理
- **错误恢复**: 更完善的错误处理，提高稳定性

## 🔧 使用建议

### 正常使用

```javascript
import Compressor from '@liuyongdi/compressorjs';

// 正常使用，无需手动清理
new Compressor(file, {
  useWorker: true,
  quality: 0.8,
  success(result) {
    // 处理结果
  }
});
```

### 长期运行的应用

如果应用长期运行且频繁使用压缩功能，建议在适当时机调用清理方法：

```javascript
// 在应用退出或不再需要压缩功能时
Compressor.cleanup();
```

## 📝 变更详情

### 修复的缺陷

- ✅ P0-1: 全局 WorkerManager 单例永不释放
- ✅ P0-2: Image 事件监听器未完全清理
- ✅ P1-2: Blob URL 清理不完整
- ✅ P1-3: pendingTasks Map 可能累积未完成的任务
- ✅ P2-2: Worker 错误处理不完善

### 新增功能

- ✅ `cleanup()` 实例方法
- ✅ `Compressor.cleanup()` 静态方法
- ✅ 自动引用计数机制

### 文档

- ✅ `PERFORMANCE_AUDIT_REPORT.md` - 完整性能审计报告
- ✅ `FIXES_APPLIED.md` - 详细修复说明
- ✅ `test/specs/performance/` - 性能测试套件

## 🔄 升级指南

从 v1.2.1-0 升级到 v1.2.1-1：

1. **无需代码变更**: API 完全向后兼容
2. **自动清理**: 资源会自动清理，无需手动操作
3. **可选清理**: 如需手动清理，可使用新增的 `cleanup()` 方法

## ⚠️ 注意事项

1. **超时时间**: Worker 任务超时时间为 30 秒，可根据需求调整
2. **引用计数**: 确保 Compressor 实例正确销毁，否则引用计数不会减少
3. **浏览器兼容**: 保持对 Chrome ≥ 96、Node ≥ 16 的支持

## 📚 相关文档

- [性能审计报告](./PERFORMANCE_AUDIT_REPORT.md)
- [修复说明](./FIXES_APPLIED.md)
- [审计总结](./AUDIT_SUMMARY.md)
- [Worker 使用指南](./WORKER_USAGE.md)

## 🐛 问题反馈

如发现问题，请提交 Issue：
- GitHub: https://github.com/Lookou823/compressorjs/issues

---

**发布状态**: ✅ 已构建并测试  
**构建时间**: 2024-11-12  
**构建工具**: Rollup + UglifyJS

