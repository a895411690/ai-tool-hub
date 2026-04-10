/**
 * 简历导入功能增强版测试
 */

// 模拟浏览器环境
global.window = { document: { createElement: () => ({}) } };
global.document = global.window.document;

// 导入增强版解析器
const fs = require('fs');
const importUtils = require('./src/lib/importUtils.js');

console.log('🔍 开始测试增强版简历导入功能...\n');

// 1. 读取测试简历文件
console.log('📋 1. 读取测试简历文件...');
const testResume = fs.readFileSync('./test_chinese_resume.txt', 'utf8');
console.log('   ✅ 测试文件已加载，长度:', testResume.length, '字符');

// 2. 创建解析器实例
console.log('\n🔧 2. 创建解析器实例...');
const parser = new importUtils.ImportUtils();
console.log('   ✅ 解析器实例已创建');

// 3. 测试解析功能
console.log('\n🎯 3. 开始解析测试简历...');
try {
    const result = parser.parseTextContent(testResume);
    
    console.log('   ✅ 解析成功！');
    console.log('\n📊 解析结果摘要:');
    
    // 个人信息
    console.log('   👤 个人信息:');
    if (result.profile.name) console.log('     姓名:', result.profile.name);
    if (result.profile.phone) console.log('     电话:', result.profile.phone);
    if (result.profile.email) console.log('     邮箱:', result.profile.email);
    if (result.profile.gender) console.log('     性别:', result.profile.gender);
    if (result.profile.experience_years) console.log('     工作经验:', result.profile.experience_years);
    
    // 工作经历
    console.log('\n   💼 工作经历:');
    if (result.experience && result.experience.length > 0) {
        result.experience.forEach((exp, i) => {
            console.log(`     ${i+1}. ${exp.company} - ${exp.position} (${exp.period})`);
        });
    } else {
        console.log('     未识别到工作经历');
    }
    
    // 技能
    console.log('\n   🛠️  专业技能:');
    if (result.skills && result.skills.length > 0) {
        console.log('     ', result.skills.slice(0, 10).join(', '));
        if (result.skills.length > 10) console.log('     ... 还有', result.skills.length - 10, '个技能');
    } else {
        console.log('     未识别到技能');
    }
    
    // 项目经验
    console.log('\n   📁 项目经验:');
    if (result.projects && result.projects.length > 0) {
        result.projects.forEach((proj, i) => {
            console.log(`     ${i+1}. ${proj.name || '未命名项目'}`);
        });
    } else {
        console.log('     未识别到项目经验');
    }
    
    // 详细统计
    console.log('\n📈 详细统计:');
    console.log('   个人信息字段:', Object.keys(result.profile).filter(k => result.profile[k]).length);
    console.log('   工作经历数量:', result.experience.length);
    console.log('   技能数量:', result.skills.length);
    console.log('   项目经验数量:', result.projects.length);
    
} catch (error) {
    console.error('   ❌ 解析失败:', error.message);
    console.error('   堆栈:', error.stack);
}

console.log('\n✅ 测试完成');
