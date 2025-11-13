# 编辑器配置说明

## 问题描述

执行 `npm run lint -- src/index.js` 后，ESLint 会自动修复代码格式（例如将双引号改为单引号），但手动保存文件后，代码又变回双引号了。

## 原因

这是因为编辑器的自动格式化配置与 ESLint 的配置不一致：
- **ESLint** 使用 `airbnb-base` 配置，要求使用**单引号**
- **编辑器**（如 VS Code）默认可能使用**双引号**进行格式化
- 保存文件时，编辑器会运行自己的格式化工具，覆盖了 ESLint 的修复

## 解决方案

### 方案 1：使用 VS Code（推荐）

项目已包含 `.vscode/settings.json` 配置文件，确保：

1. **安装 ESLint 扩展**：
   - 打开 VS Code
   - 按 `Cmd+Shift+X`（Mac）或 `Ctrl+Shift+X`（Windows/Linux）打开扩展面板
   - 搜索并安装 "ESLint"（作者：Microsoft）

2. **配置已自动应用**：
   - 编辑器会在保存时自动运行 ESLint 修复
   - 使用 ESLint 作为格式化工具，而不是默认的格式化工具
   - 确保使用单引号（与 `airbnb-base` 配置一致）

3. **验证配置**：
   - 打开任意 `.js` 文件
   - 输入双引号字符串，例如：`const str = "test";`
   - 保存文件（`Cmd+S` 或 `Ctrl+S`）
   - 应该自动变为：`const str = 'test';`

### 方案 2：其他编辑器

如果你使用其他编辑器（如 WebStorm、Sublime Text 等），需要：

1. **禁用编辑器的自动格式化**，或
2. **配置编辑器使用 ESLint 进行格式化**，或
3. **手动配置编辑器使用单引号**

#### WebStorm/IntelliJ IDEA
- Settings → Editor → Code Style → JavaScript
- 设置 "Quotes" 为 "Single"

#### Sublime Text
- 安装 "SublimeLinter-eslint" 插件
- 配置使用 ESLint 进行格式化

### 方案 3：禁用保存时自动格式化

如果不想在保存时自动格式化，可以：

1. **VS Code**：在 `.vscode/settings.json` 中设置：
   ```json
   {
     "editor.formatOnSave": false
   }
   ```

2. **手动运行 ESLint 修复**：
   ```bash
   npm run lint:js
   ```

## 当前配置

项目的 ESLint 配置（`.eslintrc`）：
- 使用 `airbnb-base` 规则集
- 要求使用单引号
- 缩进为 2 个空格
- 行尾使用 LF

## 验证

运行以下命令验证配置是否正确：

```bash
# 运行 ESLint 检查
npm run lint:js

# 如果看到引号相关的错误，说明配置正确
```

## 注意事项

- 确保 `.vscode/settings.json` 文件已提交到 Git（如果团队使用 VS Code）
- 如果团队成员使用不同编辑器，建议在 README 中说明配置要求
- 可以考虑添加 `.prettierrc` 配置文件统一格式化规则（如果项目需要）

