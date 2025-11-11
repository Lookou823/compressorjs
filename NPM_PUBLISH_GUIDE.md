# NPM 包发布完整指南

本文档提供将 Fork 版本发布为 npm 包的完整操作步骤和合规要求。

## 📋 前置检查清单

在发布前，请确认以下内容已完成：

- [x] ✅ `package.json` 的 `name` 字段已修改为 `@liuyongdi/compressorjs`（避免与原包冲突，匹配 npm 账号）
- [x] ✅ `package.json` 的 `version` 字段已更新为 `1.2.1-0`（遵循语义化版本）
- [x] ✅ `package.json` 的 `description` 字段已明确标注为基于原项目的增强版本
- [x] ✅ `package.json` 的 `author` 字段已更新为你的信息
- [x] ✅ `package.json` 的 `repository` 字段已指向你的 Fork 仓库
- [x] ✅ `LICENSE` 文件已保留原作者版权信息并添加了你的版权声明
- [x] ✅ `README.md` 已添加原项目来源说明和修改说明

## 🚀 发布步骤

### 第一步：安装项目依赖

**⚠️ 重要**：在发布前，必须先安装所有依赖。

```bash
# 安装所有依赖（包括 devDependencies）
npm install

# 如果网络较慢，可以使用国内镜像源加速安装
npm install --registry https://registry.npmmirror.com

# 安装完成后，验证关键依赖是否已安装
which del-cli
which husky
```

**注意**：安装依赖时可能会触发 `prepare` 脚本（husky install），这是正常的。

### 第一步（补充）：确保使用 npm 官方源（用于发布）

```bash
# 检查当前 npm 源
npm config get registry

# 发布时必须使用官方源，切换到官方源
npm config set registry https://registry.npmjs.org/

# 或者使用 nrm 管理多个源
npm install -g nrm
nrm use npm  # 发布时使用
nrm use taobao  # 安装依赖时可以使用淘宝镜像加速
```

### 第二步：登录 npm 账号

**⚠️ 重要更新**：npm 在 2024 年更新了认证系统，不再支持传统的用户名/密码登录方式。现在需要使用**访问令牌（Access Token）**进行认证。

#### 方法一：使用访问令牌登录（推荐）

1. **生成访问令牌**：
   - 访问 https://www.npmjs.com/settings/你的用户名/tokens
   - 点击 "Generate New Token" → "Generate New Token (classic)"
   - 选择权限类型：
     - **Automation**：用于 CI/CD（90 天有效期）
     - **Publish**：用于发布包（90 天有效期）
     - **Read-only**：仅读取权限
   - 复制生成的令牌（只显示一次，请妥善保存）

2. **使用令牌登录**：
   ```bash
   # 方式1：使用 npm login 命令（会提示输入令牌）
   npm login --auth-type=legacy
   
   # 方式2：直接配置令牌到 .npmrc 文件
   echo "//registry.npmjs.org/:_authToken=你的访问令牌" > ~/.npmrc
   
   # 方式3：使用环境变量（推荐用于 CI/CD）
   export NPM_TOKEN=你的访问令牌
   echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
   ```

3. **验证登录状态**：
   ```bash
   npm whoami
   # 应该显示你的 npm 用户名
   ```

#### 方法二：使用 npm 网站登录（新方式）

如果 `npm login` 命令报错 `410 Gone`，可以尝试：

```bash
# 使用新的认证流程
npm login --web

# 这会打开浏览器，在网页上完成登录
# 登录成功后，令牌会自动配置到本地
```

**重要提示**：
- 如果使用 scope 包名（如 `@liuyongdi/compressorjs`），确保你的 npm 账号名与 scope 名称匹配（`liuyongdi`）
- 首次发布 scope 包时，需要确保该 scope 属于你的账号
- 访问令牌有有效期限制（通常 90 天），过期后需要重新生成

### 第三步：验证 package.json 配置

```bash
# 检查 package.json 配置是否正确
cat package.json | grep -A 5 '"name"'
cat package.json | grep '"version"'
cat package.json | grep '"repository"'
```

### 第四步：构建项目（如果需要）

```bash
# 运行构建命令，确保 dist 目录包含最新构建文件
npm run release

# 或者分步执行
npm run clean
npm run lint
npm run build
npm run compress
npm test
```

### 第五步：检查发布内容

```bash
# 查看将要发布的文件列表（根据 package.json 中的 files 字段）
npm pack --dry-run

# 这会显示将要打包的文件，确认没有包含敏感信息或不需要的文件
```

### 第六步：发布到 npm

```bash
# 发布包（使用 --access public 因为这是 scope 包）
npm publish --access public

# 如果后续版本更新，只需修改 version 后再次执行
npm publish --access public
```

**注意**：
- 首次发布 scope 包（`@username/package-name`）必须使用 `--access public`
- 后续发布可以省略 `--access public`，但建议保留以确保公开访问

