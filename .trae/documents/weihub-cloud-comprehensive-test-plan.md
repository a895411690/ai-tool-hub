# weihub.cloud 综合测试计划

## 概述

对 `https://weihub.cloud/` (AI Tool Hub) 进行功能、接口、性能及安全四个维度的综合测试。项目是一个 AI 工具聚合导航平台，前端为原生 HTML/CSS/JS (Vite 构建)，后端为 Express API 服务。

测试脚本将输出到 `dogfood-output/` 目录，使用 Playwright 进行浏览器自动化测试，使用 curl 进行 API 和安全测试。

---

## 一、功能测试 (Functional Testing)

### 1.1 页面加载与基础渲染
- **测试文件**: `dogfood-output/functional-test.mjs`
- **测试项**:
  - 页面标题包含 "AI" 或 "Hub"
  - 导航栏正确渲染（logo、搜索、用户按钮、主题切换）
  - 工具卡片数量 ≥ 80 个 (`[data-tool-id]`)
  - 分类标签栏渲染（10 大分类）
  - 热门推荐区域显示
  - 统计面板（工具数、分类数）
  - 页脚内容完整

### 1.2 用户认证流程（前端 localStorage 模式）
- 注册：填写用户名/邮箱/密码 → 注册成功 → 导航栏显示用户名
- 登录：填写邮箱/密码 → 登录成功 → 导航栏显示用户名
- 登出：点击登出 → 恢复游客状态
- 刷新持久化：登录后刷新页面，用户名保持
- 表单验证：空字段、格式错误提示

### 1.3 搜索功能
- 搜索框输入 "ChatGPT" → 出现搜索建议
- 点击搜索建议 → 打开工具详情弹窗
- 清空搜索 → 恢复全部工具
- 搜索历史记录

### 1.4 工具交互
- 点击工具卡片 → 打开工具详情弹窗 (`#toolDetailModal.active`)
- 工具详情显示名称、描述、分类、标签
- 收藏/取消收藏功能
- 点击"访问工具"链接正确
- 关闭详情弹窗

### 1.5 分类筛选
- 点击分类标签（如 "AI写作"）→ 仅显示该分类工具
- 点击 "全部" → 恢复所有工具
- 筛选状态与工具数量一致

### 1.6 主题切换
- 点击主题按钮 → 切换 light/dark 模式
- `<html>` 元素 class 变化
- 主题偏好保存到 localStorage

### 1.7 分享功能
- 打开工具详情 → 点击分享 → 分享弹窗显示
- 分享方式选项（微信、QQ、复制链接）
- 关闭分享弹窗

### 1.8 响应式布局
- 1440×900 桌面端布局正常
- 768×1024 平板端布局正常
- 375×667 移动端布局正常（底部导航栏）

---

## 二、接口测试 (API Testing)

### 2.1 健康检查
- `GET /api/v1/health` → 200, 返回 status/version/timestamp

### 2.2 认证接口
- **测试文件**: `dogfood-output/api-test.mjs`
- `POST /api/v1/auth/register`:
  - 正常注册 → 201, 返回 user + quota, Set-Cookie: auth_token
  - 缺少字段 → 400
  - 邮箱格式错误 → 400
  - 密码太短 (<8位) → 400
  - 密码强度不足 (无字母+数字) → 400
  - 重复注册 → 409
- `POST /api/v1/auth/login`:
  - 正常登录 → 200, Set-Cookie: auth_token
  - 错误密码 → 401, remainingAttempts
  - 5次失败后锁定 → 429
  - 缺少字段 → 400
- `GET /api/v1/auth/me`:
  - 带 token → 200, 返回用户信息
  - 无 token → 401
  - 过期 token → 401
  - 无效 token → 401

### 2.3 简历优化接口
- `POST /api/v1/resume/optimize` (SSE):
  - 未认证 → 401
  - 缺少参数 → 400
  - 无效 level → 400
  - 简历过长 → 400
  - 配额用完 → 429
- `POST /api/v1/resume/parse`:
  - 未认证 → 401
  - 文本过短 → 400
  - 文本过长 → 400
- `POST /api/v1/resume/analyze-jd`:
  - 未认证 → 401
  - 缺少 jdText → 400

### 2.4 通用接口
- 404 路径 → 返回 JSON error
- CORS 头验证
- Rate Limit 头 (X-RateLimit-*)

