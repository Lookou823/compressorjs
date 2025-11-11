# NPM 包发布完整指南

本文档提供将 Fork 版本发布为 npm 包的完整操作步骤和合规要求。

## 📋 前置检查清单

在发布前，请确认以下内容已完成：

- [x] ✅ `package.json` 的 `name` 字段已修改为 `@lookou823/compressorjs`（避免与原包冲突）
- [x] ✅ `package.json` 的 `version` 字段已更新为 `1.2.1-0`（遵循语义化版本）
- [x] ✅ `package.json` 的 `description` 字段已明确标注为基于原项目的增强版本
- [x] ✅ `package.json` 的 `author` 字段已更新为你的信息
- [x] ✅ `package.json` 的 `repository` 字段已指向你的 Fork 仓库
- [x] ✅ `LICENSE` 文件已保留原作者版权信息并添加了你的版权声明
- [x] ✅ `README.md` 已添加原项目来源说明和修改说明

## 🚀 发布步骤

### 第一步：确保使用 npm 官方源

```bash
# 检查当前 npm 源
npm config get registry

# 如果不是官方源，切换到官方源
npm config set registry https://registry.npmjs.org/

# 或者使用 nrm 管理多个源
npm install -g nrm
nrm use npm
```

### 第二步：登录 npm 账号

```bash
# 登录 npm（如果还没有账号，请先到 https://www.npmjs.com 注册）
npm login

# 输入你的 npm 用户名、密码和邮箱
# 如果启用了双因素认证（2FA），还需要输入 OTP 验证码
```

**重要提示**：
- 如果使用 scope 包名（如 `@lookou823/compressorjs`），确保你的 npm 账号名与 scope 名称匹配（`lookou823`）
- 首次发布 scope 包时，需要确保该 scope 属于你的账号

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
npm view @lookou823/compressorjs

# 或者访问 npm 网站查看
# https://www.npmjs.com/package/@lookou823/compressorjs
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

**错误信息**：`You do not have permission to publish "@lookou823/compressorjs"`

**解决方案**：
- 确认 npm 登录的账号名与 scope 名称匹配
- 检查是否使用了正确的 npm 账号登录

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
npm unpublish @lookou823/compressorjs@1.2.1-0

# 或者标记为废弃
npm deprecate @lookou823/compressorjs@1.2.1-0 "This version has a critical bug"
```

## 📝 合规检查清单

发布前请再次确认：

- [ ] ✅ 包名不会与原包冲突（已使用 scope：`@lookou823/compressorjs`）
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
- npm 包页面: https://www.npmjs.com/package/@lookou823/compressorjs

---

**最后更新**：2024年