### 第七步：验证发布成功

```bash
# 检查包是否已发布
npm view @liuyongdi/compressorjs

# 或者访问 npm 网站查看
# https://www.npmjs.com/package/@liuyongdi/compressorjs
```

## 🔄 版本更新流程

当需要发布新版本时：

1. **更新版本号**（遵循语义化版本规范）：
   ```bash
   # 方式1：手动编辑 package.json 中的 version 字段
   # 方式2：使用 npm version 命令
   npm version patch   # 1.2.1-0 -> 1.2.1-1 (补丁版本)
   npm version minor   # 1.2.1-0 -> 1.2.2-0 (次要版本)
   npm version major   # 1.2.1-0 -> 2.0.0-0 (主要版本)
   ```

2. **更新 CHANGELOG.md**（记录本次更新的内容）

3. **构建项目**：
   ```bash
   npm run release
   ```

4. **提交并推送代码**：
   ```bash
   git add .
   git commit -m "chore: bump version to x.x.x"
   git push origin main
   ```

5. **发布到 npm**：
   ```bash
   npm publish --access public
   ```

## ⚠️ 常见问题处理

### 问题1：包名已存在

**错误信息**：`You cannot publish over the previously published versions`

**解决方案**：
- 确保 `version` 字段已更新为新版本号
- 检查是否有其他账号已占用该包名

### 问题2：Scope 权限问题

**错误信息**：`You do not have permission to publish "@liuyongdi/compressorjs"` 或 `Scope not found`

**解决方案**：
- 确认 npm 登录的账号名与 scope 名称匹配
- 检查是否使用了正确的 npm 账号登录

### 问题2.1：Scope not found 错误

**错误信息**：`404 Not Found - Scope not found` 或 `'@scope/package@version' is not in this registry`

**原因**：npm 账号名与 package.json 中的 scope 名称不匹配

**解决方案**：
1. **检查当前登录的 npm 账号**：
   ```bash
   npm whoami
   ```

2. **修改 package.json 中的 scope 名称**，使其与 npm 账号名匹配：
   ```json
   {
     "name": "@你的npm账号名/compressorjs"
   }
   ```

3. **重新构建和发布**：
   ```bash
   npm run build
   npm publish --access public
   ```

### 问题2.2：npm login 报错 410 Gone

**错误信息**：`410 Gone - PUT https://registry.npmjs.org/-/user/org.couchdb.user:username - This route is no longer supported`

**原因**：npm 已弃用传统的用户名/密码登录方式

**解决方案**：
1. **使用访问令牌登录**（推荐）：
   ```bash
   # 在 npm 网站生成令牌后
   npm login --auth-type=legacy
   # 输入用户名、密码和令牌
   ```

2. **或使用新的 Web 登录方式**：
   ```bash
   npm login --web
   ```

3. **或直接配置令牌**：
   ```bash
   # 编辑 ~/.npmrc 文件
   echo "//registry.npmjs.org/:_authToken=你的访问令牌" >> ~/.npmrc
   ```

4. **验证登录**：
   ```bash
   npm whoami
   ```

### 问题3：发布失败 - 网络问题

**解决方案**：
```bash
# 使用国内镜像时可能无法发布，切换到官方源
npm config set registry https://registry.npmjs.org/
npm publish --access public
```

### 问题4：需要撤销已发布的版本

**注意**：npm 不允许完全删除已发布的版本（24小时内可以撤销）

```bash
# 撤销最近发布的版本（24小时内）
npm unpublish @liuyongdi/compressorjs@1.2.1-0

# 或者标记为废弃
npm deprecate @liuyongdi/compressorjs@1.2.1-0 "This version has a critical bug"
```

## 📝 合规检查清单

发布前请再次确认：

- [ ] ✅ 包名不会与原包冲突（已使用 scope：`@liuyongdi/compressorjs`，且与 npm 账号名匹配）
- [ ] ✅ LICENSE 文件保留了原作者的完整版权信息
- [ ] ✅ README.md 明确标注了原项目来源和地址
- [ ] ✅ README.md 说明了本版本的修改内容
- [ ] ✅ 没有使用原项目的商标、Logo 或特定名称
- [ ] ✅ 遵循了原项目的 MIT 许可证条款
- [ ] ✅ 代码中保留了原作者的版权注释（如果有）

## 🔗 相关链接

- [npm 官方文档](https://docs.npmjs.com/)
- [语义化版本规范](https://semver.org/)
- [npm scope 包发布指南](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages)
- [原项目仓库](https://github.com/fengyuanchen/compressorjs)
- [Fork 仓库](https://github.com/Lookou823/compressorjs)

## 📞 支持

如有问题，请通过以下方式联系：

- GitHub Issues: https://github.com/Lookou823/compressorjs/issues
- npm 包页面: https://www.npmjs.com/package/@liuyongdi/compressorjs

---

**最后更新**：2024年

