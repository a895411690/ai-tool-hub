# AI 简历优化工具 - 构建流程文档

## 📋 概述

本项目采用**轻量级零依赖构建方案**，无需安装 Webpack、Vite 等复杂构建工具，所有构建脚本仅使用 Node.js 内置模块。

---

## 🚀 快速开始

### 开发环境

```bash
# 1. 进入项目目录
cd tools/resume-optimizer

# 2. 直接在浏览器中打开 index.html
open index.html

# 或者使用本地服务器（可选）
python -m http.server 8000
# 或
npx serve .
```

### 生产构建

```bash
# 1. 运行构建脚本
node scripts/build.js

# 2. 查看构建输出
ls dist/

# 3. 部署到生产环境
node scripts/deploy.js
```

---

## 📁 项目结构

```
resume-optimizer/
├── index.html                 # 主入口文件
├── src/
│   ├── app.js                # 主应用逻辑
│   ├── lib/                  # 库文件
│   │   ├── store.js
│   │   ├── pdfGenerator.js
│   │   ├── aiOptimizer.js
│   │   └── ...
│   ├── components/           # 组件
│   │   ├── resumeForm.js
│   │   ├── resumePreview.js
│   │   └── importResume.js
│   └── styles/
│       └── main.css
├── scripts/                  # 构建脚本
│   ├── build.js             # 构建脚本
│   ├── deploy.js            # 部署脚本
│   └── build.config.js      # 构建配置
├── tests/                    # 测试文件
│   ├── test-runner.html
│   └── ...
└── dist/                     # 构建输出（自动生成）
    └── ...
```

---

## 🔧 构建流程

### 1. 开发模式

**特点**：
- 无需构建步骤
- 直接编辑源文件
- 浏览器自动刷新（如使用 live-server）

**步骤**：
1. 编辑 `src/` 目录下的源文件
2. 保存后刷新浏览器
3. 查看效果

---

### 2. 生产构建

**执行命令**：
```bash
node scripts/build.js
```

**构建步骤**：
1. ✅ **清理 dist 目录**
   - 删除旧的构建文件
   - 创建新的目录结构

2. ✅ **压缩代码**
   - JavaScript: 移除注释、空白
   - CSS: 移除注释、空白
   - HTML: 移除注释、空白

3. ✅ **复制资源文件**
   - manifest.json
   - robots.txt
   - sitemap.xml

4. ✅ **生成构建报告**
   - 文件处理统计
   - 大小对比
   - 压缩率

**构建输出示例**：
```
🚀 开始构建 AI 简历优化工具...

ℹ️  清理 dist 目录...
✅ dist 目录已清理

ℹ️  处理文件...
✅ index.html: 11.00KB → 9.50KB (节省 13.6%)
✅ src/app.js: 9.94KB → 7.80KB (节省 21.5%)
✅ src/lib/aiOptimizer.js: 18.87KB → 14.20KB (节省 24.8%)
...

==================================================
✅ 构建完成！
==================================================

📊 构建统计:
   文件处理数: 12
   原始大小: 170.50KB
   节省大小: 35.70KB
   压缩率: 20.9%
   构建时间: 0.12s

📂 输出目录: /path/to/dist
```

---

### 3. 部署流程

**执行命令**：
```bash
node scripts/deploy.js
```

**部署步骤**：
1. ✅ **检查 dist 目录**
   - 验证构建文件存在

2. ✅ **检查 Git 状态**
   - 确认是否有未提交的更改

3. ✅ **部署到 GitHub Pages**
   - 使用 `git subtree` 推送到 gh-pages 分支

4. ✅ **生成部署报告**
   - 部署时间
   - 访问地址

**部署输出示例**：
```
🚀 开始部署 AI 简历优化工具...

ℹ️  检查 dist 目录...
✅ dist 目录检查通过

ℹ️  检查 Git 状态...
✅ 当前分支: main

ℹ️  部署到 GitHub Pages...
✅ 已推送到 gh-pages 分支

==================================================
✅ 部署完成！
==================================================

📊 部署统计:
   部署时间: 2.35s
   目标分支: gh-pages

🌐 访问地址:
   https://a895411690.github.io/ai-tool-hub/tools/resume-optimizer/

💡 提示: GitHub Pages 可能需要几分钟才能更新
```

---

## ⚙️ 构建配置

配置文件：`scripts/build.config.js`

### 主要配置项

```javascript
module.exports = {
    // 项目信息
    project: {
        name: 'AI 简历优化工具',
        version: '1.0.0'
    },

    // 构建配置
    build: {
        srcDir: './',
        distDir: './dist',
        minify: {
            js: { removeComments: true },
            css: { removeComments: true },
            html: { removeComments: true }
        }
    },

    // 部署配置
    deploy: {
        github: {
            repo: 'https://github.com/a895411690/ai-tool-hub.git',
            branch: 'gh-pages'
        }
    }
};
```

