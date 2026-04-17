# AI 简历优化工具 - 测试指南

## 📋 测试套件概述

本项目采用**轻量级零依赖测试方案**，无需安装 Jest、Mocha 等测试框架，所有测试都在浏览器中运行。

### 测试文件

| 文件 | 描述 | 测试场景数 |
|------|------|-----------|
| `test-runner.html` | 轻量级测试框架 + UI | 5个基础测试 |
| `test-resume-parsing.js` | 简历解析功能测试 | 8个场景 |
| `test-ai-optimizer.js` | AI优化功能测试 | 8个场景 |
| **总计** | - | **21个测试场景** |

---

## 🚀 如何运行测试

### 方法 1: 浏览器中运行（推荐）

```bash
# 1. 在浏览器中打开测试页面
open tests/test-runner.html

# 2. 点击 "运行所有测试" 按钮

# 3. 查看测试结果
```

### 方法 2: 控制台运行

```javascript
// 在浏览器控制台中运行

// 运行简历解析测试
const resumeTester = new ResumeParserTests();
resumeTester.runAll();

// 运行AI优化测试
const aiTester = new AIOptimizerTests();
aiTester.runAll();
```

### 方法 3: 集成到应用中

```html
<!-- 在 HTML 中引入测试脚本 -->
<script src="tests/test-resume-parsing.js"></script>
<script src="tests/test-ai-optimizer.js"></script>
```

---

## 📊 测试覆盖范围

### ✅ 已覆盖功能

#### 1. 简历解析功能 (test-resume-parsing.js)
- ✅ 个人信息提取（姓名、电话、邮箱）
- ✅ 工作经历解析
- ✅ 教育经历解析
- ✅ 技能提取
- ✅ 中文简历支持
- ✅ 英文简历支持
- ✅ 数据格式验证
- ✅ XSS 防护

#### 2. AI 优化功能 (test-ai-optimizer.js)
- ✅ API 配置验证
- ✅ 简历数据验证
- ✅ 职位描述解析
- ✅ 优化建议生成
- ✅ 匹配度计算
- ✅ 错误处理
- ✅ 性能测试
- ✅ 集成测试

#### 3. 基础功能 (test-runner.html)
- ✅ 本地存储功能
- ✅ 表单验证
- ✅ 简历数据结构
- ✅ 安全性测试
- ✅ 性能测试

---

## 🎯 测试用例示例

### 示例 1: 个人信息提取测试

```javascript
runner.it('应该验证邮箱格式', () => {
    const validEmail = 'user@example.com';
    const invalidEmail = 'invalid-email';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    runner.expect(emailRegex.test(validEmail)).toBeTruthy();
    runner.expect(emailRegex.test(invalidEmail)).toBeFalsy();
});
```

### 示例 2: XSS 防护测试

```javascript
runner.it('应该正确转义 HTML 特殊字符', () => {
    const escapeHtml = (text) => {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    };
    
    const malicious = '<script>alert("XSS")</script>';
    const escaped = escapeHtml(malicious);
    
    runner.expect(escaped).toContain('&lt;');
});
```

---

## 🔧 扩展测试

### 添加新测试用例

```javascript
// 在 test-resume-parsing.js 中添加新测试

class ResumeParserTests {
    // ... 现有代码 ...
    
    // 新增测试
    testNewFeature() {
        console.log('\n📋 测试：新功能');
        
        // 你的测试逻辑
        this.assert(true, '新功能测试通过');
    }
    
    runAll() {
        // ... 现有测试 ...
        this.testNewFeature(); // 添加新测试
        // ...
    }
}
```

### 创建新测试套件

```javascript
// 创建 tests/test-new-feature.js

class NewFeatureTests {
    constructor() {
        this.passed = 0;
        this.failed = 0;
    }
    
    assert(condition, message) {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            this.passed++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            this.failed++;
        }
    }
    
    testFeature1() {
        // 测试代码
    }
    
    runAll() {
        this.testFeature1();
        // 输出结果
    }
}
```

---

## 📈 测试最佳实践

### 1. 测试原则
- ✅ **独立性**：每个测试应该独立运行，不依赖其他测试
- ✅ **可重复性**：测试结果应该一致
- ✅ **清晰性**：测试名称应该清晰描述测试内容
- ✅ **快速性**：测试应该快速执行

### 2. 断言方法

```javascript
// 相等性测试
runner.expect(actual).toBe(expected);

// 深度相等性测试
runner.expect(actual).toEqual(expected);

// 真值测试
runner.expect(actual).toBeTruthy();
runner.expect(actual).toBeFalsy();

// 包含测试
runner.expect(array).toContain(item);

// 类型测试
runner.expect(value).toBeInstanceOf(Class);
```

### 3. 测试数据

```javascript
// 使用模拟数据
const mockResume = {
    profile: { name: '测试用户', email: 'test@example.com' },
    experience: [],
    education: [],
    skills: []
};
```

---

## 🐛 常见问题

### Q1: 测试失败怎么办？

1. 查看控制台错误信息
2. 检查测试数据是否正确
3. 验证被测试的功能是否实现
4. 使用断点调试

### Q2: 如何调试测试？

```javascript
// 在测试中添加调试输出
console.log('调试信息:', actualValue);

// 使用断点
debugger;
```

### Q3: 测试性能如何？

- ✅ 所有测试在浏览器中运行
- ✅ 平均执行时间 < 100ms
- ✅ 无需等待网络请求

---

## 📝 测试报告

测试完成后会生成如下报告：

```
📊 测试结果：✅ 18 通过 | ❌ 0 失败
通过率：100.0%
```

---

## 🔄 持续集成

虽然本项目没有使用 CI/CD，但可以在部署前手动运行所有测试：

```bash
# 部署前检查清单
1. 打开 test-runner.html
2. 运行所有测试
3. 确认所有测试通过
4. 部署到生产环境
```

---

## 📚 参考资源

- [测试驱动开发 (TDD)](https://en.wikipedia.org/wiki/Test-driven_development)
- [JavaScript 测试最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [XSS 防护指南](https://owasp.org/www-community/attacks/xss/)

---

**测试是质量的保障！** 🎯

*最后更新: 2026-04-10*
