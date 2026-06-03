# 搜索框尺寸优化 Spec

## Why
搜索框在页面上显示过小，原因是 CSS class 不匹配：HTML 中使用 `hero-search-input` / `hero-search-wrapper`，但 CSS 中只定义了 `.hero-search`，导致搜索框没有应用 Hero 区域的大尺寸样式。

## What Changes
- 为 `.hero-search-wrapper` 和 `.hero-search-input` 添加 CSS 样式
- 搜索框宽度加大到 max-width: 680px，高度 60px
- 搜索图标和 ⌘K 提示正确定位

## Impact
- Affected code: `css/main.css`（添加缺失的 CSS 规则）

## ADDED Requirements

### Requirement: Hero 搜索框正确渲染
Hero 区域的搜索框 SHALL 显示为大尺寸（宽 680px，高 60px），带发光边框动画。

#### Scenario: 搜索框尺寸
- **WHEN** 页面加载完成
- **THEN** Hero 中央的搜索框宽度为 680px，高度 60px，带霓虹蓝发光脉冲动画
