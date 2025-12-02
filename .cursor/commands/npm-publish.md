# NPM 发布流程

这是一个完整的 npm 包发布流程，确保能够正确发布版本。

## 前置检查

在执行发布前，请确保：

1. **已登录 npm**
   ```bash
   npm whoami
   ```
   如果未登录，执行：
   ```bash
   npm login
   ```

2. **检查 npm 源配置**
   ```bash
   npm config get registry
   ```
   如果是私有包，确保配置了正确的私有 npm registry：
   ```bash
   npm config set registry https://your-private-registry.com
   ```

3. **确保工作目录干净**
   ```bash
   git status
   ```
   建议先提交所有更改，或者使用 stash 暂存

## 发布步骤

### 方式一：使用 npm version（推荐）

```bash
# 1. 确保代码已提交
git add .
git commit -m "chore: prepare for release"

# 2. 更新版本号（选择其一）
# 补丁版本：1.0.0 -> 1.0.1
npm version patch

# 次版本：1.0.0 -> 1.1.0
npm version minor

# 主版本：1.0.0 -> 2.0.0
npm version major

# 或者指定版本号
npm version 1.2.3

# 3. 构建项目（如果需要）
pnpm run build:prod

# 4. 发布到 npm
npm publish

# 5. 推送代码和标签到远程仓库
git push origin HEAD --tags
```

### 方式二：手动发布流程

```bash
# 1. 检查当前版本
cat package.json | grep '"version"'

# 2. 手动修改 package.json 中的 version 字段
# 例如：从 "0.0.0" 改为 "1.0.0"

# 3. 运行测试（如果有）
# pnpm test

# 4. 构建项目
pnpm run build:prod

# 5. 提交版本变更
git add package.json
git commit -m "chore: bump version to 1.0.0"
git tag v1.0.0

# 6. 发布到 npm
npm publish

# 7. 推送代码和标签
git push origin HEAD
git push origin v1.0.0
```

### 方式三：一键发布脚本

创建并执行以下脚本：

```bash
#!/bin/bash
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}开始 npm 发布流程...${NC}"

# 1. 检查 npm 登录状态
echo -e "${YELLOW}检查 npm 登录状态...${NC}"
if ! npm whoami &> /dev/null; then
    echo -e "${RED}错误: 未登录 npm，请先执行 npm login${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm 已登录${NC}"

# 2. 检查工作目录
echo -e "${YELLOW}检查工作目录状态...${NC}"
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}警告: 有未提交的更改${NC}"
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 3. 获取版本类型
echo -e "${YELLOW}选择版本类型:${NC}"
echo "1) patch (补丁版本: 1.0.0 -> 1.0.1)"
echo "2) minor (次版本: 1.0.0 -> 1.1.0)"
echo "3) major (主版本: 1.0.0 -> 2.0.0)"
echo "4) 自定义版本号"
read -p "请选择 (1-4): " version_type

case $version_type in
    1)
        version_cmd="patch"
        ;;
    2)
        version_cmd="minor"
        ;;
    3)
        version_cmd="major"
        ;;
    4)
        read -p "请输入版本号 (例如: 1.2.3): " custom_version
        version_cmd="$custom_version"
        ;;
    *)
        echo -e "${RED}无效选择${NC}"
        exit 1
        ;;
esac

# 4. 更新版本号
echo -e "${YELLOW}更新版本号...${NC}"
npm version $version_cmd -m "chore: release v%s"
NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}✓ 版本已更新为 v${NEW_VERSION}${NC}"

# 5. 构建项目
echo -e "${YELLOW}构建项目...${NC}"
pnpm run build:prod
echo -e "${GREEN}✓ 构建完成${NC}"

# 6. 发布到 npm
echo -e "${YELLOW}发布到 npm...${NC}"
npm publish
echo -e "${GREEN}✓ 发布成功${NC}"

# 7. 推送代码和标签
echo -e "${YELLOW}推送代码和标签...${NC}"
git push origin HEAD --tags
echo -e "${GREEN}✓ 推送完成${NC}"

echo -e "${GREEN}发布流程完成！版本 v${NEW_VERSION} 已成功发布${NC}"
```

## 注意事项

1. **私有包配置**
   - 如果 package.json 中 `"private": true`，需要先改为 `false` 或删除该字段
   - 确保 npm registry 配置正确

2. **版本号规范**
   - 遵循语义化版本控制 (SemVer)
   - 格式：主版本号.次版本号.补丁版本号 (例如：1.2.3)

3. **发布前检查清单**
   - [ ] 代码已测试通过
   - [ ] 已更新 CHANGELOG.md（如果有）
   - [ ] 已更新 README.md（如果有变更）
   - [ ] 构建产物正确
   - [ ] npm 登录状态正常
   - [ ] registry 配置正确

4. **回滚操作**
   如果发布出错需要回滚：
   ```bash
   # 删除本地标签
   git tag -d v1.0.0
   
   # 删除远程标签
   git push origin :refs/tags/v1.0.0
   
   # 回退版本号
   npm version 0.0.0 --no-git-tag-version
   git add package.json
   git commit -m "chore: revert version"
   ```

5. **查看已发布版本**
   ```bash
   npm view <package-name> versions
   npm view <package-name> version
   ```

6. **取消发布（24小时内）**
   ```bash
   npm unpublish <package-name>@<version>
   # 或删除整个包（需要联系 npm 支持）
   ```

## 常见问题

**Q: 发布时提示 "You cannot publish over the previously published versions"**
A: 该版本已存在，需要更新版本号后再发布

**Q: 发布时提示 "npm ERR! code ENEEDAUTH"**
A: 未登录或登录过期，执行 `npm login` 重新登录

**Q: 如何发布到私有 registry？**
A: 配置 `.npmrc` 文件或使用 `npm publish --registry=https://your-registry.com`

**Q: 如何发布 beta/alpha 版本？**
A: 使用 `npm version 1.0.0-beta.1` 然后 `npm publish --tag beta`

