# 库使用规范

本文档定义了 compressorjs-worker-version 项目中第三方库的使用规范。

## 1. 核心依赖库

### 1.1 blueimp-canvas-to-blob

**用途**: Canvas 转 Blob 工具（兼容旧浏览器）

**使用位置**: `src/index.js`

**使用方式**:
```javascript
import toBlob from 'blueimp-canvas-to-blob';

// 在旧浏览器中使用
if (!canvas.toBlob) {
  callback(toBlob(canvas.toDataURL(options.mimeType, options.quality)));
}
```

**注意事项**:
- 仅在 `canvas.toBlob` 不支持时使用
- 现代浏览器优先使用原生 API

### 1.2 is-blob

**用途**: Blob 类型检查

**使用位置**: `src/index.js`

**使用方式**:
```javascript
import isBlob from 'is-blob';

if (!isBlob(file)) {
  this.fail(new Error('The first argument must be a File or Blob object.'));
}
```

**注意事项**:
- 用于验证输入参数
- 确保类型安全

## 2. 构建工具库

### 2.1 Rollup

**用途**: 模块打包工具

**配置文件**: `rollup.config.js`

**使用规范**:
- 输出多种格式：UMD、CommonJS、ES Module
- 启用 tree-shaking 优化
- 生产环境使用 Terser 压缩

**关键配置**:
```javascript
module.exports = {
  input: 'src/index.js',
  treeshake: {
    preset: 'smallest',
  },
  output: [
    { format: 'umd', file: 'dist/compressor.js' },
    { format: 'cjs', file: 'dist/compressor.common.js' },
    { format: 'esm', file: 'dist/compressor.esm.js' },
  ],
};
```

### 2.2 Babel

**用途**: JavaScript 转译工具

**配置文件**: `babel.config.js`

**使用规范**:
- 使用 `@babel/preset-env` 进行转译
- 目标浏览器：`> 1%`, `last 2 versions`, `not dead`
- 禁用模块转换（由 Rollup 处理）

**关键配置**:
```javascript
module.exports = {
  presets: [
    ['@babel/preset-env', {
      modules: false,
      targets: {
        browsers: ['> 1%', 'last 2 versions', 'not dead'],
      },
    }],
  ],
};
```

### 2.3 Terser

**用途**: JavaScript 压缩工具

**使用方式**: 通过 `@rollup/plugin-terser`

**压缩配置**:
```javascript
terser({
  compress: {
    drop_console: true,
    drop_debugger: true,
    passes: 2,
  },
  format: {
    comments: /^!/, // 仅保留以 ! 开头的注释
  },
  mangle: {
    properties: false, // 保留属性名，避免破坏 API
  },
})
```

## 3. 代码质量工具

### 3.1 ESLint

**用途**: JavaScript 代码检查

**配置文件**: `.eslintrc`

**使用规范**:
- 使用 `airbnb-base` 规则集
- 自定义规则：
  - `no-param-reassign: off`（允许参数重新赋值）
  - `valid-jsdoc`（要求有效的 JSDoc 注释）

**运行方式**:
```bash
npm run lint:js
```

### 3.2 Stylelint

**用途**: CSS 代码检查

**使用规范**:
- 检查文档 CSS 文件
- 使用 `stylelint-config-standard` 规则

**运行方式**:
```bash
npm run lint:css
```

## 4. 测试工具库

### 4.1 Karma

**用途**: 测试运行器

**配置文件**: `test/karma.conf.js`

**使用规范**:
- 使用 Puppeteer 的 Chromium（优先）
- 降级到系统 Chrome（如需要）
- 配置覆盖率报告

### 4.2 Mocha + Chai

**用途**: 测试框架和断言库

**使用方式**:
```javascript
describe('Compressor', () => {
  it('should be a class', () => {
    expect(Compressor).to.be.a('function');
  });
});
```

## 5. 库使用原则

### 5.1 依赖选择

**原则**:
- 优先使用原生 API
- 仅在必要时使用第三方库
- 选择轻量级、维护良好的库

**示例**:
- 优先使用 `canvas.toBlob()`（原生）
- 降级使用 `blueimp-canvas-to-blob`（兼容）

### 5.2 版本管理

**原则**:
- 使用精确版本或范围版本
- 定期更新依赖
- 测试新版本兼容性

**示例**:
```json
{
  "dependencies": {
    "blueimp-canvas-to-blob": "^3.29.0",
    "is-blob": "^2.1.0"
  }
}
```

### 5.3 按需导入

**原则**:
- 使用 ES6 import 语法
- 只导入需要的功能
- 利用 tree-shaking 优化

**示例**:
```javascript
import toBlob from 'blueimp-canvas-to-blob';
import isBlob from 'is-blob';
```

## 6. 浏览器 API 使用

### 6.1 Canvas API

**使用位置**: 主线程和 Worker 线程

**主线程**:
```javascript
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
context.drawImage(image, ...params);
canvas.toBlob(callback, mimeType, quality);
```

**Worker 线程**:
```javascript
const canvas = new OffscreenCanvas(width, height);
const context = canvas.getContext('2d');
context.drawImage(imageBitmap, ...params);
const blob = await canvas.convertToBlob({ type: mimeType, quality });
```

### 6.2 Web Worker API

**使用方式**:
```javascript
const blob = new Blob([workerCode], { type: 'application/javascript' });
const workerURL = URL.createObjectURL(blob);
const worker = new Worker(workerURL);
worker.postMessage(data, transferList);
```

### 6.3 FileReader API

**使用方式**:
```javascript
const reader = new FileReader();
reader.onload = ({ target }) => {
  const { result } = target;
  // 处理结果
};
reader.readAsArrayBuffer(file);
```

## 7. 避免使用的库

### 7.1 不推荐

- **jQuery**: 不需要，使用原生 API
- **Lodash**: 不需要，使用原生方法或简单工具函数
- **Moment.js**: 不需要，本项目不涉及日期处理

### 7.2 原因

- 增加包体积
- 现代浏览器已支持原生 API
- 保持库的轻量级特性

## 8. 依赖更新策略

### 8.1 更新频率

- **安全更新**: 立即更新
- **功能更新**: 测试后更新
- **重大更新**: 谨慎评估后更新

### 8.2 更新检查

```bash
npm outdated
npm audit
```

### 8.3 更新测试

- 运行完整测试套件
- 检查构建产物大小
- 验证浏览器兼容性

## 9. 最佳实践

### 9.1 依赖管理

- 保持依赖数量最少
- 定期清理未使用的依赖
- 使用 `npm audit` 检查安全问题

### 9.2 性能考虑

- 使用 tree-shaking 减少包体积
- 避免引入大型依赖
- 优先使用原生 API

### 9.3 兼容性

- 提供降级方案
- 使用特性检测
- 测试多浏览器兼容性

