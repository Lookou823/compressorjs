# Git Ignore 问题修复说明

## 问题原因

即使 `.gitignore` 中设置了 `dist`，`dist` 文件夹下的改动仍然出现在暂存区。

**根本原因**：`.gitignore` 只能忽略**未被跟踪**的文件。如果文件在添加到 `.gitignore` 之前就已经被 git 跟踪了，那么 `.gitignore` 对它们不起作用。

## 解决方案

### 1. 从 git 索引中移除已跟踪的文件

```bash
# 移除 dist 目录（保留本地文件）
git rm --cached -r dist/

# 移除 docs/js/compressor.js（保留本地文件）
git rm --cached docs/js/compressor.js
```

### 2. 更新 .gitignore

确保 `.gitignore` 包含：
```
dist
docs/js/*.js
```

### 3. 提交删除操作

提交这些删除操作，这样以后这些文件就不会被跟踪了：

```bash
git commit -m "chore: remove dist and docs/js from git tracking"
```

## 验证

提交后，运行：

```bash
git status
```

应该看不到 `dist/` 和 `docs/js/compressor.js` 的改动了。

## 注意事项

- `git rm --cached` 只会从 git 索引中移除文件，**不会删除本地文件**
- 删除操作需要提交，否则文件仍然会被跟踪
- 提交后，这些文件将不再出现在 `git status` 中
