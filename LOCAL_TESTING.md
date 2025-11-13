# 本地测试指南

## 快速开始

### 方法 1: 使用测试页面（推荐）

1. **构建项目**:
   ```bash
   npm run build
   ```

2. **启动本地服务器**:
   ```bash
   # 使用 Python (如果已安装)
   python3 -m http.server 8000
   
   # 或使用 Node.js http-server
   npx http-server -p 8000
   
   # 或使用 VS Code Live Server 插件
   ```

3. **打开浏览器访问**:
   ```
   http://localhost:8000/test-local.html
   ```

4. **测试步骤**:
   - 选择一张图片
   - 设置 `useWorker` 选项（true/auto/false）
   - 点击"压缩图片"按钮
   - 查看运行日志和结果

### 方法 2: 使用 docs 目录的示例

1. **构建项目**:
   ```bash
   npm run build
   ```

2. **启动本地服务器**:
   ```bash
   python3 -m http.server 8000
   # 或
   npx http-server -p 8000
   ```

3. **打开浏览器访问**:
   ```
   http://localhost:8000/docs/index.html
   ```

4. **注意**: docs/index.html 使用的是原版配置，需要修改 `main.js` 添加 `useWorker: true` 才能启用 Worker。

## 常见问题排查

### 1. Worker 没有启用

**可能原因**:
- 浏览器不支持 OffscreenCanvas
- `useWorker` 选项设置不正确
- Worker 初始化失败但被静默降级

**解决方法**:
1. 检查浏览器版本（需要 Chrome 69+, Firefox 105+, Safari 16.4+, Edge 79+）
2. 在测试页面中设置 `useWorker: true`（强制启用）
3. 查看浏览器控制台的错误信息
4. 使用 Chrome DevTools Performance 面板检查是否有 Worker 线程

### 2. 图片压缩失败

**可能原因**:
- 图片格式不支持
- 文件损坏
- Worker 初始化失败
- 浏览器兼容性问题

**解决方法**:
1. 检查控制台错误信息
2. 尝试设置 `useWorker: false` 使用主线程模式
3. 检查图片文件是否有效
4. 查看测试页面的运行日志

### 3. 调试技巧

**使用 Chrome DevTools**:
1. 打开 DevTools (F12)
2. 切换到 Performance 面板
3. 点击录制按钮
4. 执行压缩操作
5. 停止录制
6. 检查：
   - 主线程（Main）中是否有 Image decode 任务（Worker 模式下应该没有）
   - 是否有 Worker 线程（Worker 模式下应该有）

**使用控制台**:
```javascript
// 检查浏览器支持
console.log('OffscreenCanvas:', typeof OffscreenCanvas !== 'undefined');
console.log('Worker:', typeof Worker !== 'undefined');

// 检查 Compressor 实例
const compressor = new Compressor(file, {
  useWorker: true,
  success: (result) => console.log('Success:', result),
  error: (err) => console.error('Error:', err)
});

// 检查 Worker 状态（延迟检查，因为初始化是异步的）
setTimeout(() => {
  console.log('useWorker:', compressor.useWorker);
  console.log('workerInitialized:', compressor.workerInitialized);
}, 1000);
```

## 测试页面功能

`test-local.html` 提供了以下功能：

1. **配置选项**:
   - `useWorker`: 选择 Worker 模式（true/auto/false）
   - `quality`: 压缩质量
   - `maxWidth/maxHeight`: 最大尺寸
   - `mimeType`: 输出格式
   - `workerPath`: Worker 文件路径（可选）

2. **实时日志**:
   - 显示压缩过程的所有信息
   - 错误信息会高亮显示
   - 成功信息会标记为绿色

3. **图片预览**:
   - 显示原始图片和压缩后图片
   - 显示文件信息（名称、大小、类型）

4. **状态显示**:
   - 显示 Worker 是否启用
   - 显示压缩状态

## 修改 docs/index.html 启用 Worker

如果需要在使用 docs/index.html 时启用 Worker，需要修改 `docs/js/main.js`:

```javascript
options: {
  // ... 其他选项
  useWorker: true,  // 添加这一行
  success: function (result) {
    // ...
  },
  // ...
}
```

