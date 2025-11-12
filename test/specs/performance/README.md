# 性能审计测试

本目录包含使用 Jest + Puppeteer 的性能审计测试。

## 测试目标

1. **解码不在主线程**: 验证 performance entry 中主线程无 decode 任务
2. **无内存增长 > 10%**: 1000 次压缩后内存增长 < 10%
3. **Worker 线程存活**: Worker 线程存在且 postMessage 往返 < 50 ms

## 运行测试

### 前置条件

1. 安装依赖：
   ```bash
   npm install --save-dev jest puppeteer
   ```

2. 构建项目：
   ```bash
   npm run build
   ```

3. 确保测试图片存在：
   - `docs/images/picture.jpg`

### 运行所有性能测试

```bash
# 使用 Jest
npx jest test/specs/performance/

# 或使用 npm script（需要在 package.json 中添加）
npm run test:performance
```

### 运行单个测试

```bash
npx jest test/specs/performance/worker-performance.spec.js
```

## 测试说明

### 1. 解码线程验证

- **测试**: `解码不在主线程`
  - 使用 Performance Observer 监听主线程任务
  - 验证 Worker 模式下无 decode 相关任务在主线程

- **测试**: `Worker 线程应成功启动`
  - 验证 Worker 成功初始化
  - 测量消息往返时间

### 2. 内存泄漏验证

- **测试**: `1000 次压缩后内存增长应 < 10%`
  - 执行 1000 次压缩操作
  - 对比初始和最终内存使用
  - 验证内存增长 < 10%

- **测试**: `Worker 实例应正确清理`
  - 验证是否有清理机制
  - 检查 Worker 实例是否正确释放

### 3. Worker 性能验证

- **测试**: `Worker postMessage 往返时间应 < 50ms`
  - 测量多次压缩的消息往返时间
  - 验证平均时间在合理范围内

## 注意事项

1. **内存测试**: 需要 Chrome 启动时添加 `--js-flags="--expose-gc"` 以启用 `window.gc()`
2. **性能测试**: 实际时间取决于图片大小和 CPU 性能
3. **浏览器兼容性**: 测试针对 Chrome ≥ 96

## 故障排除

### 测试失败：dist/compressor.js 不存在

```bash
npm run build
```

### 测试失败：测试图片不存在

确保 `docs/images/picture.jpg` 存在，或修改测试代码使用其他图片。

### 内存测试不准确

在 `puppeteer.launch()` 中添加：
```javascript
args: ['--js-flags="--expose-gc"']
```

然后在测试中使用 `window.gc()` 强制垃圾回收。

