#!/bin/bash
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}    NPM 发布流程 - @liuyongdi/compressorjs${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 检查 npm 登录状态
echo -e "${YELLOW}[1/7] 检查 npm 登录状态...${NC}"
if ! npm whoami &> /dev/null; then
    echo -e "${RED}✗ 未登录 npm${NC}"
    echo -e "${YELLOW}请先执行: npm login${NC}"
    exit 1
fi
NPM_USER=$(npm whoami)
echo -e "${GREEN}✓ npm 已登录: ${NPM_USER}${NC}"
echo ""

# 2. 检查 registry
echo -e "${YELLOW}[2/7] 检查 npm registry...${NC}"
REGISTRY=$(npm config get registry)
echo -e "${GREEN}✓ Registry: ${REGISTRY}${NC}"
echo ""

# 3. 检查工作目录
echo -e "${YELLOW}[3/7] 检查工作目录状态...${NC}"
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠ 警告: 有未提交的更改${NC}"
    git status --short
    echo ""
    read -p "是否先提交这些更改？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "请输入提交信息: " commit_msg
        if [[ -z "$commit_msg" ]]; then
            commit_msg="chore: prepare for release"
        fi
        git add .
        git commit -m "$commit_msg"
        echo -e "${GREEN}✓ 更改已提交${NC}"
    else
        echo -e "${YELLOW}⚠ 继续发布流程（未提交的更改不会被包含在发布中）${NC}"
    fi
else
    echo -e "${GREEN}✓ 工作目录干净${NC}"
fi
echo ""

# 4. 获取当前版本
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}[4/7] 当前版本: v${CURRENT_VERSION}${NC}"

# 5. 获取版本类型
echo -e "${YELLOW}[5/7] 选择版本类型:${NC}"
echo "  1) patch (补丁版本: ${CURRENT_VERSION} -> $(node -p "require('semver').inc('${CURRENT_VERSION}', 'patch')"))"
echo "  2) minor (次版本: ${CURRENT_VERSION} -> $(node -p "require('semver').inc('${CURRENT_VERSION}', 'minor')"))"
echo "  3) major (主版本: ${CURRENT_VERSION} -> $(node -p "require('semver').inc('${CURRENT_VERSION}', 'major')"))"
echo "  4) 自定义版本号"
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
        if [[ -z "$custom_version" ]]; then
            echo -e "${RED}✗ 版本号不能为空${NC}"
            exit 1
        fi
        version_cmd="$custom_version"
        ;;
    *)
        echo -e "${RED}✗ 无效选择${NC}"
        exit 1
        ;;
esac

# 6. 更新版本号
echo ""
echo -e "${YELLOW}[6/7] 更新版本号...${NC}"
if [[ "$version_cmd" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]; then
    npm version "$version_cmd" -m "chore: release v%s" --no-git-tag-version
    git add package.json package-lock.json
    git commit -m "chore: release v$version_cmd"
    git tag "v$version_cmd"
else
    npm version "$version_cmd" -m "chore: release v%s"
fi
NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}✓ 版本已更新为 v${NEW_VERSION}${NC}"
echo ""

# 7. 构建项目
echo -e "${YELLOW}[7/7] 构建项目...${NC}"
npm run build
echo -e "${GREEN}✓ 构建完成${NC}"
echo ""

# 8. 发布到 npm
echo -e "${YELLOW}[发布] 发布到 npm...${NC}"
npm publish
echo -e "${GREEN}✓ 发布成功${NC}"
echo ""

# 9. 推送代码和标签
echo -e "${YELLOW}[推送] 推送代码和标签到远程仓库...${NC}"
git push origin HEAD --tags
echo -e "${GREEN}✓ 推送完成${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   发布完成！版本 v${NEW_VERSION} 已成功发布${NC}"
echo -e "${GREEN}========================================${NC}"

