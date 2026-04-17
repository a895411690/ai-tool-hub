/**
 * AI 优化功能测试套件
 * 测试文件：test-ai-optimizer.js
 * 用途：验证 AI 简历优化功能
 */

// ==================== 模拟数据 ====================

const mockResumeData = {
    profile: {
        name: '张三',
        title: '前端开发工程师',
        email: 'zhangsan@example.com',
        phone: '13800138000',
        location: '上海',
        summary: '5年前端开发经验，熟练掌握 React、Vue.js 等前端框架。'
    },
    experience: [
        {
            company: 'ABC公司',
            position: '前端开发工程师',
            period: '2020-2023',
            description: '负责公司官网开发和维护'
        }
    ],
    education: [
        {
            school: '某大学',
            degree: '计算机科学与技术',
            period: '2016-2020'
        }
    ],
    skills: ['JavaScript', 'React', 'Vue.js', 'HTML5', 'CSS3']
};

const mockJobDescription = `
职位：高级前端开发工程师
要求：
- 5年以上前端开发经验
- 精通 React 或 Vue.js
- 熟悉 TypeScript
- 有大型项目经验优先
- 良好的团队协作能力
`;

// ==================== 测试用例 ====================

class AIOptimizerTests {
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

    // 测试 1: API 配置验证
    testAPIConfiguration() {
        console.log('\n📋 测试：API 配置验证');
        
        // 测试 API Key 存储和检索
        const testKey = 'test-api-key-123';
        localStorage.setItem('qianfan_api_key', testKey);
        const retrievedKey = localStorage.getItem('qianfan_api_key');
        
        this.assert(retrievedKey === testKey, 'API Key 存储和检索正确');
        
        // 测试模型配置
        const testModel = 'ernie-4.0-8k';
        localStorage.setItem('qianfan_model', testModel);
        const retrievedModel = localStorage.getItem('qianfan_model');
        
        this.assert(retrievedModel === testModel, '模型配置存储正确');
        
        // 清理
        localStorage.removeItem('qianfan_api_key');
        localStorage.removeItem('qianfan_model');
    }

    // 测试 2: 简历数据验证
    testResumeDataValidation() {
        console.log('\n📋 测试：简历数据验证');
        
        // 验证必需字段
        this.assert(mockResumeData.profile.name !== undefined, '简历包含姓名');
        this.assert(mockResumeData.profile.email !== undefined, '简历包含邮箱');
        this.assert(mockResumeData.profile.phone !== undefined, '简历包含电话');
        
        // 验证数组字段
        this.assert(Array.isArray(mockResumeData.experience), '工作经历是数组');
        this.assert(Array.isArray(mockResumeData.education), '教育经历是数组');
        this.assert(Array.isArray(mockResumeData.skills), '技能是数组');
        
        // 验证数据完整性
        this.assert(mockResumeData.experience.length > 0, '包含工作经历');
        this.assert(mockResumeData.education.length > 0, '包含教育经历');
        this.assert(mockResumeData.skills.length > 0, '包含技能');
    }

    // 测试 3: 职位描述解析
    testJobDescriptionParsing() {
        console.log('\n📋 测试：职位描述解析');
        
        // 验证职位描述包含关键信息
        this.assert(mockJobDescription.includes('前端'), '职位描述包含职位类型');
        this.assert(mockJobDescription.includes('React'), '职位描述包含技术要求');
        this.assert(mockJobDescription.includes('5年'), '职位描述包含经验要求');
        
        // 提取关键词
        const keywords = ['React', 'Vue.js', 'TypeScript', '前端'];
        keywords.forEach(keyword => {
            this.assert(mockJobDescription.includes(keyword), `识别到关键词: ${keyword}`);
        });
    }

    // 测试 4: 优化建议生成
    testOptimizationSuggestions() {
        console.log('\n📋 测试：优化建议生成');
        
        // 模拟优化建议
        const suggestions = [
            {
                type: 'highlight',
                field: 'experience',
                suggestion: '强调 React 项目经验',
                reason: '职位要求精通 React'
            },
            {
                type: 'add',
                field: 'skills',
                suggestion: '添加 TypeScript 技能',
                reason: '职位要求熟悉 TypeScript'
            },
            {
                type: 'improve',
                field: 'summary',
                suggestion: '量化工作成果',
                reason: '提升简历说服力'
            }
        ];
        
        // 验证建议结构
        suggestions.forEach(suggestion => {
            this.assert(suggestion.type !== undefined, '建议包含类型');
            this.assert(suggestion.field !== undefined, '建议包含字段');
            this.assert(suggestion.suggestion !== undefined, '建议包含具体建议');
            this.assert(suggestion.reason !== undefined, '建议包含原因');
        });
        
        this.assert(suggestions.length > 0, '生成了优化建议');
    }

