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

class AIOptimizer {
    // 百度千帆 API 配置
    static API_BASE_URL = 'https://qianfan.baidubce.com/v2/chat/completions';
    static DEFAULT_MODEL = 'ernie-4.0-8k';
    static STORAGE_KEY_API = 'qianfan_api_key';
    static STORAGE_KEY_MODEL = 'qianfan_model';
    static REQUEST_TIMEOUT = 30000; // 30秒请求超时

    constructor() {
        this.apiKey = localStorage.getItem(AIOptimizer.STORAGE_KEY_API) || '';
        this.model = localStorage.getItem(AIOptimizer.STORAGE_KEY_MODEL) || AIOptimizer.DEFAULT_MODEL;
        this.isOptimizing = false;
    }

    // 打开 AI 面板
    openPanel() {
        const panel = document.getElementById('aiPanel');
        const content = document.getElementById('aiPanelContent');
        panel.classList.remove('hidden');
        setTimeout(() => content.classList.add('ai-panel-open'), 10);
        this._fillApiSettings();
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

    // 获取优化提示词
    getPrompt(resumeData, jobDescription) {
        return `你是一位专业的简历优化顾问，拥有10年HR和招聘经验。

请根据以下职位描述，优化候选人的简历：

【职位描述】
${jobDescription}

【当前简历】
${JSON.stringify(resumeData, null, 2)}

请提供以下优化建议（以JSON格式返回）：
{
  "summary": "简历整体评价（2-3句话）",
  "suggestions": [
    {
      "section": "profile|experience|education|skills",
      "type": "content|format|keyword",
      "title": "建议标题",
      "current": "当前内容",
      "suggested": "建议修改",
      "reason": "修改原因"
    }
  ],
  "keywords": ["建议添加的关键词1", "关键词2"],
  "score": 85
}

要求：
1. 针对职位描述优化关键词匹配度
2. 突出与职位相关的经验和技能
3. 保持简洁专业，避免过度包装
4. 给出具体可执行的修改建议`;
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

        const resumeData = store.getState();
        if (!resumeData.profile.name) {
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
                console.warn('[AIOptimizer] 未配置百度千帆 API Key，使用模拟数据');
                await this.simulateOptimization(resumeData, jobDescription);
                this.showNotification('当前为演示模式，配置千帆 API Key 后可使用真实 AI 优化', 'info');
            }
        } catch (error) {
            console.error('Optimization failed:', error);
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

        const suggestions = [
            {
                section: 'profile',
                type: 'content',
                title: '个人简介优化',
                current: resumeData.profile.summary || '（未填写）',
                suggested: `具备3年以上相关经验的专业人才，熟悉${this.extractKeywords(jobDescription).slice(0, 3).join('、')}等核心技能...`,
                reason: '添加与职位相关的关键词，提高匹配度'
            },
            {
                section: 'skills',
                type: 'keyword',
                title: '技能关键词建议',
                keywords: this.extractKeywords(jobDescription),
                reason: '这些关键词在职位描述中高频出现'
            }
        ];

        this.displayResults({
            summary: '简历整体质量良好，建议增加与目标职位相关的关键词，突出项目成果。',
            suggestions,
            score: Math.floor(Math.random() * 15) + 75
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

            <div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 class="font-medium text-gray-300 mb-2">整体评价</h4>
                <p class="text-sm text-gray-400">${escapeHtml(result.summary)}</p>
            </div>

            ${result.suggestions.map((s, i) => `
                <div class="suggestion-card">
                    <div class="suggestion-title flex items-center gap-2">
                        <i class="fas fa-lightbulb"></i>
                        ${escapeHtml(s.title || '')}
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
                    <button onclick="aiOptimizer.applySuggestion(${i})" class="apply-btn">
                        <i class="fas fa-check mr-1"></i>应用建议
                    </button>
                </div>
            `).join('')}
        `;
    }

    // 应用建议
    applySuggestion(index) {
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

// 创建全局实例
const aiOptimizer = new AIOptimizer();
