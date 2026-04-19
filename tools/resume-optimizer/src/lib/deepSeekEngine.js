/**
 * DeepSeek AI Engine - 求职方舟同款大模型
 * 
 * 基于DeepSeek API实现专业级简历优化
 * 支持三档智能优化：轻度/中度/深度
 */

class DeepSeekEngine {
    constructor(apiKey = '') {
        this.apiKey = apiKey || localStorage.getItem('deepseek_api_key') || '';
        this.baseUrl = 'https://api.deepseek.com/v1';
        this.model = 'deepseek-chat'; // 使用DeepSeek-V3或DeepSeek-Coder
        this.timeout = 60000; // 60秒超时
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('deepseek_api_key', key);
        return true;
    }

    getApiKey() {
        return this.apiKey;
    }

    hasApiKey() {
        return !!this.apiKey && this.apiKey.length > 10;
    }

    /**
     * 调用DeepSeek API
     */
    async _callAPI(messages, options = {}) {
        if (!this.hasApiKey()) {
            throw new Error('请先配置DeepSeek API Key');
        }

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 4096,
                top_p: options.topP || 0.9,
                frequency_penalty: options.frequencyPenalty || 0.3,
                presence_penalty: options.presencePenalty || 0.1
            }),
            signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `API请求失败: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }

    /**
     * 轻度优化 - 语言润色（参考求职方舟）
     */
    async lightOptimize(resumeText, jobDescription = '') {
        const systemPrompt = `你是一位专业的简历润色专家。你的任务是对用户的简历进行轻度优化。

【优化原则】
1. 保持原始内容和原意不变
2. 修正语法错误、错别字
3. 优化语言表达，使其更专业流畅
4. 统一格式和标点符号
5. 不添加不存在的信息

【输出要求】
请直接输出优化后的完整简历内容（Markdown格式），不要包含任何解释性文字。

【原文】
${resumeText}

${jobDescription ? `\n【目标职位参考】\n${jobDescription}\n（仅用于调整语气风格）` : ''}`;

        try {
            const optimizedContent = await this._callAPI([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: '请对以上简历进行轻度语言润色优化：' }
            ], { temperature: 0.5, maxTokens: 2048 });

            return {
                level: 'light',
                score: this._estimateScore(resumeText, optimizedContent, 0.85),
                optimizedContent: optimizedContent.trim(),
                suggestions: [
                    { icon: '✨', title: '语言润色', desc: '已优化表达方式，更专业流畅' },
                    { icon: '📝', title: '格式规范', desc: '统一了格式和标点符号' },
                    { icon: '✅', title: '语法检查', desc: '修正了潜在的语法问题' }
                ],
                summary: '轻度优化完成！主要改进了语言表达的流畅性和专业性，保持了原始内容的完整性。',
                processingTime: '~3秒',
                model: 'DeepSeek-V3'
            };
        } catch (error) {
            console.error('轻度优化失败:', error);
            throw new Error(`轻度优化失败: ${error.message}`);
        }
    }

    /**
     * 中度优化 - 关键词对齐+成果量化（推荐）
     */
    async mediumOptimize(resumeText, jobDescription) {
        if (!jobDescription) {
            throw new Error('中度优化需要提供目标职位描述（JD）');
        }

        const systemPrompt = `你是一位资深的HR专家和职业顾问，拥有15年+的招聘经验。你的任务是根据目标岗位JD对简历进行中度优化。

【核心能力】
- 精通ATS（Applicant Tracking System）筛选机制
- 擅长关键词匹配和对齐
- 能够量化工作成果和数据化表达
- 了解各行业招聘标准和偏好

【优化策略】
1. **关键词对齐**：从JD中提取核心技能关键词，自然融入简历
2. **成果量化**：将定性描述改为定量描述（如"提升了效率"→"效率提升40%"）
3. **行为动词强化**：使用更有力的动词（如"负责"→"主导"、"参与"→"推动"）
4. **ATS优化**：确保关键技能词出现频率适中，通过ATS筛选
5. **保持真实性**：不编造经历，只优化表达方式

