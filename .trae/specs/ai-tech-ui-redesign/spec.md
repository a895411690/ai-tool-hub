# 主站 AI 科技风格 UI 重构 Spec

## Why
当前主站刚从赛博朋克风格改为 Ant Design 企业风格，但排版布局偏传统（上导航 + Hero + 卡片网格），缺乏 AI 科技感。用户希望重构为更具视觉冲击力的 AI 科技风格。

## What Changes
- 重新设计整体页面布局为现代 AI 科技风格
- Hero 区域改为全屏渐变 + 粒子/网格动画背景
- 工具卡片改为玻璃态（Glassmorphism）+ 渐变边框
- 导航栏改为半透明毛玻璃 + AI 光效
- 搜索框改为大尺寸居中 Command Bar 风格
- 统计面板改为数据可视化仪表盘风格
- 暗色为默认主题，亮色为可选
- 配色：深蓝紫渐变 (#0f0c29 → #302b63 → #24243e) + 霓虹蓝 (#00d4ff) + 霓虹紫 (#a855f7)

## Impact
- Affected code: `css/main.css`（全部重写）, `index.html`（HTML 结构调整）, `js/renderer.js`（卡片渲染 HTML）
- 不影响业务逻辑：`state.js`, `ui.js`（搜索/筛选逻辑）, `tool.js`（弹窗逻辑）

## ADDED Requirements

### Requirement: AI 科技风格 Hero 区域
Hero 区域 SHALL 为全屏高度，使用深色渐变背景 + CSS 动画网格/粒子效果，中央放置大标题 + 副标题 + 搜索框。

#### Scenario: 首屏视觉冲击
- **WHEN** 用户首次打开网站
- **THEN** 看到 full-viewport 深色渐变背景 + 动态网格动画 + 居中大标题"AI Tool Hub" + 发光搜索框

### Requirement: 毛玻璃导航栏
导航栏 SHALL 使用半透明背景 + backdrop-filter blur 效果，滚动时背景不透明度增加。

#### Scenario: 滚动导航栏
- **WHEN** 用户向下滚动页面
- **THEN** 导航栏从完全透明过渡到半透明毛玻璃效果

### Requirement: Command Bar 搜索框
搜索框 SHALL 居中放置在 Hero 区域，大尺寸（宽 600px+），带发光边框动画和 Cmd+K 快捷键提示。

#### Scenario: 搜索框视觉
- **WHEN** 页面加载完成
- **THEN** Hero 中央显示带发光脉冲动画的大搜索框，右侧显示 "⌘K" 快捷键提示

### Requirement: 玻璃态工具卡片
工具卡片 SHALL 使用玻璃态设计：半透明背景 + 模糊 + 1px 渐变边框 + hover 发光效果。

#### Scenario: 卡片交互
- **WHEN** 用户 hover 工具卡片
- **THEN** 卡片上浮 4px + 边框发出蓝色微光 + 背景模糊度增加

### Requirement: 数据仪表盘统计面板
统计面板 SHALL 使用数据可视化风格：深色卡片 + 渐变色数值 + 动态进度条。

### Requirement: 深色默认主题
默认主题 SHALL 为深色，亮色为可选切换。CSS 变量系统保留。

## MODIFIED Requirements

### Requirement: Ant Design 风格改为 AI 科技风格
之前改为的 Ant Design 企业风格全部替换为 AI 科技风格。配色从 #1677ff 蓝色系改为深蓝紫渐变 + 霓虹色系。

## REMOVED Requirements
（无删除，纯视觉重构）
