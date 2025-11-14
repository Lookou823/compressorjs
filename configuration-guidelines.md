# 配置规范

本文档定义了 compressorjs-worker-version 项目的配置文件使用规范。

## 1. 项目配置文件

### 1.1 package.json

**用途**: 项目元数据和依赖管理

**关键配置**:
```json
{
  "name": "@liuyongdi/compressorjs",
  "version": "1.2.6",
  "main": "dist/compressor.common.js",
  "module": "dist/compressor.esm.js",
  "browser": "dist/compressor.js",
  "files": ["src", "dist", "types"]
}
```

**脚本配置**:
- `build`: 生产环境构建
- `dev`: 开发环境构建（watch 模式）
- `lint`: 代码检查
- `test`: 运行测试

### 1.2 rollup.config.js

**用途**: Rollup 构建配置

**关键配置**:
- **输入**: `src/index.js`
- **输出**: UMD、CommonJS、ES Module 三种格式
- **插件**: Babel、CommonJS、Node Resolve、Replace、Terser
- **Tree-shaking**: 启用最小化预设

**环境变量处理**:
```javascript
replace({
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
})
```

### 1.3 babel.config.js

**用途**: Babel 转译配置

**关键配置**:
- **Preset**: `@babel/preset-env`
- **目标浏览器**: `> 1%`, `last 2 versions`, `not dead`
- **模块**: 禁用转换（由 Rollup 处理）

### 1.4 .eslintrc

**用途**: ESLint 代码检查配置

**关键配置**:
- **扩展**: `airbnb-base`
- **环境**: `browser: true`
- **自定义规则**:
  - `no-param-reassign: off`
  - `valid-jsdoc: error`

## 2. 运行时配置

### 2.1 默认配置 (src/defaults.js)

**用途**: Compressor 类的默认选项

**配置项**:
```javascript
export default {
  strict: true,
  checkOrientation: true,
  retainExif: false,
  maxWidth: Infinity,
  maxHeight: Infinity,
  minWidth: 0,
  minHeight: 0,
  width: undefined,
  height: undefined,
  resize: 'none',
  quality: 0.8,
  mimeType: 'auto',
  convertTypes: ['image/png'],
  convertSize: 5000000,
  useWorker: undefined,  // 自动检测
  workerPath: undefined,
  beforeDraw: null,
  drew: null,
  success: null,
  error: null,
};
```

**修改默认值**:
```javascript
Compressor.setDefaults({
  quality: 0.9,
  maxWidth: 1920,
});
```

### 2.2 环境变量

**NODE_ENV**:
- `production`: 生产环境（启用压缩、移除 console）
- `development`: 开发环境（保留调试信息）
- `test`: 测试环境（启用覆盖率）

**使用方式**:
```javascript
if (process.env.NODE_ENV !== 'production') {
  console.warn('Worker data preparation failed');
}
```

## 3. 构建配置

### 3.1 Rollup 插件配置

**@rollup/plugin-babel**:
```javascript
babel({
  babelHelpers: 'bundled',
  exclude: 'node_modules/**',
})
```

**@rollup/plugin-replace**:
```javascript
replace({
  delimiters: ['', ''],
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
})
```

**@rollup/plugin-terser**:
```javascript
terser({
  compress: {
    drop_console: true,
    drop_debugger: true,
    passes: 2,
  },
  mangle: {
    properties: false, // 保留属性名
  },
})
```

### 3.2 输出配置

**UMD 格式** (浏览器直接使用):
```javascript
{
  format: 'umd',
  name: 'Compressor',
  file: 'dist/compressor.js',
}
```

**CommonJS 格式** (Node.js):
```javascript
{
  format: 'cjs',
  file: 'dist/compressor.common.js',
  exports: 'auto',
}
```

**ES Module 格式** (现代打包工具):
```javascript
{
  format: 'esm',
  file: 'dist/compressor.esm.js',
}
```

## 4. 测试配置

### 4.1 Karma 配置 (test/karma.conf.js)

**浏览器配置**:
- 优先使用 Puppeteer 的 Chromium
- 降级到系统 Chrome
- 支持 macOS 和 Linux

**覆盖率配置**:
```javascript
coverageIstanbulReporter: {
  reports: ['html', 'lcovonly', 'text-summary'],
  fixWebpackSourcePaths: true,
}
```

### 4.2 Jest 配置 (test/specs/performance/jest.config.js)

**用途**: 性能测试配置

**配置项**:
- Puppeteer 浏览器配置
- 超时设置
- 测试环境配置

## 5. Git 配置

### 5.1 .gitignore

**忽略文件**:
- `node_modules/`
- `dist/`
- `coverage/`
- `*.log`

### 5.2 commitlint.config.js

**用途**: Git 提交消息规范

**配置**:
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
```

**提交格式**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

### 5.3 lint-staged.config.js

**用途**: Git 钩子中的代码检查

**配置**:
```javascript
module.exports = {
  '*.js': ['eslint --fix'],
  '*.css': ['stylelint --fix'],
};
```

## 6. 编辑器配置

### 6.1 .vscode/settings.json

**用途**: VS Code 编辑器配置

**关键配置**:
- 使用 ESLint 作为默认格式化工具
- 保存时自动修复 ESLint 错误
- JavaScript/TypeScript 使用单引号

### 6.2 EditorConfig

**用途**: 跨编辑器配置（如需要）

**配置项**:
- 缩进：2 个空格
- 行尾：LF
- 字符集：UTF-8

## 7. Worker 配置

### 7.1 Worker 路径配置

**内联 Worker** (默认):
- 使用 `getInlineWorkerCode()` 生成内联代码
- 无需额外文件

**外部 Worker**:
```javascript
new Compressor(file, {
  workerPath: '/path/to/worker.js',
});
```

### 7.2 Worker 初始化配置

**自动检测** (推荐):
```javascript
new Compressor(file, {
  useWorker: undefined,  // 自动检测浏览器支持
});
```

**强制启用**:
```javascript
new Compressor(file, {
  useWorker: true,  // 不支持时失败
});
```

**禁用 Worker**:
```javascript
new Compressor(file, {
  useWorker: false,  // 始终使用主线程
});
```

## 8. 配置最佳实践

### 8.1 开发环境

- 启用 source map
- 保留 console 日志
- 使用 watch 模式

### 8.2 生产环境

- 禁用 source map（可选）
- 移除 console 日志
- 启用代码压缩
- 优化包体积

### 8.3 测试环境

- 启用覆盖率报告
- 使用 Puppeteer Chromium
- 配置超时时间

## 9. 配置验证

### 9.1 构建验证

```bash
npm run build
# 检查 dist/ 目录下的文件
# 验证文件大小
# 检查 source map
```

### 9.2 测试验证

```bash
npm test
# 检查测试覆盖率
# 验证所有测试通过
```

### 9.3 代码质量验证

```bash
npm run lint
# 检查 ESLint 错误
# 检查 Stylelint 错误
```