---

## 三、性能测试 (Performance Testing)

### 3.1 页面加载性能
- **测试文件**: `dogfood-output/performance-test.mjs`
- **指标**:
  - FCP (First Contentful Paint) < 2s
  - LCP (Largest Contentful Paint) < 3s
  - DOM 加载完成时间
  - 窗口加载完成时间
  - 总资源数量和大小

### 3.2 资源优化检查
- JS 文件是否压缩（gzip/brotli）
- CSS 文件是否压缩
- 图片是否使用现代格式
- 是否有 render-blocking 资源
- Service Worker 注册和缓存策略

### 3.3 运行时性能
- 工具卡片滚动流畅度（无大量重排）
- 搜索输入响应时间 < 200ms
- 主题切换无明显闪烁

### 3.4 静态资源审计
- 检查 HTTP 缓存头 (Cache-Control, ETag)
- 检查是否启用压缩传输
- 检查关键资源加载顺序

---

## 四、安全测试 (Security Testing)

### 4.1 HTTP 安全头
- **测试文件**: `dogfood-output/security-test.mjs`
- Content-Security-Policy 存在且配置合理
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy 设置
- Strict-Transport-Security (HSTS)

### 4.2 XSS 防护
- 搜索框输入 `<script>alert(1)</script>` → 不执行脚本
- 工具名称注入 HTML → 被转义
- URL 参数注入 → 安全处理

### 4.3 认证安全
- JWT Cookie 属性: httpOnly, secure, sameSite=strict
- Token 过期处理
- 登录失败锁定机制（5次失败锁定15分钟）

### 4.4 输入验证
- API 接口输入长度限制
- SQL 注入防护（参数化查询/ORM）
- JSON body 大小限制 (100kb)
- 文件上传安全（如有）

### 4.5 信息泄露
- 错误信息不暴露内部细节
- 生产环境禁用 sourcemap
- API 版本信息控制
- 目录遍历防护

### 4.6 CORS 配置
- 仅允许指定域名
- credentials: true 但非 wildcard origin
- 预检请求处理

---

## 实现方案

### 脚本结构
```
dogfood-output/
├── functional-test.mjs    # 功能测试 (Playwright)
├── api-test.mjs           # API 接口测试 (Playwright fetch)
├── performance-test.mjs   # 性能测试 (Playwright + Performance API)
├── security-test.mjs      # 安全测试 (Playwright + HTTP 分析)
├── screenshots/           # 测试截图输出目录
└── regression-test.mjs    # 已有的回归测试（保留不动）
```

### 技术选型
- **Playwright** (已安装): 浏览器自动化 + 性能指标采集
- **原生 fetch**: API 接口测试（在 Playwright page.evaluate 中执行）
- 所有脚本为独立 `.mjs` 文件，可直接 `node` 运行

### 执行方式
```bash
# 功能测试
node dogfood-output/functional-test.mjs

# API 测试（需要后端服务运行，测试线上前端认证逻辑）
node dogfood-output/api-test.mjs

# 性能测试
node dogfood-output/performance-test.mjs

# 安全测试
node dogfood-output/security-test.mjs
```

### 输出格式
每个测试脚本统一输出格式:
```
[PASS/FAIL] 分类 > 测试项: 详情
...
========== SUMMARY ==========
Total: N | Passed: N | Failed: N
Pass Rate: XX.X%
```

---

## 假设与决策

1. **前端认证**: 线上网站 (weihub.cloud) 使用前端 localStorage 进行用户认证（注册/登录），不依赖后端 API。API 测试将主要验证前端认证流程的正确性。
2. **后端 API**: 后端部署在独立服务器，API 测试如果能访问到后端则测试后端接口，否则跳过后端相关测试。
3. **测试环境**: 使用 Playwright headless 模式，viewport 1440×900。
4. **测试数据**: 注册测试用户后自动清理，不污染线上数据。
5. **网络依赖**: 测试依赖网络连接访问 weihub.cloud，网络不稳定可能导致测试失败。

---

## 验证步骤

1. 运行每个测试脚本，检查 PASS/FAIL 输出
2. 检查 screenshots/ 目录的截图是否正常
3. 汇总所有测试结果，生成综合报告
4. 对 FAIL 项分析原因，区分 bug 和环境问题
