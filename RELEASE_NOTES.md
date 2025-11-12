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

