/**
 * 直接测试简历解析准确性
 */

// 模拟浏览器环境
global.window = { document: { createElement: () => ({}) } };
global.document = global.window.document;

// 读取测试简历
const fs = require('fs');
const testResume = fs.readFileSync('./test_weijiahao_resume.txt', 'utf8');

console.log('🔍 直接测试简历解析准确性...\n');
console.log('📋 测试简历内容摘要:');
console.log('   姓名: 卫家豪');
console.log('   电话: 13311667685');
console.log('   邮箱: 895411690@qq.com');
console.log('   性别: 男');
console.log('   工作经验: 8年');
console.log('   工作经历: 2个项目');
console.log('   技能: React, Vue, TypeScript等\n');

// 尝试动态导入解析器
try {
    const { ImportUtils } = require('./src/lib/importUtils.js');
    const parser = new ImportUtils();
    
    console.log('✅ 解析器加载成功');
    
    // 解析简历
    const result = parser.parseTextContent(testResume);
    
    console.log('📊 解析结果:');
    
    // 1. 个人信息验证
    console.log('\n👤 个人信息验证:');
    const personalChecks = [
        { field: 'name', expected: '卫家豪', actual: result.profile.name },
        { field: 'phone', expected: '13311667685', actual: result.profile.phone },
        { field: 'email', expected: '895411690@qq.com', actual: result.profile.email },
        { field: 'gender', expected: '男', actual: result.profile.gender },
        { field: 'experience_years', expected: '8', actual: result.profile.experience_years }
    ];
    
    personalChecks.forEach(check => {
        const match = check.actual && check.actual.includes(check.expected) ? '✅' : '❌';
        console.log(`   ${match} ${check.field}: 期望 "${check.expected}", 得到 "${check.actual || '未识别'}"`);
    });
    
    // 2. 工作经历验证
    console.log('\n💼 工作经历验证:');
    if (result.experience && result.experience.length > 0) {
        console.log(`   ✅ 识别到 ${result.experience.length} 个工作经历`);
        result.experience.forEach((exp, i) => {
            console.log(`      ${i+1}. ${exp.company || '公司'}: ${exp.position || '职位'} (${exp.period || '时间'})`);
        });
    } else {
        console.log('   ❌ 未识别到工作经历');
    }
    
    // 3. 技能验证
    console.log('\n🛠️  技能验证:');
    if (result.skills && result.skills.length > 0) {
        console.log(`   ✅ 识别到 ${result.skills.length} 个技能`);
        console.log(`      技能: ${result.skills.slice(0, 10).join(', ')}`);
    } else {
        console.log('   ❌ 未识别到技能');
    }
    
    // 4. 统计
    console.log('\n📈 统计信息:');
    console.log(`   个人信息字段识别: ${Object.keys(result.profile).filter(k => result.profile[k]).length}/8`);
    console.log(`   工作经历数量: ${result.experience.length}`);
    console.log(`   技能数量: ${result.skills.length}`);
    
} catch (error) {
    console.error('❌ 解析器测试失败:', error.message);
    console.error('   堆栈:', error.stack);
}

console.log('\n🎯 测试完成');
