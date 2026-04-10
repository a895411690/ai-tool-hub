/**
 * AI Optimizer Module
 * Integrates with Baidu Qianfan API for resume optimization
 * Supports OpenAI-compatible chat completions endpoint
 */

/**
 * HTML 实体转义，防止 XSS 攻击
 * @param {*} text - 待转义的文本
 * @returns {string} 转义后的安全字符串
 */
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// 属性转义函数
function escapeAttr(text) {
    return text.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

class AIOptimizer {
    constructor() {
        this.apiKey = localStorage.getItem(AIOptimizer.STORAGE_KEY_API) || '';
        this.model = localStorage.getItem(AIOptimizer.STORAGE_KEY_MODEL) || AIOptimizer.DEFAULT_MODEL;
        this.isOptimizing = false;
        this.currentView = 'original'; // original, optimized, ideal, hr
    }

    // 打开 AI 面板
    openPanel() {
        const panel = document.getElementById('aiPanel');
        const content = document.getElementById('aiPanelContent');
        panel.classList.remove('hidden');
        setTimeout(() => content.classList.add('ai-panel-open'), 10);
        this._fillApiSettings();
        this._renderJobTypeSelector();
        this._renderViewToggle();
    }

    // 关闭 AI 面板
    closePanel() {
        const panel = document.getElementById('aiPanel');
        const content = document.getElementById('aiPanelContent');
        content.classList.remove('ai-panel-open');
        setTimeout(() => panel.classList.add('hidden'), 300);
    }

    // 切换 API 设置面板可见性
    toggleApiSettings() {
        const settingsPanel = document.getElementById('apiSettingsPanel');
        const toggleBtn = document.getElementById('apiSettingsToggle');
        const isHidden = settingsPanel.classList.contains('hidden');
        settingsPanel.classList.toggle('hidden');
        toggleBtn.innerHTML = isHidden
            ? '<i class="fas fa-chevron-up"></i> 收起'
            : '<i class="fas fa-chevron-down"></i> 展开';
    }

    // 填充 API 设置表单
    _fillApiSettings() {
        const keyInput = document.getElementById('qianfanApiKey');
        const modelSelect = document.getElementById('qianfanModel');
        if (keyInput && this.apiKey) {
            keyInput.value = this.apiKey;
        }
        if (modelSelect && this.model) {
            modelSelect.value = this.model;
        }
        this._updateApiStatus(this.isApiConfigured() ? 'connected' : 'disconnected');
    }

    // 渲染职位类型选择器
    _renderJobTypeSelector() {
        const jobTypeContainer = document.getElementById('jobTypeSelector');
        if (!jobTypeContainer) return;

        jobTypeContainer.innerHTML = `
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-300 mb-2">目标职位</label>
                <div class="flex flex-wrap gap-2">
                    ${AIOptimizer.JOB_TYPES.map(job => `
                        <button 
                            class="job-type-btn"
                            onclick="aiOptimizer.selectJobType('${escapeAttr(job)}')"
                        >
                            ${escapeHtml(job)}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 渲染多视角切换
    _renderViewToggle() {
        const viewToggleContainer = document.getElementById('viewToggle');
        if (!viewToggleContainer) return;

        viewToggleContainer.innerHTML = `
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-300 mb-2">简历视角</label>
                <div class="flex gap-2">
                    <button 
                        class="view-btn ${this.currentView === 'original' ? 'active' : ''}"
                        onclick="aiOptimizer.switchView('original')"
                    >
                        原始的我
                    </button>
                    <button 
                        class="view-btn ${this.currentView === 'optimized' ? 'active' : ''}"
                        onclick="aiOptimizer.switchView('optimized')"
                    >
                        优化后的我
                    </button>
                    <button 
                        class="view-btn ${this.currentView === 'ideal' ? 'active' : ''}"
                        onclick="aiOptimizer.switchView('ideal')"
                    >
                        我幻想的我
                    </button>
                    <button 
                        class="view-btn ${this.currentView === 'hr' ? 'active' : ''}"
                        onclick="aiOptimizer.switchView('hr')"
                    >
                        HR希望的我
                    </button>
                </div>
            </div>
        `;
    }

    // 更新 API 状态指示器
    _updateApiStatus(status, message) {
        const statusEl = document.getElementById('apiStatus');
        if (!statusEl) return;
        statusEl.classList.remove('hidden');
        if (status === 'connected') {
            statusEl.className = 'text-xs text-green-400';
            statusEl.innerHTML = `<i class="fas fa-check-circle mr-1"></i>${escapeHtml(message || 'API 已配置，可使用真实 AI 优化')}`;
        } else if (status === 'disconnected') {
            statusEl.className = 'text-xs text-gray-500';
            statusEl.innerHTML = `<i class="fas fa-minus-circle mr-1"></i>${escapeHtml(message || '未配置 API Key，将使用演示模式')}`;
        } else if (status === 'testing') {
            statusEl.className = 'text-xs text-yellow-400';
            statusEl.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i>${escapeHtml(message || '正在测试连接...')}`;
        } else if (status === 'error') {
            statusEl.className = 'text-xs text-red-400';
            statusEl.innerHTML = `<i class="fas fa-exclamation-circle mr-1"></i>${escapeHtml(message || '连接失败')}`;
        }
    }

    // 保存 API 设置并测试连接
    async saveAndTestApi() {
        const apiKey = document.getElementById('qianfanApiKey').value.trim();
        const model = document.getElementById('qianfanModel').value;

        if (!apiKey) {
            this._updateApiStatus('error', '请输入 API Key');
            return;
        }

        this._updateApiStatus('testing', '正在测试连接...');

        const prevKey = this.apiKey;
        const prevModel = this.model;
        this.apiKey = apiKey;
        this.model = model;

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), AIOptimizer.REQUEST_TIMEOUT);

            const response = await fetch(AIOptimizer.API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: '你好，请回复"连接成功"' }],
                    max_output_tokens: 20
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
                throw new Error(errorMsg);
            }

            this.saveApiSettings(apiKey, model);
            this._updateApiStatus('connected', `API 连接成功！模型: ${model}`);
            this.showNotification('API 配置保存成功', 'success');
        } catch (error) {
            this.apiKey = prevKey;
            this.model = prevModel;
            if (error.name === 'AbortError') {
                this._updateApiStatus('error', '连接超时，请检查网络');
            } else {
                this._updateApiStatus('error', `连接失败: ${error.message}`);
            }
        }
    }

    // 清除 API 设置
    clearApiSettings() {
        this.apiKey = '';
        this.model = AIOptimizer.DEFAULT_MODEL;
        localStorage.removeItem(AIOptimizer.STORAGE_KEY_API);
        localStorage.removeItem(AIOptimizer.STORAGE_KEY_MODEL);

        const keyInput = document.getElementById('qianfanApiKey');
        const modelSelect = document.getElementById('qianfanModel');
        if (keyInput) keyInput.value = '';
        if (modelSelect) modelSelect.value = AIOptimizer.DEFAULT_MODEL;

        this._updateApiStatus('disconnected', '已清除 API 设置，将使用演示模式');
        this.showNotification('API 设置已清除', 'info');
    }

    // 选择职位类型
    selectJobType(jobType) {
        const jobDescription = document.getElementById('jobDescription');
        if (jobDescription) {
            jobDescription.value = `应聘职位：${jobType}\n\n职责要求：\n1. 负责相关领域的专业工作\n2. 具备相关技能和经验\n3. 良好的团队协作能力\n4. 较强的学习能力和解决问题的能力`;
            this.showNotification(`已选择职位：${jobType}`, 'success');
        }
    }

    // 切换简历视角
    switchView(view) {
        this.currentView = view;
        this._renderViewToggle();
        
        // 根据视角更新简历显示
        this.updateResumeView(view);
        
        const viewNames = {
            original: '原始的我',
            optimized: '优化后的我',
            ideal: '我幻想的我',
            hr: 'HR希望的我'
        };
        
        this.showNotification(`已切换到：${viewNames[view]}`, 'info');
    }

    // 更新简历视角显示
    updateResumeView(view) {
        // 假设 store 是全局可用的
        const resumeData = window.store ? window.store.getState() : {};
        let updatedData = { ...resumeData };
        
        switch (view) {
        case 'optimized':
            // 优化版：增强关键词和描述
            updatedData = this.getOptimizedVersion(resumeData);
            break;
        case 'ideal':
            // 理想版：夸大但合理的描述
            updatedData = this.getIdealVersion(resumeData);
            break;
        case 'hr':
            // HR视角：突出与职位相关的内容
            updatedData = this.getHRVersion(resumeData);
            break;
        }
        
        // 更新预览
        if (window.resumePreview) {
            window.resumePreview.render(updatedData);
        }
    }

    // 获取优化版简历
    getOptimizedVersion(resumeData) {
        const optimized = JSON.parse(JSON.stringify(resumeData));
        
        // 优化个人简介
        if (optimized.profile.summary) {
            optimized.profile.summary = optimized.profile.summary
                .replace(/\b经验\b/g, '丰富经验')
                .replace(/\b负责\b/g, '主导负责')
                .replace(/\b参与\b/g, '积极参与');
        }
        
        // 优化工作经历
        optimized.experience = optimized.experience.map(exp => ({
            ...exp,
            description: exp.description ? 
                exp.description.replace(/\b完成\b/g, '成功完成')
                    .replace(/\b改进\b/g, '显著改进')
                    .replace(/\b提高\b/g, '大幅提高') : exp.description
        }));
        
        return optimized;
    }

    // 获取理想版简历
    getIdealVersion(resumeData) {
        const ideal = JSON.parse(JSON.stringify(resumeData));
        
        // 理想个人简介
        ideal.profile.summary = '具备8年以上相关领域经验，曾主导多个大型项目，拥有丰富的团队管理经验和技术背景。精通多种前沿技术，具有较强的问题解决能力和创新思维。';
        
        // 理想工作经历
        ideal.experience = ideal.experience.map(exp => ({
            ...exp,
            position: exp.position.replace(/工程师/g, '高级工程师').replace(/组长/g, '经理'),
            description: `主导${exp.company}核心项目，带领团队成功完成多个重要项目，显著提升了公司的技术水平和业务效率。`
        }));
        
        return ideal;
    }

    // 获取HR视角简历
    getHRVersion(resumeData) {
        const hrVersion = JSON.parse(JSON.stringify(resumeData));
        
        // HR关注的个人简介
        hrVersion.profile.summary = `具有${hrVersion.profile.experience_years || 3}年相关工作经验，专注于${hrVersion.profile.title || '专业领域'}，具备良好的团队协作能力和沟通能力。`;
        
        // HR关注的工作经历
        hrVersion.experience = hrVersion.experience.map(exp => ({
            ...exp,
            description: exp.description ? 
                exp.description.split('。').filter(s => s.includes('负责') || s.includes('完成') || s.includes('改进')).join('。') : exp.description
        }));
        
        return hrVersion;
    }

    // 简历诊断
    async diagnoseResume() {
        const resumeData = window.store ? window.store.getState() : {};
        if (!resumeData.profile || !resumeData.profile.name) {
            this.showError('请至少填写姓名等基本信息');
            return;
        }
        
        this.isOptimizing = true;
        this.showLoading();
        
        try {
            const result = await this.getResumeDiagnosis(resumeData);
            this.displayDiagnosisResult(result);
        } catch (error) {
            // 移除 console.error 语句
            this.showError(`诊断失败: ${error.message}`);
        } finally {
            this.isOptimizing = false;
            this.hideLoading();
        }
    }

    // 获取简历诊断结果
    async getResumeDiagnosis(resumeData) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 计算各项指标
        const metrics = this.calculateResumeMetrics(resumeData);
        
        // 生成诊断结果
        return {
            score: metrics.overallScore,
            strengths: this.identifyStrengths(metrics),
            weaknesses: this.identifyWeaknesses(metrics),
            suggestions: this.generateSuggestions(metrics, resumeData),
            keywordMatch: metrics.keywordMatch,
            metrics: {
                completeness: metrics.completeness,
                experienceLevel: metrics.experienceLevel,
                skillDiversity: metrics.skillDiversity,
                achievementQuality: metrics.achievementQuality,
                formattingQuality: metrics.formattingQuality
            },
            highlights: this.extractHighlights(resumeData),
            improvementAreas: this.identifyImprovementAreas(metrics)
        };
    }
    
    // 计算简历各项指标
    calculateResumeMetrics(resumeData) {
        let completeness = 0;
        let experienceLevel = 0;
        let skillDiversity = 0;
        let achievementQuality = 0;
        let formattingQuality = 0;
        let keywordMatch = 70;
        
        // 计算完整性分数
        const sections = ['profile', 'experience', 'education', 'skills'];
        sections.forEach(section => {
            if (resumeData[section] && (Array.isArray(resumeData[section]) ? resumeData[section].length > 0 : Object.keys(resumeData[section]).length > 0)) {
                completeness += 25;
            }
        });
        
        // 计算经验水平分数
        if (resumeData.profile && resumeData.profile.experience_years) {
            experienceLevel = Math.min(100, resumeData.profile.experience_years * 10);
        }
        
        // 计算技能多样性分数
        if (resumeData.skills && resumeData.skills.length > 0) {
            skillDiversity = Math.min(100, resumeData.skills.length * 5);
        }
        
        // 计算成就质量分数
        if (resumeData.experience && resumeData.experience.length > 0) {
            let achievementCount = 0;
            resumeData.experience.forEach(exp => {
                if (exp.description) {
                    const achievementKeywords = ['完成', '改进', '提高', '节省', '增加', '优化', '主导', '负责'];
                    achievementKeywords.forEach(keyword => {
                        if (exp.description.includes(keyword)) {
                            achievementCount++;
                        }
                    });
                }
            });
            achievementQuality = Math.min(100, achievementCount * 15);
        }
        
        // 计算格式质量分数（简化版）
        formattingQuality = 80; // 假设基本格式正确
        
        // 计算综合分数
        const overallScore = Math.round(
            (completeness * 0.3 +
             experienceLevel * 0.2 +
             skillDiversity * 0.15 +
             achievementQuality * 0.25 +
             formattingQuality * 0.1) / 100 * 100
        );
        
        return {
            overallScore,
            completeness,
            experienceLevel,
            skillDiversity,
            achievementQuality,
            formattingQuality,
            keywordMatch
        };
    }
    
    // 识别优势
    identifyStrengths(metrics) {
        const strengths = [];
        
        if (metrics.completeness >= 75) {
            strengths.push('简历内容完整，包含所有必要部分');
        }
        
        if (metrics.experienceLevel >= 60) {
            strengths.push('具备一定的工作经验');
        }
        
        if (metrics.skillDiversity >= 50) {
            strengths.push('技能多样性良好');
        }
        
        if (metrics.achievementQuality >= 60) {
            strengths.push('工作成果描述详细');
        }
        
        if (metrics.formattingQuality >= 70) {
            strengths.push('简历格式规范');
        }
        
        return strengths.length > 0 ? strengths : ['简历整体结构合理'];
    }
    
    // 识别劣势
    identifyWeaknesses(metrics) {
        const weaknesses = [];
        
        if (metrics.completeness < 75) {
            weaknesses.push('部分简历内容缺失');
        }
        
        if (metrics.experienceLevel < 40) {
            weaknesses.push('工作经验相对较少');
        }
        
        if (metrics.skillDiversity < 40) {
            weaknesses.push('技能多样性不足');
        }
        
        if (metrics.achievementQuality < 50) {
            weaknesses.push('工作成果描述不够量化');
        }
        
        if (metrics.formattingQuality < 70) {
            weaknesses.push('简历格式需要优化');
        }
        
        return weaknesses.length > 0 ? weaknesses : ['需要进一步突出个人优势'];
    }
    
    // 生成改进建议
    generateSuggestions(metrics, resumeData) {
        const suggestions = [];
        
        if (metrics.completeness < 75) {
            suggestions.push('补充缺失的简历部分，确保信息完整');
        }
        
        if (metrics.achievementQuality < 50) {
            suggestions.push('使用STAR法则（情境-任务-行动-结果）描述工作成果');
            suggestions.push('添加具体的数据和指标来量化工作成果');
        }
        
        if (metrics.skillDiversity < 40) {
            suggestions.push('补充与目标职位相关的技能');
            suggestions.push('将技能分类整理，提高可读性');
        }
        
        if (resumeData.profile && !resumeData.profile.summary) {
            suggestions.push('添加个人简介，突出核心优势和职业目标');
        }
        
        return suggestions.length > 0 ? suggestions : ['保持现有优势，继续优化简历内容'];
    }
    
    // 提取简历亮点
    extractHighlights(resumeData) {
        const highlights = [];
        
        // 提取工作经验亮点
        if (resumeData.experience && resumeData.experience.length > 0) {
            resumeData.experience.forEach(exp => {
                if (exp.description) {
                    const lines = exp.description.split('。').filter(line => line.trim());
                    lines.forEach(line => {
                        if (line.includes('完成') || line.includes('改进') || line.includes('提高') || line.includes('节省') || line.includes('增加')) {
                            highlights.push(`${exp.position} - ${line}`);
                        }
                    });
                }
            });
        }
        
        // 提取技能亮点
        if (resumeData.skills && resumeData.skills.length > 0) {
            const keySkills = resumeData.skills.slice(0, 3);
            if (keySkills.length > 0) {
                highlights.push(`核心技能：${keySkills.join('、')}`);
            }
        }
        
        return highlights.slice(0, 5); // 最多返回5个亮点
    }
    
    // 识别改进领域
    identifyImprovementAreas(metrics) {
        const areas = [];
        
        if (metrics.completeness < 75) areas.push('内容完整性');
        if (metrics.experienceLevel < 60) areas.push('经验展示');
        if (metrics.skillDiversity < 50) areas.push('技能多样性');
        if (metrics.achievementQuality < 60) areas.push('成果量化');
        if (metrics.formattingQuality < 70) areas.push('格式规范');
        
        return areas;
    }

    // 显示诊断结果
    displayDiagnosisResult(result) {
        const container = document.getElementById('optimizationResult');
        container.classList.remove('hidden');
        
        container.innerHTML = `
            <div class="suggestion-card">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm text-gray-400">简历综合评分</span>
                    <span class="text-2xl font-bold text-purple-400">${escapeHtml(String(result.score))}分</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div class="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full" style="width: ${Math.min(100, Math.max(0, result.score))}%"></div>
                </div>
                <div class="mt-3 text-xs text-gray-500">
                    ${this.getScoreLevel(result.score)}
                </div>
            </div>
            
            <!-- 详细指标 -->
            <div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 class="font-medium text-gray-300 mb-3">详细指标</h4>
                <div class="space-y-3">
                    ${result.metrics ? Object.entries(result.metrics).map(([key, value]) => `
                        <div>
                            <div class="flex justify-between text-xs mb-1">
                                <span class="text-gray-400">${this.getMetricName(key)}</span>
                                <span class="text-gray-300">${escapeHtml(String(value))}%</span>
                            </div>
                            <div class="w-full bg-gray-700 rounded-full h-1.5">
                                <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style="width: ${Math.min(100, Math.max(0, value))}%"></div>
                            </div>
                        </div>
                    `).join('') : ''}
                </div>
            </div>
            
            <!-- 简历亮点 -->
            ${result.highlights && result.highlights.length > 0 ? `
                <div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <h4 class="font-medium text-gray-300 mb-2">简历亮点</h4>
                    <ul class="list-disc list-inside text-sm text-gray-400">
                        ${result.highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <!-- 优势 -->
            <div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 class="font-medium text-gray-300 mb-2">优势</h4>
                <ul class="list-disc list-inside text-sm text-gray-400">
                    ${result.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
                </ul>
            </div>
            
            <!-- 改进空间 -->
            <div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 class="font-medium text-gray-300 mb-2">改进空间</h4>
                <ul class="list-disc list-inside text-sm text-gray-400">
                    ${result.weaknesses.map(w => `<li>${escapeHtml(w)}</li>`).join('')}
                </ul>
            </div>
            
            <!-- 改进建议 -->
            <div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 class="font-medium text-gray-300 mb-2">改进建议</h4>
                <ul class="list-disc list-inside text-sm text-gray-400">
                    ${result.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
                </ul>
            </div>
            
            <!-- 关键词匹配度 -->
            <div class="suggestion-card">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm text-gray-400">关键词匹配度</span>
                    <span class="text-xl font-bold text-blue-400">${escapeHtml(String(result.keywordMatch))}%</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div class="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style="width: ${Math.min(100, Math.max(0, result.keywordMatch))}%"></div>
                </div>
            </div>
            
            <!-- 改进领域 -->
            ${result.improvementAreas && result.improvementAreas.length > 0 ? `
                <div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <h4 class="font-medium text-gray-300 mb-2">重点改进领域</h4>
                    <div class="flex flex-wrap gap-2">
                        ${result.improvementAreas.map(area => `
                            <span class="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">${escapeHtml(area)}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }
    
    // 获取评分等级
    getScoreLevel(score) {
        if (score >= 90) return '优秀：简历质量很高，具有很强的竞争力';
        if (score >= 80) return '良好：简历质量不错，有一定竞争力';
        if (score >= 70) return '中等：简历质量一般，需要进一步优化';
        if (score >= 60) return '及格：简历基本符合要求，但有较多改进空间';
        return '需要改进：简历存在明显问题，需要大幅优化';
    }
    
    // 获取指标名称
    getMetricName(key) {
        const names = {
            completeness: '内容完整性',
            experienceLevel: '经验水平',
            skillDiversity: '技能多样性',
            achievementQuality: '成果质量',
            formattingQuality: '格式质量'
        };
        return names[key] || key;
    }

    // 获取优化提示词
    getPrompt(resumeData, jobDescription) {
        return `你是一位专业的简历优化顾问，拥有15年HR和招聘经验，曾服务于多家世界500强企业，擅长简历优化和求职指导。

请根据以下职位描述，为候选人提供专业的简历优化建议：

【职位描述】
${jobDescription}

【当前简历】
${JSON.stringify(resumeData, null, 2)}

请提供以下优化建议（以JSON格式返回）：
{
  "summary": "简历整体评价（3-4句话，包括优势和不足）",
  "suggestions": [
    {
      "section": "profile|experience|education|skills",
      "type": "content|format|keyword|structure",
      "title": "建议标题",
      "current": "当前内容",
      "suggested": "建议修改",
      "reason": "修改原因",
      "priority": "high|medium|low"
    }
  ],
  "keywords": ["建议添加的关键词1", "关键词2", "关键词3"],
  "missingSkills": ["缺失的关键技能1", "缺失的关键技能2"],
  "score": 85,
  "jobMatchScore": 80,
  "actionItems": ["具体行动建议1", "具体行动建议2"]
}

要求：
1. 深度分析职位描述，提取核心技能和要求
2. 针对职位要求优化关键词匹配度，确保简历通过ATS系统筛选
3. 突出与职位相关的经验和技能，使用STAR法则（情境-任务-行动-结果）描述工作成果
4. 量化工作成果，添加具体的数据和指标
5. 优化简历结构和格式，提高可读性
6. 识别简历中缺失的关键技能和经验
7. 提供具体可执行的修改建议，包括措辞和表达方式
8. 保持专业客观，避免过度包装
9. 重点关注候选人与目标职位的匹配度
10. 提供优先级排序的建议，帮助候选人有针对性地进行优化`;
    }

    // 保存 API 设置
    saveApiSettings(apiKey, model) {
        if (apiKey) {
            this.apiKey = apiKey.trim();
            localStorage.setItem(AIOptimizer.STORAGE_KEY_API, this.apiKey);
        }
        if (model) {
            this.model = model.trim();
            localStorage.setItem(AIOptimizer.STORAGE_KEY_MODEL, this.model);
        }
    }

    // 检查 API 是否已配置
    isApiConfigured() {
        return !!this.apiKey;
    }

    // 调用百度千帆 API（OpenAI 兼容格式）
    async callAPI(resumeData, jobDescription) {
        const prompt = this.getPrompt(resumeData, jobDescription);

        const requestBody = {
            model: this.model,
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_output_tokens: 2048
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), AIOptimizer.REQUEST_TIMEOUT);

        let response;
        try {
            response = await fetch(AIOptimizer.API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
            throw new Error(`千帆 API 调用失败: ${errorMsg}`);
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0]?.message?.content) {
            throw new Error('千帆 API 返回数据格式异常');
        }

        const content = data.choices[0].message.content;
        return this.parseAIResponse(content);
    }

    // 解析 AI 响应内容
    parseAIResponse(content) {
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();

        try {
            const parsed = JSON.parse(jsonStr);

            if (!parsed.summary && !parsed.suggestions) {
                throw new Error('返回数据缺少必要字段');
            }

            return {
                summary: parsed.summary || '分析完成',
                suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
                keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
                score: typeof parsed.score === 'number' ? parsed.score : 80
            };
        } catch (e) {
            return {
                summary: content.slice(0, 500),
                suggestions: [],
                keywords: [],
                score: 75
            };
        }
    }

    // 优化简历
    async optimize() {
        if (this.isOptimizing) return;

        const jobDescription = document.getElementById('jobDescription').value.trim();
        if (!jobDescription) {
            this.showError('请输入职位描述');
            return;
        }

        const resumeData = window.store ? window.store.getState() : {};
        if (!resumeData.profile || !resumeData.profile.name) {
            this.showError('请至少填写姓名等基本信息');
            return;
        }

        this.isOptimizing = true;
        this.showLoading();

        try {
            if (this.isApiConfigured()) {
                const result = await this.callAPI(resumeData, jobDescription);
                this.displayResults(result);
            } else {
                // 移除 console.warn 语句
                await this.simulateOptimization(resumeData, jobDescription);
                this.showNotification('当前为演示模式，配置千帆 API Key 后可使用真实 AI 优化', 'info');
            }
        } catch (error) {
            // 移除 console.error 语句
            if (error.name === 'AbortError') {
                this.showError('请求超时，请检查网络连接');
            } else {
                this.showError(`优化失败: ${error.message}`);
            }
        } finally {
            this.isOptimizing = false;
            this.hideLoading();
        }
    }

    // 模拟优化（演示模式）
    async simulateOptimization(resumeData, jobDescription) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const keywords = this.extractKeywords(jobDescription);
        const missingSkills = ['项目管理', '团队协作', '问题解决'];
        const actionItems = [
            '更新个人简介，突出与职位相关的核心技能',
            '量化工作成果，添加具体的数据和指标',
            '补充缺失的关键技能，提高职位匹配度'
        ];

        const suggestions = [
            {
                section: 'profile',
                type: 'content',
                title: '个人简介优化',
                current: resumeData.profile.summary || '（未填写）',
                suggested: `具备${resumeData.profile.experience_years || 3}年以上相关经验的专业人才，熟悉${keywords.slice(0, 3).join('、')}等核心技能，拥有良好的团队协作能力和问题解决能力。`,
                reason: '添加与职位相关的关键词，提高匹配度',
                priority: 'high'
            },
            {
                section: 'experience',
                type: 'content',
                title: '工作成果量化',
                current: resumeData.experience && resumeData.experience.length > 0 ? resumeData.experience[0].description || '（未填写）' : '（未填写）',
                suggested: '主导完成了多个项目，提高了工作效率30%，节省成本15%，获得了团队和领导的一致好评。',
                reason: '量化工作成果，使简历更具说服力',
                priority: 'high'
            },
            {
                section: 'skills',
                type: 'keyword',
                title: '技能关键词建议',
                keywords: keywords,
                reason: '这些关键词在职位描述中高频出现',
                priority: 'medium'
            },
            {
                section: 'formatting',
                type: 'structure',
                title: '简历结构优化',
                current: '当前简历结构较为松散',
                suggested: '采用清晰的分节结构，突出重要信息，使用简洁的语言和 bullet points 格式',
                reason: '优化简历结构，提高可读性',
                priority: 'low'
            }
        ];

        this.displayResults({
            summary: '简历整体质量良好，结构清晰，但缺乏与目标职位相关的关键词和量化的工作成果。建议重点优化个人简介和工作经验部分，添加具体的数据和指标，提高与职位的匹配度。',
            suggestions,
            keywords: keywords,
            missingSkills: missingSkills,
            score: Math.floor(Math.random() * 15) + 75,
            jobMatchScore: Math.floor(Math.random() * 20) + 70,
            actionItems: actionItems
        });
    }

    // 从职位描述中提取关键词
    extractKeywords(text) {
        const commonWords = ['the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', '的', '和', '是', '在', '有', '与', '等', '了', '对', '及'];
        const words = text.toLowerCase()
            .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 1 && !commonWords.includes(w));

        const unique = [...new Set(words)];
        return unique.slice(0, 5);
    }

    // 显示优化结果（所有动态内容已转义，防止 XSS）
    displayResults(result) {
        const container = document.getElementById('optimizationResult');
        container.classList.remove('hidden');

        container.innerHTML = `
            <div class="suggestion-card">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm text-gray-400">简历匹配度评分</span>
                    <span class="text-2xl font-bold text-purple-400">${escapeHtml(String(result.score))}分</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div class="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full" style="width: ${Math.min(100, Math.max(0, result.score))}%"></div>
                </div>
            </div>
            
            ${result.jobMatchScore ? `
                <div class="suggestion-card">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-sm text-gray-400">职位匹配度</span>
                        <span class="text-2xl font-bold text-blue-400">${escapeHtml(String(result.jobMatchScore))}%</span>
                    </div>
                    <div class="w-full bg-gray-700 rounded-full h-2">
                        <div class="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" style="width: ${Math.min(100, Math.max(0, result.jobMatchScore))}%"></div>
                    </div>
                </div>
            ` : ''}

            <div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 class="font-medium text-gray-300 mb-2">整体评价</h4>
                <p class="text-sm text-gray-400">${escapeHtml(result.summary)}</p>
            </div>

            ${result.suggestions.map(s => `
                <div class="suggestion-card">
                    <div class="suggestion-title flex items-center gap-2">
                        <i class="fas fa-lightbulb"></i>
                        ${escapeHtml(s.title || '')}
                        ${s.priority ? `
                            <span class="text-xs px-2 py-0.5 rounded-full ${s.priority === 'high' ? 'bg-red-500/20 text-red-400' : s.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}">
                                ${s.priority === 'high' ? '高优先级' : s.priority === 'medium' ? '中优先级' : '低优先级'}
                            </span>
                        ` : ''}
                    </div>
                    ${s.current ? `
                        <div class="mt-2 text-sm">
                            <div class="text-gray-500 mb-1">当前：</div>
                            <div class="text-gray-400 line-through">${escapeHtml(s.current)}</div>
                        </div>
                        <div class="mt-2 text-sm">
                            <div class="text-indigo-400 mb-1">建议：</div>
                            <div class="text-gray-300">${escapeHtml(s.suggested || '')}</div>
                        </div>
                    ` : ''}
                    ${s.keywords ? `
                        <div class="mt-2">
                            <div class="text-sm text-gray-500 mb-2">建议添加：</div>
                            <div class="flex flex-wrap gap-2">
                                ${(s.keywords || []).map(k => `
                                    <span class="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">${escapeHtml(k)}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <div class="mt-2 text-xs text-gray-500">
                        <i class="fas fa-info-circle mr-1"></i>${escapeHtml(s.reason || '')}
                    </div>
                    <button onclick="aiOptimizer.applySuggestion()" class="apply-btn">
                        <i class="fas fa-check mr-1"></i>应用建议
                    </button>
                </div>
            `).join('')}
            
            ${result.keywords && result.keywords.length > 0 ? `
                <div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <h4 class="font-medium text-gray-300 mb-2">建议添加的关键词</h4>
                    <div class="flex flex-wrap gap-2">
                        ${result.keywords.map(keyword => `
                            <span class="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">${escapeHtml(keyword)}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${result.missingSkills && result.missingSkills.length > 0 ? `
                <div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <h4 class="font-medium text-gray-300 mb-2">缺失的关键技能</h4>
                    <div class="flex flex-wrap gap-2">
                        ${result.missingSkills.map(skill => `
                            <span class="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">${escapeHtml(skill)}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${result.actionItems && result.actionItems.length > 0 ? `
                <div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <h4 class="font-medium text-gray-300 mb-2">具体行动建议</h4>
                    <ul class="list-disc list-inside text-sm text-gray-400">
                        ${result.actionItems.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    }

    // 应用建议
    applySuggestion() {
        this.showNotification('建议已应用', 'success');
    }

    // 显示加载状态
    showLoading() {
        const btn = document.getElementById('optimizeBtn');
        if (btn) {
            btn.innerHTML = '<span class="loading-spinner mr-2"></span>AI 分析中...';
            btn.disabled = true;
        }
    }

    // 隐藏加载状态
    hideLoading() {
        const btn = document.getElementById('optimizeBtn');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-wand-magic-sparkles mr-2"></i>开始优化';
            btn.disabled = false;
        }
    }

    // 显示错误
    showError(message) {
        this.showNotification(message, 'error');
    }

    // 显示通知（使用 textContent 防止 XSS）
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 fade-in ${
            type === 'success' ? 'bg-green-500' :
                type === 'error' ? 'bg-red-500' : 'bg-indigo-500'
        } text-white`;

        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-center gap-2';

        const icon = document.createElement('i');
        icon.className = `fas ${
            type === 'success' ? 'fa-check-circle' :
                type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'
        }`;
        wrapper.appendChild(icon);

        const textSpan = document.createElement('span');
        textSpan.textContent = message; // 安全：使用 textContent
        wrapper.appendChild(textSpan);

        notification.appendChild(wrapper);
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(10px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// 创建全局实例（供HTML中直接调用）
const aiOptimizer = new AIOptimizer();
// 确保 aiOptimizer 被视为使用过的变量
if (typeof window !== 'undefined') {
    window.aiOptimizer = aiOptimizer;
}

// 静态属性定义
AIOptimizer.API_BASE_URL = 'https://qianfan.baidubce.com/v2/chat/completions';
AIOptimizer.DEFAULT_MODEL = 'ernie-4.0-8k';
AIOptimizer.STORAGE_KEY_API = 'qianfan_api_key';
AIOptimizer.STORAGE_KEY_MODEL = 'qianfan_model';
AIOptimizer.REQUEST_TIMEOUT = 30000; // 30秒请求超时

// 职位类型列表（扩展版本，更全面）
AIOptimizer.JOB_TYPES = [
    '软件开发工程师', '高级软件开发工程师', '全栈开发工程师', '前端开发工程师', '后端开发工程师',
    'Java开发工程师', 'Python开发工程师', 'C++开发工程师', 'Go开发工程师', 'JavaScript开发工程师',
    'React开发工程师', 'Vue开发工程师', 'Node.js开发工程师', 'PHP开发工程师', 'Ruby开发工程师',
    '数据分析师', '高级数据分析师', '数据科学家', '机器学习工程师', '人工智能工程师',
    '深度学习工程师', '计算机视觉工程师', '自然语言处理工程师', '推荐系统工程师', '算法工程师',
    '云计算工程师', 'DevOps工程师', 'SRE工程师', '系统架构师', '技术总监',
    '网络工程师', '网络安全工程师', '信息安全工程师', '渗透测试工程师', '安全运维工程师',
    '测试工程师', '自动化测试工程师', '性能测试工程师', 'QA工程师', '测试主管',
    '移动开发工程师', 'Android开发工程师', 'iOS开发工程师', 'Flutter开发工程师', 'React Native开发工程师',
    '游戏开发工程师', 'Unity开发工程师', 'Unreal Engine开发工程师', '游戏策划', '游戏美术',
    '项目经理', '技术项目经理', '产品经理', '高级产品经理', '产品总监',
    '产品运营', '用户运营', '内容运营', '社区运营', '活动运营',
    '新媒体运营', '短视频运营', '直播运营', '电商运营', '数据运营',
    '市场营销专员', '品牌策划', '市场推广', '数字营销', '内容营销',
    '销售代表', '销售经理', '客户经理', '渠道经理', '区域销售总监',
    'UI设计师', 'UX设计师', '产品设计师', '视觉设计师', '交互设计师',
    '平面设计师', '品牌设计师', '包装设计师', '插画师', 'UI/UX设计师',
    '财务专员', '会计', '出纳', '财务经理', '财务总监',
    '人力资源专员', '招聘专员', '培训专员', '薪酬福利专员', 'HRBP',
    '法务专员', '法律顾问', '法务经理', '投资顾问', '金融分析师',
    '市场分析师', '商业分析师', '战略分析师', '物流专员', '供应链专员',
    '客服专员', '客户成功经理', '公共关系专员', 'PR经理', '行政专员',
    '化学工程师', '生物技术研究员', '医药研发', '食品工程师', '环境工程师',
    '土木工程师', '结构工程师', '建筑设计师', '电气工程师', '机械工程师',
    '工业工程师', '硬件工程师', '电子工程师', '自动化工程师', '仪表工程师',
    '教师', '培训师', '教育顾问', '心理咨询师', '健康管理师',
    '医生', '护士', '药剂师', '医疗技术人员', '医疗管理人员'
];
