# AI Tool Hub UI 重构设计文档

## 设计目标

将主站首页和简历优化工具的 UI 全面重构为 Ant Design 风格，支持亮色/暗色双主题切换。

## 设计参考

- **Ant Design 5.x** 组件库设计语言
- 配色：主色 #1677ff（蓝），辅助色 #722ed1（紫）、#52c41a（绿）、#faad14（金）、#ff4d4f（红）
- 圆角：8px（大组件）、6px（小组件）、4px（按钮/标签）
- 阴影：elevation-1/2/3 层级
- 字体：系统字体栈 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei'
- 间距：4px 基准网格（4/8/12/16/20/24/32/48）

---

## 一、主站首页重构

### 1.1 导航栏 (Navbar)

**当前**：毛玻璃效果、渐变图标、pill 按钮
**重构为 Ant Design Pro 风格**：
- 亮色：白底 + 底部 1px 分割线
- 暗色：#141414 底 + 底部 1px #303030 分割线
- Logo：纯文字 "AI Tool Hub"，无渐变，字体加粗
- 搜索框集成在导航栏内（Ant Design Input.Search 样式）
- 右侧：主题切换按钮 + 用户头像下拉（Ant Design Dropdown）

### 1.2 搜索框

**当前**：独立区块，glass 效果
**重构为 Ant Design Input**：
- 亮色：白底 + #d9d9d9 边框 + focus 时 #1677ff 蓝色边框 + 蓝色光晕
- 暗色：#141414 底 + #424242 边框 + focus 时 #1677ff 蓝色边框
- 圆角 8px，高度 40px
- 搜索建议下拉：白底卡片 + elevation-3 阴影

### 1.3 分类筛选

**当前**：pill 按钮，glass 效果
**重构为 Ant Design Tabs + Tag**：
- 顶部分类用 Ant Design Tabs 样式（下划线指示器 #1677ff）
- 标签筛选用 Ant Design Tag（CheckableTag 样式）
- 亮色：浅灰底 + 选中蓝色底白字
- 暗色：深灰底 + 选中蓝色底白字

### 1.4 工具卡片

**当前**：glass 效果 + 渐变图标 + 复杂装饰
**重构为 Ant Design Card**：
- 亮色：白底 + #f0f0f0 边框 + hover 时 elevation-2 阴影 + 左侧 3px #1677ff 色条
- 暗色：#1f1f1f 底 + #303030 边框 + hover 时更强的阴影
- 图标区域：48x48 圆角方形，浅蓝底 (#e6f4ff) + 蓝色图标
- 标题：16px 加粗，单行省略
- 描述：14px #8c8c8c，两行省略
- 标签：Ant Design Tag 样式（小号、圆角 4px）
- 右上角：收藏星标按钮

### 1.5 工具详情弹窗

**当前**：全屏模态
**重构为 Ant Design Modal**：
- 宽度 720px，居中
- 亮色：白底 + elevation-3 阴影
- 暗色：#1f1f1f 底
- 顶部：图标 + 标题 + 分类 + 标签
- 中部：描述 + 平台标签 + 难度 + 更新时间
- 底部：打开按钮（Ant Design Button Primary）+ 收藏按钮（Default）
- 右上角：关闭 X 按钮

### 1.6 统计面板

**当前**：glass 卡片
**重构为 Ant Design Statistic**：
- 亮色：白底卡片 + 左侧 4px 色条
- 数值：24px 加粗，对应颜色
- 标签：14px #8c8c8c
- 图标：右侧小图标

### 1.7 热门推荐

**当前**：独立区块
**重构为 Ant Design List**：
- 标题区：Ant Design Typography.Title (h2) + 右侧 "查看全部" 链接
- 卡片列表：紧凑模式，hover 背景色变化
- 排名序号：前3名用 #1677ff 色圆圈，其余灰色

---

## 二、主题系统

### 2.1 CSS 变量

```css
:root {
  /* Ant Design 主色 */
  --ant-primary: #1677ff;
  --ant-primary-hover: #4096ff;
  --ant-primary-active: #0958d9;
  --ant-primary-bg: #e6f4ff;
  
  /* 功能色 */
  --ant-success: #52c41a;
  --ant-warning: #faad14;
  --ant-error: #ff4d4f;
  --ant-info: #1677ff;
  
  /* 中性色 */
  --ant-text-primary: rgba(0,0,0,0.88);
  --ant-text-secondary: rgba(0,0,0,0.65);
  --ant-text-tertiary: rgba(0,0,0,0.45);
  --ant-border: #d9d9d9;
  --ant-bg-layout: #f5f5f5;
  --ant-bg-container: #ffffff;
  --ant-bg-elevated: #ffffff;
  
  /* 圆角 */
  --ant-radius: 8px;
  --ant-radius-sm: 6px;
  --ant-radius-xs: 4px;
  
  /* 阴影 */
  --ant-shadow-1: 0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px 0 rgba(0,0,0,0.02);
  --ant-shadow-2: 0 6px 16px 0 rgba(0,0,0,0.08), 0 3px 6px -4px rgba(0,0,0,0.12), 0 9px 28px 8px rgba(0,0,0,0.05);
}

html.dark {
  --ant-text-primary: rgba(255,255,255,0.85);
  --ant-text-secondary: rgba(255,255,255,0.65);
  --ant-text-tertiary: rgba(255,255,255,0.45);
  --ant-border: #424242;
  --ant-bg-layout: #000000;
  --ant-bg-container: #141414;
  --ant-bg-elevated: #1f1f1f;
  --ant-primary-bg: #111b26;
}
```

### 2.2 主题切换

- 导航栏右侧添加太阳/月亮图标按钮
- 切换时在 `<html>` 上添加/移除 `dark` class
- 偏好保存到 localStorage
- 默认跟随系统 `prefers-color-scheme`

---

## 三、实现策略

### 3.1 不引入 Ant Design React

当前项目是原生 HTML + Vanilla JS，不使用 React/Vue 框架。重构方式：
- 用 **纯 CSS** 实现 Ant Design 视觉风格
- 保留现有 JS 逻辑不变
- 只改 CSS 变量和 HTML class
- 渐进式替换：先改 CSS，再优化 HTML 结构

### 3.2 文件变更

| 文件 | 变更 |
|------|------|
| `css/main.css` | 全部重写为 Ant Design 风格 |
| `index.html` | 调整 HTML 结构和 class 名 |
| `js/ui.js` | 调整渲染函数中的 HTML class |
| `js/tool.js` | 调整弹窗 HTML class |
| `tools/resume-optimizer/src/styles/main.css` | 全部重写 |
| `tools/resume-optimizer/index.html` | 调整结构 |

### 3.3 兼容性

- 保留所有现有功能（搜索、筛选、收藏、评分、分享等）
- 保留所有 JS 模块和事件绑定
- 保留 PWA 和 Service Worker
- 保留 CSP 安全策略

---

## 四、实施顺序

1. **Phase 1**：CSS 变量系统 + 主题切换按钮
2. **Phase 2**：导航栏 + 搜索框重构
3. **Phase 3**：工具卡片 + 分类筛选重构
4. **Phase 4**：弹窗 + 统计面板重构
5. **Phase 5**：简历工具 UI 重构
6. **Phase 6**：部署验证
