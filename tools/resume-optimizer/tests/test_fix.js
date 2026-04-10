/**
 * 简历导入功能修复验证
 */

// 模拟浏览器环境
global.window = { document: { createElement: () => ({}) } };
global.document = global.window.document;

// 测试简历内容
const testResume = `个人简历-卫家豪

个人信息
姓名：卫家豪
电话：13311667685
邮箱：895411690@qq.com
性别：男
工作经验：8年
求职意向：测试工程师（资深/管理）

工作经历
零售信贷核心重构及企业级架构项目   高级测试工程师   2023.02-2025.01
项目描述：交通银行启动零售信贷核心重构及企业级架构项目，作为数字化转型战略的关键组成部分，旨在构建高效的数字化经营体系，提升业务灵活性，优化客户体验，并强化风险管理。

测试规划：在交通银行零售信贷核心重构及企业级架构项目中，根据需求文档制定详细测试计划，配置测试环境，确保测试覆盖全面。

广发信用卡新核心项目   测试组长   2022.10-2023.01
项目描述：该项目为广发信用卡大机核心优化升级项目，升级后的广发信用卡主机平台为业内最先进的系统，被称为信用卡中心的“最强心脏”。

专业技能
前端：React、Vue、TypeScript、HTML5、CSS3
后端：Node.js、Python、Java、MySQL、Redis
工具：Git、Docker、Jenkins、Webpack`;

console.log('🔍 开始验证简历导入功能修复...\n');

// 动态导入解析器
import('./src/lib/importUtils.js')
    .then(({ importUtils }) => {
        console.log('✅ 解析器加载成功');
        
        try {
            // 解析测试简历
            const result = importUtils.parseTextContent(testResume);
            
            console.log('✅ 解析成功！');
            console.log('\n📊 解析结果摘要:');
            
            // 个人信息
            console.log('👤 个人信息:');
            console.log(`   姓名: ${result.profile.name || '未识别'}`);
            console.log(`   电话: ${result.profile.phone || '未识别'}`);
            console.log(`   邮箱: ${result.profile.email || '未识别'}`);
            console.log(`   性别: ${result.profile.gender || '未识别'}`);
            console.log(`   工作经验: ${result.profile.experience_years || '未识别'}年`);
            
            // 工作经历
            console.log('\n💼 工作经历:');
            if (result.experience && result.experience.length > 0) {
                result.experience.forEach((exp, i) => {
                    console.log(`   ${i+1}. ${exp.company || '公司'} - ${exp.position || '职位'} (${exp.period || '时间'})`);
                });
            } else {
                console.log('   未识别到工作经历');
            }
            
            // 技能
            console.log('\n🛠️  专业技能:');
            if (result.skills && result.skills.length > 0) {
                console.log(`   ${result.skills.slice(0, 10).join(', ')}`);
                if (result.skills.length > 10) {
                    console.log(`   ... 还有 ${result.skills.length - 10} 个技能`);
                }
            } else {
                console.log('   未识别到技能');
            }
            
            // 统计信息
            console.log('\n📈 统计信息:');
            console.log(`   个人信息字段: ${Object.keys(result.profile).filter(k => result.profile[k]).length}`);
            console.log(`   工作经历数量: ${result.experience.length}`);
            console.log(`   技能数量: ${result.skills.length}`);
            
            console.log('\n🎉 修复验证完成！');
            
        } catch (error) {
            console.error('❌ 解析失败:', error.message);
            console.error('   堆栈:', error.stack);
        }
    })
    .catch(error => {
        console.error('❌ 解析器加载失败:', error.message);
    });
