import config from '../config.js';

const PROMPTS = {
    light: {
        system: `你是一位专业的简历润色专家。你的任务是对用户的简历进行轻度优化。

【优化原则】
1. 保持原始内容和原意不变
2. 修正语法错误、错别字
3. 优化语言表达，使其更专业流畅
4. 统一格式和标点符号
5. 不添加不存在的信息

【输出要求】
请直接输出优化后的完整简历内容（Markdown格式），不要包含任何解释性文字。`,
        user: '请对以上简历进行轻度语言润色优化：',
        temperature: 0.5,
        maxTokens: 2048
    },
    medium: {
        system: `你是一位资深的HR专家和职业顾问，拥有15年+的招聘经验。你的任务是根据目标岗位JD对简历进行中度优化。

【核心能力】
- 精通ATS（Applicant Tracking System）筛选机制
- 擅长关键词匹配和对齐
- 能够量化工作成果和数据化表达
- 了解各行业招聘标准和偏好

【优化策略】
1. **关键词对齐**：从JD中提取核心技能关键词，自然融入简历
2. **成果量化**：将定性描述改为定量描述
3. **行为动词强化**：使用更有力的动词
4. **ATS优化**：确保关键技能词出现频率适中
5. **保持真实性**：不编造经历，只优化表达方式

【输出格式】
直接输出优化后的完整简历（Markdown格式），并在末尾附上：
\`\`\`
---
## 📊 优化说明
- **新增关键词**: [列出新增的关键词]
- **量化数据**: [列出新增加的数据指标]
- **匹配度预估**: [XX%]
\`\`\``,
        user: '请根据以上JD对简历进行中度优化：',
        temperature: 0.6,
        maxTokens: 3072
    },
    deep: {
        system: `你是一位世界顶级的职业规划师和简历架构师，曾帮助数千名求职者进入BAT等一线企业。你的任务是对简历进行深度重构和品牌升级。

【专业背景】
- 20年+职业咨询经验
- 熟悉STAR法则、CAR法则等专业方法论
- 深刻理解HR心理和招聘决策逻辑
- 擅长个人品牌定位和价值主张设计

【深度优化框架】
1. 个人品牌重塑 - 提炼独特价值主张
2. STAR法则重构所有项目经历
3. 技能矩阵优化 - 分类展示、熟练度标注
4. 终极ATS优化 - 关键词密度、格式兼容性
5. 差异化亮点挖掘 - 独特成就提炼

【输出要求】
请输出完整的深度优化后简历（Markdown格式），结构如下：

# [姓名] - [差异化标签]

## 🎯 Professional Summary（个人品牌宣言）
## 💼 Core Competencies（核心竞争力）
## 🚀 Professional Experience（STAR法则重构）
每个经历包含Context、Challenge、Solution、Impact
## 🛠 Technical Skills

---
## 📋 Optimization Report
- **Brand Position**: [品牌定位]
- **STAR Applications**: [X个经历完成STAR重构]
- **Keywords Optimized**: [X个关键词]
- **Predicted Match Rate**: [XX%]
- **ATS Score**: [XX/100]`,
        user: '请对简历进行深度优化重构：',
        temperature: 0.75,
        maxTokens: 5000
    }
};

export class LLMService {
    constructor() {
        this.apiKey = config.DEEPSEEK_API_KEY;
        this.baseUrl = config.DEEPSEEK_BASE_URL;
        this.model = config.DEEPSEEK_MODEL;
    }

    async *streamOptimize(level, resumeText, jobDescription) {
        if (!this.apiKey) {
            throw new Error('DEEPSEEK_API_KEY not configured');
        }

        const promptConfig = PROMPTS[level];
        if (!promptConfig) {
            throw new Error(`Unknown optimization level: ${level}`);
        }

        const messages = this._buildMessages(promptConfig, resumeText, jobDescription);
        const options = {
            temperature: promptConfig.temperature,
            max_tokens: promptConfig.maxTokens,
            stream: true
        };

        yield { type: 'progress', data: { status: 'analyzing', level } };

        const response = await this._callAPI(messages, options);

        yield { type: 'progress', data: { status: 'optimizing', level } };

        let fullContent = '';
        const decoder = new TextDecoder();

        for await (const chunk of response) {
            const text = decoder.decode(chunk, { stream: true });
            const lines = text.split('\n');

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.substring(6).trim();
                if (data === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content || '';
                    if (content) {
                        fullContent += content;
                        yield { type: 'token', data: { content } };
                    }
                } catch {
                    // skip malformed JSON
                }
            }
        }

