/**
 * AI简历优化器 - 功能自动化测试
 * 验证所有新增功能（3档优化、量化成就、ATS对齐）
 */

// 模拟浏览器环境
globalThis.window = {
    aiOptimizer: null,
    store: null
};
globalThis.document = {
    getElementById: () => ({
        innerHTML: '',
        className: '',
        style: {}
    }),
    addEventListener: () => {}
};
globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};
globalThis.showNotification = (msg, type) => console.log(`[${type.toUpperCase()}] ${msg}`);

async function runTests() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║     🧪 AI简历优化器 - 自动化功能测试           ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    let passedTests = 0;
    let failedTests = 0;

    // ========== 测试1：3档优化级别配置 ==========
    console.log('📋 测试1/5: 3档优化级别配置验证');
    try {
        // 动态导入aiOptimizer模块
        const { AIOptimizer } = await import('./src/lib/aiOptimizer.js');
        const optimizer = new AIOptimizer();

        // 验证optimizationLevels对象存在
        if (!optimizer.optimizationLevels) {
            throw new Error('❌ optimizationLevels 未定义');
        }

        // 验证3个级别都存在
        const levels = ['light', 'medium', 'deep'];
        for (const level of levels) {
            if (!optimizer.optimizationLevels[level]) {
                throw new Error(`❌ 缺少优化级别: ${level}`);
            }
            
            const levelInfo = optimizer.optimizationLevels[level];
            
            // 验证必要属性
            if (!levelInfo.name || !levelInfo.description || !levelInfo.icon || !levelInfo.color) {
                throw new Error(`❌ 级别 ${level} 缺少必要属性`);
            }

            // 验证promptTemplate存在且包含关键指令
            if (!levelInfo.promptTemplate) {
                throw new Error(`❌ 级别 ${level} 缺少 promptTemplate`);
            }
        }

        console.log(`   ✅ 3档优化级别全部正确配置:`);
        console.log(`      - 轻度 (${optimizer.optimizationLevels.light.name}): ${optimizer.optimizationLevels.light.icon}`);
        console.log(`      - 中度 (${optimizer.optimizationLevels.medium.name}): ${optimizer.optimizationLevels.medium.icon}`);
        console.log(`      - 深度 (${optimizer.optimizationLevels.deep.name}): ${optimizer.optimizationLevels.deep.icon}`);
        passedTests++;
    } catch (error) {
        console.error(`   ❌ 测试1失败: ${error.message}`);
        failedTests++;
    }

    // ========== 测试2：量化成就提取器 ==========
    console.log('\n📊 测试2/5: 量化成就提取器验证');
    try {
        const { AIOptimizer } = await import('./src/lib/aiOptimizer.js');
        const optimizer = new AIOptimizer();

        // 测试用例1：包含百分比的数据
        const testText1 = `
        在项目中，我通过优化算法提升了30%的处理效率，
        同时降低了15%的运营成本。团队规模扩大了2倍，
        实现了200万元的营收增长。
        `;

        const achievements1 = optimizer.extractQuantifiableAchievements(testText1);
        
        if (!Array.isArray(achievements1)) {
            throw new Error('❌ extractQuantifiableAchievements 应返回数组');
        }

        if (achievements1.length < 4) {
            throw new Error(`❌ 应该提取到至少4条量化成就，实际只提取到 ${achievements1.length} 条`);
        }

        console.log(`   ✅ 成功从文本中提取 ${achievements1.length} 条量化成就:`);
        achievements1.forEach((ach, i) => {
            console.log(`      ${i + 1}. [${ach.type}] ${ach.value} - "${ach.context.substring(0, 40)}..."`);
        });

        // 测试用例2：空文本
        const achievements2 = optimizer.extractQuantifiableAchievements('');
        if (achievements2.length !== 0) {
            throw new Error('❌ 空文本应该返回空数组');
        }

        console.log(`   ✅ 空文本处理正确（返回空数组）`);
        passedTests++;
    } catch (error) {
        console.error(`   ❌ 测试2失败: ${error.message}`);
        failedTests++;
    }

    // ========== 测试3：ATS关键词对齐系统 ==========
    console.log('\n🔍 测试3/5: ATS关键词对齐系统验证');
    try {
        const { AIOptimizer } = await import('./src/lib/aiOptimizer.js');
        const optimizer = new AIOptimizer();

        // 模拟职位描述（JD）
        const jobDescription = `
        我们正在寻找一位高级前端工程师，要求：
        - 精通 React、Vue、TypeScript
        - 熟悉 Node.js、Docker、Kubernetes
        - 有良好的团队协作和项目管理能力
        - 具备数据分析能力
        `;

        // 模拟简历内容
        const resumeContent = `
        张三，5年前端开发经验。
        技能：React、Vue、JavaScript、HTML/CSS
        工作经历：
        - 使用React开发企业级应用
        - 参与团队协作完成多个项目
        `;

        const atsResult = optimizer.alignATSKeywords(jobDescription, resumeContent);

        // 验证返回结构
        if (!atsResult.matched || !atsResult.missing || !atsResult.score === undefined) {
            throw new Error('❌ alignATSKeywords 返回结构不完整');
        }

        // 验证匹配到的关键词
        if (atsResult.matched.length === 0) {
            throw new Error('❌ 应该匹配到至少部分关键词');
        }

        // 验证缺失的关键词
        if (atsResult.missing.length === 0) {
            console.warn('   ⚠️  所有JD关键词都在简历中找到（可能测试数据太简单）');
        }

        // 验证分数范围
        if (atsResult.score < 0 || atsResult.score > 100) {
            throw new Error(`❌ 匹配分数应在0-100之间，实际值: ${atsResult.score}`);
        }

        console.log(`   ✅ ATS分析结果:`);
        console.log(`      - 匹配关键词数: ${atsResult.matched.length} 个`);
        console.log(`      - 缺失关键词数: ${atsResult.missing.length} 个`);
        console.log(`      - 匹配分数: ${atsResult.score}/100`);
        console.log(`      - 建议: ${atsResult.suggestion}`);

        if (atsResult.missing.length > 0) {
            console.log(`      - 建议添加的关键词: ${atsResult.missing.slice(0, 3).join(', ')}`);
        }

        passedTests++;
    } catch (error) {
        console.error(`   ❌ 测试3失败: ${error.message}`);
        failedTests++;
    }

    // ========== 测试4：优化级别切换功能 ==========
    console.log('\n🔄 测试4/5: 优化级别切换功能验证');
    try {
        const { AIOptimizer } = await import('./src/lib/aiOptimizer.js');
        const optimizer = new AIOptimizer();

        // 初始级别应该是medium
        if (optimizer.currentLevel !== 'medium') {
            console.warn(`   ⚠️  默认级别不是medium，当前是: ${optimizer.currentLevel}`);
        }

        // 测试切换到light
        optimizer.selectOptimizationLevel('light');
        if (optimizer.currentLevel !== 'light') {
            throw new Error('❌ 切换到light失败');
        }

        // 测试切换到deep
        optimizer.selectOptimizationLevel('deep');
        if (optimizer.currentLevel !== 'deep') {
            throw new Error('❌ 切换到deep失败');
        }

        // 测试切换回medium
        optimizer.selectOptimizationLevel('medium');
        if (optimizer.currentLevel !== 'medium') {
            throw new Error('❌ 切换到medium失败');
        }

        // 测试无效级别
        let invalidError = false;
        try {
            optimizer.selectOptimizationLevel('invalid_level');
        } catch (e) {
            invalidError = true;
        }
        if (!invalidError && optimizer.currentLevel === 'invalid_level') {
            throw new Error('❌ 无效级别不应该被接受');
        }

        console.log(`   ✅ 优化级别切换正常工作:`);
        console.log(`      - light → medium → deep 切换成功`);
        console.log(`      - 无效级别被正确拒绝`);
        passedTests++;
    } catch (error) {
        console.error(`   ❌ 测试4失败: ${error.message}`);
        failedTests++;
    }

    // ========== 测试5：Prompt模板质量检查 ==========
    console.log('\n📝 测试5/5: Prompt模板质量验证');
    try {
        const { AIOptimizer } = await import('./src/lib/aiOptimizer.js');
        const optimizer = new AIOptimizer();

        const levels = ['light', 'medium', 'deep'];
        for (const level of levels) {
            const prompt = optimizer.optimizationLevels[level].promptTemplate;

            // 检查必要的占位符
            if (!prompt.includes('{content}')) {
                throw new Error(`❌ ${level} 级别的prompt缺少 {content} 占位符`);
            }

            // medium和deep级别应该包含jobDescription
            if ((level === 'medium' || level === 'deep') && !prompt.includes('{jobDescription}')) {
                throw new Error(`❌ ${level} 级别的prompt缺少 {jobDescription} 占位符`);
            }

            // 检查prompt长度（确保足够详细）
            if (prompt.length < 100) {
                throw new Error(`❌ ${level} 级别的prompt过短(${prompt.length}字符)，可能不够详细`);
            }
        }

        // 特别检查deep级别的复杂度
        const deepPrompt = optimizer.optimizationLevels.deep.promptTemplate;
        const deepSteps = ['第一步', '第二步', '第三步', '第四步', '第五步', '第六步'];
        let stepCount = 0;
        deepSteps.forEach(step => {
            if (deepPrompt.includes(step)) stepCount++;
        });

        if (stepCount < 4) {
            throw new Error(`❌ Deep级别应该包含多步骤指导，实际只包含${stepCount}步`);
        }

        console.log(`   ✅ Prompt模板质量检查通过:`);
        console.log(`      - Light prompt: ${optimizer.optimizationLevels.light.promptTemplate.length} 字符`);
        console.log(`      - Medium prompt: ${optimizer.optimizationLevels.medium.promptTemplate.length} 字符`);
        console.log(`      - Deep prompt: ${optimizer.optimizationLevels.deep.promptTemplate.length} 字符 (${stepCount}步详细指导)`);
        passedTests++;
    } catch (error) {
        console.error(`   ❌ 测试5失败: ${error.message}`);
        failedTests++;
    }

    // ========== 测试结果汇总 ==========
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║              📊 测试结果汇总                   ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  ✅ 通过: ${passedTests.toString().padStart(2)} 个测试                          ║`);
    console.log(`║  ❌ 失败: ${failedTests.toString().padStart(2)} 个测试                          ║`);
    console.log(`║  📈 通过率: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(0).padStart(3)}%                            ║`);
    console.log('╚══════════════════════════════════════════════════╝');

    if (failedTests === 0) {
        console.log('\n🎉 所有测试通过！功能实现完全正确！\n');
        process.exit(0);
    } else {
        console.error(`\n⚠️  有 ${failedTests} 个测试失败，请检查上述错误信息\n`);
        process.exit(1);
    }
}

runTests().catch(error => {
    console.error('💥 测试运行出错:', error);
    process.exit(1);
});
