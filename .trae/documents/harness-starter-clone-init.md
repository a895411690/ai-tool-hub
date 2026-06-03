# Harness Starter 克隆与初始化计划

## 概述

将 [Harness-Starter](https://github.com/chenklein26-maker/Harness-Starter) 仓库克隆到本项目中并完成初始化。Harness Starter 是一套 Claude Code Hook 自动化模板，提供安全拦截、自动格式化、会话审查等功能。

## 当前状态分析

- **项目**: ai-tool-hub（AI 工具聚合导航平台）
- **技术栈**: 原生 HTML/CSS/JS + Vite + Express 后端
- **已有 .claude/ 目录**: 无
- **已有 CLAUDE.md**: 无
- **已有 .lsp.json**: 无

## 实施步骤

### 步骤 1: 克隆 Harness-Starter 到临时目录

```bash
git clone https://github.com/chenklein26-maker/Harness-Starter.git /tmp/harness-starter
```

### 步骤 2: 复制模板文件到项目

将以下文件/目录复制到项目根目录：

| 来源 | 目标 | 说明 |
|------|------|------|
| `/tmp/harness-starter/.claude/` | `.claude/` | Hook 脚本、Skills、settings |
| `/tmp/harness-starter/CLAUDE.md` | `CLAUDE.md` | AI 行为规则（需填写项目信息） |
| `/tmp/harness-starter/.lsp.json` | `.lsp.json` | LSP 语言服务配置 |
| `/tmp/harness-starter/scripts/` | `scripts/` | check/init/upgrade 脚本 |

### 步骤 3: 填写 CLAUDE.md 项目信息

替换 CLAUDE.md 中的占位符：

```
用途：AI 工具聚合导航平台，帮助用户发现和访问优质 AI 工具
技术栈：原生 HTML5 + CSS3 + JavaScript ES6+ + Vite 6 + Express 4 + Service Worker
跑测试：NODE_OPTIONS='--experimental-vm-modules' npx jest
```

### 步骤 4: 调整 .lsp.json

当前默认配置为 TypeScript。本项目主要使用 JavaScript，配置本身已支持 `.js`/`.jsx`，无需修改。

### 步骤 5: 运行健康检查

```bash
node scripts/check.mjs
```

### 步骤 6: 清理临时文件

```bash
rm -rf /tmp/harness-starter
```

## 注意事项

- 不覆盖项目已有的 `.gitignore`、`package.json`、`.github/workflows/deploy.yml`
- Harness 的 `.claude/settings.json` 注册了 5 个 Hook，不影响现有功能
- CLAUDE.md 中的行为准则（Karpathy 原则）作为 AI 辅助开发规范

## 验证

1. 确认 `.claude/` 目录结构完整（hooks/、skills/、settings.json）
2. 确认 `CLAUDE.md` 项目信息已正确填写
3. 确认 `.lsp.json` 配置正确
4. 运行 `node scripts/check.mjs` 检查通过