---

## 🎯 最佳实践

### 开发阶段

1. **直接编辑源文件**
   - 无需构建，即时预览
   - 使用浏览器的开发者工具调试

2. **使用本地服务器**（可选）
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js (需要安装 serve)
   npx serve .
   
   # PHP
   php -S localhost:8000
   ```

3. **测试功能**
   ```bash
   # 打开测试页面
   open tests/test-runner.html
   ```

### 构建阶段

1. **运行构建前测试**
   ```bash
   # 确保所有测试通过
   node tests/test-resume-parsing.js
   ```

2. **执行构建**
   ```bash
   node scripts/build.js
   ```

3. **验证构建输出**
   ```bash
   # 检查 dist 目录
   ls -lh dist/
   
   # 本地测试构建版本
   cd dist
   python -m http.server 3000
   # 访问 http://localhost:3000
   ```

### 部署阶段

1. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 新功能描述"
   git push origin main
   ```

2. **部署到 GitHub Pages**
   ```bash
   node scripts/deploy.js
   ```

3. **验证部署**
   - 访问 GitHub Pages URL
   - 检查功能是否正常
   - 测试移动端访问

---

## 🔍 常见问题

### Q1: 构建失败怎么办？

**检查清单**：
- ✅ Node.js 是否已安装（运行 `node --version`）
- ✅ 源文件是否存在
- ✅ 文件路径是否正确
- ✅ 查看错误日志

**解决方法**：
```bash
# 清理后重新构建
rm -rf dist/
node scripts/build.js
```

### Q2: 如何查看构建后的文件大小？

```bash
# 查看单个文件
ls -lh dist/index.html

# 查看整个目录
du -sh dist/
```

### Q3: 压缩率不够高怎么办？

**当前方案**：简单的正则替换

**改进方案**（需要额外工具）：
1. 使用 Terser 压缩 JavaScript
2. 使用 clean-css 压缩 CSS
3. 使用 html-minifier 压缩 HTML

**示例**：
```bash
# 安装工具
npm install -g terser clean-css-cli html-minifier

# 压缩文件
terser src/app.js -o dist/app.min.js
cleancss src/styles/main.css -o dist/styles/main.min.css
html-minifier index.html -o dist/index.html
```

### Q4: 如何调试构建过程？

```javascript
// 在 build.js 中添加调试输出
console.log('调试信息:', filename);
console.log('原始大小:', originalSize);
console.log('压缩后大小:', newSize);
```

---

## 📊 性能对比

### 构建前 vs 构建后

| 指标 | 构建前 | 构建后 | 改进 |
|------|--------|--------|------|
| **总大小** | 170KB | 135KB | -20.9% |
| **JS 大小** | 140KB | 105KB | -25.0% |
| **CSS 大小** | 5.3KB | 4.1KB | -22.6% |
| **HTML 大小** | 11KB | 9.5KB | -13.6% |

### 加载时间（估算）

| 环境 | 构建前 | 构建后 | 改进 |
|------|--------|--------|------|
| **3G 网络** | 2.3s | 1.8s | -21.7% |
| **4G 网络** | 0.9s | 0.7s | -22.2% |
| **WiFi** | 0.4s | 0.3s | -25.0% |

---

## 🛠️ 高级功能（可选）

### 1. 添加版本号

```javascript
// 在 build.js 中
const version = require('../package.json').version;
const html = fs.readFileSync('index.html', 'utf-8')
    .replace(/\.js"/g, `.js?v=${version}"`)
    .replace(/\.css"/g, `.css?v=${version}"`);
```

### 2. 生成 Source Map

```javascript
// 需要安装 source-map 库
npm install source-map

// 在压缩时生成 source map
const { SourceMapGenerator } = require('source-map');
// ... 生成逻辑
```

### 3. 自动化部署

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Build
        run: node scripts/build.js
      
      - name: Deploy
        run: node scripts/deploy.js
```

---

## 📚 参考资源

- [Node.js 文档](https://nodejs.org/docs/)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [Web 性能优化](https://web.dev/performance/)
- [构建工具对比](https://2020.stateofjs.com/en-US/technologies/build-tools/)

---

## 🎯 总结

**本构建方案的优势**：

1. ✅ **零依赖**：无需安装任何外部工具
2. ✅ **简单**：仅需 Node.js 环境
3. ✅ **快速**：构建时间 < 1秒
4. ✅ **透明**：所有构建逻辑可读、可调试
5. ✅ **符合用户原则**：零依赖单文件架构

**适用场景**：
- 小型项目
- 快速原型开发
- 无需复杂构建流程的项目
- 学习和理解构建原理

**不适用场景**：
- 大型复杂项目
- 需要高级特性（Tree-shaking、HMR等）
- 团队协作要求高

---

**构建流程已优化完成！** 🚀

*最后更新: 2026-04-10*
