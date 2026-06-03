# 五项功能修复 Spec

## Why
用户反馈了 5 个功能问题：登录方式需从 GitHub 改为内部注册、分享弹窗关闭失效、主题切换无效、反馈功能无响应、搜索结果点击无跳转。

## What Changes
- 登录系统从 GitHub OAuth 占位改为内部注册/登录弹窗（前端演示模式，localStorage 存储）
- 修复分享弹窗和主题弹窗的关闭按钮逻辑
- 修复浅色/深色模式切换（CSS 选择器与 JS class 名对齐）
- 反馈按钮跳转到 mailto:895411690@qq.com
- 搜索建议项点击后打开工具详情弹窗

## Impact
- Affected code: `index.html`, `js/main.js`, `js/ui.js`, `js/share.js`, `js/utils.js`, `css/main.css`

## ADDED Requirements

### Requirement: 内部注册/登录系统
系统 SHALL 提供内部注册和登录功能，使用 localStorage 存储用户数据（前端演示模式）。

#### Scenario: 用户注册
- **WHEN** 用户点击"登录"按钮并填写用户名/邮箱/密码后点击注册
- **THEN** 系统将用户信息保存到 localStorage 并自动登录

#### Scenario: 用户登录
- **WHEN** 用户输入邮箱和密码后点击登录
- **THEN** 系统验证 localStorage 中的用户数据，匹配则登录成功

### Requirement: 反馈按钮
反馈按钮 SHALL 跳转到 mailto:895411690@qq.com

#### Scenario: 点击反馈
- **WHEN** 用户点击"反馈"链接
- **THEN** 打开默认邮件客户端，收件人为 895411690@qq.com

## MODIFIED Requirements

### Requirement: 分享/主题弹窗关闭
`closeShareModal` 和 `closeThemeModal` 函数 SHALL 在点击关闭按钮时直接关闭弹窗，不再检查 event.target。

### Requirement: 浅色/深色模式
主题切换 SHALL 正确工作：深色模式添加 `html.dark` class，浅色模式移除 `html.dark`。CSS 变量需在 `:root`（深色默认）和 `html.light`（浅色覆盖）中正确对应。

### Requirement: 搜索建议项点击跳转
搜索建议项点击时，如果有 data-tool-id，SHALL 直接调用 showToolDetail(toolId) 打开工具详情弹窗。

## REMOVED Requirements

### Requirement: GitHub OAuth 登录
**Reason**: 改为内部注册/登录系统
**Migration**: 移除 GitHub 登录按钮和相关占位代码
