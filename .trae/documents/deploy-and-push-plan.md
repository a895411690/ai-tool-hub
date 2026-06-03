# 部署 + GitHub 提交 + 更新说明 计划

## 概述

将最新代码（含安全修复、CSP、autocomplete、Harness Starter 等）执行三步操作：
1. 构建并部署到腾讯云服务器 101.43.35.235
2. 提交代码到 GitHub
3. 更新说明文件

## 当前状态

- **Git**: main 分支，远程 origin = `https://github.com/a895411690/ai-tool-hub.git`
- **变更**: 131 files changed, ~14000 insertions（含测试脚本、安全修复、Harness Starter、UI 重构等）
- **部署目标**: 腾讯云 101.43.35.235, 域名 weihub.cloud
- **部署工具**: `deploy/tencent-cloud/quick-deploy.sh full`

## 实施步骤

### 步骤 1: 构建项目

```bash
cd /Users/weijiahao/Downloads/ai-tool-hub && npm run build
```

验证 `dist/` 目录生成成功。

### 步骤 2: 部署到腾讯云

使用 `quick-deploy.sh full`（本地构建 + rsync 上传 + 远程 Nginx 重载）：

```bash
bash deploy/tencent-cloud/quick-deploy.sh full
```

该脚本会：
- 本地 `npm run build`
- `rsync -avz --delete dist/` 到 `root@101.43.35.235:/var/www/ai-tool-hub/dist/`
- SSH 到服务器重载 Nginx

如果 rsync/SSH 需要密码，可能需要交互输入。

### 步骤 3: 提交到 GitHub

```bash
git add -A
git commit -m "feat: 安全修复 + Harness Starter + 综合测试"
git push origin main
```

提交内容包括：
- 安全修复：CORS、CSP meta、autocomplete、nginx .map 拦截
- Harness Starter：.claude/、CLAUDE.md、.lsp.json、scripts/
- 综合测试：4 个测试脚本（functional/api/performance/security）
- 测试修复：选择器修正、阈值调整

**注意**: push 到 main 会自动触发 GitHub Actions CI/CD（测试 + 构建 + 部署到 GitHub Pages）。

### 步骤 4: 验证部署

```bash
# 检查服务器部署状态
bash deploy/tencent-cloud/quick-deploy.sh status

# 快速验证线上网站
curl -s -o /dev/null -w "%{http_code}" https://weihub.cloud/
```

## 注意事项

- `dist/` 目录在 `.gitignore` 中，不应提交到 GitHub（GitHub Actions 会自动构建）
- 部署到腾讯云服务器需要 SSH 访问权限（root@101.43.35.235）
- quick-deploy.sh 中已配置 `SERVER_IP="101.43.35.235"`、`SERVER_PATH="/var/www/ai-tool-hub"`
