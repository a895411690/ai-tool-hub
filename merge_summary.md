此次合并引入了完整的AI工具管理系统，包括用户认证、工具管理、数据同步等核心功能，并添加了测试框架和代码质量工具。变更主要涉及新增多个JavaScript模块和配置文件，重构了应用结构。
| 文件 | 变更 |
|------|---------|
| .eslintrc.json | - 新增ESLint配置文件，定义代码质量规则 |
| dist/index.html | - 移除了部分HTML内容，简化了生产版本 |
| jest.config.js | - 新增Jest测试配置文件，设置测试环境 |
| package.json | - 添加了测试相关依赖，更新了项目配置 |
| src/__tests__/utils.test.js | - 新增工具函数测试文件，包含多种测试用例 |
| src/index.html | - 移除了部分HTML内容，简化了源文件 |
| src/js/app.js | - 完全重写应用主文件，实现核心功能和事件处理 |
| src/js/config.js | - 新增配置文件，定义应用常量和设置 |
| src/js/prompts.js | - 新增提示信息文件，包含系统提示和示例 |
| src/js/state.js | - 新增状态管理文件，管理应用全局状态 |
| src/js/tools.js | - 新增工具管理文件，实现工具展示、搜索和分类功能 |
| src/js/ui.js | - 新增UI工具文件，实现Toast、模态框和键盘快捷键 |
| src/js/user.js | - 新增用户系统文件，实现GitHub登录和数据同步 |
| src/js/utils.js | - 新增工具函数文件，包含防抖、节流和本地存储封装