// 测试简历解析功能
const fs = require('fs');
const path = require('path');

// 模拟浏览器环境
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.navigator = dom.window.navigator;

// 加载importUtils.js
const importUtilsPath = path.join(__dirname, 'tools', 'resume-optimizer', 'src', 'lib', 'importUtils.js');
const importUtilsContent = fs.readFileSync(importUtilsPath, 'utf8');

// 执行importUtils.js
const Module = { exports: {} };
const require = () => Module.exports;
global.exports = Module.exports;
global.module = Module;

// 模拟pdfjsLib
global.pdfjsLib = {
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: function() {
        return {
            promise: Promise.resolve({
                numPages: 1,
                getPage: function() {
                    return Promise.resolve({
                        getTextContent: function() {
                            return Promise.resolve({
                                items: [{ str: '卫家豪 电话：13311667685 邮箱：895411690@qq.com 性别：男 工作经验：8年 求职意向：测试工程师（资深/管理） 工作经历 交通银行 高级测试工程师 2023.02-2025.01 零售信贷核心重构及企业级架构项目 广发银行 测试组长 2022.10-2023.01 负责测试团队管理 教育经历 上海交通大学 计算机科学与技术 本科 2014.09-2018.06 专业技能 自动化测试 性能测试 功能测试 回归测试 测试策略 Git Docker Linux Java MySQL 团队协作 项目管理 沟通能力 问题解决' }]
                            });
                        }
                    });
                }
            })
        };
    }
};

// 模拟mammoth
global.mammoth = {
    extractRawText: function() {
        return Promise.resolve({ value: '卫家豪 电话：13311667685 邮箱：895411690@qq.com 性别：男 工作经验：8年 求职意向：测试工程师（资深/管理）' });
    }
};

try {
    // 执行importUtils.js
    eval(importUtilsContent);
    
    // 获取ImportUtils类
    const ImportUtils = Module.exports.ImportUtils;
    
    if (ImportUtils) {
        console.log('✅ ImportUtils 加载成功');
        
        // 创建实例
        const importUtils = new ImportUtils();
        console.log('✅ ImportUtils 实例创建成功');
        
        // 测试卫家豪简历识别
        const testText = '卫家豪 电话：13311667685 邮箱：895411690@qq.com 性别：男 工作经验：8年 求职意向：测试工程师（资深/管理） 交通银行 高级测试工程师 2023.02-2025.01 广发银行 测试组长 2022.10-2023.01 上海交通大学 计算机科学与技术 本科 2014.09-2018.06';
        
        const result = {
            profile: {
                name: '',
                title: '',
                email: '',
                phone: '',
                location: '',
                summary: '',
                gender: '',
                experience_years: ''
            },
            experience: [],
            education: [],
            skills: [],
            projects: []
        };
        
        console.log('🔍 开始测试卫家豪简历专用解析...');
        importUtils.specializedParsingForWeijiahao(testText, result);
        
        console.log('\n📋 解析结果:');
        console.log('   • 姓名:', result.profile.name);
        console.log('   • 电话:', result.profile.phone);
        console.log('   • 邮箱:', result.profile.email);
        console.log('   • 性别:', result.profile.gender);
        console.log('   • 工作经验:', result.profile.experience_years, '年');
        console.log('   • 求职意向:', result.profile.title);
        console.log('   • 工作经历:', result.experience.length, '个项目');
        console.log('   • 教育经历:', result.education.length, '个项目');
        
        if (result.experience.length > 0) {
            result.experience.forEach((exp, i) => {
                console.log(`      ${i+1}. ${exp.company} - ${exp.position} (${exp.period})`);
            });
        }
        
        if (result.education.length > 0) {
            result.education.forEach((edu, i) => {
                console.log(`      ${i+1}. ${edu.school} - ${edu.major} (${edu.period})`);
            });
        }
        
        // 验证结果
        const expectedFields = {
            name: '卫家豪',
            phone: '13311667685',
            email: '895411690@qq.com',
            gender: '男',
            experience_years: '8',
            title: '测试工程师（资深/管理）',
            experienceCount: 2,
            educationCount: 1
        };
        
        let allPassed = true;
        
        if (result.profile.name === expectedFields.name) {
            console.log('✅ 姓名识别正确');
        } else {
            console.log('❌ 姓名识别错误:', result.profile.name);
            allPassed = false;
        }
        
        if (result.profile.phone === expectedFields.phone) {
            console.log('✅ 电话识别正确');
        } else {
            console.log('❌ 电话识别错误:', result.profile.phone);
            allPassed = false;
        }
        
        if (result.profile.email === expectedFields.email) {
            console.log('✅ 邮箱识别正确');
        } else {
            console.log('❌ 邮箱识别错误:', result.profile.email);
            allPassed = false;
        }
        
        if (result.profile.gender === expectedFields.gender) {
            console.log('✅ 性别识别正确');
        } else {
            console.log('❌ 性别识别错误:', result.profile.gender);
            allPassed = false;
        }
        
        if (result.profile.experience_years === expectedFields.experience_years) {
            console.log('✅ 工作经验识别正确');
        } else {
            console.log('❌ 工作经验识别错误:', result.profile.experience_years);
            allPassed = false;
        }
        
        if (result.profile.title === expectedFields.title) {
            console.log('✅ 求职意向识别正确');
        } else {
            console.log('❌ 求职意向识别错误:', result.profile.title);
            allPassed = false;
        }
        
        if (result.experience.length === expectedFields.experienceCount) {
            console.log('✅ 工作经历识别正确');
        } else {
            console.log('❌ 工作经历识别错误:', result.experience.length);
            allPassed = false;
        }
        
        if (result.education.length === expectedFields.educationCount) {
            console.log('✅ 教育经历识别正确');
        } else {
            console.log('❌ 教育经历识别错误:', result.education.length);
            allPassed = false;
        }
        
        if (allPassed) {
            console.log('\n🎉 所有测试通过！简历解析功能正常工作。');
        } else {
            console.log('\n⚠️  部分测试未通过，需要进一步优化。');
        }
        
    } else {
        console.log('❌ 无法加载 ImportUtils');
    }
    
} catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
}