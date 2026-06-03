# Tasks

- [x] Task 1: 修复分享弹窗和主题弹窗关闭按钮
  - [x] 修改 share.js closeShareModal：关闭按钮调用时不检查 event.target
  - [x] 修改 utils.js closeThemeModal：同上

- [x] Task 2: 修复浅色/深色模式切换
  - [x] 修改 utils.js toggleTheme/setTheme：深色用 html.dark，浅色用 html.light
  - [x] 修改 css/main.css：确保 :root 是深色默认，html.light 是浅色覆盖

- [x] Task 3: 修复搜索建议项点击跳转
  - [x] 修改 ui.js 搜索建议点击处理：有 toolId 时调用 showToolDetail(toolId)

- [x] Task 4: 修复反馈按钮
  - [x] 修改 index.html 反馈链接：href 改为 mailto:895411690@qq.com

- [x] Task 5: 实现内部注册/登录系统
  - [x] 在 index.html 添加登录/注册弹窗 HTML
  - [x] 在 main.js 添加注册/登录逻辑（localStorage 存储）
  - [x] 替换 GitHub 登录按钮为内部登录按钮
  - [x] 登录后更新用户菜单显示用户名

- [x] Task 6: 构建部署验证

# Task Dependencies
- [Task 5] 独立
- [Task 1, 2, 3, 4] 可并行
- [Task 6] depends on all
