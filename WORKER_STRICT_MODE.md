# Worker 严格模式修复

## 修复目标

确保当 `useWorker: true` 时，图片解析和压缩**一定**在 Worker 中进行，绝不回退到主线程。

## 修复内容

### 1. Worker 初始化失败处理

**修复前**: 初始化失败时降级到主线程

**修复后**: 当 `useWorker: true` 时，初始化失败直接抛出错误，不降级

```javascript
.catch((error) => {
  if (options.useWorker === true) {
    this.fail(new Error(`Worker initialization failed: ${error.message}`));
    return;
  }
  // 只有自动检测模式才降级
  this.useWorker = false;
  this.proceedWithLoad(data);
});
```

### 2. Worker 尺寸获取失败处理

**修复前**: 获取尺寸失败时降级到主线程

**修复后**: 当 `useWorker: true` 时，失败直接抛出错误，不降级

```javascript
catch (error) {
  if (this.options.useWorker === true) {
    this.fail(new Error(`Worker mode failed: ${error.message}`));
    return;
  }
  // 只有自动检测模式才降级
  this.proceedWithLoad(data);
}
```

### 3. Worker 压缩失败处理

**修复前**: 压缩失败时降级到主线程

**修复后**: 当 `useWorker: true` 时，失败直接抛出错误，不降级

```javascript
catch (error) {
  if (this.options.useWorker === true) {
    this.fail(new Error(`Worker compression failed: ${error.message}`));
    return;
  }
  // 只有自动检测模式才降级
  return this.drawOnMainThread(...);
}
```

### 4. Worker 数据 URL 缺失处理

**修复前**: 如果 `workerImageDataURL` 不存在，使用 `image.src`（可能已在主线程解码）

**修复后**: 当 `useWorker: true` 时，直接抛出错误

```javascript
if (!imageDataURL) {
  if (this.options.useWorker === true) {
    throw new Error('Worker image data URL not available');
  }
  // 只有自动检测模式才尝试从 image.src 获取
}
```

## 行为变化

### useWorker: true（严格模式）

- ✅ Worker 初始化失败 → 抛出错误，**不降级**
- ✅ Worker 尺寸获取失败 → 抛出错误，**不降级**
- ✅ Worker 压缩失败 → 抛出错误，**不降级**
- ✅ 确保图片解析和压缩**一定**在 Worker 中

### useWorker: undefined（自动检测模式）

- ✅ Worker 初始化失败 → 降级到主线程
- ✅ Worker 尺寸获取失败 → 降级到主线程
- ✅ Worker 压缩失败 → 降级到主线程
- ✅ 保持向后兼容性

### useWorker: false（主线程模式）

- ✅ 直接使用主线程，不尝试 Worker

## 使用建议

### 严格 Worker 模式（推荐用于性能关键场景）

```javascript
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

### 自动检测模式（推荐用于兼容性场景）

```javascript
new Compressor(file, {
  // useWorker 未指定，自动检测
  quality: 0.8,
  success(result) {
    // 压缩完成（可能在 Worker 或主线程）
  }
});
```

## 验证方法

使用 Chrome DevTools Performance 面板：

1. 设置 `useWorker: true`
2. 开始录制
3. 执行压缩
4. 检查主线程（Main）：
   - **不应有** Image decode 任务
   - **不应有** Canvas 操作
5. 检查 Worker 线程：
   - **应有** Image decode 任务
   - **应有** OffscreenCanvas 操作

## 错误处理

当 `useWorker: true` 且 Worker 失败时，会调用 `error` 回调：

```javascript
new Compressor(file, {
  useWorker: true,
  error(err) {
    // err.message 包含详细错误信息
    // 例如: "Worker initialization failed: ..."
    // 或: "Worker mode failed: ..."
  }
});
```