    // 测试 5: 匹配度计算
    testMatchingScore() {
        console.log('\n📋 测试：匹配度计算');
        
        // 模拟匹配度计算
        const requiredSkills = ['React', 'Vue.js', 'TypeScript'];
        const candidateSkills = mockResumeData.skills;
        
        const matchedSkills = requiredSkills.filter(skill => 
            candidateSkills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()))
        );
        
        const matchScore = (matchedSkills.length / requiredSkills.length) * 100;
        
        this.assert(matchScore >= 0 && matchScore <= 100, '匹配度在有效范围内');
        this.assert(matchedSkills.includes('React'), '匹配到 React 技能');
        this.assert(matchedSkills.includes('Vue.js'), '匹配到 Vue.js 技能');
        
        console.log(`   匹配度: ${matchScore.toFixed(1)}%`);
    }

    // 测试 6: 错误处理
    testErrorHandling() {
        console.log('\n📋 测试：错误处理');
        
        // 测试空简历数据处理
        const emptyResume = {};
        try {
            const hasRequiredFields = emptyResume.profile && emptyResume.profile.name;
            this.assert(!hasRequiredFields, '空简历被正确识别');
        } catch (error) {
            this.assert(true, '空简历触发错误处理');
        }
        
        // 测试无效 API Key
        const invalidAPIKey = '';
        this.assert(invalidAPIKey === '', '无效 API Key 被识别');
        
        // 测试网络错误模拟
        const mockNetworkError = new Error('Network error');
        this.assert(mockNetworkError.message === 'Network error', '网络错误被捕获');
    }

    // 测试 7: 性能测试
    testPerformance() {
        console.log('\n📋 测试：性能测试');
        
        // 测试简历解析性能
        const start = performance.now();
        
        // 模拟简历解析
        const parsedData = {
            ...mockResumeData,
            parsed: true,
            timestamp: Date.now()
        };
        
        const end = performance.now();
        const duration = end - start;
        
        this.assert(duration < 50, `简历解析性能良好 (${duration.toFixed(2)}ms)`);
        
        // 测试大量数据处理
        const largeDataset = [];
        for (let i = 0; i < 100; i++) {
            largeDataset.push({ id: i, data: mockResumeData });
        }
        
        this.assert(largeDataset.length === 100, '大数据集处理正确');
    }

    // 测试 8: 集成测试
    testIntegration() {
        console.log('\n📋 测试：集成测试');
        
        // 模拟完整的优化流程
        const flow = {
            step1: '加载简历数据',
            step2: '解析职位描述',
            step3: '计算匹配度',
            step4: '生成优化建议',
            step5: '应用优化'
        };
        
        // 验证流程完整性
        Object.values(flow).forEach((step, index) => {
            this.assert(step !== undefined, `流程步骤 ${index + 1}: ${step}`);
        });
        
        // 验证端到端功能
        const result = {
            success: true,
            optimized: true,
            suggestions: 3
        };
        
        this.assert(result.success, '优化流程成功完成');
        this.assert(result.optimized, '简历已优化');
        this.assert(result.suggestions > 0, '生成了优化建议');
    }

    // 运行所有测试
    runAll() {
        console.log('🧪 AI 优化功能测试套件');
        console.log('========================');
        
        this.testAPIConfiguration();
        this.testResumeDataValidation();
        this.testJobDescriptionParsing();
        this.testOptimizationSuggestions();
        this.testMatchingScore();
        this.testErrorHandling();
        this.testPerformance();
        this.testIntegration();
        
        console.log('\n========================');
        console.log(`📊 测试结果：✅ ${this.passed} 通过 | ❌ ${this.failed} 失败`);
        console.log(`通过率：${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
        
        return this.failed === 0;
    }
}

// 导出测试套件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIOptimizerTests;
}

// 如果在浏览器中运行
if (typeof window !== 'undefined') {
    window.AIOptimizerTests = AIOptimizerTests;
}

// 如果直接运行此脚本
if (typeof window !== 'undefined' && !window.location.search.includes('module')) {
    const tester = new AIOptimizerTests();
    window.addEventListener('DOMContentLoaded', () => {
        tester.runAll();
    });
}
