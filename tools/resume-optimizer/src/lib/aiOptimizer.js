/**
 * AI Optimizer Module
 * Integrates with Baidu Qianfan API for resume optimization
 */

class AIOptimizer {
    constructor() {
        this.apiKey = localStorage.getItem('qianfan_api_key') || '';
        this.isOptimizing = false;
    }

    // Open AI panel
    openPanel() {
        const panel = document.getElementById('aiPanel');
        const content = document.getElementById('aiPanelContent');
        panel.classList.remove('hidden');
        setTimeout(() => content.classList.add('ai-panel-open'), 10);
    }

    // Close AI panel
    closePanel() {
        const panel = document.getElementById('aiPanel');
        const content = document.getElementById('aiPanelContent');
        content.classList.remove('ai-panel-open');
        setTimeout(() => panel.classList.add('hidden'), 300);
    }

    // Get optimization prompt
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

    // Optimize resume
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
            // For demo purposes, simulate AI response
            // In production, replace with actual API call
            await this.simulateOptimization(resumeData, jobDescription);
            
            // Actual API call would be:
            // const result = await this.callAPI(resumeData, jobDescription);
            
        } catch (error) {
            console.error('Optimization failed:', error);
            this.showError('优化失败，请重试');
        } finally {
            this.isOptimizing = false;
            this.hideLoading();
        }
    }

    // Simulate optimization (for demo)
    async simulateOptimization(resumeData, jobDescription) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate mock suggestions
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

    // Extract keywords from job description
    extractKeywords(text) {
        // Simple keyword extraction
        const commonWords = ['the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with'];
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !commonWords.includes(w));
        
        // Get unique words and return top 5
        const unique = [...new Set(words)];
        return unique.slice(0, 5);
    }

    // Display optimization results
    displayResults(result) {
        const container = document.getElementById('optimizationResult');
        container.classList.remove('hidden');
        
        container.innerHTML = `
            <div class="suggestion-card">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm text-gray-400">简历匹配度评分</span>
                    <span class="text-2xl font-bold text-purple-400">${result.score}分</span>
                </div>
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div class="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full" style="width: ${result.score}%"></div>
                </div>
            </div>
            
            <div class="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <h4 class="font-medium text-gray-300 mb-2">整体评价</h4>
                <p class="text-sm text-gray-400">${result.summary}</p>
            </div>
            
            ${result.suggestions.map((s, i) => `
                <div class="suggestion-card">
                    <div class="suggestion-title flex items-center gap-2">
                        <i class="fas fa-lightbulb"></i>
                        ${s.title}
                    </div>
                    ${s.current ? `
                        <div class="mt-2 text-sm">
                            <div class="text-gray-500 mb-1">当前：</div>
                            <div class="text-gray-400 line-through">${s.current}</div>
                        </div>
                        <div class="mt-2 text-sm">
                            <div class="text-indigo-400 mb-1">建议：</div>
                            <div class="text-gray-300">${s.suggested}</div>
                        </div>
                    ` : ''}
                    ${s.keywords ? `
                        <div class="mt-2">
                            <div class="text-sm text-gray-500 mb-2">建议添加：</div>
                            <div class="flex flex-wrap gap-2">
                                ${s.keywords.map(k => `
                                    <span class="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">${k}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <div class="mt-2 text-xs text-gray-500">
                        <i class="fas fa-info-circle mr-1"></i>${s.reason}
                    </div>
                    <button onclick="aiOptimizer.applySuggestion(${i})" class="apply-btn">
                        <i class="fas fa-check mr-1"></i>应用建议
                    </button>
                </div>
            `).join('')}
        `;
    }

    // Apply suggestion
    applySuggestion(index) {
        // Implementation would update the store with the suggested change
        this.showNotification('建议已应用', 'success');
    }

    // Show loading state
    showLoading() {
        const btn = document.getElementById('optimizeBtn');
        btn.innerHTML = '<span class="loading-spinner mr-2"></span>AI 分析中...';
        btn.disabled = true;
    }

    // Hide loading state
    hideLoading() {
        const btn = document.getElementById('optimizeBtn');
        btn.innerHTML = '<i class="fas fa-wand-magic-sparkles mr-2"></i>开始优化';
        btn.disabled = false;
    }

    // Show error
    showError(message) {
        this.showNotification(message, 'error');
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 fade-in ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 'bg-indigo-500'
        } text-white`;
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(10px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Create global instance
const aiOptimizer = new AIOptimizer();
