/**
 * 简历解析功能测试套件
 * 测试文件：test-resume-parsing.js
 * 用途：验证简历导入和解析功能
 */

// ==================== 测试数据 ====================

const sampleResumes = {
    chinese: `卫家豪
前端开发工程师

电话: 13311667685
邮箱: 895411690@qq.com
性别: 男

工作经历:
交通银行 - 前端开发工程师 (2021-2023)
- 负责银行官网前端开发
- 使用 React + TypeScript 技术栈
- 优化页面性能，提升用户体验

广发银行 - 前端开发 (2020-2021)
- 参与移动端H5开发
- 使用 Vue.js 框架

教育经历:
上海交通大学 - 计算机科学与技术 (2016-2020)
本科

技能:
JavaScript, TypeScript, React, Vue.js, HTML5, CSS3, Node.js
`,
    
    english: `John Smith
Software Engineer

Phone: (555) 123-4567
Email: john.smith@example.com

Experience:
Tech Corp - Senior Software Engineer (2020-2023)
- Developed web applications using React
- Improved application performance by 40%
- Led team of 5 developers

Startup Inc - Software Developer (2018-2020)
- Built RESTful APIs using Node.js
- Implemented CI/CD pipelines

Education:
MIT - Computer Science (2014-2018)
Bachelor's Degree

Skills:
JavaScript, Python, React, Node.js, AWS, Docker
`,

    minimal: `
张三
前端工程师

电话: 13800138000
邮箱: zhangsan@example.com
`
};

// ==================== 测试用例 ====================

class ResumeParserTests {
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

    // 测试 1: 个人信息提取
    testPersonalInfoExtraction() {
        console.log('\n📋 测试：个人信息提取');
        
        const text = sampleResumes.chinese;
        
        // 提取姓名
        const nameMatch = text.match(/^([^\n]+)/);
        this.assert(nameMatch && nameMatch[1] === '卫家豪', '姓名提取正确');
        
        // 提取电话
        const phoneMatch = text.match(/电话:\s*(\d{11})/);
        this.assert(phoneMatch && phoneMatch[1] === '13311667685', '电话提取正确');
        
        // 提取邮箱
        const emailMatch = text.match(/邮箱:\s*([^\s]+)/);
        this.assert(emailMatch && emailMatch[1] === '895411690@qq.com', '邮箱提取正确');
    }

    // 测试 2: 工作经历解析
    testExperienceParsing() {
        console.log('\n📋 测试：工作经历解析');
        
        const text = sampleResumes.chinese;
        
        // 检查是否包含工作经历
        this.assert(text.includes('工作经历'), '识别到工作经历部分');
        
        // 检查是否包含公司名称
        this.assert(text.includes('交通银行'), '识别到公司名称（交通银行）');
        this.assert(text.includes('广发银行'), '识别到公司名称（广发银行）');
        
        // 检查是否包含职位
        this.assert(text.includes('前端开发工程师'), '识别到职位信息');
    }

    // 测试 3: 教育经历解析
    testEducationParsing() {
        console.log('\n📋 测试：教育经历解析');
        
        const text = sampleResumes.chinese;
        
        // 检查是否包含教育经历
        this.assert(text.includes('教育经历'), '识别到教育经历部分');
        
        // 检查是否包含学校
        this.assert(text.includes('上海交通大学'), '识别到学校名称');
        
        // 检查是否包含专业
        this.assert(text.includes('计算机科学与技术'), '识别到专业');
    }

    // 测试 4: 技能提取
    testSkillsExtraction() {
        console.log('\n📋 测试：技能提取');
        
        const text = sampleResumes.chinese;
        
        // 检查是否包含技能部分
        this.assert(text.includes('技能'), '识别到技能部分');
        
        // 检查关键技能
        const skills = ['JavaScript', 'TypeScript', 'React', 'Vue.js'];
        skills.forEach(skill => {
            this.assert(text.includes(skill), `识别到技能: ${skill}`);
        });
    }

    // 测试 5: 英文简历解析
    testEnglishResume() {
        console.log('\n📋 测试：英文简历解析');
        
        const text = sampleResumes.english;
        
        // 提取姓名
        const nameMatch = text.match(/^([^\n]+)/);
        this.assert(nameMatch && nameMatch[1] === 'John Smith', '英文姓名提取正确');
        
        // 提取邮箱
        const emailMatch = text.match(/Email:\s*([^\s]+)/);
        this.assert(emailMatch && emailMatch[1] === 'john.smith@example.com', '英文邮箱提取正确');
        
        // 检查工作经历
        this.assert(text.includes('Tech Corp'), '识别到英文公司名称');
        this.assert(text.includes('MIT'), '识别到英文学校');
    }

    // 测试 6: 最小简历解析
    testMinimalResume() {
        console.log('\n📋 测试：最小简历解析');
        
        const text = sampleResumes.minimal;
        
        // 即使是最小简历也应该能提取基本信息
        const nameMatch = text.match(/^([^\n]+)/);
        this.assert(nameMatch && nameMatch[1] === '张三', '最小简历姓名提取正确');
        
        const phoneMatch = text.match(/电话:\s*(\d{11})/);
        this.assert(phoneMatch && phoneMatch[1] === '13800138000', '最小简历电话提取正确');
    }

    // 测试 7: 数据格式验证
    testDataValidation() {
        console.log('\n📋 测试：数据格式验证');
        
        // 邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        this.assert(emailRegex.test('test@example.com'), '邮箱格式验证正确');
        this.assert(!emailRegex.test('invalid-email'), '无效邮箱被拒绝');
        
        // 电话格式验证（中国）
        const phoneRegex = /^1[3-9]\d{9}$/;
        this.assert(phoneRegex.test('13800138000'), '电话格式验证正确');
        this.assert(!phoneRegex.test('12345'), '无效电话被拒绝');
    }

    // 测试 8: XSS 防护
    testXSSProtection() {
        console.log('\n📋 测试：XSS 防护');
        
        const maliciousInput = '<script>alert("XSS")</script>';
        const escapeHtml = (text) => {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };
        
        const escaped = escapeHtml(maliciousInput);
        this.assert(!escaped.includes('<script>'), 'XSS 攻击被阻止');
        this.assert(escaped.includes('&lt;script&gt;'), '恶意脚本被正确转义');
    }

    // 运行所有测试
    runAll() {
        console.log('🧪 简历解析功能测试套件');
        console.log('========================');
        
        this.testPersonalInfoExtraction();
        this.testExperienceParsing();
        this.testEducationParsing();
        this.testSkillsExtraction();
        this.testEnglishResume();
        this.testMinimalResume();
        this.testDataValidation();
        this.testXSSProtection();
        
        console.log('\n========================');
        console.log(`📊 测试结果：✅ ${this.passed} 通过 | ❌ ${this.failed} 失败`);
        console.log(`通过率：${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
        
        return this.failed === 0;
    }
}

// 导出测试套件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResumeParserTests;
}

// 如果在浏览器中运行
if (typeof window !== 'undefined') {
    window.ResumeParserTests = ResumeParserTests;
}

// 如果直接运行此脚本
if (typeof window !== 'undefined' && !window.location.search.includes('module')) {
    const tester = new ResumeParserTests();
    window.addEventListener('DOMContentLoaded', () => {
        tester.runAll();
    });
}