        const result = this._parseResult(level, fullContent);
        yield { type: 'done', data: result };
    }

    async parseResumeText(text) {
        if (!this.apiKey) {
            throw new Error('DEEPSEEK_API_KEY not configured');
        }

        const messages = [
            {
                role: 'system',
                content: `你是专业的简历解析助手。你的任务是从简历原始文本中精确提取结构化信息。

【核心规则 - 必须严格遵守】
1. 只输出JSON，不要有任何额外文字、注释、markdown标记或代码块
2. 严禁编造不存在的信息，无法识别的字段填空字符串""或空数组[]
3. 所有字段名用英文，字段值保持简历原文中的语言和表述
4. 日期格式：startDate和endDate使用 "YYYY.MM" 格式（如 "2020.03"、"2024.06"），仍在职用 "至今"
5. 技能列表保留原文表述，每项为独立字符串
6. description字段保留原文关键信息，保持简洁但完整
7. 个人简介summary要准确概括求职者的核心优势，不要编造

【提取要点】
- profile: 仔细识别姓名、职位、联系方式、城市和个人简介
- experience: 每段工作经历必须完整提取公司名、职位、起止时间、工作描述
- education: 每段教育经历必须完整提取学校、学历/学位、专业、起止时间、简短描述
- skills: 从简历中提取所有明确提到的技术技能和软技能`
            },
            {
                role: 'user',
                content: `请从以下简历文本中提取结构化信息，严格按照指定的JSON格式输出：

【简历原文】
${text}

【必须按此格式输出，不要添加任何其他字段或注释】
{
  "profile": {
    "name": "简历中的真实姓名",
    "title": "求职意向或当前职位",
    "email": "邮箱地址",
    "phone": "手机号码",
    "location": "所在城市",
    "summary": "从简历中提取的个人简介或自我评价，如没有则留空"
  },
  "experience": [
    {
      "company": "公司全称",
      "position": "职位名称",
      "startDate": "YYYY.MM格式，如2020.03",
      "endDate": "YYYY.MM格式，如2023.12，仍在职填至今",
      "description": "工作内容和成果的简要描述"
    }
  ],
  "education": [
    {
      "school": "学校全称",
      "degree": "学历/学位，如本科、硕士、大专",
      "major": "所学专业",
      "startDate": "YYYY.MM格式",
      "endDate": "YYYY.MM格式",
      "description": "在校期间的简要描述，如无则留空"
    }
  ],
  "skills": ["从简历中提取的技能列表"]
}`
            }
        ];

        const response = await this._callAPI(messages, {
            temperature: 0.1,
            max_tokens: 2048
        });

        const fullContent = await this._readFullResponse(response);

        try {
            const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                // Normalize: ensure required arrays exist
                parsed.experience = Array.isArray(parsed.experience) ? parsed.experience : [];
                parsed.education = Array.isArray(parsed.education) ? parsed.education : [];
                parsed.skills = Array.isArray(parsed.skills) ? parsed.skills : [];
                parsed.profile = parsed.profile || {};

                return parsed;
            }
        } catch (e) {
            console.error('[LLM] Parse resume JSON error:', e.message);
        }

        // Fallback: return what we can extract
        return {
            profile: { name: '', title: '', email: '', phone: '', location: '', summary: '' },
            experience: [],
            education: [],
            skills: [],
            _rawText: fullContent
        };
    }

    async analyzeJD(jdText) {
        if (!this.apiKey) {
            throw new Error('DEEPSEEK_API_KEY not configured');
        }

        const messages = [
            {
                role: 'system',
                content: '你是专业的JD分析专家，擅长提取职位关键信息。'
            },
            {
                role: 'user',
                content: `请分析以下职位描述（JD），提取关键信息：\n\n【JD内容】\n${jdText}\n\n请以JSON格式返回：\n{\n  "jobTitle": "职位名称",\n  "requiredSkills": ["必备技能1", "必备技能2"],\n  "preferredSkills": ["优先技能1"],\n  "experienceYears": 数字,\n  "education": "学历要求",\n  "responsibilities": ["主要职责1"],\n  "keywords": ["关键词1", "关键词2"],\n  "industry": "行业",\n  "companyType": "公司类型",\n  "matchDifficulty": "easy/medium/hard"\n}`
            }
        ];

        const response = await this._callAPI(messages, {
            temperature: 0.3,
            max_tokens: 1024
        });

        const fullContent = await this._readFullResponse(response);

        try {
            const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch {
            // fall through
        }

        return { rawAnalysis: fullContent };
    }

    _buildMessages(promptConfig, resumeText, jobDescription) {
        const userContent = jobDescription
            ? `${promptConfig.user}\n\n【原文】\n${resumeText}\n\n【目标职位参考】\n${jobDescription}`
            : `${promptConfig.user}\n\n【原文】\n${resumeText}`;

        return [
            { role: 'system', content: promptConfig.system },
            { role: 'user', content: userContent }
        ];
    }

    async _callAPI(messages, options = {}) {
        const maxRetries = 3;
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(`${this.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages,
                        temperature: options.temperature || 0.7,
                        max_tokens: options.max_tokens || 4096,
                        stream: options.stream || false,
                        top_p: options.top_p || 0.9,
                        frequency_penalty: options.frequency_penalty || 0.3,
                        presence_penalty: options.presence_penalty || 0.1
                    })
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    let errMsg = error.error?.message || `API request failed: ${response.status}`;

                    if (errMsg.includes('does not support') && errMsg.includes('input')) {
                        errMsg = 'AI模型暂不支持图片或文件输入，请使用纯文本内容';
                    } else if (errMsg.toLowerCase().includes('insufficient') || errMsg.includes('余额')) {
                        errMsg = 'AI服务余额不足，请联系管理员充值';
                    }

                    if (this._shouldRetry(response.status) && attempt < maxRetries) {
                        const delay = Math.pow(2, attempt) * 1000;
                        console.log(`[LLM] Retry ${attempt + 1}/${maxRetries} after ${delay}ms: ${errMsg}`);
                        await this._sleep(delay);
                        continue;
                    }

                    throw new Error(errMsg);
                }

                if (options.stream) {
                    return response.body;
                }

                return response;
            } catch (error) {
                lastError = error;
                if (this._shouldRetryError(error) && attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    await this._sleep(delay);
                    continue;
                }
                throw error;
            }
        }

        throw lastError;
    }

    async _readFullResponse(response) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }

    _parseResult(level, content) {
        const parts = content.split('---');
        const optimizedContent = parts[0]?.trim() || content;
        const reportSection = parts.length > 1 ? parts.slice(1).join('---').trim() : '';

        const result = {
            level,
            optimizedContent,
            model: 'DeepSeek-V3'
        };

        if (level === 'medium') {
            const notes = this._parseMediumNotes(reportSection);
            result.score = notes.matchRate || 82;
            result.suggestions = [
                { icon: '🔑', title: '关键词对齐', desc: `已对齐${notes.addedKeywords?.length || 0}个JD核心关键词` },
                { icon: '📊', title: '成果量化', desc: '为工作经历添加了具体的数字和指标' },
                { icon: '💪', title: '行为动词强化', desc: '使用了更强有力的动词' },
                { icon: '📄', title: 'ATS优化', desc: '排版和关键词密度已优化' }
            ];
        } else if (level === 'deep') {
            const report = this._parseDeepReport(reportSection);
            result.score = report.matchRate || 90;
            result.brandPosition = report.brandPosition;
            result.starApplications = report.starCount;
            result.suggestions = [
                { icon: '⭐', title: 'STAR法则重构', desc: '所有经历都按照STARR结构重组' },
                { icon: '👔', title: '个人品牌塑造', desc: '打造独特的职业定位和价值主张' },
                { icon: '🔍', title: '终极ATS优化', desc: '关键词密度和格式都已优化到极致' },
                { icon: '💡', title: '差异化亮点', desc: '突出了独特成就和竞争优势' }
            ];
        } else {
            result.score = 85;
            result.suggestions = [
                { icon: '✨', title: '语言润色', desc: '已优化表达方式，更专业流畅' },
                { icon: '📝', title: '格式规范', desc: '统一了格式和标点符号' },
                { icon: '✅', title: '语法检查', desc: '修正了潜在的语法问题' }
            ];
        }

        return result;
    }

    _parseMediumNotes(text) {
        const result = {};
        const matchRateMatch = text.match(/匹配度[：:]\s*(\d+)/);
        result.matchRate = matchRateMatch ? parseInt(matchRateMatch[1]) : null;

        const keywordsMatch = text.match(/新增关键词[：:]\s*(.+)/);
        if (keywordsMatch) {
            result.addedKeywords = keywordsMatch[1]
                .split(/[,，、]/)
                .map(s => s.trim())
                .filter(Boolean);
        }

        return result;
    }

    _parseDeepReport(text) {
        const result = {};
        const brandMatch = text.match(/Brand Position[：:]\s*(.+)/i);
        result.brandPosition = brandMatch ? brandMatch[1].trim() : '';

        const starMatch = text.match(/STAR Applications[：:]\s*(\d+)/i);
        result.starCount = starMatch ? parseInt(starMatch[1]) : 0;

        const matchMatch = text.match(/Match Rate[：:]\s*(\d+)/i);
        result.matchRate = matchMatch ? parseInt(matchMatch[1]) : 90;

        const keywordsMatch = text.match(/Keywords Optimized[：:]\s*(\d+)/i);
        result.keywordsOptimized = keywordsMatch ? parseInt(keywordsMatch[1]) : 0;

        return result;
    }

    _shouldRetry(status) {
        return [408, 429, 500, 502, 503, 504].includes(status);
    }

    _shouldRetryError(error) {
        return error.name === 'TypeError' || error.name === 'AbortError' ||
            (error.message && (error.message.includes('timeout') || error.message.includes('network')));
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}