【JD分析重点】
请仔细分析以下JD的要求：
- 必备技能有哪些？
- 经验年限要求？
- 核心职责是什么？
- 隐含的软技能需求？

【输出格式】
直接输出优化后的完整简历（Markdown格式），并在末尾附上：
\`\`\`
---
## 📊 优化说明
- **新增关键词**: [列出新增的关键词]
- **量化数据**: [列出新增加的数据指标]
- **匹配度预估**: [XX%]
\`\`\`

【原始简历】
${resumeText}

【目标职位JD】
${jobDescription}`;

        try {
            const startTime = Date.now();
            const optimizedContent = await this._callAPI([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: '请根据以上JD对简历进行中度优化：' }
            ], { temperature: 0.6, maxTokens: 3072 });

            const processingTime = `${((Date.now() - startTime) / 1000).toFixed(1)}秒`;

            // 解析优化说明
            const optimizationNotes = this._parseOptimizationNotes(optimizedContent);

            return {
                level: 'medium',
                score: this._estimateScore(resumeText, optimizedContent, 0.88),
                optimizedContent: optimizedContent.split('---')[0].trim(),
                changes: this._extractChanges(resumeText, optimizedContent),
                suggestions: [
                    { icon: '🎯', title: '关键词对齐', desc: optimizationNotes.keywords || `已对齐JD关键技能词` },
                    { icon: '📊', title: '成果量化', desc: optimizationNotes.quantified || '已为工作经历添加具体数据指标' },
                    { icon: '⚡', title: '行为动词强化', desc: '使用了更强有力的行为动词' },
                    { icon: '🔍', title: 'ATS优化', desc: `预计ATS通过率提升至${optimizationNotes.matchRate || '85%'}%` }
                ],
                summary: `中度优化完成！${optimizationNotes.matchRate ? `职位匹配度${optimizationNotes.matchRate}%` : ''}已根据JD进行针对性优化，量化了工作成果。`,
                jdMatch: parseInt(optimizationNotes.matchRate) || 82,
                atsScore: Math.min(100, (parseInt(optimizationNotes.matchRate) || 82) + 8),
                keywordsAdded: optimizationNotes.addedKeywords || [],
                processingTime: processingTime,
                model: 'DeepSeek-V3'
            };
        } catch (error) {
            console.error('中度优化失败:', error);
            throw new Error(`中度优化失败: ${error.message}`);
        }
    }

    /**
     * 深度优化 - STAR法则重构+个人品牌塑造
     */
    async deepOptimize(resumeText, jobDescription) {
        if (!jobDescription) {
            throw new Error('深度优化需要提供目标职位描述（JD）');
        }

        const systemPrompt = `你是一位世界顶级的职业规划师和简历架构师，曾帮助数千名求职者进入BAT等一线企业。你的任务是对简历进行深度重构和品牌升级。

【专业背景】
- 20年+职业咨询经验
- 熟悉STAR法则、CAR法则等专业方法论
- 深刻理解HR心理和招聘决策逻辑
- 擅长个人品牌定位和价值主张设计

【深度优化框架】

### 1️⃣ 个人品牌重塑
- 提炼独特的价值主张（Value Proposition）
- 打造差异化的职业标签
- 构建专业的个人简介（Professional Summary）

### 2️⃣ STAR法则重构所有项目经历
对于每个项目/工作经历，按以下结构重组：
- **S**ituation（情境）：项目背景、挑战、业务场景
- **T**ask（任务）：你的角色、责任、目标
- **A**ction（行动）：采取的具体行动、方法、工具
- **R**esult（结果）：量化成果、影响、认可

### 3️⃣ 技能矩阵优化
- 技能分类（核心技术/通用技能/软技能）
- 技能熟练度标注
- 与JD高度对齐

### 4️⃣ 终极ATS优化
- 关键词密度优化
- 格式兼容性检查
- 排版结构优化

### 5️⃣ 差异化亮点挖掘
- 独特成就提炼
- 竞争优势突出
- 故事化叙述增强感染力

【输出要求】
请输出完整的深度优化后简历（Markdown格式），结构如下：

# [姓名] - [差异化标签]

## 🎯 Professional Summary（个人品牌宣言）
[3-4句话的价值主张]

## 💼 Core Competencies（核心竞争力）
[6-8个核心能力标签]

## 🚀 Professional Experience（STAR法则重构）

### [公司名称] | [职位] | [时间]
**Context（背景）**
[项目/业务背景]

**Challenge（挑战）**
[面临的核心挑战]

**Solution（方案）**
[你的具体行动和方法]

**Impact（影响）**
[量化的结果和影响]

...（其他经历类似）

## 🛠 Technical Skills / Skills
[分类展示技能]

---

## 📋 Optimization Report
- **Brand Position**: [品牌定位]
- **STAR Applications**: [X个经历已完成STAR重构]
- **Keywords Optimized**: [X个关键词]
- **Predicted Match Rate**: [XX%]
- **ATS Score**: [XX/100]

【原始简历】
${resumeText}

【目标职位JD】
${jobDescription}`;

        try {
            const startTime = Date.now();
            const optimizedContent = await this._callAPI([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: '请对简历进行深度优化重构：' }
            ], { temperature: 0.75, maxTokens: 5000, topP: 0.95 });

            const processingTime = `${((Date.now() - startTime) / 1000).toFixed(1)}秒`;

            // 解析优化报告
            const report = this._parseDeepReport(optimizedContent);

            return {
                level: 'deep',
                score: this._estimateScore(resumeText, optimizedContent, 0.92),
                optimizedContent: optimizedContent.split('---')[0].trim(),
                changes: this._extractChanges(resumeText, optimizedContent),
                suggestions: [
                    { icon: '⭐', title: 'STAR法则重构', desc: `${report.starCount || '所有'}经历已完成情境-任务-行动-结果重组` },
                    { icon: '👔', title: '个人品牌塑造', desc: `打造独特的"${report.brandPosition || '职业专家'}"定位` },
                    { icon: '🔍', title: '终极ATS优化', desc: `预测ATS评分${report.atsScore || '92'}/100` },
                    { icon: '💡', title: '差异化亮点', desc: '突出独特成就和核心竞争力' }
                ],
                summary: `深度优化完成！综合评分优秀，职位匹配度${report.matchRate || '90'}%，已完成全面重构和个人品牌重塑。`,
                jdMatch: parseInt(report.matchRate) || 90,
                atsScore: parseInt(report.atsScore) || 92,
                brandPosition: report.brandPosition,
                starApplications: report.starCount,
                keywordsOptimized: report.keywordsOptimized,
                processingTime: processingTime,
                model: 'DeepSeek-V3',
                fullReport: optimizedContent
            };
        } catch (error) {
            console.error('深度优化失败:', error);
            throw new Error(`深度优化失败: ${error.message}`);
        }
    }

    /**
     * 分析JD提取关键信息
     */
    async analyzeJobDescription(jd) {
        const prompt = `请分析以下职位描述（JD），提取关键信息：

【JD内容】
${jd}

请以JSON格式返回：
{
  "jobTitle": "职位名称",
  "requiredSkills": ["必备技能1", "必备技能2", ...],
  "preferredSkills": ["优先技能1", ...],
  "experienceYears": 数字,
  "education": "学历要求",
  "responsibilities": ["主要职责1", ...],
  "keywords": ["关键词1", "关键词2", ...],
  "industry": "行业",
  "companyType": "公司类型",
  "matchDifficulty": "easy/medium/hard"
}`;

        try {
            const result = await this._callAPI([
                { role: 'system', content: '你是专业的JD分析专家，擅长提取职位关键信息。' },
                { role: 'user', content: prompt }
            ], { temperature: 0.3, maxTokens: 1024 });

            // 尝试解析JSON
            try {
                const jsonMatch = result.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                console.warn('JD分析JSON解析失败，返回原始文本');
            }

            return { rawAnalysis: result };
        } catch (error) {
            console.error('JD分析失败:', error);
            throw error;
        }
    }

    /**
     * 估算优化质量分数
     */
    _estimateScore(original, optimized, baseScore) {
        if (!original || !optimized) return baseScore * 100;

        let score = baseScore * 100;

        // 内容长度变化
        const lengthRatio = optimized.length / original.length;
        if (lengthRatio > 1.2 && lengthRatio < 1.8) {
            score += 5; // 合理的内容扩充
        }

        // 关键特征检测
        const features = [
            /\d+%/.test(optimized), // 包含百分比
            /\d+年/.test(optimized), // 包含年数
            /主导|带领|负责|推动|实施|构建|开发/.test(optimized), // 强动词
            /提升|增长|降低|减少|节省|优化|改进/.test(optimized), // 成果词汇
            /熟练|精通|掌握|熟悉|了解/.test(optimized), // 技能描述
        ];

        score += features.filter(Boolean).length * 2;

        return Math.min(99, Math.round(score));
    }

    /**
     * 解析优化说明
     */
    _parseOptimizationNotes(content) {
        const notes = {};
        
        // 匹配关键词
        const keywordsMatch = content.match(/新增关键词.*?:?\s*([^\n]+)/i);
        if (keywordsMatch) {
            notes.keywords = keywordsMatch[1].trim();
            notes.addedKeywords = keywordsMatch[1].split(/[,，、]/).map(k => k.trim()).filter(Boolean);
        }

        // 匹配量化数据
        const quantMatch = content.match(/量化数据.*?:?\s*([^\n]+)/i);
        if (quantMatch) {
            notes.quantified = quantMatch[1].trim();
        }

        // 匹配匹配度
        const matchMatch = content.match(/匹配度预估.*?(\d+)%/i);
        if (matchMatch) {
            notes.matchRate = matchMatch[1];
        }

        return notes;
    }

    /**
     * 解析深度优化报告
     */
    _parseDeepReport(content) {
        const report = {};

        const brandMatch = content.match(/Brand Position.*?:\s*([^\n]+)/i);
        if (brandMatch) report.brandPosition = brandMatch[1].trim();

        const starMatch = content.match(/STAR Applications.*?(\d+)/i);
        if (starMatch) report.starCount = starMatch[1];

        const keywordMatch = content.match(/Keywords Optimized.*?(\d+)/i);
        if (keywordMatch) report.keywordsOptimized = keywordMatch[1];

        const matchMatch = content.match(/Predicted Match Rate.*?(\d+)%/i);
        if (matchMatch) report.matchRate = matchMatch[1];

        const atsMatch = content.match(/ATS Score.*?(\d+)/i);
        if (atsMatch) report.atsScore = atsMatch[1];

        return report;
    }

    /**
     * 提取修改对比
     */
    _extractChanges(original, optimized) {
        return {
            original: original.slice(0, 500),
            optimized: optimized.slice(0, 500)
        };
    }

    /**
     * 测试API连接
     */
    async testConnection() {
        if (!this.hasApiKey()) {
            return { success: false, message: '请先配置API Key' };
        }

        try {
            const result = await this._callAPI([
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: 'Say "Connection successful" in Chinese.' }
            ], { maxTokens: 50, temperature: 0.1 });

            return {
                success: true,
                message: 'API连接成功',
                model: this.model,
                response: result
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}

// 导出单例实例
const deepSeekEngine = new DeepSeekEngine();

// 如果在浏览器环境，挂载到window
if (typeof window !== 'undefined') {
    window.DeepSeekEngine = DeepSeekEngine;
    window.deepSeekEngine = deepSeekEngine;
}

export default DeepSeekEngine;
export { deepSeekEngine };